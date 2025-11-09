import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { type ReportWithClient } from "@shared/schema";
import ReportView from "@/components/admin/ReportView";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportDetail() {
  const [, params] = useRoute("/admin/reports/:id");

  const { data: report, isLoading } = useQuery<ReportWithClient>({
    queryKey: [`/api/reports/${params?.id}`],
    enabled: !!params?.id,
  });

  const handleDownloadPdf = async () => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/reports/download/${params.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${params.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Report Details</p>
        </div>
      </div>

      <ReportView report={report} onDownloadPdf={handleDownloadPdf} />
    </div>
  );
}
