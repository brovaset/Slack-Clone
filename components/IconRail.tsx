"use client";

import { useApp } from "@/lib/context/AppContext";
import type { RailView } from "@/lib/types";

const RAIL_ITEMS: { id: RailView; label: string; icon: React.FC }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "dms", label: "DMs", icon: DmIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "files", label: "Files", icon: FilesIcon },
  { id: "more", label: "More", icon: MoreIcon },
];

export default function IconRail() {
  const { railView, setRailView, setOpenPanel, dms, openDm, channels, openChannel } = useApp();

  function handleNav(view: RailView) {
    setRailView(view);
    setOpenPanel(null);
    if (view === "home" && channels[0]) openChannel(channels[0].id);
    if (view === "dms" && dms[0]) openDm(dms[0].id);
  }

  return (
    <nav className="w-[70px] min-w-[70px] bg-[#1A1D21] flex flex-col items-center py-3 gap-1 border-r border-[#363639]">
      <button
        onClick={() => setOpenPanel("workspace")}
        className="w-9 h-9 rounded-lg bg-[#350D36] flex items-center justify-center mb-3 hover:bg-[#4A154B] transition-colors"
        title="Workspaces"
      >
        <SlackMark />
      </button>

      {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          title={label}
          onClick={() => handleNav(id)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            railView === id
              ? "bg-white text-[#1A1D21]"
              : "text-[#ABABAD] hover:bg-[#35373B] hover:text-white"
          }`}
        >
          <Icon />
        </button>
      ))}

      <div className="flex-1" />

      <button
        title="Create"
        onClick={() => setOpenPanel("quick-add")}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#ABABAD] hover:bg-[#35373B] hover:text-white transition-colors"
      >
        <PlusIcon />
      </button>
    </nav>
  );
}

function SlackMark() {
  return (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function HomeIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
}
function DmIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>;
}
function ActivityIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>;
}
function FilesIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>;
}
function MoreIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>;
}
function PlusIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
}
