import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { type ReportWithClient } from "@shared/schema";
import ReportView from "@/components/admin/ReportView";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReportDetail() {
  const [, params] = useRoute("/admin/reports/:id");
  const { toast } = useToast();

  const { data: report, isLoading } = useQuery<ReportWithClient>({
    queryKey: [`/api/reports/${params?.id}`],
    enabled: !!params?.id,
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!params?.id) throw new Error("No report ID");
      return await apiRequest("POST", `/api/reports/${params.id}/regenerate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Regeneration started",
        description: "The AI analysis and PDF are being regenerated. This may take a few moments.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to regenerate report",
      });
    },
  });

  const handleDownloadPdf = async () => {
    if (!params?.id) return;
    
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/reports/download/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
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
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to download PDF",
        });
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download PDF",
      });
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

      <ReportView 
        report={report} 
        onDownloadPdf={handleDownloadPdf}
        onRegenerate={() => regenerateMutation.mutate()}
        isRegenerating={regenerateMutation.isPending}
      />
    </div>
  );
}
