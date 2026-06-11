"use client";

import IconRail from "@/components/IconRail";
import MainContent from "@/components/MainContent";
import SidePanel from "@/components/SidePanel";
import Sidebar from "@/components/Sidebar";
import WorkspaceMenu from "@/components/WorkspaceMenu";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/context/AppContext";
import { useRef } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const displayName = user?.displayName ?? "User";
  const railWorkspaceRef = useRef<HTMLButtonElement>(null);
  const sidebarWorkspaceRef = useRef<HTMLButtonElement>(null);
  const { workspaceMenuOpen, setWorkspaceMenuOpen } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-[#4A154B]">
      <IconRail displayName={displayName} workspaceRef={railWorkspaceRef} />
      <Sidebar workspaceRef={sidebarWorkspaceRef} />
      <MainContent displayName={displayName} userId={user?.id ?? ""} />
      <SidePanel />
      <WorkspaceMenu
        open={workspaceMenuOpen}
        onClose={() => setWorkspaceMenuOpen(false)}
        anchorRefs={[railWorkspaceRef, sidebarWorkspaceRef]}
      />
    </div>
  );
}
