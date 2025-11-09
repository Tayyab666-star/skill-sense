import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Upload, TrendingUp, Target, BookOpen, FileText, Github, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock data for demonstration
  const skillProfile = {
    overallConfidence: 85,
    skillsIdentified: 42,
    skillGaps: 8,
    recommendations: 12
  };

  const topSkills = [
    { name: "React", category: "Technical", confidence: 95, isExplicit: true },
    { name: "Leadership", category: "Soft", confidence: 88, isExplicit: false },
    { name: "TypeScript", category: "Technical", confidence: 90, isExplicit: true },
    { name: "Problem Solving", category: "Soft", confidence: 92, isExplicit: false },
    { name: "Cloud Architecture", category: "Domain", confidence: 85, isExplicit: true },
    { name: "Mentoring", category: "Soft", confidence: 80, isExplicit: false },
  ];

  const learningRecommendations = [
    "Advanced System Design Patterns",
    "Machine Learning Fundamentals",
    "Strategic Communication Skills",
    "DevOps Best Practices"
  ];

  const dataSources = [
    { icon: FileText, name: "Resume/CV", status: "not-connected", color: "text-muted-foreground" },
    { icon: Linkedin, name: "LinkedIn", status: "not-connected", color: "text-muted-foreground" },
    { icon: Github, name: "GitHub", status: "not-connected", color: "text-muted-foreground" },
    { icon: BookOpen, name: "Blog Posts", status: "not-connected", color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSense
            </span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/upload")}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Your Skill Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover your complete skill profile powered by AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overall Confidence
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">
                {skillProfile.overallConfidence}%
              </div>
              <Progress value={skillProfile.overallConfidence} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Skills Identified
                </CardTitle>
                <Brain className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {skillProfile.skillsIdentified}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Explicit & Implicit
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Skill Gaps
                </CardTitle>
                <Target className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {skillProfile.skillGaps}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Areas to improve
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recommendations
                </CardTitle>
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {skillProfile.recommendations}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Learning paths
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Profile */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Your Top Skills</CardTitle>
                <CardDescription>
                  AI-identified skills with confidence scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topSkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">{skill.name}</span>
                        <Badge variant={skill.isExplicit ? "default" : "secondary"} className="text-xs">
                          {skill.isExplicit ? "Explicit" : "Implicit"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={skill.confidence} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-muted-foreground w-12">
                          {skill.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Data Sources</CardTitle>
                <CardDescription>
                  Connect your professional profiles for comprehensive analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dataSources.map((source, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 justify-start"
                      onClick={() => navigate("/upload")}
                    >
                      <source.icon className={`h-6 w-6 mr-3 ${source.color}`} />
                      <div className="text-left">
                        <div className="font-semibold">{source.name}</div>
                        <div className="text-xs text-muted-foreground">Not connected</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Recommendations */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Learning Path</CardTitle>
                <CardDescription>
                  Recommended skills to develop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningRecommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className="flex items-start p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary text-white border-0">
              <CardHeader>
                <CardTitle className="text-white">Start Your Analysis</CardTitle>
                <CardDescription className="text-white/80">
                  Upload your professional data to unlock your complete skill profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-white text-primary hover:bg-white/90"
                  onClick={() => navigate("/upload")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Data Sources
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
