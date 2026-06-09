"use client";

import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getUser()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1d21] text-white">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
