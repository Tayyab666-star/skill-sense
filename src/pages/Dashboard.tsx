import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Upload, TrendingUp, Target, BookOpen, Sparkles, Award, Zap, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    // Check if we have analysis results from navigation
    if (location.state?.analysisResult) {
      setAnalysisData(location.state.analysisResult);
    }
  }, [location]);

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-500';
      case 'Advanced': return 'bg-primary';
      case 'Intermediate': return 'bg-accent';
      case 'Beginner': return 'bg-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Zap className="h-4 w-4" />;
      case 'Soft': return <Sparkles className="h-4 w-4" />;
      case 'Domain': return <Target className="h-4 w-4" />;
      case 'Language': return <FileText className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-destructive text-destructive-foreground',
      medium: 'bg-accent text-accent-foreground',
      low: 'bg-secondary text-secondary-foreground'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

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
          <Button onClick={() => navigate("/upload")} className="bg-primary hover:bg-primary/90">
            <Upload className="mr-2 h-4 w-4" />
            Upload New CV
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Your Skill Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered analysis of your professional capabilities
          </p>
        </motion.div>

        {analysisData && analysisData.isValid ? (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Overall Score
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {analysisData.overallScore}%
                  </div>
                  <Progress value={analysisData.overallScore} className="h-2" />
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Skills Identified
                    </CardTitle>
                    <Brain className="h-5 w-5 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {analysisData.skills.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Explicit & Implicit
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Expert Skills
                    </CardTitle>
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {analysisData.skills.filter((s: any) => s.proficiencyLevel === 'Expert').length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Top proficiency
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Career Insights
                    </CardTitle>
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {analysisData.insights.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recommendations
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="bg-gradient-primary text-white border-0 shadow-glow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="h-6 w-6 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">AI Analysis Summary</h3>
                      <p className="text-white/90">{analysisData.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs defaultValue="skills" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="skills" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Skills Profile
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Career Insights
                  </TabsTrigger>
                </TabsList>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Technical Skills */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Zap className="h-5 w-5 text-primary" />
                          Technical Skills
                        </CardTitle>
                        <CardDescription>
                          {analysisData.skills.filter((s: any) => s.category === 'Technical').length} identified
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.skills
                          .filter((s: any) => s.category === 'Technical')
                          .slice(0, 8)
                          .map((skill: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{skill.name}</span>
                                <Badge variant={skill.isExplicit ? "default" : "secondary"} className="text-xs">
                                  {skill.proficiencyLevel}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={skill.confidence} className="flex-1 h-1.5" />
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {skill.confidence}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Soft Skills */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-5 w-5 text-accent" />
                          Soft Skills
                        </CardTitle>
                        <CardDescription>
                          {analysisData.skills.filter((s: any) => s.category === 'Soft').length} identified
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.skills
                          .filter((s: any) => s.category === 'Soft')
                          .slice(0, 8)
                          .map((skill: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{skill.name}</span>
                                <Badge variant={skill.isExplicit ? "default" : "secondary"} className="text-xs">
                                  {skill.proficiencyLevel}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={skill.confidence} className="flex-1 h-1.5" />
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {skill.confidence}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Domain & Other Skills */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="h-5 w-5 text-success" />
                          Domain Knowledge
                        </CardTitle>
                        <CardDescription>
                          {analysisData.skills.filter((s: any) => s.category === 'Domain' || s.category === 'Language').length} identified
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.skills
                          .filter((s: any) => s.category === 'Domain' || s.category === 'Language')
                          .slice(0, 8)
                          .map((skill: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{skill.name}</span>
                                <Badge variant={skill.isExplicit ? "default" : "secondary"} className="text-xs">
                                  {skill.proficiencyLevel}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={skill.confidence} className="flex-1 h-1.5" />
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {skill.confidence}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* All Skills Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Complete Skill Inventory</CardTitle>
                      <CardDescription>All identified skills with detailed analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisData.skills.map((skill: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full ${getProficiencyColor(skill.proficiencyLevel)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{skill.name}</span>
                                {getCategoryIcon(skill.category)}
                                <Badge variant="outline" className="text-xs">
                                  {skill.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={skill.confidence} className="flex-1 h-1.5 max-w-xs" />
                                <span className="text-xs text-muted-foreground">
                                  {skill.confidence}% confidence
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Badge
                                variant={skill.isExplicit ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {skill.proficiencyLevel}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-success" />
                          Your Strengths
                        </CardTitle>
                        <CardDescription>
                          Key areas where you excel
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.insights
                          .filter((i: any) => i.category === 'strength')
                          .map((insight: any, idx: number) => (
                            <div key={idx} className="p-4 bg-success/5 border border-success/20 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Badge className={getPriorityBadge(insight.priority)}>
                                  {insight.priority}
                                </Badge>
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {insight.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Growth Opportunities
                        </CardTitle>
                        <CardDescription>
                          Recommendations for skill development
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysisData.insights
                          .filter((i: any) => i.category === 'recommendation')
                          .map((insight: any, idx: number) => (
                            <div key={idx} className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Badge className={getPriorityBadge(insight.priority)}>
                                  {insight.priority}
                                </Badge>
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {insight.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Gaps */}
                    {analysisData.insights.filter((i: any) => i.category === 'gap').length > 0 && (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-accent" />
                            Areas for Development
                          </CardTitle>
                          <CardDescription>
                            Skills that could strengthen your profile
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysisData.insights
                            .filter((i: any) => i.category === 'gap')
                            .map((insight: any, idx: number) => (
                              <div key={idx} className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Badge className={getPriorityBadge(insight.priority)}>
                                    {insight.priority}
                                  </Badge>
                                  <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {insight.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <Card className="max-w-2xl w-full border-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Brain className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">No Analysis Yet</h2>
                <p className="text-muted-foreground mb-8">
                  Upload your CV to get started with AI-powered skill analysis
                </p>
                <Button
                  onClick={() => navigate("/upload")}
                  className="bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Your CV
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
