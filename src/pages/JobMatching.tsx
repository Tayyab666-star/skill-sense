import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Briefcase, Target, TrendingUp, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const JobMatching = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [hasSkills, setHasSkills] = useState<boolean | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userSkills, setUserSkills] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadJobs();
      checkUserSkills();
    }
  }, [user]);

  // Recheck skills when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        checkUserSkills();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const checkUserSkills = async () => {
    console.log('🔍 Checking user skills...');
    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        *,
        skill_framework (
          name,
          category
        )
      `)
      .order('confidence_score', { ascending: false })
      .limit(10);

    console.log('✅ Skills check result:', { hasData: data && data.length > 0, count: data?.length });
    setHasSkills(data && data.length > 0);
    if (data && data.length > 0) {
      setUserSkills(data);
    }
  };

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("is_active", true)
      .limit(10);

    if (data) {
      setJobs(data);
    }
  };

  const runDemoAnalysis = () => {
    setAnalyzing(true);
    setIsDemoMode(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setMatchResult({
        matchScore: 78,
        matchingSkills: [
          "JavaScript",
          "React",
          "TypeScript",
          "Node.js",
          "REST APIs",
          "Git",
          "Agile Development",
          "Problem Solving"
        ],
        missingSkills: [
          "GraphQL",
          "Docker",
          "Kubernetes",
          "AWS Services"
        ],
        recommendations: [
          "Strong foundation in core technologies - your JavaScript and React skills align well with this role",
          "Consider learning GraphQL to enhance your API development capabilities",
          "Docker and Kubernetes knowledge would strengthen your DevOps skills for this position",
          "AWS certification would be valuable for cloud infrastructure requirements",
          "Your Agile experience is a great asset for the team collaboration aspects"
        ],
        jobRequirements: {
          technical: ["JavaScript", "React", "TypeScript", "GraphQL", "Docker", "AWS"],
          soft: ["Team collaboration", "Problem solving", "Communication"],
          experience: "3-5 years"
        }
      });
      setAnalyzing(false);
    }, 1500);
  };

  const analyzeJobMatch = async () => {
    if (!jobDescription.trim()) return;

    setAnalyzing(true);
    setIsDemoMode(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-job-match', {
        body: { jobDescription }
      });

      if (error) {
        console.error('Error analyzing job match:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setMatchResult(data);
    } catch (error) {
      console.error('Failed to analyze job match:', error);
      setMatchResult({
        matchScore: 0,
        matchingSkills: [],
        missingSkills: [],
        recommendations: [
          error instanceof Error ? error.message : "Failed to analyze job match. Please ensure you have uploaded your CV or connected data sources first."
        ]
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSense
            </span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/team")}>
              Team Analysis
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Job Matching
          </h1>
          <p className="text-muted-foreground text-lg">
            Find roles that match your skill profile
          </p>
        </motion.div>

        {/* User Skills Overview */}
        {hasSkills === true && userSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Your Top Skills
                </CardTitle>
                <CardDescription>
                  Based on your CV analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill) => (
                    <Badge 
                      key={skill.id} 
                      variant="default"
                      className="text-sm py-1.5 px-3"
                    >
                      {skill.skill_framework?.name || 'Unknown Skill'}
                      {skill.proficiency_level && (
                        <span className="ml-2 opacity-70 text-xs">
                          {skill.proficiency_level}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
                {userSkills.length >= 10 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Showing top 10 skills. View all in your Dashboard.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Analyze Job Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Analyze Job Description
                </CardTitle>
                <CardDescription>
                  Paste a job description to see how well you match
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSkills === false && (
                  <div className="p-4 bg-muted rounded-lg border border-border mb-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload your CV for personalized analysis, or try our demo mode to see how it works.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate("/upload")}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        Upload CV
                      </Button>
                      <Button
                        onClick={runDemoAnalysis}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={analyzing}
                      >
                        Try Demo
                      </Button>
                    </div>
                  </div>
                )}
                {hasSkills === true && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">CV uploaded - Ready for analysis</span>
                    </div>
                    <Button
                      onClick={checkUserSkills}
                      variant="ghost"
                      size="sm"
                    >
                      Refresh
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px]"
                />
                <Button
                  onClick={analyzeJobMatch}
                  disabled={!jobDescription.trim() || analyzing || hasSkills === false}
                  className="w-full"
                >
                  {analyzing ? (
                    <>Analyzing...</>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Match
                    </>
                  )}
                </Button>

                {matchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {isDemoMode && (
                      <div className="p-3 bg-accent/50 text-accent-foreground rounded-lg border border-accent text-sm">
                        <strong>Demo Mode:</strong> This is sample data. Upload your CV for personalized results.
                      </div>
                    )}
                    <div className="p-4 bg-gradient-primary text-white rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1">Match Score</div>
                        <div className="text-4xl font-bold">{matchResult.matchScore}%</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Matching Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.matchingSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Skills to Develop</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missingSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recommendations</h4>
                      {matchResult.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Target className="h-4 w-4 text-primary mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Available Jobs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Recommended Jobs
                </CardTitle>
                <CardDescription>
                  Opportunities matching your skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobs.length > 0 ? (
                  jobs.map((job, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">Match Score</div>
                        <div className="flex items-center gap-2">
                          <Progress value={job.match_score || 0} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{job.match_score || 0}%</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        View Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No jobs available yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back soon for new opportunities
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JobMatching;
