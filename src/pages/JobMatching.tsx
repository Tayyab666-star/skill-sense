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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

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

  const analyzeJobMatch = async () => {
    if (!jobDescription.trim()) return;

    setAnalyzing(true);
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
                <Textarea
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px]"
                />
                <Button
                  onClick={analyzeJobMatch}
                  disabled={!jobDescription.trim() || analyzing}
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
