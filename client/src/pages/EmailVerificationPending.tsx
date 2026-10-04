import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import bmaaFashionLogo from "@assets/bmaafashion.jpeg";

export default function EmailVerificationPending() {
  const [, setLocation] = useLocation();
  const { pendingVerification, user, clearPendingVerification } = useAuth();
  const { toast } = useToast();

  // Redirect if no pending verification or user is already verified
  useEffect(() => {
    if (!pendingVerification) {
      if (user?.emailVerified) {
        setLocation("/profile");
      } else {
        setLocation("/login");
      }
    }
  }, [pendingVerification, user, setLocation]);

  const handleBackToLogin = () => {
    clearPendingVerification();
    setLocation("/login");
  };

  if (!pendingVerification) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <img
                src={bmaaFashionLogo}
                alt="Bmaafashion Logo"
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Check Your Email
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Mail className="h-16 w-16 text-primary" />
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">
                Account Created Successfully!
              </h3>
              <p className="text-muted-foreground">
                We've sent a verification email to:
              </p>
              <p className="font-medium text-primary break-all" data-testid="text-pending-email">
                {pendingVerification}
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>

            <EmailVerificationBanner 
              email={pendingVerification} 
              className="text-left"
            />

            <div className="space-y-3 pt-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here to log in to your account</li>
                </ol>
              </div>

              <Button 
                variant="outline" 
                onClick={handleBackToLogin}
                className="w-full"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Didn't receive the email?
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Ensure {pendingVerification} is correct</li>
                <li>• Use the "Resend Email" button above</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground">
              ← Back to Bmaafashion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}