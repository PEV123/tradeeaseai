import { useState } from "react";
import { type ReportWithClient, type Worker } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Calendar, Building2, FileText, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Users } from "lucide-react";
import { format } from "date-fns";

interface ReportViewProps {
  report: ReportWithClient;
  workers?: Worker[];
  onDownloadPdf?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function ReportView({ report, workers = [], onDownloadPdf, onRegenerate, isRegenerating }: ReportViewProps) {
  const { client, formData, aiAnalysis } = report;
  const [selectedImage, setSelectedImage] = useState<{ src: string; description: string } | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {client.logoPath ? (
              <img src={`/${client.logoPath}`} alt={client.companyName} className="h-12 object-contain" />
            ) : (
              <div
                className="h-12 w-12 rounded-md flex items-center justify-center"
                style={{ backgroundColor: client.brandColor }}
              >
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold" data-testid="text-project-name">
                {report.projectName}
              </h1>
              <p className="text-muted-foreground">{client.companyName}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant={report.status === "completed" ? "outline" : report.status === "processing" ? "secondary" : "destructive"}
            className={report.status === "completed" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" : ""}
          >
            {report.status}
          </Badge>
          {report.pdfPath && onDownloadPdf && (
            <Button onClick={onDownloadPdf} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Report Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Report Date</p>
              <p className="font-medium" data-testid="text-report-date">
                {format(new Date(report.reportDate), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Submitted</p>
              <p className="font-medium">
                {format(new Date(report.submittedAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Images</p>
              <p className="font-medium" data-testid="text-image-count">{report.images.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Report ID</p>
              <p className="font-mono text-sm" data-testid="text-report-id">{report.id.slice(0, 8)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Data */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Submitted Information</CardTitle>
              <CardDescription>Data entered by site worker</CardDescription>
            </div>
            {onRegenerate && (
              <Button 
                onClick={onRegenerate} 
                variant="outline"
                disabled={isRegenerating || report.status === "processing"}
                data-testid="button-regenerate"
              >
                {isRegenerating || report.status === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate AI Analysis and PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Works Performed</h4>
            <p className="whitespace-pre-wrap" data-testid="text-works-performed">{formData.worksPerformed}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Labour on Site</h4>
              <p data-testid="text-labour">{formData.labourOnSite}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Hours Worked</h4>
              <p data-testid="text-hours">{formData.hoursWorked}</p>
            </div>
          </div>

          {formData.plantMachinery && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Plant & Machinery</h4>
              <p data-testid="text-plant">{formData.plantMachinery}</p>
            </div>
          )}

          {formData.materialsUsed && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Materials Used</h4>
              <p data-testid="text-materials">{formData.materialsUsed}</p>
            </div>
          )}

          {formData.delaysWeather && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Delays / Weather</h4>
              <p data-testid="text-delays">{formData.delaysWeather}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Safety Incidents</h4>
            <p data-testid="text-safety">{formData.safetyIncidents}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              AI-Generated Report Analysis
            </CardTitle>
            <CardDescription>Professional AI-analyzed construction report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiAnalysis.works_summary && (
              <div>
                <h4 className="text-lg font-semibold mb-2">{aiAnalysis.works_summary.title}</h4>
                <p className="text-muted-foreground mb-3">{aiAnalysis.works_summary.description}</p>
                {aiAnalysis.works_summary.key_activities && aiAnalysis.works_summary.key_activities.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {aiAnalysis.works_summary.key_activities.map((activity: string, i: number) => (
                      <li key={i}>{activity}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {aiAnalysis.workforce && (
              <>
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Workers</p>
                    <p className="text-2xl font-semibold">{aiAnalysis.workforce.total_workers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-semibold">{aiAnalysis.workforce.total_hours}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Man Hours</p>
                    <p className="text-2xl font-semibold">{aiAnalysis.workforce.man_hours}</p>
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

            {aiAnalysis.materials?.items_used && aiAnalysis.materials.items_used.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Materials Used</h4>
                <div className="space-y-2">
                  {aiAnalysis.materials.items_used.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>{item.material}</span>
                      <Badge variant="secondary">{item.quantity} {item.unit}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.safety_incidents?.incidents_reported && aiAnalysis.safety_incidents.incidents_reported.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Incidents Reported
                </h4>
                <div className="space-y-3">
                  {aiAnalysis.safety_incidents.incidents_reported.map((incident: any, i: number) => (
                    <div key={i} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      {typeof incident === 'string' ? (
                        <p>{incident}</p>
                      ) : (
                        <>
                          <p className="font-medium">{incident.person || 'Worker'}: {incident.description}</p>
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

            {aiAnalysis.safety_incidents?.safety_observations && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Safety Observations
                </h4>
                <p>{aiAnalysis.safety_incidents.safety_observations}</p>
              </div>
            )}

            {aiAnalysis.next_day_plan?.scheduled_works && aiAnalysis.next_day_plan.scheduled_works.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Next Day Plan</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aiAnalysis.next_day_plan.scheduled_works.map((work: string, i: number) => (
                    <li key={i}>{work}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Site Images */}
      {report.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Site Photos</CardTitle>
            <CardDescription>{report.images.length} images from construction site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.images.map((image) => (
                <div 
                  key={image.id} 
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setSelectedImage({ 
                    src: `/${image.filePath}`, 
                    description: image.aiDescription || image.fileName 
                  })}
                  data-testid={`button-view-image-${image.id}`}
                >
                  <img
                    src={`/${image.filePath}`}
                    alt={image.aiDescription || image.fileName}
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
