import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { getImageUrl } from "@/lib/image-utils";

const bmaaFashionLogo = getImageUrl("logo");

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [location, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, pendingVerification } = useAuth();
  const { toast } = useToast();

  // Get returnTo URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo') || '/profile';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      // Redirect to returnTo URL (from query param) or profile
      setLocation(returnTo);
    } catch (error: any) {
      // All error handling is managed by AuthContext
      // including setting pendingVerification for email verification required
      console.error("Login error:", error);
    }
  };

  // Redirect to verification page when pendingVerification is set by AuthContext
  useEffect(() => {
    if (pendingVerification) {
      setLocation("/email-verification-pending");
    }
  }, [pendingVerification, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mb-4">
              <div className="flex justify-center mb-2">
                <img
                  src={bmaaFashionLogo}
                  alt="Bmaafashion Logo"
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-primary/60 text-sm font-medium">
                Premium Fashion, Beautifully Curated
              </p>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Welcome Back
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Sign in to your Bmaafashion account
            </p>
          </CardHeader>
          
          <CardContent>
            {pendingVerification && (
              <div className="mb-4">
                <EmailVerificationBanner email={pendingVerification} />
              </div>
            )}
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pr-12"
                            {...field}
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    "Signing in..."
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register">
                  <Button variant="ghost" className="p-0 h-auto font-semibold text-primary hover:bg-transparent">
                    Create one here
                  </Button>
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/forgot-password">
                <Button variant="ghost" className="text-sm text-muted-foreground hover:bg-transparent">
                  Forgot your password?
                </Button>
              </Link>
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