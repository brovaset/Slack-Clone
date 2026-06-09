"use client";

import { useEffect, useState } from "react";

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail);
      window.setTimeout(() => setMessage(null), 2800);
    }
    document.addEventListener("slack:toast", onToast);
    return () => document.removeEventListener("slack:toast", onToast);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-[#1D1C1D] text-white text-[14px] rounded-lg shadow-lg max-w-[90vw]">
      {message}
    </div>
  );
}
