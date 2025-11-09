import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    if (!cvText || typeof cvText !== 'string') {
      return new Response(
        JSON.stringify({ error: "CV text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('🚀 Starting AI-powered CV analysis...');
    console.log('📄 CV length:', cvText.length, 'characters');
    console.log('🎯 Extracted skills:', extractedSkills?.length || 0);

    // System prompt for skill analysis
    const systemPrompt = `You are an expert career analyst and skill extraction AI. Analyze CVs/resumes and extract comprehensive skill information.`;

    const userPrompt = `Analyze this CV and extract all skills (both explicit and implicit):

CV TEXT:
${cvText}

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
