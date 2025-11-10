import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Users, LogOut, LayoutDashboard } from "lucide-react";
import logoUrl from "@assets/tradeaseai-logo_1762739159026.png";

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/admin/clients", icon: Building2 },
    { name: "All Reports", href: "/admin/reports", icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="h-16 border-b px-6 flex items-center">
          <img 
            src={logoUrl} 
            alt="TradeaseAI" 
            className="h-8"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`
                    w-full justify-start gap-3 hover-elevate active-elevate-2
                    ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                  `}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
