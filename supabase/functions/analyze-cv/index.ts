import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SkillAnalysis {
  name: string;
  category: 'Technical' | 'Soft' | 'Domain' | 'Language';
  confidence: number;
  isExplicit: boolean;
  evidence: string[];
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface CareerInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'strength' | 'gap' | 'recommendation';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, extractedSkills } = await req.json();

    // Input validation
    const MAX_CV_LENGTH = 100000; // 100KB (~25 pages)
    const MIN_TEXT_LENGTH = 50;

    if (!cvText || typeof cvText !== 'string') {
      return new Response(
        JSON.stringify({ error: "CV text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cvText.length < MIN_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too short",
          details: `CV text must be at least ${MIN_TEXT_LENGTH} characters`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cvText.length > MAX_CV_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Input too large",
          maxLength: MAX_CV_LENGTH,
          details: `CV text exceeds maximum allowed size of ${MAX_CV_LENGTH} characters (${Math.round(MAX_CV_LENGTH/1024)}KB)`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user first for rate limiting
    const authHeader = req.headers.get('authorization') || '';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const RATE_LIMIT = 10; // requests per hour
    const WINDOW_HOURS = 1;
    const endpoint = 'analyze-cv';
    const now = new Date();
    const windowStart = new Date(now.getTime() - (WINDOW_HOURS * 60 * 60 * 1000));

    const { data: rateLimitData, error: rateLimitError } = await supabaseClient
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (rateLimitData && rateLimitData.request_count >= RATE_LIMIT) {
      const resetTime = new Date(new Date(rateLimitData.window_start).getTime() + (WINDOW_HOURS * 60 * 60 * 1000));
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          details: `Maximum ${RATE_LIMIT} requests per hour. Please try again later.`,
          retryAfter,
          resetAt: resetTime.toISOString()
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": RATE_LIMIT.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.getTime().toString(),
            "Retry-After": retryAfter.toString()
          } 
        }
      );
    }

    // Update rate limit
    if (rateLimitData) {
      await supabaseClient
        .from('rate_limits')
        .update({ 
          request_count: rateLimitData.request_count + 1,
          updated_at: now.toISOString()
        })
        .eq('user_id', user.id)
        .eq('endpoint', endpoint)
        .eq('window_start', rateLimitData.window_start);
    } else {
      await supabaseClient
        .from('rate_limits')
        .insert({
          user_id: user.id,
          endpoint,
          request_count: 1,
          window_start: now.toISOString()
        });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Truncate to max length before processing
    const processedText = cvText.slice(0, MAX_CV_LENGTH);

    console.log('🚀 Starting AI-powered CV analysis...');
    console.log('📄 CV length:', processedText.length, 'characters');
    console.log('🎯 Extracted skills:', extractedSkills?.length || 0);

    // System prompt for skill analysis
    const systemPrompt = `You are an expert career analyst and skill extraction AI. Analyze CVs/resumes and extract comprehensive skill information.`;

    const userPrompt = `Analyze this CV and extract all skills (both explicit and implicit):

CV TEXT:
${processedText}

${extractedSkills && extractedSkills.length > 0 ? `\nPreviously identified skills to validate: ${extractedSkills.join(', ')}` : ''}

Provide comprehensive skill analysis with evidence, proficiency levels, career insights, and an overall score.`;

    // Call Lovable AI with tool calling for structured output
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
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_cv",
              description: "Extract skills and insights from a CV/resume",
              parameters: {
                type: "object",
                properties: {
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string", enum: ["Technical", "Soft", "Domain", "Language"] },
                        confidence: { type: "number", minimum: 0, maximum: 100 },
                        isExplicit: { type: "boolean" },
                        evidence: { type: "array", items: { type: "string" } },
                        proficiencyLevel: { type: "string", enum: ["Beginner", "Intermediate", "Advanced", "Expert"] }
                      },
                      required: ["name", "category", "confidence", "isExplicit", "evidence", "proficiencyLevel"],
                      additionalProperties: false
                    }
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        category: { type: "string", enum: ["strength", "gap", "recommendation"] }
                      },
                      required: ["title", "description", "priority", "category"],
                      additionalProperties: false
                    }
                  },
                  summary: { type: "string" },
                  overallScore: { type: "number", minimum: 0, maximum: 100 }
                },
                required: ["skills", "insights", "summary", "overallScore"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_cv" } }
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
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "analyze_cv") {
      console.error("No tool call in response:", JSON.stringify(aiData, null, 2));
      throw new Error("AI did not return structured output");
    }

    console.log('✅ AI analysis completed with tool calling');

    // Parse the structured output from tool calling
    let analysis;
    try {
      analysis = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool call arguments. Error:", parseError);
      console.error("Arguments:", toolCall.function.arguments);
      throw new Error("Failed to parse AI analysis result");
    }

    // Validate response structure
    if (!analysis.skills || !Array.isArray(analysis.skills)) {
      throw new Error("Invalid analysis format: missing skills array");
    }

    console.log('📊 Analysis results:');
    console.log('  - Skills found:', analysis.skills.length);
    console.log('  - Insights generated:', analysis.insights?.length || 0);
    console.log('  - Overall score:', analysis.overallScore);

    // Persist recognized skills into user_skills for the authenticated user
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      if (user) {
        const uniqueNames = Array.from(new Set((analysis.skills as SkillAnalysis[])
          .map(s => s.name.trim()).filter(Boolean)));

        const matched: { name: string; id: string }[] = [];
        for (const name of uniqueNames) {
          // Try case-insensitive name match first
          const byName = await supabase
            .from('skill_framework')
            .select('id,name,keywords')
            .ilike('name', name)
            .maybeSingle();

          if (byName.data) {
            matched.push({ name, id: byName.data.id });
            continue;
          }

          // Try keywords contains
          const keywordsTry = await supabase
            .from('skill_framework')
            .select('id,name,keywords')
            .contains('keywords', [name.toLowerCase()]);

          if (keywordsTry.data && keywordsTry.data.length > 0) {
            matched.push({ name, id: keywordsTry.data[0].id });
          }
        }

        const ids = matched.map(m => m.id);
        if (ids.length) {
          const { data: existing } = await supabase
            .from('user_skills')
            .select('id,skill_id')
            .eq('user_id', user.id)
            .in('skill_id', ids);

          const existingIds = new Set((existing || []).map(r => r.skill_id));

          const rows = (analysis.skills as SkillAnalysis[])
            .filter(s => matched.some(m => m.name === s.name))
            .map(s => {
              const mid = matched.find(m => m.name === s.name)!.id;
              return {
                user_id: user.id,
                skill_id: mid,
                proficiency_level: s.proficiencyLevel, // matches enum values
                is_explicit: s.isExplicit,
                confidence_score: Math.round(s.confidence),
                evidence: (s.evidence || []).slice(0, 3),
              };
            })
            .filter(r => !existingIds.has(r.skill_id));

          if (rows.length) {
            const { error: insErr } = await supabase.from('user_skills').insert(rows);
            if (insErr) {
              console.warn('⚠️ Failed to persist some skills:', insErr);
            } else {
              console.log(`🗃️ Persisted ${rows.length} new user_skills rows`);
            }
          } else {
            console.log('ℹ️ No new user_skills to add');
          }
        } else {
          console.log('ℹ️ No skills matched the framework; skipping persistence');
        }
      }
    } catch (persistErr) {
      console.warn('⚠️ Error while persisting skills:', persistErr);
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-cv function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze CV. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
