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

    if (!reviewText || typeof reviewText !== 'string') {
      return new Response(
        JSON.stringify({ error: "Performance review text is required" }),
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
${reviewText}

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
        raw_content: reviewText,
        metadata: {
          reviewDate: reviewDate || new Date().toISOString(),
          contentLength: reviewText.length
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
          contentLength: reviewText.length
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
