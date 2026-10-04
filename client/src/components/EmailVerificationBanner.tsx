import { useState } from "react";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationBannerProps {
  email: string;
  className?: string;
}

export default function EmailVerificationBanner({ 
  email, 
  className = ""
}: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const { resendVerification } = useAuth();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerification(email);
      toast({
        title: "Verification Email Sent",
        description: "We've sent a new verification email to your inbox. Please check your email and click the verification link.",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: "We couldn't send the verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className={`border-amber-200 bg-amber-50 text-amber-800 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 mr-4">
          <div className="font-medium">Email Verification Required</div>
          <div className="text-sm mt-1">
            Please check your email ({email}) and click the verification link to activate your account.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isResending}
          className="shrink-0 bg-white hover:bg-amber-50 border-amber-300 text-amber-700"
          data-testid="button-resend-verification"
        >
          {isResending ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-3 w-3 mr-1" />
              Resend Email
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}