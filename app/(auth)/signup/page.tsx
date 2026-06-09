"use client";

import {
  AuthDivider,
  AuthField,
  AuthFooterLink,
  AuthFormWrapper,
  AuthHero,
  AuthSSOButtons,
  AuthSubmitButton,
} from "@/components/AuthLayout";
import { createUser, getUser, setUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUser()) router.replace("/");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const user = createUser(displayName || email.split("@")[0] || "User", email);
    setUser(user);
    router.push("/");
  }

  function handleSSO(provider: string) {
    setLoading(true);
    const mockEmail = provider === "google" ? "you@gmail.com" : "you@icloud.com";
    setUser(createUser("Demo User", mockEmail));
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
        <AuthSSOButtons onSSO={handleSSO} />
        <AuthDivider />
        <form onSubmit={handleSubmit}>
          <AuthField
            id="displayName"
            label="Full name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Ex. John Smith"
            required
          />
          <AuthField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
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
          <AuthSubmitButton loading={loading}>
            {loading ? "Creating account..." : "Continue"}
          </AuthSubmitButton>
        </form>
        <p className="mt-5 text-center text-[13px] text-[#616061] leading-relaxed">
          By continuing, you&apos;re agreeing to our{" "}
          <button
            type="button"
            className="text-[#1264A3] hover:underline font-bold"
            onClick={() => window.open("https://slack.com/terms-of-service", "_blank")}
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="text-[#1264A3] hover:underline font-bold"
            onClick={() => window.open("https://slack.com/trust/privacy/privacy-policy", "_blank")}
          >
            Privacy Policy
          </button>
          .
        </p>
      </AuthFormWrapper>
    </div>
  );
}
