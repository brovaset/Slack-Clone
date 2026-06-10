"use client";

import {
  AuthDemoNotice,
  AuthDivider,
  AuthField,
  AuthFooterLink,
  AuthFormWrapper,
  AuthHero,
  AuthSSOButtons,
  AuthSubmitButton,
} from "@/components/AuthLayout";
import { createUser, getUser, setUser } from "@/lib/auth";
import { LIMITS } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getUser()) router.replace("/");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = createUser(displayName || email.split("@")[0] || "User", email);
    if ("error" in result) {
      setError(result.error);
      showToast(result.error);
      setLoading(false);
      return;
    }
    setUser(result.user);
    router.push("/");
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
        title="First, enter your email"
        footer={
          <AuthFooterLink text="Already using Slack?" linkText="Sign in" href="/login" />
        }
      >
        <AuthDemoNotice />
        <AuthSSOButtons onSSO={handleSSO} />
        <AuthDivider />
        <form onSubmit={handleSubmit}>
          <AuthField
            id="displayName"
            label="Full name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Ex. John Smith"
            maxLength={LIMITS.displayName}
            required
          />
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
            placeholder="6+ characters"
            required
            minLength={6}
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{error}</p>
          )}
          <AuthSubmitButton loading={loading}>
            {loading ? "Creating account..." : "Continue"}
          </AuthSubmitButton>
        </form>
        <p className="mt-5 text-center text-[13px] text-[#616061] leading-relaxed">
          By continuing, you&apos;re agreeing to our{" "}
          <button
            type="button"
            className="text-[#1264A3] hover:underline font-bold"
            onClick={() => openExternal("https://slack.com/terms-of-service")}
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="text-[#1264A3] hover:underline font-bold"
            onClick={() => openExternal("https://slack.com/trust/privacy/privacy-policy")}
          >
            Privacy Policy
          </button>
          .
        </p>
      </AuthFormWrapper>
    </div>
  );
}
