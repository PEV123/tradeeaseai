import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertClient } from "@shared/schema";
import ClientForm from "@/components/admin/ClientForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NewClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ data, logoFile }: { data: InsertClient; logoFile?: File }) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create client");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
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
    await createMutation.mutateAsync({ data, logoFile });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Create New Client</h1>
          <p className="text-muted-foreground">Add a construction company to the system</p>
        </div>
      </div>

      <ClientForm
        onSubmit={handleSubmit}
        onCancel={() => setLocation("/admin/clients")}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
