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
    const systemPrompt = `You are an expert career analyst and skill extraction AI. Your task is to analyze CVs/resumes and extract comprehensive skill information.

For each skill mentioned or implied in the CV, you must:
1. Identify the skill name
2. Categorize it (Technical, Soft, Domain, or Language)
3. Determine if it's explicitly mentioned or implied
4. Find evidence/context where it appears
5. Assess proficiency level (Beginner, Intermediate, Advanced, Expert)
6. Calculate confidence score (0-100)

Also provide:
- Career insights about strengths, gaps, and recommendations
- Overall profile summary
- Skill distribution analysis

Return ONLY a valid JSON object with this exact structure:
{
  "skills": [
    {
      "name": "skill name",
      "category": "Technical|Soft|Domain|Language",
      "confidence": 85,
      "isExplicit": true,
      "evidence": ["context where mentioned"],
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
  "summary": "overall analysis summary",
  "overallScore": 85
}`;

    const userPrompt = `Analyze this CV and extract all skills (both explicit and implicit):

CV TEXT:
${cvText}

${extractedSkills && extractedSkills.length > 0 ? `\nPreviously identified skills to validate: ${extractedSkills.join(', ')}` : ''}

Provide comprehensive skill analysis with evidence, proficiency levels, career insights, and an overall score.`;

    // Call Lovable AI
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
        max_tokens: 4000,
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
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log('✅ AI analysis completed');

    // Parse AI response (handle both markdown code blocks and raw JSON)
    let analysis;
    try {
      // Remove markdown code blocks if present - use lazy matching
      let jsonStr = content.trim();
      
      // Try to extract JSON from markdown code blocks
      const markdownMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        jsonStr = markdownMatch[1];
      } else {
        // Try to find JSON object directly
        const jsonMatch = jsonStr.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
      }
      
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response. Error:", parseError);
      console.error("Content preview (first 500 chars):", content.substring(0, 500));
      console.error("Content preview (last 500 chars):", content.substring(content.length - 500));
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
