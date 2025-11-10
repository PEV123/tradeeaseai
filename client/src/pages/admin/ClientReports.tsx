import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type ReportWithClient } from "@shared/schema";
import ReportList from "@/components/admin/ReportList";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ClientReports() {
  const [, params] = useRoute("/admin/clients/:id/reports");
  const clientId = params?.id;

  const { data: reports = [], isLoading } = useQuery<ReportWithClient[]>({
    queryKey: [`/api/admin/clients/${clientId}/reports`],
    enabled: !!clientId,
  });

  const { data: client } = useQuery<any>({
    queryKey: [`/api/admin/clients/${clientId}`],
    enabled: !!clientId,
  });

  const handleDownloadPdf = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/download/${reportId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="sm" data-testid="button-back-to-clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-semibold mb-2">
          {client?.companyName ? `${client.companyName} - Reports` : "Client Reports"}
        </h1>
        <p className="text-muted-foreground">View and manage all reports for this client</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">No reports submitted yet for this client</p>
        </div>
      ) : (
        <ReportList reports={reports} onDownloadPdf={handleDownloadPdf} />
      )}
    </div>
  );
}
