import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => void;
  clearPendingVerification: () => void;
  isLoading: boolean;
  error: string | null;
  pendingVerification: string | null; // Email pending verification
  registerCartMigrationCallback: (callback: () => Promise<void>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface LoginResponse {
  user?: User;
  token?: string;
  message: string;
  requiresVerification?: boolean;
  email?: string;
  emailSent?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);
  const [cartMigrationCallback, setCartMigrationCallback] = useState<(() => Promise<void>) | null>(null);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Initialize token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Fetch user data when token is available
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user', token],
    queryFn: async () => {
      // Get fresh token from localStorage to avoid closure issues
      const currentToken = token || localStorage.getItem('auth_token');
      
      console.log('🔍 Frontend auth query - Token check:', {
        stateToken: token ? `[${token.substring(0, 20)}...]` : '[MISSING]',
        localStorageToken: localStorage.getItem('auth_token') ? `[${localStorage.getItem('auth_token')!.substring(0, 20)}...]` : '[MISSING]',
        currentToken: currentToken ? `[${currentToken.substring(0, 20)}...]` : '[MISSING]'
      });
      
      if (!currentToken) {
        console.log('❌ No token available, skipping auth request');
        return null;
      }
      
      console.log('🚀 Making auth request with token');
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log('📡 Auth response:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid, clear it
          console.log('❌ Token invalid, clearing auth state');
          setToken(null);
          localStorage.removeItem('auth_token');
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      
      console.log('✅ Auth successful, user data received');
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: async (data) => {
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        setPendingVerification(null);
        
        // Cart migration now happens automatically in CartContext when token is set
      } else if (data.requiresVerification && data.email) {
        // Handle email verification required case
        setPendingVerification(data.email);
        setToken(null);
        localStorage.removeItem('auth_token');
      }
      setError(null);
      // Query will automatically re-run when token changes due to queryKey dependency
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: async (data) => {
      if (data.token) {
        // Old flow - user is immediately logged in
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        setPendingVerification(null);
        
        // Cart migration now happens automatically in CartContext when token is set
        
        // Show success message and redirect to profile
        toast({
          title: "Welcome to Bmaafashion!",
          description: "Your account has been created successfully.",
        });
        navigate('/profile');
      } else if (data.requiresVerification && data.email) {
        // New flow - user needs to verify email
        setPendingVerification(data.email);
        setToken(null);
        localStorage.removeItem('auth_token');
        
        // Show verification message and redirect to verification page
        toast({
          title: "Account Created Successfully!",
          description: "Please check your email and click the verification link to activate your account.",
        });
        navigate('/email-verification-pending');
      }
      setError(null);
      // Query will automatically re-run when token changes due to queryKey dependency
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      return response.json();
    },
    onSuccess: () => {
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const resendVerification = async (email: string) => {
    await resendVerificationMutation.mutateAsync(email);
  };

  const clearPendingVerification = () => {
    setPendingVerification(null);
  };

  const registerCartMigrationCallback = (callback: () => Promise<void>) => {
    console.log('🔗 Cart migration callback registered');
    setCartMigrationCallback(() => callback);
  };

  const logout = () => {
    setToken(null);
    setPendingVerification(null);
    localStorage.removeItem('auth_token');
    queryClient.clear();
    setError(null);
    
    // Call logout endpoint (optional for JWT)
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignore errors since logout is client-side with JWT
    });
    
    // Redirect to login page after logout
    navigate('/login');
  };

  const value: AuthContextType = {
    user: user || null,
    token,
    login,
    register,
    resendVerification,
    logout,
    clearPendingVerification,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || resendVerificationMutation.isPending,
    error,
    pendingVerification,
    registerCartMigrationCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook export for React Fast Refresh compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook for API requests with authentication
export function useAuthenticatedFetch() {
  const { token } = useAuth();
  
  return (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type to JSON if body is not FormData
    // FormData needs the browser to auto-set multipart/form-data with boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };
}