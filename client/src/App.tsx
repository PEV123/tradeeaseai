import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Clients from "@/pages/admin/Clients";
import NewClient from "@/pages/admin/NewClient";
import EditClient from "@/pages/admin/EditClient";
import Reports from "@/pages/admin/Reports";
import ReportDetail from "@/pages/admin/ReportDetail";
import PublicForm from "@/pages/public/PublicForm";

function AdminRouter() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (token) {
      localStorage.setItem("admin_token", token);
      // Redirect to clients if we're just at /admin
      if (location === "/admin" || location === "/admin/") {
        setLocation("/admin/clients");
      }
    } else {
      localStorage.removeItem("admin_token");
    }
  }, [token, location, setLocation]);

  const handleLogout = () => {
    setToken(null);
    setLocation("/admin");
  };

  if (!token) {
    return <AdminLogin onLoginSuccess={setToken} />;
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <Switch base="/admin">
        <Route path="dashboard" component={Dashboard} />
        <Route path="clients" component={Clients} />
        <Route path="clients/new" component={NewClient} />
        <Route path="clients/:id/edit" component={EditClient} />
        <Route path="reports" component={Reports} />
        <Route path="reports/:id" component={ReportDetail} />
        <Route path=":rest*">
          <Redirect to="/admin/clients" />
        </Route>
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/form/:slug" component={PublicForm} />
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route path="/">
        <Redirect to="/admin" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
