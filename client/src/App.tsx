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
import ClientReports from "@/pages/admin/ClientReports";
import Reports from "@/pages/admin/Reports";
import ReportDetail from "@/pages/admin/ReportDetail";
import Settings from "@/pages/admin/Settings";
import PublicForm from "@/pages/public/PublicForm";

function ProtectedRoute({ component: Component }: { component: any }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (token) {
      localStorage.setItem("admin_token", token);
    } else {
      localStorage.removeItem("admin_token");
    }
  }, [token]);

  useEffect(() => {
    // Redirect to clients if we're just at /admin
    if (token && (location === "/admin" || location === "/admin/")) {
      setLocation("/admin/clients");
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
      <Component />
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/form/:slug" component={PublicForm} />
          <Route path="/admin/dashboard">
            {() => <ProtectedRoute component={Dashboard} />}
          </Route>
          <Route path="/admin/clients/new">
            {() => <ProtectedRoute component={NewClient} />}
          </Route>
          <Route path="/admin/clients/:id/reports">
            {() => <ProtectedRoute component={ClientReports} />}
          </Route>
          <Route path="/admin/clients/:id/edit">
            {() => <ProtectedRoute component={EditClient} />}
          </Route>
          <Route path="/admin/clients">
            {() => <ProtectedRoute component={Clients} />}
          </Route>
          <Route path="/admin/reports/:id">
            {() => <ProtectedRoute component={ReportDetail} />}
          </Route>
          <Route path="/admin/reports">
            {() => <ProtectedRoute component={Reports} />}
          </Route>
          <Route path="/admin/settings">
            {() => <ProtectedRoute component={Settings} />}
          </Route>
          <Route path="/admin">
            {() => <ProtectedRoute component={Clients} />}
          </Route>
          <Route path="/">
            <Redirect to="/admin" />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
