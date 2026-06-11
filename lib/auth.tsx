"use client";

import { createClient } from "@/lib/supabase/client";
import { sanitizeDisplayName } from "@/lib/security";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    displayName: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(
  authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null
): AppUser | null {
  if (!authUser) return null;
  const displayName =
    (authUser.user_metadata?.display_name as string | undefined) ||
    authUser.email?.split("@")[0] ||
    "User";
  return {
    id: authUser.id,
    displayName,
    email: authUser.email ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    if (!client) {
      setLoading(false);
      return;
    }

    client.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setUser(mapUser(data.session?.user ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(mapUser(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return {
          error:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to GitHub repository secrets, then redeploy.",
        };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    [supabase]
  );

  const signUp = useCallback(
    async (displayName: string, email: string, password: string) => {
      if (!supabase) {
        return {
          error:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to GitHub repository secrets, then redeploy.",
        };
      }
      const safeName = sanitizeDisplayName(displayName);
      if (!safeName) return { error: "Enter a valid display name." };

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: safeName },
        },
      });
      if (error) return { error: error.message };
      return {};
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
