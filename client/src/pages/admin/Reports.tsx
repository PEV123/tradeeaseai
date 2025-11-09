import { useQuery } from "@tanstack/react-query";
import { type ReportWithClient } from "@shared/schema";
import ReportList from "@/components/admin/ReportList";

export default function Reports() {
  const { data: reports = [], isLoading } = useQuery<ReportWithClient[]>({
    queryKey: ["/api/admin/reports"],
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
      <div>
        <h1 className="text-3xl font-semibold mb-2">All Reports</h1>
        <p className="text-muted-foreground">View and manage all submitted daily reports</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <ReportList reports={reports} onDownloadPdf={handleDownloadPdf} />
      )}
    </div>
  );
}
