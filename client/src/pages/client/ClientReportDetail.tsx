import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Download, Loader2, Users } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  projectName: string;
  reportDate: Date;
  createdAt: Date;
  status: string;
  pdfPath: string | null;
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

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2" data-testid="text-project-name">{report.projectName}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(report.reportDate), "PPP")}
                  </span>
                  <Badge variant={report.status === "completed" ? "default" : "secondary"} data-testid="badge-status">
                    {report.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {analysis && (
          <>
            {/* Workforce */}
            {workers && workers.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Workforce ({workers.length} workers)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {workers.map((worker) => (
                      <Badge key={worker.id} variant="secondary" data-testid={`badge-worker-${worker.id}`}>
                        {worker.workerName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Works Performed */}
            {analysis.works_performed && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Works Performed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap" data-testid="text-works-performed">{analysis.works_performed.detailed_description}</p>
                </CardContent>
              </Card>
            )}

            {/* Site Conditions */}
            {analysis.site_conditions && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Site Conditions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weather</p>
                    <p data-testid="text-weather">{analysis.site_conditions.weather}</p>
                  </div>
                  {analysis.site_conditions.temperature && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                      <p data-testid="text-temperature">{analysis.site_conditions.temperature}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Materials */}
            {analysis.materials_tracking && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap" data-testid="text-materials">{analysis.materials_tracking.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Safety */}
            {analysis.safety_observations && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Safety Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap" data-testid="text-safety">{analysis.safety_observations.summary}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Images */}
        {images && images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Site Photos ({images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="space-y-2" data-testid={`image-container-${image.id}`}>
                    <img
                      src={`/${image.filePath}`}
                      alt={image.aiDescription || "Site photo"}
                      className="w-full rounded-md border"
                      data-testid={`img-${image.id}`}
                    />
                    {image.aiDescription && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-caption-${image.id}`}>
                        {image.aiDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
