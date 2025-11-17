import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { insertClientSchema, type InsertClient, type Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Upload, Loader2, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Helper function to convert storage paths to public URLs
function getStorageUrl(storagePath: string): string {
  // If path starts with "public/", convert to "/storage/" route
  if (storagePath.startsWith('public/')) {
    return `/storage/${storagePath.substring(7)}`; // Remove "public/" prefix
  }
  // If path starts with "storage/", use as-is with leading slash
  if (storagePath.startsWith('storage/')) {
    return `/${storagePath}`;
  }
  // Otherwise, assume it's a relative path and prepend slash
  return `/${storagePath}`;
}

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: InsertClient, logoFile?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    client?.logoPath ? getStorageUrl(client.logoPath) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch global settings to get default AI prompt
  const { data: settings } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/admin/settings"],
  });

  // Determine the effective AI prompt: client-specific > global > default
  const effectiveAiPrompt = client?.aiPromptTemplate || settings?.ai_prompt || settings?.default_ai_prompt || "";

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      companyName: client?.companyName || "",
      contactName: client?.contactName || "",
      contactEmail: client?.contactEmail || "",
      notificationEmails: client?.notificationEmails && client.notificationEmails.length > 0 
        ? client.notificationEmails 
        : [""],
      notificationPhoneNumber: client?.notificationPhoneNumber || "",
      notificationTime: client?.notificationTime || "",
      notificationDays: client?.notificationDays as any || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      brandColor: client?.brandColor || "#E8764B",
      formSlug: client?.formSlug || "",
      aiPromptTemplate: effectiveAiPrompt,
      active: client?.active ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "notificationEmails",
  });

  // Update aiPromptTemplate when settings load
  useEffect(() => {
    if (settings && !client?.aiPromptTemplate) {
      const newEffectivePrompt = settings.ai_prompt || settings.default_ai_prompt || "";
      form.setValue("aiPromptTemplate", newEffectivePrompt);
    }
  }, [settings, client?.aiPromptTemplate, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (data: InsertClient) => {
    console.log("[ClientForm] handleSubmit called with data:", data);
    await onSubmit(data, logoFile || undefined);
  };

  const generateSlug = () => {
    const companyName = form.getValues("companyName");
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("formSlug", slug);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Basic details about the construction company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              data-testid="input-company-name"
              {...form.register("companyName")}
              disabled={isLoading}
              placeholder="e.g., ABC Construction Ltd"
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                data-testid="input-contact-name"
                {...form.register("contactName")}
                disabled={isLoading}
                placeholder="John Smith"
              />
              {form.formState.errors.contactName && (
                <p className="text-sm text-destructive">{form.formState.errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                data-testid="input-contact-email"
                type="email"
                {...form.register("contactEmail")}
                disabled={isLoading}
                placeholder="john@abcconstruction.com"
              />
              {form.formState.errors.contactEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding & Form Settings</CardTitle>
          <CardDescription>Customize the public report form appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-start gap-4">
              {logoPreview && (
                <div className="h-24 w-24 border rounded-lg overflow-hidden bg-card flex items-center justify-center p-2">
                  <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  data-testid="input-logo-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  data-testid="button-upload-logo"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  PNG, JPG or SVG. Max 2MB. Will appear on public forms and PDF reports.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="brandColor">Brand Color *</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="brandColor"
                  data-testid="input-brand-color"
                  type="color"
                  {...form.register("brandColor")}
                  disabled={isLoading}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={form.watch("brandColor")}
                  onChange={(e) => form.setValue("brandColor", e.target.value)}
                  disabled={isLoading}
                  placeholder="#E8764B"
                  className="flex-1"
                />
              </div>
              {form.formState.errors.brandColor && (
                <p className="text-sm text-destructive">{form.formState.errors.brandColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="formSlug">Form URL Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="formSlug"
                  data-testid="input-form-slug"
                  {...form.register("formSlug")}
                  disabled={isLoading}
                  placeholder="abc-construction"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSlug}
                  disabled={isLoading}
                  data-testid="button-generate-slug"
                >
                  Generate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Public form URL: /form/{form.watch("formSlug") || "your-slug"}
              </p>
              {form.formState.errors.formSlug && (
                <p className="text-sm text-destructive">{form.formState.errors.formSlug.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              {...form.register("active")}
              disabled={isLoading}
              className="h-4 w-4"
              data-testid="checkbox-active"
            />
            <Label htmlFor="active" className="font-normal cursor-pointer">
              Client is active (form accepts submissions)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Recipients</CardTitle>
          <CardDescription>Email addresses that will receive PDF reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...form.register(`notificationEmails.${index}` as const)}
                placeholder="email@example.com"
                type="email"
                disabled={isLoading}
                data-testid={`input-notification-email-${index}`}
                className="flex-1"
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={isLoading}
                  data-testid={`button-remove-email-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {form.formState.errors.notificationEmails && (
            <p className="text-sm text-destructive">
              {form.formState.errors.notificationEmails.message || "Please provide at least one valid email"}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => append("")}
            disabled={isLoading}
            data-testid="button-add-email"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Email Address
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Reminder Notifications (Optional)</CardTitle>
          <CardDescription>
            Send daily SMS reminders to foreman to complete the daily report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="notificationPhoneNumber">Phone Number</Label>
              <Input
                id="notificationPhoneNumber"
                data-testid="input-notification-phone"
                type="tel"
                {...form.register("notificationPhoneNumber")}
                disabled={isLoading}
                placeholder="+61412345678"
              />
              <p className="text-sm text-muted-foreground">
                Include country code (e.g., +61 for Australia)
              </p>
              {form.formState.errors.notificationPhoneNumber && (
                <p className="text-sm text-destructive">{form.formState.errors.notificationPhoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationTime">Reminder Time</Label>
              <Input
                id="notificationTime"
                data-testid="input-notification-time"
                type="time"
                {...form.register("notificationTime")}
                disabled={isLoading}
                placeholder="17:00"
              />
              <p className="text-sm text-muted-foreground">
                Daily reminder time (24-hour format, Australian Eastern Time - Sydney/Melbourne)
              </p>
              {form.formState.errors.notificationTime && (
                <p className="text-sm text-destructive">{form.formState.errors.notificationTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Send Reminders On</Label>
            <p className="text-sm text-muted-foreground">
              Select which days of the week to send SMS reminders
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { value: 'monday' as const, label: 'Monday' },
                { value: 'tuesday' as const, label: 'Tuesday' },
                { value: 'wednesday' as const, label: 'Wednesday' },
                { value: 'thursday' as const, label: 'Thursday' },
                { value: 'friday' as const, label: 'Friday' },
                { value: 'saturday' as const, label: 'Saturday' },
                { value: 'sunday' as const, label: 'Sunday' }
              ]).map((day) => {
                const currentDays = form.watch('notificationDays') || [];
                const isChecked = currentDays.includes(day.value);
                
                return (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      data-testid={`checkbox-${day.value}`}
                      checked={isChecked}
                      disabled={isLoading}
                      onCheckedChange={(checked) => {
                        const current = form.getValues('notificationDays') || [];
                        if (checked) {
                          form.setValue('notificationDays', [...current, day.value] as any);
                        } else {
                          form.setValue('notificationDays', current.filter(d => d !== day.value) as any);
                        }
                      }}
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              If no days are selected, no reminders will be sent
            </p>
          </div>
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aiPromptTemplate">AI Prompt Template</Label>
            <Textarea
              id="aiPromptTemplate"
              data-testid="input-ai-prompt-template"
              {...form.register("aiPromptTemplate")}
              placeholder="Leave empty to use the default prompt..."
              rows={20}
              className="font-mono text-sm"
              disabled={isLoading}
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
              <li>This prompt will be used for all reports submitted for this client</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="button-save-client">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            client ? "Update Client" : "Create Client"
          )}
        </Button>
      </div>
    </form>
  );
}
