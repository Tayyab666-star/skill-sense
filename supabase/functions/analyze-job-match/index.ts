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
    const { jobDescription } = await req.json();

    if (!jobDescription || typeof jobDescription !== 'string') {
      return new Response(
        JSON.stringify({ error: "Job description is required" }),
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

    console.log('🔍 Fetching user skills from database...');

    // Fetch user's skills from database with skill names
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        *,
        skill_framework (
          name,
          category
        )
      `)
      .eq('user_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      throw new Error('Failed to fetch user skills');
    }

    if (!userSkills || userSkills.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No skills found",
          details: "Please upload your CV or connect data sources first to analyze job matches."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('📊 Found', userSkills.length, 'user skills');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare user skills summary for AI
    const userSkillsSummary = userSkills.map(skill => {
      const skillName = skill.skill_framework?.name || 'Unknown';
      const category = skill.skill_framework?.category || 'Unknown';
      return `${skillName} (${category}, ${skill.proficiency_level || 'N/A'})`;
    }).join('\n');

    const systemPrompt = `You are an expert career counselor and job matching specialist. Analyze job descriptions against candidate skills to provide accurate match scores and recommendations.

Your task:
1. Extract required and preferred skills from the job description
2. Compare them with the candidate's skills
3. Calculate an accurate match score (0-100)
4. Identify matching skills and skills to develop
5. Provide actionable recommendations

Use the analyze_job_match function to return structured results.`;

    const userPrompt = `Analyze this job match:

JOB DESCRIPTION:
${jobDescription}

CANDIDATE SKILLS:
${userSkillsSummary}

Provide a detailed analysis including match score, matching skills, missing skills, and recommendations.`;

    console.log('🤖 Analyzing job match with AI...');

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
              name: "analyze_job_match",
              description: "Return job match analysis with score and recommendations",
              parameters: {
                type: "object",
                properties: {
                  matchScore: {
                    type: "number",
                    description: "Match score from 0-100 based on skill overlap"
                  },
                  matchingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills the candidate has that match the job requirements"
                  },
                  missingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills required for the job that the candidate needs to develop"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Actionable recommendations for the candidate (3-5 items)"
                  },
                  jobRequirements: {
                    type: "object",
                    properties: {
                      technical: {
                        type: "array",
                        items: { type: "string" },
                        description: "Technical skills required"
                      },
                      soft: {
                        type: "array",
                        items: { type: "string" },
                        description: "Soft skills required"
                      },
                      experience: {
                        type: "string",
                        description: "Experience level required"
                      }
                    }
                  }
                },
                required: ["matchScore", "matchingSkills", "missingSkills", "recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_job_match" } }
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
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "analyze_job_match") {
      console.error('Unexpected AI response format:', JSON.stringify(aiData, null, 2));
      throw new Error("AI did not return expected tool call");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    console.log('✅ Job match analysis completed');
    console.log('  - Match score:', analysis.matchScore);
    console.log('  - Matching skills:', analysis.matchingSkills?.length || 0);
    console.log('  - Missing skills:', analysis.missingSkills?.length || 0);

    // Store job match result in database (in analysis field as jsonb)
    const { error: matchError } = await supabase
      .from('job_matches')
      .insert({
        user_id: user.id,
        job_id: null, // No specific job posting for manual analysis
        match_score: analysis.matchScore,
        matching_skills: analysis.matchingSkills,
        missing_skills: analysis.missingSkills,
        analysis: {
          jobDescription: jobDescription.slice(0, 2000),
          recommendations: analysis.recommendations,
          jobRequirements: analysis.jobRequirements,
          analyzedAt: new Date().toISOString()
        }
      });

    if (matchError) {
      console.error('Error storing job match:', matchError);
      // Continue anyway, don't fail the request
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-job-match function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze job match. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
