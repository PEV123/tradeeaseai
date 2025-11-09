import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type Client } from "@shared/schema";
import SiteReportForm from "@/components/form/SiteReportForm";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicForm() {
  const [, params] = useRoute("/form/:slug");

  const { data: client, isLoading, error } = useQuery<Client>({
    queryKey: [`/api/public/client/${params?.slug}`],
    enabled: !!params?.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Form Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The form you're looking for doesn't exist or is no longer active.
              Please check the URL and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Form Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This form is currently inactive and not accepting submissions.
              Please contact your project manager for more information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SiteReportForm client={client} />;
}
