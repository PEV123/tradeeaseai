import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Mail, Brain, Users, Shield, CheckCircle, ArrowRight } from "lucide-react";
import logoUrl from "@assets/tradeeaseai-logo_1762856519098.png";
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
              <Link href="/admin">
                <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white hover:text-orange-600" data-testid="button-admin-login-nav">
                  Admin Login
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
              Transform Your Construction Reporting
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              AI-powered daily site reports that save time, improve accuracy, and keep stakeholders informed—automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/admin">
                <Button 
                  size="lg" 
                  className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6 h-auto"
                  data-testid="button-get-started-hero"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/client/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-orange-600 text-lg px-8 py-6 h-auto"
                  data-testid="button-view-portal-hero"
                >
                  View Client Portal
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose TradeaseAI?</h2>
            <p className="text-xl text-muted-foreground">Everything you need for professional construction documentation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover-elevate">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Save 80% of Time</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Automated AI analysis and PDF generation means reports that used to take hours now take minutes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  GPT-5 analyzes photos and data to extract workforce details, materials, and safety observations automatically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Secure & Professional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Client-branded PDFs, secure portal access, and automated email delivery to keep everyone informed.
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Complete Feature Set</h2>
            <p className="text-xl text-white/90">Built for modern construction companies</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: "Custom Branded Forms", desc: "No-login forms with your company logo and colors that workers access via simple URL" },
              { icon: Brain, title: "GPT-5 Analysis", desc: "Advanced AI analyzes form data and site photos to generate comprehensive reports" },
              { icon: Zap, title: "Automated PDFs", desc: "Beautiful, branded PDF reports with embedded images created automatically" },
              { icon: Mail, title: "Email Notifications", desc: "Automatically send completed reports to all stakeholders via SMTP" },
              { icon: Users, title: "Client Portal", desc: "Secure portal where clients can view and download all their historical reports" },
              { icon: Shield, title: "Multi-Client Management", desc: "Manage multiple companies, each with custom branding and settings" },
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
            <p className="text-xl text-muted-foreground">Simple workflow, powerful results</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "1", title: "Submit Report", desc: "Workers fill out branded forms with photos from any device" },
              { num: "2", title: "AI Analysis", desc: "GPT-5 analyzes data and images in seconds" },
              { num: "3", title: "Generate PDF", desc: "Professional branded reports created automatically" },
              { num: "4", title: "Distribute", desc: "Email to stakeholders and available in client portal" },
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
            Ready to Transform Your Reporting?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join construction companies saving hours every day with AI-powered reporting
          </p>
          <Link href="/admin">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-10 py-6 h-auto"
              data-testid="button-cta-get-started"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
              <Link href="/admin">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Admin
                </Button>
              </Link>
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
