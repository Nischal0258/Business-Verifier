"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function ProtectedRoute({ children, fallbackPath = "/" }: ProtectedRouteProps) {
  const { user, loading, initialized, error } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!initialized || loading) return;

    if (!user && !hasRedirected) {
      setHasRedirected(true);
      router.replace(fallbackPath);
    }
  }, [initialized, loading, user, hasRedirected, router, fallbackPath]);

  if (!initialized || loading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return <DashboardErrorState error={error} />;
  }

  if (!user) {
    return <DashboardLoadingState />;
  }

  return <>{children}</>;
}

function DashboardLoadingState() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-2 border-accent-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-accent-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      </div>
      <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-foreground-subtle">
        Initializing Session
      </div>
    </div>
  );
}

function DashboardErrorState({ error }: { error: string }) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-error-muted flex items-center justify-center">
          <span className="text-error text-2xl">!</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Authentication Error
          </h1>
          <p className="text-sm text-foreground-subtle">{error}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl bg-accent-primary text-background font-semibold text-sm hover:bg-accent-primary-light transition-colors"
          >
            Retry
          </button>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 rounded-xl border border-border text-foreground-subtle font-semibold text-sm hover:bg-surface transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAuthRedirect() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [redirectComplete, setRedirectComplete] = useState(false);

  useEffect(() => {
    if (!initialized || loading) return;

    if (!user && !redirectComplete) {
      setRedirectComplete(true);
      router.replace("/");
    }
  }, [initialized, loading, user, redirectComplete, router]);

  return { shouldRedirect: !user && initialized && !loading, loading: !initialized || loading };
}
