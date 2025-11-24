import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Mail, Brain, Users, Shield, CheckCircle, ArrowRight } from "lucide-react";
import logoUrl from "@assets/Trade Ease Logo - black (1)_1763089710627.png";
import heroBackground from "@assets/generated_images/Construction_site_hero_background_d312695b.png";
import techBackground from "@assets/generated_images/Technology_workspace_background_56fe0754.png";
import patternBackground from "@assets/generated_images/Abstract_geometric_pattern_a05969fd.png";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <img src={logoUrl} alt="TradeaseAI" className="h-10 w-auto" data-testid="img-logo-nav" />
            <div className="flex gap-3">
              <Link href="/client/login">
                <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-client-login-nav">
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div 
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-orange-900/70"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-32 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <img 
              src={logoUrl} 
              alt="TradeaseAI" 
              className="h-24 w-auto mx-auto drop-shadow-2xl" 
              data-testid="img-logo-hero" 
            />
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Daily Work Tracking for Construction Managers
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Log your daily construction activities and get professional PDF reports instantly. At job completion, receive a comprehensive spreadsheet with all project details.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a href="https://www.tradeease.ai/contact" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6 h-auto"
                  data-testid="button-get-started-hero"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Link href="/client/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/30 text-white text-lg px-8 py-6 h-auto"
                  data-testid="button-client-portal-hero"
                >
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Key Benefits Section */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for Construction Managers</h2>
            <p className="text-xl text-muted-foreground">Track daily work, manage your projects, and get comprehensive financial summaries</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover-elevate">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Daily Work Logging</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Quickly log each day's activities, workforce, materials used, and site photos in one simple form.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Instant PDF Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  AI analyzes your entries and generates professional PDF reports automatically for daily documentation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">End-of-Job Spreadsheet</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  When your project is complete, get a comprehensive spreadsheet with all work details and financial data.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section with Background */}
      <div 
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: `url(${techBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/95 via-orange-700/95 to-orange-800/95"></div>
        
        <div className="relative z-10 container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-white/90">Simple daily logging to comprehensive project summaries</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: "Easy Daily Forms", desc: "Quick and simple forms to log workforce, hours worked, materials used, and progress photos each day" },
              { icon: Brain, title: "AI-Generated Reports", desc: "Your daily entries are automatically transformed into professional PDF reports with AI analysis" },
              { icon: Zap, title: "Organized Data Storage", desc: "All your daily logs are saved and organized chronologically for easy reference and tracking" },
              { icon: Mail, title: "Email Distribution", desc: "Daily PDF reports automatically sent to project stakeholders to keep everyone informed" },
              { icon: Users, title: "Client Portal Access", desc: "View all your reports and collate financial data for each job in our dedicated portal" },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl bg-white/10 backdrop-blur-sm hover-elevate">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">From daily logging to complete project summaries</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "1", title: "Log Your Day", desc: "Enter work details, labor hours, materials, and upload site photos" },
              { num: "2", title: "Get PDF Report", desc: "AI generates a professional daily report automatically" },
              { num: "3", title: "Track Progress", desc: "All daily reports saved and organized in your portal" },
              { num: "4", title: "Export Spreadsheet", desc: "At job completion, download a comprehensive data spreadsheet" },
            ].map((step) => (
              <div key={step.num} className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{step.num}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-xl">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div 
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: `url(${patternBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/95"></div>
        
        <div className="relative z-10 container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Tracking Your Projects Today
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Log daily work, get instant reports, and export comprehensive project data when the job is done
          </p>
          <a href="https://www.tradeease.ai/contact" target="_blank" rel="noopener noreferrer">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-10 py-6 h-auto"
              data-testid="button-cta-get-started"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="TradeaseAI" className="h-10 w-auto" data-testid="img-logo-footer" />
            </div>
            <p className="text-white/60">
              © 2025 TradeaseAI. Construction Site Daily Reporting System.
            </p>
            <div className="flex gap-4">
              <Link href="/client/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
