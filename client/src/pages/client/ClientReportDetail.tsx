import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Download, Loader2, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  projectName: string;
  reportDate: Date;
  createdAt: Date;
  submittedAt: Date;
  status: string;
  pdfPath: string | null;
  formData: any;
  aiAnalysis: any;
}

interface Worker {
  id: string;
  workerName: string;
  hoursWorked: number | null;
}

interface Image {
  id: string;
  filePath: string;
  aiDescription: string | null;
}

export default function ClientReportDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<{ src: string; description: string } | null>(null);

  const { data: report, isLoading, error } = useQuery<Report>({
    queryKey: ["/api/client/reports", id],
    queryFn: async () => {
      const response = await fetch(`/api/client/reports/${id}`, {
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        setLocation("/client/login");
        throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error("Failed to fetch report");
      return response.json();
    },
  });

  const { data: workers } = useQuery<Worker[]>({
    queryKey: ["/api/client/reports", id, "workers"],
    queryFn: async () => {
      const response = await fetch(`/api/client/reports/${id}/workers`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!id,
  });

  const { data: images } = useQuery<Image[]>({
    queryKey: ["/api/client/reports", id, "images"],
    queryFn: async () => {
      const response = await fetch(`/api/client/reports/${id}/images`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!id,
  });

  const handleDownloadPDF = async () => {
    if (!report?.pdfPath) return;
    const response = await fetch(`/api/client/reports/${id}/pdf`, {
      credentials: "include",
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-report" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load report</p>
            <Button onClick={() => setLocation("/client/portal")} className="mt-4">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = report.aiAnalysis;
  const formData = report.formData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation("/client/portal")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal
          </Button>
          {report.pdfPath && (
            <Button onClick={handleDownloadPDF} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>

        {/* Header with project name and status */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-project-name">
            {report.projectName}
          </h1>
          <Badge 
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="badge-status"
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Badge>
        </div>

        {/* Metadata Table */}
        <div className="mb-6 border rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y">
              <tr className="hover-elevate">
                <td className="px-4 py-2 text-sm font-medium text-muted-foreground w-32">Report Date</td>
                <td className="px-4 py-2 text-sm" data-testid="text-report-date">
                  {format(new Date(report.reportDate), "MMM dd, yyyy")}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-muted-foreground w-32">Submitted</td>
                <td className="px-4 py-2 text-sm" data-testid="text-submitted-date">
                  {report.submittedAt ? format(new Date(report.submittedAt), "MMM dd, yyyy HH:mm") : "N/A"}
                </td>
              </tr>
              <tr className="hover-elevate">
                <td className="px-4 py-2 text-sm font-medium text-muted-foreground">Images</td>
                <td className="px-4 py-2 text-sm" data-testid="text-image-count">{images?.length || 0}</td>
                <td className="px-4 py-2 text-sm font-medium text-muted-foreground">Report ID</td>
                <td className="px-4 py-2 text-sm font-mono" data-testid="text-report-id">{report.id.slice(0, 8)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Form Data */}
        {formData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Submitted Information</CardTitle>
              <CardDescription>Data entered by site worker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Works Performed</h4>
                <p className="whitespace-pre-wrap" data-testid="text-form-works-performed">{formData.worksPerformed}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Labour on Site</h4>
                  <p data-testid="text-form-labour">{formData.labourOnSite}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Hours Worked</h4>
                  <p data-testid="text-form-hours">{formData.hoursWorked}</p>
                </div>
              </div>

              {formData.plantMachinery && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Plant & Machinery</h4>
                  <p data-testid="text-form-plant">{formData.plantMachinery}</p>
                </div>
              )}

              {formData.materialsUsed && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Materials Used</h4>
                  <p data-testid="text-form-materials">{formData.materialsUsed}</p>
                </div>
              )}

              {formData.delaysWeather && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Delays / Weather</h4>
                  <p data-testid="text-form-delays">{formData.delaysWeather}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Safety Incidents</h4>
                <p data-testid="text-form-safety">{formData.safetyIncidents}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {analysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                AI-Generated Report Analysis
              </CardTitle>
              <CardDescription>Professional AI-analyzed construction report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysis.works_summary && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">{analysis.works_summary.title}</h4>
                  <p className="text-muted-foreground mb-3">{analysis.works_summary.description}</p>
                  {analysis.works_summary.key_activities && analysis.works_summary.key_activities.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.works_summary.key_activities.map((activity: string, i: number) => (
                        <li key={i}>{activity}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {analysis.workforce && (
                <>
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Workers</p>
                      <p className="text-2xl font-semibold">{analysis.workforce.total_workers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-semibold">{analysis.workforce.total_hours}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Man Hours</p>
                      <p className="text-2xl font-semibold">{analysis.workforce.man_hours}</p>
                    </div>
                  </div>
                  {workers && workers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Worker Names
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {workers.map((worker) => (
                          <Badge key={worker.id} variant="secondary" data-testid={`badge-worker-${worker.id}`}>
                            {worker.workerName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {analysis.materials?.items_used && analysis.materials.items_used.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Materials Used</h4>
                  <div className="space-y-2">
                    {analysis.materials.items_used.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>{item.material}</span>
                        <Badge variant="secondary">{item.quantity} {item.unit}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.safety_incidents?.incidents_reported && analysis.safety_incidents.incidents_reported.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Incidents Reported
                  </h4>
                  <div className="space-y-3">
                    {analysis.safety_incidents.incidents_reported.map((incident: any, i: number) => (
                      <div key={i} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        {typeof incident === 'string' ? (
                          <p>{incident}</p>
                        ) : (
                          <>
                            <p className="font-medium">
                              {incident.person || 'Worker'}: {incident.description || 'Incident reported - details unavailable'}
                            </p>
                            {incident.action_taken && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <strong>Action taken:</strong> {incident.action_taken}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.safety_incidents?.safety_observations && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Safety Observations
                  </h4>
                  <p>{analysis.safety_incidents.safety_observations}</p>
                </div>
              )}

              {analysis.next_day_plan?.scheduled_works && analysis.next_day_plan.scheduled_works.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Next Day Plan</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.next_day_plan.scheduled_works.map((work: string, i: number) => (
                      <li key={i}>{work}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Site Images */}
        {images && images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Site Photos</CardTitle>
              <CardDescription>{images.length} images from construction site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div 
                    key={image.id} 
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => setSelectedImage({ 
                      src: `/${image.filePath}`, 
                      description: image.aiDescription || "Site photo" 
                    })}
                    data-testid={`button-view-image-${image.id}`}
                  >
                    <img
                      src={`/${image.filePath}`}
                      alt={image.aiDescription || "Site photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      data-testid={`img-site-photo-${image.id}`}
                    />
                    {image.aiDescription && (
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                        <p className="text-xs text-white">{image.aiDescription}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Site Photo</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.src}
                alt={selectedImage.description}
                className="w-full h-auto rounded-lg"
              />
              {selectedImage.description && (
                <p className="text-sm text-muted-foreground">{selectedImage.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
