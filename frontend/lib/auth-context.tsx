"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  User,
  onIdTokenChanged,
  signOut as firebaseSignOut,
  getIdTokenResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isTokenExpired: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

function isTokenExpiringSoon(tokenResult: ReturnType<typeof getIdTokenResult> extends Promise<infer T> ? T : never): boolean {
  if (!tokenResult || !tokenResult.expirationTime) return true;
  const expirationTime = new Date(tokenResult.expirationTime).getTime();
  const currentTime = Date.now();
  return expirationTime - currentTime < TOKEN_REFRESH_THRESHOLD_MS;
}

interface AuthProviderProps {
  children: ReactNode;
  onAuthStateChange?: (user: User | null) => void;
}

export function AuthProvider({ children, onAuthStateChange }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
    error: null,
  });

  const userRef = useRef<User | null>(null);
  const tokenRef = useRef<string | null>(null);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAuthStateChange = useCallback(
    async (user: User | null) => {
      // console.log("Auth state changed:", user?.email); // Removed for cleaner logs
      try {
        if (user) {
          const tokenResult = await getIdTokenResult(user);
          userRef.current = user;
          tokenRef.current = tokenResult.token;
          onAuthStateChange?.(user);
        } else {
          userRef.current = null;
          tokenRef.current = null;
          onAuthStateChange?.(null);
        }
        updateState({ user, loading: false, initialized: true, error: null });
      } catch (err: any) {
        const errorMessage = err?.message || "Authentication error occurred";
        updateState({ user: null, loading: false, initialized: true, error: errorMessage });
        onAuthStateChange?.(null);
      }
    },
    [onAuthStateChange, updateState]
  );

  useEffect(() => {
    if (!auth) {
      updateState({
        loading: false,
        initialized: true,
        error: "Firebase auth is not initialized",
      });
      return;
    }

    updateState({ loading: true });

    const unsubscribe = onIdTokenChanged(
      auth,
      handleAuthStateChange,
      (error) => {
        console.error("Auth state change error:", error);
        updateState({
          user: null,
          loading: false,
          initialized: true,
          error: error.message || "Authentication error",
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [handleAuthStateChange, updateState]);

  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      await firebaseSignOut(auth);
      userRef.current = null;
      tokenRef.current = null;
      updateState({ user: null, loading: false, error: null });
    } catch (err: any) {
      const errorMessage = err?.message || "Sign out failed";
      updateState({ loading: false, error: errorMessage });
      throw err;
    }
  }, [updateState]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const user = userRef.current;
    if (!user) return null;

    try {
      const tokenResult = await getIdTokenResult(user, true);
      tokenRef.current = tokenResult.token;
      return tokenResult.token;
    } catch (err) {
      console.error("Error getting token:", err);
      return tokenRef.current;
    }
  }, []);

  const isTokenExpired = useCallback(async (): Promise<boolean> => {
    const user = userRef.current;
    if (!user) return true;

    try {
      const tokenResult = await getIdTokenResult(user);
      if (!tokenResult.expirationTime) return true;

      const expirationTime = new Date(tokenResult.expirationTime).getTime();
      return Date.now() >= expirationTime;
    } catch {
      return true;
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const user = userRef.current;
    if (!user) return null;

    try {
      const tokenResult = await getIdTokenResult(user, true);
      tokenRef.current = tokenResult.token;
      return tokenResult.token;
    } catch (err) {
      console.error("Error refreshing token:", err);
      return null;
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    signOut,
    getToken,
    isTokenExpired,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthGuard(redirectTo: string = "/"): {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { user, loading, initialized, error } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !user && redirectTo) {
      window.location.href = redirectTo;
    }
  }, [initialized, loading, user, redirectTo]);

  return {
    isAuthorized: !!user,
    isLoading: loading,
    error,
  };
}
