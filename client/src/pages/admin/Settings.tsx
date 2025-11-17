import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Key, FileText, MessageSquare, Send, Mail } from "lucide-react";
import type { Client } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [smsTemplate, setSmsTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHeaderText, setEmailHeaderText] = useState("");
  const [emailFooterText, setEmailFooterText] = useState("");
  const [testClientId, setTestClientId] = useState("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");

  const { data: settings, isLoading } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/admin/clients"],
  });

  // Load settings when available, or use defaults
  useEffect(() => {
    if (settings) {
      setAiPrompt(settings.ai_prompt || settings.default_ai_prompt || "");
      setSmsTemplate(settings.sms_template || settings.default_sms_template || "");
      setEmailSubject(settings.email_subject || "");
      setEmailHeaderText(settings.email_header_text || "");
      setEmailFooterText(settings.email_footer_text || "");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { 
      openaiApiKey?: string; 
      aiPrompt?: string; 
      smsTemplate?: string;
      emailSubject?: string;
      emailHeaderText?: string;
      emailFooterText?: string;
    }) => {
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

  const handleSmsTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ smsTemplate });
  };

  const handleEmailTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ 
      emailSubject, 
      emailHeaderText,
      emailFooterText 
    });
  };

  const testSmsMutation = useMutation({
    mutationFn: async (data: { clientId: string; phoneNumber: string }) => {
      return await apiRequest("POST", "/api/admin/test-sms", data);
    },
    onSuccess: () => {
      toast({
        title: "Test SMS sent",
        description: "Check your phone for the test message",
      });
      setTestPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send test SMS",
      });
    },
  });

  const handleTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testClientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a client",
      });
      return;
    }
    if (!testPhoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a phone number",
      });
      return;
    }
    testSmsMutation.mutate({ clientId: testClientId, phoneNumber: testPhoneNumber });
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
                Configure your OpenAI API key to enable AI-powered image analysis
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
              <p className="text-sm font-medium">About AI Analysis</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Analyzes site photos using advanced vision AI</li>
                <li>Extracts detailed information from images and form data</li>
                <li>Generates structured JSON reports with AI insights</li>
                <li>Provides professional construction site analysis</li>
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
                Customize the AI prompt template used for analyzing site reports and images
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>SMS Reminder Template</CardTitle>
              <CardDescription>
                Customize the SMS message sent to foremen for daily report reminders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSmsTemplateSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="smsTemplate">SMS Message Template</Label>
              <Textarea
                id="smsTemplate"
                data-testid="input-sms-template"
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                placeholder="Leave empty to use the default message..."
                rows={6}
                className="font-mono text-sm"
                disabled={updateSettingsMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Use template variables: <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;companyName&#125;</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">&#123;formUrl&#125;</code>
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">Template Tips</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Template variables will be replaced with actual values when sending</li>
                <li>Keep messages concise (SMS has character limits)</li>
                <li>Leave blank to use the default reminder message</li>
                <li>Changes apply immediately to all scheduled reminders</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-sms-template"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </>
                )}
              </Button>
              {smsTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSmsTemplate("")}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-reset-sms-template"
                >
                  Reset to Default
                </Button>
              )}
            </div>
          </form>

          <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Test SMS Reminder</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Send a test message to verify how your SMS template looks
            </p>
            <form onSubmit={handleTestSms} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testClient">Select Client</Label>
                <Select
                  value={testClientId}
                  onValueChange={setTestClientId}
                  disabled={testSmsMutation.isPending}
                >
                  <SelectTrigger id="testClient" data-testid="select-test-client">
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testPhone">Test Phone Number</Label>
                <Input
                  id="testPhone"
                  data-testid="input-test-phone"
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+61457002098"
                  disabled={testSmsMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +61 for Australia)
                </p>
              </div>

              <Button
                type="submit"
                disabled={testSmsMutation.isPending || !testClientId || !testPhoneNumber.trim()}
                data-testid="button-send-test-sms"
                variant="secondary"
              >
                {testSmsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email Template Settings</CardTitle>
              <CardDescription>
                Customize the email template sent with daily site reports
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailTemplateSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Email Subject Prefix</Label>
              <Input
                id="emailSubject"
                data-testid="input-email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Daily Site Report"
                disabled={updateSettingsMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Custom text added to email subject line (e.g., "Daily Site Report - Project Name - Date")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailHeaderText">Email Header Text</Label>
              <Textarea
                id="emailHeaderText"
                data-testid="input-email-header"
                value={emailHeaderText}
                onChange={(e) => setEmailHeaderText(e.target.value)}
                placeholder="A new daily site report has been generated..."
                rows={3}
                disabled={updateSettingsMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Introduction text displayed at the top of the email body
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailFooterText">Email Footer Text</Label>
              <Textarea
                id="emailFooterText"
                data-testid="input-email-footer"
                value={emailFooterText}
                onChange={(e) => setEmailFooterText(e.target.value)}
                placeholder="This report was automatically generated by TradeaseAI."
                rows={2}
                disabled={updateSettingsMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Footer text displayed at the bottom of the email
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">Email Template Tips</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Leave fields empty to use default values</li>
                <li>Changes apply to all new report emails</li>
                <li>The Trade Ease AI logo will always appear in the email header</li>
                <li>Client branding (logo and color) is automatically included</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-email-template"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </>
                )}
              </Button>
              {(emailSubject || emailHeaderText || emailFooterText) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmailSubject("");
                    setEmailHeaderText("");
                    setEmailFooterText("");
                  }}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-reset-email-template"
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
