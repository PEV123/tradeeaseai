import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, Download, FileText, LogOut, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  projectName: string;
  reportDate: Date;
  createdAt: Date;
  status: string;
  pdfPath: string | null;
}

interface Client {
  id: string;
  name: string;
  brandColor: string | null;
  logoPath: string | null;
}

interface ClientPortalProps {
  clientId: string;
  client: Client;
  onLogout: () => void;
}

export default function ClientPortal({ clientId, client, onLogout }: ClientPortalProps) {
  const [, setLocation] = useLocation();

  const { data: reports, isLoading, error } = useQuery<Report[]>({
    queryKey: ["/api/client/reports"],
    queryFn: async () => {
      const response = await fetch("/api/client/reports", {
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        // Auth error, force logout
        onLogout();
        throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
  });

  // Show error state if query failed
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Error Loading Reports</h1>
              <Button variant="outline" onClick={onLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium mb-2 text-destructive">Failed to load reports</p>
              <p className="text-sm text-muted-foreground mb-4">Please try again or contact support</p>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleDownloadPDF = async (reportId: string) => {
    const response = await fetch(`/api/client/reports/${reportId}/pdf`, {
      credentials: "include",
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white" data-testid={`status-completed`}>Completed</Badge>;
      case "processing":
        return <Badge variant="secondary" data-testid={`status-processing`}>Processing</Badge>;
      case "failed":
        return <Badge variant="destructive" data-testid={`status-failed`}>Failed</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const brandColor = client.brandColor || "#2563eb";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="border-b"
        style={{ 
          backgroundColor: `${brandColor}10`,
          borderBottomColor: `${brandColor}30`,
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {client.logoPath ? (
                <img 
                  src={`/storage/${client.logoPath}`} 
                  alt={client.name}
                  className="h-12 w-auto object-contain"
                  data-testid="img-client-logo"
                />
              ) : (
                <div 
                  className="rounded-full p-3"
                  style={{ backgroundColor: brandColor }}
                >
                  <Building2 className="h-6 w-6 text-white" data-testid="icon-building" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-client-name">{client.name}</h1>
                <p className="text-sm text-muted-foreground">Daily Report Portal</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2" data-testid="text-reports-title">Construction Reports</h2>
          <p className="text-muted-foreground">
            View and download your daily site reports
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-reports" />
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} data-testid={`card-report-${report.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2" data-testid={`text-project-name-${report.id}`}>
                        <FileText className="h-5 w-5" />
                        {report.projectName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1" data-testid={`text-report-date-${report.id}`}>
                            <Calendar className="h-4 w-4" />
                            {report.reportDate ? format(new Date(report.reportDate), "PPP") : "N/A"}
                          </span>
                          <span className="text-muted-foreground" data-testid={`text-submitted-${report.id}`}>
                            Submitted {report.createdAt ? format(new Date(report.createdAt), "PPP") : "N/A"}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/client/reports/${report.id}`)}
                      data-testid={`button-view-${report.id}`}
                    >
                      View Details
                    </Button>
                    {report.pdfPath && (
                      <Button
                        variant="default"
                        onClick={() => handleDownloadPDF(report.id)}
                        data-testid={`button-download-${report.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" data-testid="icon-no-reports" />
              <p className="text-lg font-medium mb-2" data-testid="text-no-reports">No reports yet</p>
              <p className="text-sm text-muted-foreground text-center">
                Daily reports submitted by your site workers will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
