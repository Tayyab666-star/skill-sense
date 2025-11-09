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

    console.log('🔍 Checking LinkedIn OAuth connection for user:', user.id);

    // Get LinkedIn data from user's OAuth identity
    const { data: identities } = await supabase
      .from('auth.identities')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'linkedin_oidc')
      .single();

    if (!identities) {
      return new Response(
        JSON.stringify({ 
          error: "LinkedIn not connected",
          message: "Please connect your LinkedIn account first"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract LinkedIn profile data from user metadata
    const linkedinData = user.user_metadata;
    
    console.log('📊 Processing LinkedIn profile data');

    // Build profile text for AI analysis
    const linkedinProfileText = `
LinkedIn Profile Analysis
Name: ${linkedinData.full_name || linkedinData.name || 'Not available'}
Email: ${linkedinData.email || 'Not available'}
Profile Picture: ${linkedinData.avatar_url || linkedinData.picture || 'Not available'}

Professional Identity: ${linkedinData.full_name || 'Not specified'}
Location: ${linkedinData.preferred_username || 'Not specified'}

Note: This is a basic LinkedIn profile import. For detailed work experience, education, and skills,
LinkedIn's API requires additional authentication and permissions beyond basic OAuth.

User can manually enter their LinkedIn profile URL or job details to enhance this analysis.
    `.trim();

    console.log('🤖 Analyzing LinkedIn profile with AI...');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert career analyst. Analyze LinkedIn profile data to extract professional skills, career trajectory, and provide insights.

Even with limited data, provide:
1. Professional skills based on available information
2. Career development insights
3. Recommendations for skill enhancement

Return ONLY a valid JSON object with this structure:
{
  "skills": [
    {
      "name": "skill name",
      "category": "Technical|Soft|Domain|Language",
      "confidence": 70,
      "isExplicit": false,
      "evidence": ["inferred from profile"],
      "proficiencyLevel": "Intermediate|Advanced"
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
  "overallScore": 70
}`;

    const userPrompt = `Analyze this LinkedIn profile data and extract professional skills and insights:

${linkedinProfileText}

Note: This is limited data from OAuth. Provide general professional insights and recommend the user to upload their full CV or manually enter their LinkedIn experience for comprehensive analysis.`;

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
        max_tokens: 2000,
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
        source_type: 'linkedin',
        source_name: linkedinData.full_name || linkedinData.email || 'LinkedIn Profile',
        source_url: `https://www.linkedin.com/in/${linkedinData.preferred_username || ''}`,
        raw_content: linkedinProfileText,
        metadata: linkedinData,
        processed_at: new Date().toISOString()
      });

    if (dataSourceError) {
      console.error('Error storing data source:', dataSourceError);
    }

    console.log('✅ LinkedIn analysis completed');
    console.log('  - Skills found:', analysis.skills?.length || 0);

    return new Response(
      JSON.stringify({
        ...analysis,
        sourceMetadata: {
          name: linkedinData.full_name || linkedinData.name,
          email: linkedinData.email,
          profileUrl: `https://www.linkedin.com/in/${linkedinData.preferred_username || ''}`
        },
        limitedData: true,
        message: "LinkedIn OAuth provides limited data. For comprehensive analysis, please upload your CV or manually enter your experience."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-linkedin function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze LinkedIn profile. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
