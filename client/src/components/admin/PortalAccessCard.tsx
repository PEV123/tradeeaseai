import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Key, Mail, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface PortalAccessCardProps {
  clientId: string;
}

// Generate a secure random password
function generateSecurePassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join("");
}

export default function PortalAccessCard({ clientId }: PortalAccessCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: [`/api/admin/clients/${clientId}`],
    queryFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch client");
      return response.json();
    },
  });

  const { data: portalUser, isLoading: portalUserLoading } = useQuery({
    queryKey: [`/api/admin/clients/${clientId}/portal-user`],
    queryFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/clients/${clientId}/portal-user`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch portal user");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (password: string) => {
      const contactEmail = client?.contactEmail;
      if (!contactEmail) {
        throw new Error("Contact email not found");
      }
      
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/clients/${clientId}/portal-user`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: contactEmail, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create portal user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${clientId}/portal-user`] });
      setShowPassword(true);
      toast({ 
        title: "Success", 
        description: "Portal access created successfully" 
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setGeneratedPassword(null);
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (password: string) => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/clients/${clientId}/portal-user`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${clientId}/portal-user`] });
      setShowPassword(true);
      toast({ 
        title: "Success", 
        description: "Password reset successfully" 
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setGeneratedPassword(null);
      setIsResetting(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/clients/${clientId}/portal-user`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete portal user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${clientId}/portal-user`] });
      toast({ title: "Success", description: "Portal access removed successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleCreate = () => {
    if (!client?.contactEmail) {
      toast({ variant: "destructive", title: "Error", description: "Contact email not found" });
      return;
    }
    const password = generateSecurePassword();
    setGeneratedPassword(password);
    createMutation.mutate(password);
  };

  const handleReset = () => {
    const password = generateSecurePassword();
    setGeneratedPassword(password);
    updateMutation.mutate(password);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Password copied to clipboard" });
  };

  const handleDismissPassword = () => {
    setShowPassword(false);
    setGeneratedPassword(null);
    setIsCreating(false);
    setIsResetting(false);
  };

  if (clientLoading || portalUserLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client Portal Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-portal-access">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Client Portal Access
        </CardTitle>
        <CardDescription>
          Secure login credentials for client portal access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPassword && generatedPassword && (
          <div className="p-4 border-2 border-orange-500 rounded-md bg-orange-50 dark:bg-orange-950/20 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  ⚠️ Save this password now
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  This password will only be shown once. Copy it and share securely with the client.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-background rounded-md border">
                <p className="text-sm font-medium mb-1">Username</p>
                <p className="font-mono text-sm">{client?.contactEmail}</p>
              </div>
              <div className="p-3 bg-background rounded-md border">
                <p className="text-sm font-medium mb-1">Password</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm flex-1 break-all">{generatedPassword}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPassword)}
                    data-testid="button-copy-password"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDismissPassword}
              className="w-full"
              data-testid="button-dismiss-password"
            >
              I've Saved the Password
            </Button>
          </div>
        )}
        
        {portalUser?.exists && !showPassword ? (
          <>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-portal-email">{portalUser.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {portalUser.user.lastLogin 
                      ? `Last login: ${format(new Date(portalUser.user.lastLogin), "PPp")}`
                      : "Never logged in"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {portalUser.user.active ? (
                  <Badge variant="default" data-testid="badge-active">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" data-testid="badge-inactive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            {isResetting ? (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  This will generate a new secure password. The current password will no longer work.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReset}
                    disabled={updateMutation.isPending}
                    data-testid="button-confirm-reset"
                  >
                    {updateMutation.isPending ? "Generating..." : "Generate New Password"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsResetting(false)}
                    disabled={updateMutation.isPending}
                    data-testid="button-cancel-reset"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsResetting(true)}
                  data-testid="button-reset-password"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" data-testid="button-delete-portal-access">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Access
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Portal Access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the client's portal login credentials.
                        They will no longer be able to access their reports online.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        {deleteMutation.isPending ? "Removing..." : "Remove Access"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        ) : !showPassword ? (
          <>
            {isCreating ? (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  A secure random password will be generated. You'll see it once to share with the client.
                </p>
                <div className="p-3 bg-background rounded-md border">
                  <p className="text-sm"><strong>Username:</strong> {client?.contactEmail}</p>
                  <p className="text-sm"><strong>Password:</strong> Secure random password (shown after creation)</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Access"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    disabled={createMutation.isPending}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  No portal access configured.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Username will be: <strong>{client?.contactEmail}</strong>
                </p>
                <Button onClick={() => setIsCreating(true)} data-testid="button-enable-portal">
                  <Shield className="h-4 w-4 mr-2" />
                  Enable Portal Access
                </Button>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
