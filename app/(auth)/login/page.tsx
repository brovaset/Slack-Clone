"use client";

import {
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUser()) router.replace("/");
  }, [router]);

  function signIn() {
    setLoading(true);
    const displayName = email.split("@")[0] || "User";
    setUser(createUser(displayName, email));
    router.push("/");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn();
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
        title="Sign in to Slack"
        subtitle="We suggest using the email address you use at work."
        footer={
          <>
            <AuthFooterLink text="New to Slack?" linkText="Create an account" href="/signup" />
            <AuthHelpLink />
          </>
        }
      >
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
          <AuthSubmitButton loading={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </AuthSubmitButton>
        </form>
      </AuthFormWrapper>
    </div>
  );
}
