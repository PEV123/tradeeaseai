import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      icon: Building2,
      href: "/admin/clients",
      color: "text-primary",
    },
    {
      title: "Total Reports",
      value: stats?.totalReports || 0,
      icon: FileText,
      href: "/admin/reports",
      color: "text-chart-2",
    },
    {
      title: "Processing",
      value: stats?.processingReports || 0,
      icon: Clock,
      href: "/admin/reports",
      color: "text-chart-4",
    },
    {
      title: "Completed Today",
      value: stats?.completedToday || 0,
      icon: CheckCircle2,
      href: "/admin/reports",
      color: "text-chart-3",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to TradeaseAI admin portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/clients/new">
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-new-client">
                <Building2 className="h-4 w-4 mr-2" />
                Create New Client
              </Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Clients
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View All Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your first construction company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</div>
                Create a client
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                Add a construction company with their branding and notification emails
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">2</div>
                Share form link
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                Give site workers the custom form URL to submit daily reports
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">3</div>
                Review AI reports
              </h4>
              <p className="text-sm text-muted-foreground ml-8">
                GPT-5 analyzes photos and generates professional PDF reports automatically
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
