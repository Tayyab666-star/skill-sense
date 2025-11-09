import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewText, reviewTitle, reviewDate } = await req.json();

    // Input validation
    const MAX_REVIEW_LENGTH = 75000; // 75KB
    const MIN_TEXT_LENGTH = 50;

    if (!reviewText || typeof reviewText !== 'string') {
      return new Response(
        JSON.stringify({ error: "Performance review text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reviewText.length < MIN_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too short",
          details: `Performance review must be at least ${MIN_TEXT_LENGTH} characters`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reviewText.length > MAX_REVIEW_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too large",
          maxLength: MAX_REVIEW_LENGTH,
          details: `Performance review exceeds maximum allowed size of ${MAX_REVIEW_LENGTH} characters (${Math.round(MAX_REVIEW_LENGTH/1024)}KB)`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseService.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const RATE_LIMIT = 10; // requests per hour
    const WINDOW_HOURS = 1;
    const endpoint = 'analyze-performance-review';
    const now = new Date();
    const windowStart = new Date(now.getTime() - (WINDOW_HOURS * 60 * 60 * 1000));

    const { data: rateLimitData } = await supabaseService
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitData && rateLimitData.request_count >= RATE_LIMIT) {
      const resetTime = new Date(new Date(rateLimitData.window_start).getTime() + (WINDOW_HOURS * 60 * 60 * 1000));
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          details: `Maximum ${RATE_LIMIT} requests per hour. Please try again later.`,
          retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString()
          } 
        }
      );
    }

    // Update rate limit
    if (rateLimitData) {
      await supabaseService.from('rate_limits').update({ 
        request_count: rateLimitData.request_count + 1,
        updated_at: now.toISOString()
      }).eq('user_id', user.id).eq('endpoint', endpoint).eq('window_start', rateLimitData.window_start);
    } else {
      await supabaseService.from('rate_limits').insert({
        user_id: user.id,
        endpoint,
        request_count: 1,
        window_start: now.toISOString()
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const processedText = reviewText.slice(0, MAX_REVIEW_LENGTH);

    console.log('📊 Analyzing performance review...');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert HR analyst and career coach. Analyze performance reviews to extract:

1. **Demonstrated Skills**: Technical and soft skills mentioned in feedback
2. **Strengths**: Areas of excellence and high performance
3. **Growth Areas**: Skills to develop and improvement opportunities
4. **Leadership Qualities**: Team collaboration, mentorship, influence
5. **Work Style**: Communication, problem-solving, initiative

Focus on both explicitly mentioned skills and implicit capabilities shown through achievements and feedback.

Return ONLY a valid JSON object with this structure:
{
  "skills": [
    {
      "name": "skill name",
      "category": "Technical|Soft|Domain|Language",
      "confidence": 80,
      "isExplicit": true,
      "evidence": ["quotes from review"],
      "proficiencyLevel": "Expert|Advanced|Intermediate|Beginner"
    }
  ],
  "insights": [
    {
      "title": "insight title",
      "description": "detailed description",
      "priority": "high|medium|low",
      "category": "strength|gap|recommendation"
    }
  ],
  "summary": "comprehensive summary of performance and skills",
  "overallScore": 80
}`;

    const userPrompt = `Analyze this performance review and extract all skills and insights:

REVIEW TITLE: ${reviewTitle || 'Performance Review'}
REVIEW DATE: ${reviewDate || 'Not specified'}

REVIEW CONTENT:
${processedText}

Extract both praised strengths and areas for improvement. Identify soft skills like communication, leadership, and collaboration.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis result");
    }

    // Store data source
    const { error: dataSourceError } = await supabase
      .from('data_sources')
      .insert({
        user_id: user.id,
        source_type: 'performance_review',
        source_name: reviewTitle || 'Performance Review',
        raw_content: processedText,
        metadata: {
          reviewDate: reviewDate || new Date().toISOString(),
          contentLength: processedText.length
        },
        processed_at: new Date().toISOString()
      });

    if (dataSourceError) {
      console.error('Error storing data source:', dataSourceError);
    }

    console.log('✅ Performance review analysis completed');
    console.log('  - Skills found:', analysis.skills?.length || 0);
    console.log('  - Insights:', analysis.insights?.length || 0);

    return new Response(
      JSON.stringify({
        ...analysis,
        sourceMetadata: {
          title: reviewTitle,
          date: reviewDate,
          contentLength: processedText.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-performance-review function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze performance review. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
