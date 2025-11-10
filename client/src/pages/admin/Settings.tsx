import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Key, FileText } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const { data: settings, isLoading } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/admin/settings"],
  });

  // Load AI prompt from settings when available
  useEffect(() => {
    if (settings?.ai_prompt) {
      setAiPrompt(settings.ai_prompt);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { openaiApiKey?: string; aiPrompt?: string }) => {
      return await apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully",
      });
      setApiKey("");
      setShowApiKey(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update settings",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an OpenAI API key",
      });
      return;
    }
    updateSettingsMutation.mutate({ openaiApiKey: apiKey });
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ aiPrompt });
  };

  const hasApiKey = settings?.openai_api_key === '***configured***';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your TradeaseAI configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>OpenAI API Key</CardTitle>
              <CardDescription>
                Configure your OpenAI API key to enable GPT-5 image analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasApiKey && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Current Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm text-muted-foreground">
                  API key is configured
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {hasApiKey ? "Update OpenAI API Key" : "OpenAI API Key"}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  data-testid="input-openai-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasApiKey ? "Enter new API key to update" : "sk-..."}
                  disabled={updateSettingsMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={updateSettingsMutation.isPending}
                >
                  {showApiKey ? "Hide" : "Show"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">About GPT-5 Analysis</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Analyzes site photos using GPT-5 vision capabilities</li>
                <li>Extracts detailed information from images and form data</li>
                <li>Generates structured JSON reports with AI insights</li>
                <li>Model: gpt-5-2025-08-07 (released August 2025)</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending || !apiKey.trim()}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasApiKey ? "Update API Key" : "Save API Key"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Analysis Prompt</CardTitle>
              <CardDescription>
                Customize the GPT-5 prompt template used for analyzing site reports and images
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handlePromptSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="aiPrompt">AI Prompt Template</Label>
              <Textarea
                id="aiPrompt"
                data-testid="input-ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Leave empty to use the default prompt..."
                rows={20}
                className="font-mono text-sm"
                disabled={updateSettingsMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Use template variables: <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;reportDate&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;projectName&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;worksPerformed&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;labourOnSite&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;plantMachinery&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;hoursWorked&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;materialsUsed&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;delaysWeather&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;safetyIncidents&#125;&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;&#123;imageCount&#125;&#125;</code>
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">Prompt Tips</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Template variables will be replaced with actual values from the report form</li>
                <li>Ensure the prompt requests JSON output for proper parsing</li>
                <li>Leave blank to use the default construction industry prompt</li>
                <li>Changes apply to all new reports and regenerated reports</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-prompt"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Prompt
                  </>
                )}
              </Button>
              {aiPrompt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAiPrompt("")}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-reset-prompt"
                >
                  Reset to Default
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
