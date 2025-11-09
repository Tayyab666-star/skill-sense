import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Target, TrendingUp, Upload, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI extracts both explicit and implicit skills from your professional data"
    },
    {
      icon: Upload,
      title: "Multi-Source Integration",
      description: "Connect CVs, LinkedIn, GitHub, blogs, and performance reviews in one place"
    },
    {
      icon: Target,
      title: "Skill Gap Analysis",
      description: "Identify gaps between your current skills and career goals with precision"
    },
    {
      icon: TrendingUp,
      title: "Growth Recommendations",
      description: "Get personalized learning paths tailored to your unique skill profile"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSense
            </span>
          </div>
          <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium text-secondary-foreground mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Skill Discovery
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Unlock Your
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Hidden Potential
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover what you're truly good at. SkillSense uses advanced AI to analyze your professional journey and reveal skills you didn't know you had.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 shadow-glow"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Your Analysis
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 h-14 border-2"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-card p-6 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-primary p-3 rounded-xl w-fit mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div>
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to discover your complete skill profile
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                step: "01",
                title: "Upload Your Data",
                description: "Connect your CV, LinkedIn, GitHub, and other professional sources"
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our AI processes your data to identify explicit and implicit skills"
              },
              {
                step: "03",
                title: "Get Insights",
                description: "Receive your complete skill profile with personalized recommendations"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-primary/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-primary rounded-3xl p-12 text-center text-white shadow-glow">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Discover Your Full Potential?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of professionals who've unlocked their hidden skills
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 h-14"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">SkillSense</span>
          </div>
          <p>Unlock Your Hidden Potential</p>
          <p className="text-sm mt-2">© 2025 SkillSense. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
