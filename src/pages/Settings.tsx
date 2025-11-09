import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [privacyLevel, setPrivacyLevel] = useState<"private" | "organization" | "public">("private");
  const [saving, setSaving] = useState(false);

  const saveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      toast({
        title: "✅ Settings saved",
        description: "Your preferences have been updated",
      });
      setSaving(false);
    }, 500);
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
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account and privacy preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your skill profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup 
                  value={privacyLevel} 
                  onValueChange={(value) => setPrivacyLevel(value as "private" | "organization" | "public")}
                >
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="private" id="private" />
                    <div className="flex-1">
                      <Label htmlFor="private" className="font-semibold cursor-pointer">
                        Private
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Only you can see your complete skill profile
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="organization" id="organization" />
                    <div className="flex-1">
                      <Label htmlFor="organization" className="font-semibold cursor-pointer">
                        Organization
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Visible to members of your organization for team analysis
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                    <RadioGroupItem value="public" id="public" />
                    <div className="flex-1">
                      <Label htmlFor="public" className="font-semibold cursor-pointer">
                        Public
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Visible to everyone, including recruiters and job matching
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Show in job matching</div>
                    <div className="text-sm text-muted-foreground">
                      Allow your profile to be matched with relevant job opportunities
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Anonymous team analysis</div>
                    <div className="text-sm text-muted-foreground">
                      Contribute to team insights without revealing your identity
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
