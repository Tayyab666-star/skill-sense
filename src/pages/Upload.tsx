import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, FileText, Upload as UploadIcon, Link2, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      setUploading(false);
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) ready for analysis`,
      });
    }, 1500);
  };

  const handleAnalyze = () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload at least one file to analyze",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Analysis started",
      description: "Processing your data with AI...",
    });

    // Simulate analysis
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SkillSense
            </span>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Upload Your Data
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect multiple sources for comprehensive skill analysis
          </p>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                Upload your CV, resume, performance reviews, or any professional documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  PDF, DOC, DOCX, TXT (Max 10MB each)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">{file}</span>
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading files...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LinkedIn Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                LinkedIn Profile
              </CardTitle>
              <CardDescription>
                Import your professional experience directly from LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedin-url"
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    className="mt-2"
                  />
                </div>
                <Button variant="outline" className="w-full">
                  Connect LinkedIn
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                GitHub Profile
              </CardTitle>
              <CardDescription>
                Analyze your coding projects and contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="github-url">GitHub Username</Label>
                  <Input
                    id="github-url"
                    type="text"
                    placeholder="your-username"
                    className="mt-2"
                  />
                </div>
                <Button variant="outline" className="w-full">
                  Connect GitHub
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Context */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Context (Optional)</CardTitle>
              <CardDescription>
                Provide any additional information about your skills or goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="E.g., career goals, specific skills you want to highlight, projects you're proud of..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Analyze Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button 
              onClick={handleAnalyze}
              className="bg-primary hover:bg-primary/90"
              disabled={uploading}
            >
              <Brain className="mr-2 h-4 w-4" />
              Analyze My Skills
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
