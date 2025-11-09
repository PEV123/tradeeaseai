import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { type Client, type InsertClient } from "@shared/schema";
import ClientForm from "@/components/admin/ClientForm";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function EditClient() {
  const [, params] = useRoute("/admin/clients/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: [`/api/admin/clients/${params?.id}`],
    enabled: !!params?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ data, logoFile }: { data: InsertClient; logoFile?: File }) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await fetch(`/api/admin/clients/${params?.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update client");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${params?.id}`] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setLocation("/admin/clients");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = async (data: InsertClient, logoFile?: File) => {
    await updateMutation.mutateAsync({ data, logoFile });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Client not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Edit Client</h1>
          <p className="text-muted-foreground">{client.companyName}</p>
        </div>
      </div>

      <ClientForm
        client={client}
        onSubmit={handleSubmit}
        onCancel={() => setLocation("/admin/clients")}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
