import { Link } from "wouter";
import { type ClientWithReportCount } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Edit, FileText, Link as LinkIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClientListProps {
  clients: ClientWithReportCount[];
}

export default function ClientList({ clients }: ClientListProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/clients/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Client deleted",
        description: "The client and all associated reports have been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete client",
      });
    },
  });

  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No clients yet</h3>
        <p className="text-muted-foreground mb-6">Get started by creating your first construction company client</p>
        <Link href="/admin/clients/new">
          <Button data-testid="button-create-first-client">
            Create First Client
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <Card key={client.id} data-testid={`card-client-${client.id}`} className="hover-elevate">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {client.logoPath ? (
                  <img 
                    src={client.logoPath} 
                    alt={`${client.companyName} logo`}
                    className="h-12 object-contain mb-3"
                  />
                ) : (
                  <div 
                    className="h-12 w-12 rounded-md mb-3 flex items-center justify-center"
                    style={{ backgroundColor: client.brandColor }}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                )}
                <CardTitle className="text-lg truncate">{client.companyName}</CardTitle>
                <CardDescription className="truncate">{client.contactName}</CardDescription>
              </div>
              <Badge variant={client.active ? "default" : "secondary"} data-testid={`badge-status-${client.id}`}>
                {client.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span data-testid={`text-report-count-${client.id}`}>{client.reportCount} reports</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                /form/{client.formSlug}
              </code>
            </div>

            <div className="flex gap-2 pt-2">
              <Link href={`/admin/clients/${client.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full" data-testid={`button-edit-${client.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Link href={`/admin/clients/${client.id}/reports`} className="flex-1">
                <Button size="sm" className="w-full" data-testid={`button-view-reports-${client.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              </Link>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  data-testid={`button-delete-${client.id}`}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Client
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {client.companyName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this client, all {client.reportCount} associated reports, and all related files (images, PDFs). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid={`button-cancel-delete-${client.id}`}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(client.id)}
                    className="bg-destructive hover:bg-destructive/90"
                    data-testid={`button-confirm-delete-${client.id}`}
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
