import { Link } from "wouter";
import { type ReportWithClient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, Download, Eye, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

interface ReportListProps {
  reports: ReportWithClient[];
  onDownloadPdf?: (reportId: string) => void;
}

export default function ReportList({ reports, onDownloadPdf }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
        <p className="text-muted-foreground">Reports will appear here as site workers submit them</p>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Client
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Project
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-t hover-elevate"
                  data-testid={`row-report-${report.id}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium" data-testid={`text-date-${report.id}`}>
                        {format(new Date(report.reportDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span data-testid={`text-client-${report.id}`}>{report.client.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium" data-testid={`text-project-${report.id}`}>
                      {report.projectName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(report.status)} data-testid={`badge-status-${report.id}`}>
                      {report.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/reports/${report.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-${report.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      {report.pdfPath && onDownloadPdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadPdf(report.id)}
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-6" data-testid={`card-report-mobile-${report.id}`}>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(report.reportDate), "MMM dd, yyyy")}</span>
                  </div>
                  <h3 className="font-semibold truncate">{report.projectName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate">{report.client.companyName}</span>
                  </div>
                </div>
                <Badge variant={getStatusVariant(report.status)}>
                  {report.status}
                </Badge>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Link href={`/admin/reports/${report.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                {report.pdfPath && onDownloadPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadPdf(report.id)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
