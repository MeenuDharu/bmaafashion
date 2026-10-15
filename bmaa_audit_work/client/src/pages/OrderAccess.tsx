import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function OrderAccess() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const orderId = params.get('orderId');

    if (!token || !orderId) {
      setError('Invalid order access link');
      setTimeout(() => setLocation('/login'), 3000);
      return;
    }

    const verifyAndRedirect = async () => {
      try {
        const response = await fetch('/api/order-access/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, orderId }),
        });

        if (response.ok) {
          sessionStorage.setItem(`order_access_token_${orderId}`, token);
          setLocation(`/orders/${orderId}`);
        } else {
          setError('Invalid or expired link. Please log in to view your order.');
          setTimeout(() => setLocation('/login'), 3000);
        }
      } catch (error) {
        console.error('Error verifying order access:', error);
        setError('Something went wrong. Please try again.');
        setTimeout(() => setLocation('/login'), 3000);
      }
    };

    verifyAndRedirect();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {error ? (
          <div>
            <h1 className="text-2xl font-semibold text-destructive mb-4">{error}</h1>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold mb-4">Verifying order access...</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
