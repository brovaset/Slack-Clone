"use client";

import IconRail from "@/components/IconRail";
import MainContent from "@/components/MainContent";
import SidePanel from "@/components/SidePanel";
import Sidebar from "@/components/Sidebar";
import { getUser } from "@/lib/auth";

export default function HomePage() {
  const user = getUser();
  const displayName = user?.displayName ?? "User";

  return (
    <div className="flex h-screen overflow-hidden bg-[#1A1D21]">
      <IconRail />
      <Sidebar displayName={displayName} userId={user?.id ?? ""} />
      <MainContent displayName={displayName} userId={user?.id ?? ""} />
      <SidePanel />
    </div>
  );
}
