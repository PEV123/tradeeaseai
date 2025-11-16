import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ClientList from "@/components/admin/ClientList";
import { type ClientWithReportCount } from "@shared/schema";

export default function Clients() {
  const { data: clients = [], isLoading } = useQuery<ClientWithReportCount[]>({
    queryKey: ["/api/admin/clients"],
  });

  const sortedClients = [...clients].sort((a, b) => 
    a.companyName.localeCompare(b.companyName)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Clients</h1>
          <p className="text-muted-foreground">Manage construction company clients and their reports</p>
        </div>
        <Link href="/admin/clients/new">
          <Button data-testid="button-create-client">
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <ClientList clients={sortedClients} />
      )}
    </div>
  );
}
