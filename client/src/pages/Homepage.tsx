import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Mail, Brain, Users, Shield, Building2 } from "lucide-react";
import logoUrl from "@assets/tradeeaseai-logo_1762856519098.png";

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto px-6 py-20 max-w-6xl">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center mb-4">
              <img src={logoUrl} alt="TradeaseAI" className="h-20 w-auto" data-testid="img-logo" />
            </div>
            <p className="text-2xl font-semibold text-orange-100">
              Construction Site Daily Reporting Made Simple
            </p>
            <p className="text-lg text-orange-100 max-w-2xl mx-auto">
              Streamline your construction documentation with AI-powered daily reports. 
              Collect, analyze, and distribute professional site reports automatically.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/admin">
                <Button size="lg" variant="outline" className="bg-white text-orange-700 hover:bg-orange-50 border-0" data-testid="button-admin-login">
                  Admin Login
                </Button>
              </Link>
              <Link href="/client/login">
                <Button size="lg" variant="outline" className="bg-orange-700 text-white hover:bg-orange-600 border-white" data-testid="button-client-portal">
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">Complete Reporting Solution</h2>
          <p className="text-muted-foreground text-lg">Everything you need for professional construction site documentation</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Custom Branded Forms</CardTitle>
              <CardDescription>
                No-login forms with your company branding that site workers can access instantly
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 2 */}
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                GPT-5 analyzes form data and site photos to generate comprehensive professional reports
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 3 */}
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Automated PDF Generation</CardTitle>
              <CardDescription>
                Beautiful, branded PDF reports with embedded images automatically created
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 4 */}
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Automatically send completed reports to stakeholders via email
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 5 */}
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Client Portal</CardTitle>
              <CardDescription>
                Secure portal for clients to view and download their historical reports
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 6 */}
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Multi-Client Management</CardTitle>
              <CardDescription>
                Manage multiple construction companies, each with custom branding and settings
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Simple workflow, powerful results</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="font-semibold text-lg">Submit Report</h3>
              <p className="text-muted-foreground text-sm">
                Site workers fill out custom-branded forms with photos
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="font-semibold text-lg">AI Analysis</h3>
              <p className="text-muted-foreground text-sm">
                GPT-5 analyzes data and images to extract insights
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="font-semibold text-lg">Generate PDF</h3>
              <p className="text-muted-foreground text-sm">
                Professional PDF with branding and images created automatically
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                4
              </div>
              <h3 className="font-semibold text-lg">Distribute</h3>
              <p className="text-muted-foreground text-sm">
                Email to stakeholders and available in client portal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-16 max-w-4xl text-center">
        <h2 className="text-3xl font-semibold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Transform your construction site reporting today
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/admin">
            <Button size="lg" variant="default" className="bg-orange-600 hover:bg-orange-700" data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="TradeaseAI" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              Construction Site Daily Reporting System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
