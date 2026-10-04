import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/image-utils";

const bmaaFashionLogo = getImageUrl("logo");

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get token from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setError('Invalid verification link. Missing token parameter.');
      return;
    }

    // Verify email with token
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          toast({
            title: "Email Verified!",
            description: "Your email has been successfully verified. You can now log in to your account.",
          });
        } else {
          setVerificationStatus('error');
          setError(data.message || 'Failed to verify email address');
        }
      } catch (error) {
        setVerificationStatus('error');
        setError('Network error. Please check your connection and try again.');
        console.error('Email verification error:', error);
      }
    };

    verifyEmail();
  }, [token, toast]);

  const handleLoginRedirect = () => {
    setLocation('/login');
  };

  const handleHomeRedirect = () => {
    setLocation('/');
  };

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
              Email Verification
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center">
            {verificationStatus === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Verifying your email...</h3>
                <p className="text-muted-foreground">
                  Please wait while we verify your email address.
                </p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-green-700">
                    Email Verified Successfully!
                  </h3>
                  <p className="text-muted-foreground">
                    Your email address has been verified. You can now log in to your Bmaafashion account and start shopping.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={handleLoginRedirect}
                    className="w-full"
                    data-testid="button-login-redirect"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Log In to Your Account
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleHomeRedirect}
                    className="w-full"
                    data-testid="button-home-redirect"
                  >
                    Back to Bmaa Fashion
                  </Button>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-destructive">
                    Verification Failed
                  </h3>
                  <p className="text-muted-foreground">
                    We couldn't verify your email address.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={handleHomeRedirect}
                    className="w-full"
                    data-testid="button-home-redirect"
                  >
                    Back to Bmaa Fashion
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Need help with verification?
                    </p>
                    <Link to="/contact">
                      <Button variant="link" className="text-sm">
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground">
              ← Back to Bmaa Fashion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}