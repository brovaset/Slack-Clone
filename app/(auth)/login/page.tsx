"use client";

import {
  AuthDemoNotice,
  AuthDivider,
  AuthField,
  AuthFooterLink,
  AuthFormWrapper,
  AuthHelpLink,
  AuthHero,
  AuthSSOButtons,
  AuthSubmitButton,
} from "@/components/AuthLayout";
import { createUser, getUser, setUser } from "@/lib/auth";
import { LIMITS } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getUser()) router.replace("/");
  }, [router]);

  function signIn() {
    setError(null);
    setLoading(true);
    const displayName = email.split("@")[0] || "User";
    const result = createUser(displayName, email);
    if ("error" in result) {
      setError(result.error);
      showToast(result.error);
      setLoading(false);
      return;
    }
    setUser(result.user);
    router.push("/");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Enter a password to continue.");
      return;
    }
    signIn();
  }

  function handleSSO(provider: string) {
    setLoading(true);
    const mockEmail = provider === "google" ? "you@gmail.com" : "you@icloud.com";
    const result = createUser("Demo User", mockEmail);
    if ("error" in result) {
      setError(result.error);
      showToast(result.error);
      setLoading(false);
      return;
    }
    setUser(result.user);
    router.push("/");
  }

  return (
    <div className="min-h-screen flex">
      <AuthHero />
      <AuthFormWrapper
        title="Sign in to Slack"
        subtitle="We suggest using the email address you use at work."
        footer={
          <>
            <AuthFooterLink text="New to Slack?" linkText="Create an account" href="/signup" />
            <AuthHelpLink />
          </>
        }
      >
        <AuthDemoNotice />
        <AuthSSOButtons onSSO={handleSSO} />
        <AuthDivider />
        <form onSubmit={handleSubmit}>
          <AuthField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            maxLength={LIMITS.email}
            required
          />
          <AuthField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            required
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{error}</p>
          )}
          <AuthSubmitButton loading={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </AuthSubmitButton>
        </form>
      </AuthFormWrapper>
    </div>
  );
}
