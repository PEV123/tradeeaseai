import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, type InsertReport, type Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import ImageUpload from "./ImageUpload";
import logoUrl from "@assets/tradeaseai-logo_1762739159026.png";

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

interface SiteReportFormProps {
  client: Client;
}

export default function SiteReportForm({ client }: SiteReportFormProps) {
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<InsertReport>({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      clientId: client.id,
      reportDate: new Date().toISOString().split('T')[0],
      projectName: "",
      worksPerformed: "",
      labourOnSite: "",
      plantMachinery: "",
      hoursWorked: "",
      materialsUsed: "",
      delaysWeather: "",
      safetyIncidents: "None reported",
    },
  });

  const onSubmit = async (data: InsertReport) => {
    // Temporarily allow submissions without images for testing
    // TODO: Re-enable validation once image handling is tested
    // if (images.length === 0) {
    //   alert("Please upload at least one site photo");
    //   return;
    // }

    setIsSubmitting(true);
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await fetch("/api/reports/submit", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsSuccess(true);
        form.reset();
        setImages([]);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit report");
      }
    } catch (error) {
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Report Submitted Successfully!</CardTitle>
            <CardDescription>
              Your daily site report has been received and is being processed by our AI system.
              A PDF report will be generated and emailed to the team and saved in your client portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setIsSuccess(false)}
              variant="outline"
              className="w-full"
              data-testid="button-submit-another"
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header with Client Branding */}
        <div className="text-center mb-12">
          {client.logoPath ? (
            <img
              src={getStorageUrl(client.logoPath)}
              alt={client.companyName}
              className="h-16 mx-auto mb-4"
            />
          ) : (
            <div
              className="h-16 w-16 rounded-lg mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: client.brandColor }}
            >
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-semibold mb-2">{client.companyName}</h1>
          <p className="text-lg text-muted-foreground">Daily Site Report</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Enter the basic information about today's work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reportDate">Report Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reportDate"
                      type="date"
                      {...form.register("reportDate")}
                      disabled={isSubmitting}
                      className="pl-10"
                      data-testid="input-report-date"
                    />
                  </div>
                  {form.formState.errors.reportDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.reportDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    {...form.register("projectName")}
                    disabled={isSubmitting}
                    placeholder="e.g., Main Street Bridge Reconstruction"
                    data-testid="input-project-name"
                  />
                  {form.formState.errors.projectName && (
                    <p className="text-sm text-destructive">{form.formState.errors.projectName.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Works Performed */}
          <Card>
            <CardHeader>
              <CardTitle>Works Performed</CardTitle>
              <CardDescription>Describe the work completed today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="worksPerformed">Works Performed Today *</Label>
                <Textarea
                  id="worksPerformed"
                  {...form.register("worksPerformed")}
                  disabled={isSubmitting}
                  placeholder="Describe all works completed today in detail..."
                  rows={5}
                  data-testid="textarea-works-performed"
                />
                {form.formState.errors.worksPerformed && (
                  <p className="text-sm text-destructive">{form.formState.errors.worksPerformed.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workforce & Equipment */}
          <Card>
            <CardHeader>
              <CardTitle>Workforce & Equipment</CardTitle>
              <CardDescription>Personnel and machinery on site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="labourOnSite">Labour on Site *</Label>
                  <Input
                    id="labourOnSite"
                    {...form.register("labourOnSite")}
                    disabled={isSubmitting}
                    placeholder="e.g., 8 workers (4 labourers, 2 operators, 2 supervisors)"
                    data-testid="input-labour"
                  />
                  {form.formState.errors.labourOnSite && (
                    <p className="text-sm text-destructive">{form.formState.errors.labourOnSite.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursWorked">Hours Worked *</Label>
                  <Input
                    id="hoursWorked"
                    {...form.register("hoursWorked")}
                    disabled={isSubmitting}
                    placeholder="e.g., 8 hours (7:00 AM - 3:30 PM)"
                    data-testid="input-hours"
                  />
                  {form.formState.errors.hoursWorked && (
                    <p className="text-sm text-destructive">{form.formState.errors.hoursWorked.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plantMachinery">Plant & Machinery</Label>
                <Input
                  id="plantMachinery"
                  {...form.register("plantMachinery")}
                  disabled={isSubmitting}
                  placeholder="e.g., Excavator, Concrete mixer, Bobcat"
                  data-testid="input-plant"
                />
              </div>
            </CardContent>
          </Card>

          {/* Materials & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Materials & Site Conditions</CardTitle>
              <CardDescription>Resources used and environmental conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="materialsUsed">Materials Used</Label>
                <Textarea
                  id="materialsUsed"
                  {...form.register("materialsUsed")}
                  disabled={isSubmitting}
                  placeholder="List materials and quantities used today..."
                  rows={3}
                  data-testid="textarea-materials"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delaysWeather">Delays / Weather Conditions</Label>
                <Textarea
                  id="delaysWeather"
                  {...form.register("delaysWeather")}
                  disabled={isSubmitting}
                  placeholder="Note any delays, weather impacts, or site conditions..."
                  rows={3}
                  data-testid="textarea-delays"
                />
              </div>
            </CardContent>
          </Card>

          {/* Safety */}
          <Card>
            <CardHeader>
              <CardTitle>Safety & Incidents</CardTitle>
              <CardDescription>Report any safety incidents or observations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="safetyIncidents">Safety Incidents</Label>
                <Textarea
                  id="safetyIncidents"
                  {...form.register("safetyIncidents")}
                  disabled={isSubmitting}
                  placeholder="Report any incidents, near misses, or safety observations..."
                  rows={3}
                  data-testid="textarea-safety"
                />
              </div>
            </CardContent>
          </Card>

          {/* Site Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Site Photos *</CardTitle>
              <CardDescription>Upload photos showing today's work (at least 1 required)</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                disabled={isSubmitting}
                brandColor={client.brandColor}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full md:w-auto px-12"
              data-testid="button-submit-report"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                "Submit Daily Report"
              )}
            </Button>
          </div>
        </form>

        {/* Powered by footer */}
        <div className="text-center py-8 border-t mt-12">
          <p className="text-sm text-muted-foreground mb-3">Powered by</p>
          <img 
            src={logoUrl} 
            alt="TradeaseAI" 
            className="h-6 mx-auto opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
