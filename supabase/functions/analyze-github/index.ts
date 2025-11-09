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
    const { githubUsername } = await req.json();

    if (!githubUsername || typeof githubUsername !== 'string') {
      return new Response(
        JSON.stringify({ error: "GitHub username is required" }),
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

    console.log('🔍 Fetching GitHub profile:', githubUsername);

    // Fetch user profile
    const profileResponse = await fetch(`https://api.github.com/users/${githubUsername}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SkillSense-App'
      }
    });

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "GitHub user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`GitHub API error: ${profileResponse.status}`);
    }

    const profile = await profileResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=30`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SkillSense-App'
        }
      }
    );

    if (!reposResponse.ok) {
      throw new Error(`Failed to fetch repositories: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();

    console.log('📚 Found', repos.length, 'repositories');

    // Extract languages and topics from repositories
    const languages = new Set<string>();
    const topics = new Set<string>();
    let totalStars = 0;
    let totalForks = 0;

    for (const repo of repos) {
      if (repo.language) languages.add(repo.language);
      if (repo.topics) repo.topics.forEach((topic: string) => topics.add(topic));
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
    }

    // Build profile text for AI analysis
    const githubProfileText = `
GitHub Profile Analysis for ${profile.name || githubUsername}
Bio: ${profile.bio || 'No bio available'}
Location: ${profile.location || 'Not specified'}
Company: ${profile.company || 'Not specified'}

Profile Stats:
- Public Repositories: ${profile.public_repos}
- Followers: ${profile.followers}
- Following: ${profile.following}
- Total Stars Received: ${totalStars}
- Total Forks: ${totalForks}

Programming Languages Used: ${Array.from(languages).join(', ')}
Repository Topics: ${Array.from(topics).join(', ')}

Top Repositories:
${repos.slice(0, 10).map((repo: any) => 
  `- ${repo.name}: ${repo.description || 'No description'} (${repo.language || 'N/A'}) - ⭐${repo.stargazers_count}`
).join('\n')}
    `.trim();

    console.log('🤖 Analyzing GitHub profile with AI...');

    // Use Lovable AI for skill extraction
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert developer skill analyzer. Analyze GitHub profiles to extract technical skills, proficiency levels, and provide career insights.

Identify:
1. Programming languages and frameworks
2. Development tools and platforms
3. Software engineering practices
4. Domains of expertise
5. Collaboration and contribution patterns

Return ONLY a valid JSON object with this structure:
{
  "skills": [
    {
      "name": "skill name",
      "category": "Technical|Soft|Domain|Language",
      "confidence": 85,
      "isExplicit": true,
      "evidence": ["context from GitHub"],
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

    const userPrompt = `Analyze this GitHub profile and extract all technical skills:

${githubProfileText}

Focus on programming languages, frameworks, tools, and practices evident from the repositories and profile.`;

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
        source_type: 'github',
        source_name: githubUsername,
        source_url: profile.html_url,
        raw_content: githubProfileText,
        metadata: {
          profile,
          languages: Array.from(languages),
          topics: Array.from(topics),
          totalStars,
          totalForks,
          repoCount: repos.length
        },
        processed_at: new Date().toISOString()
      });

    if (dataSourceError) {
      console.error('Error storing data source:', dataSourceError);
    }

    console.log('✅ GitHub analysis completed');
    console.log('  - Skills found:', analysis.skills?.length || 0);
    console.log('  - Languages:', Array.from(languages).join(', '));

    return new Response(
      JSON.stringify({
        ...analysis,
        sourceMetadata: {
          username: githubUsername,
          profileUrl: profile.html_url,
          languages: Array.from(languages),
          topics: Array.from(topics),
          stats: {
            repos: profile.public_repos,
            stars: totalStars,
            forks: totalForks
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in analyze-github function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze GitHub profile. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
