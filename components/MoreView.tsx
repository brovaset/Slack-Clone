"use client";

import { useApp } from "@/lib/context/AppContext";
import { GOOGLE_DRIVE_LOGO } from "@/lib/google-drive-logo";
import { showToast } from "@/lib/toast";
import { useState } from "react";

interface App {
  id: string;
  name: string;
  desc: string;
  category: string;
  installed: boolean;
  icon: React.FC;
}

const APPS: App[] = [
  {
    id: "drive",
    name: "Google Drive",
    desc: "Get notifications about Google Drive files within Slack",
    category: "Productivity",
    installed: true,
    icon: GoogleDriveIcon,
  },
  {
    id: "zoom",
    name: "Zoom",
    desc: "Easily start or join Zoom meetings directly from Slack",
    category: "Communication",
    installed: true,
    icon: ZoomIcon,
  },
  {
    id: "jira",
    name: "Jira Cloud",
    desc: "Official app by Atlassian — track issues and projects",
    category: "Project management",
    installed: false,
    icon: JiraIcon,
  },
  {
    id: "github",
    name: "GitHub",
    desc: "Bring your code to the conversations you care about",
    category: "Developer tools",
    installed: true,
    icon: GitHubIcon,
  },
  {
    id: "asana",
    name: "Asana",
    desc: "Move work forward — tasks, projects, and goals in Slack",
    category: "Project management",
    installed: false,
    icon: AsanaIcon,
  },
  {
    id: "figma",
    name: "Figma",
    desc: "Share, preview, and comment on Figma files in Slack",
    category: "Design",
    installed: false,
    icon: FigmaIcon,
  },
];

const SHORTCUTS = [
  { id: "reminders", name: "Reminders", desc: "Set a reminder for yourself or a channel" },
  { id: "poll", name: "Poll", desc: "Create a quick poll for your team" },
  { id: "status", name: "Custom Status", desc: "Set a status with emoji and expiry" },
];

const TABS = ["All apps", "Installed", "Recommended"] as const;

export default function MoreView() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All apps");
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(APPS.filter((a) => a.installed).map((a) => a.id))
  );
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const { setOpenPanel, setProfileMenuOpen, addMessage, channels, openChannel } = useApp();

  function openApp(app: App) {
    const channel = channels[0];
    if (channel) {
      openChannel(channel.id);
      addMessage(channel.id, "user-you", "You", `Opened ${app.name}`);
    }
    showToast(`Opened ${app.name}`);
  }

  function handleShortcut(id: string, name: string) {
    if (id === "status") {
      setProfileMenuOpen(true);
      showToast("Update your status in the profile menu");
      return;
    }
    if (id === "reminders") {
      setOpenPanel("quick-add");
      showToast("Set a reminder from the create menu");
      return;
    }
    if (id === "poll") {
      showToast("Poll created — share it in a channel");
      return;
    }
    showToast(`Opened ${name}`);
  }

  const filtered = APPS.filter((app) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      app.name.toLowerCase().includes(q) ||
      app.desc.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q);
    const matchesTab =
      tab === "All apps" ||
      (tab === "Installed" && installed.has(app.id)) ||
      (tab === "Recommended" && !installed.has(app.id));
    return matchesSearch && matchesTab;
  });

  function toggleInstall(app: App) {
    setInstalled((prev) => {
      const next = new Set(prev);
      if (next.has(app.id)) {
        next.delete(app.id);
        showToast(`${app.name} removed from workspace`);
      } else {
        next.add(app.id);
        showToast(`${app.name} added to workspace`);
      }
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0 relative">
      <header className="px-6 h-[49px] border-b border-[#E8E8E8] flex items-center justify-between shrink-0">
        <h2 className="font-bold text-[#1D1C1D] text-[18px]">Apps</h2>
        <button
          onClick={() => {
            setTab("Recommended");
            showToast("Showing recommended apps");
          }}
          className="text-[13px] text-[#1264A3] font-medium hover:underline"
        >
          Browse App Directory
        </button>
      </header>

      <div className="px-6 py-4 border-b border-[#E8E8E8] shrink-0 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616061]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps, shortcuts, and workflows"
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-lg text-[15px] focus:outline-none focus:border-[#1264A3] focus:bg-white focus:shadow-[0_0_0_1px_#1264A3] transition-all"
          />
        </div>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                tab === t
                  ? "bg-[#1264A3] text-white"
                  : "text-[#616061] hover:bg-[#F8F8F8] hover:text-[#1D1C1D]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto slack-scrollbar-light">
        {!search && tab === "All apps" && (
          <section className="px-6 py-5 border-b border-[#E8E8E8]">
            <h3 className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-3">
              Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShortcut(s.id, s.name)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#E8E8E8] hover:border-[#CFCFCF] hover:shadow-sm hover:bg-[#FAFAFA] text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#F4ECF6] flex items-center justify-center shrink-0 group-hover:bg-[#E8D4ED] transition-colors">
                    <ShortcutIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] text-[#1D1C1D]">{s.name}</p>
                    <p className="text-[12px] text-[#616061] leading-snug mt-0.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="px-6 py-5">
          <h3 className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-1">
            {tab === "Installed" ? "Installed apps" : tab === "Recommended" ? "Recommended for you" : "Apps for your workspace"}
          </h3>
          <p className="text-[13px] text-[#616061] mb-4">
            {filtered.length} app{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[15px] text-[#616061]">No apps match your search.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setTab("All apps");
                }}
                className="mt-2 text-[14px] text-[#1264A3] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0F0F0]">
              {filtered.map((app) => {
                const isInstalled = installed.has(app.id);
                const Icon = app.icon;
                return (
                  <li key={app.id}>
                    <div className="flex items-center gap-4 py-4 group">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="flex items-center gap-4 flex-1 min-w-0 text-left"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-[#E8E8E8]">
                          <Icon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[15px] text-[#1D1C1D] group-hover:text-[#1264A3] transition-colors">
                              {app.name}
                            </p>
                            {isInstalled && (
                              <span className="text-[11px] font-bold text-[#007A5A] bg-[#E8F5F0] px-1.5 py-0.5 rounded">
                                Added
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#616061] mt-0.5 line-clamp-1">{app.desc}</p>
                          <p className="text-[12px] text-[#ABABAD] mt-0.5">{app.category}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        {isInstalled ? (
                          <>
                            <button
                              onClick={() => openApp(app)}
                              className="px-3 py-1.5 text-[13px] font-bold text-[#1264A3] border border-[#1264A3] rounded hover:bg-[#E8F5FA] transition-colors"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => toggleInstall(app)}
                              className="p-1.5 rounded text-[#616061] hover:bg-[#F8F8F8] hover:text-[#E01E5A]"
                              title="Remove app"
                            >
                              <MoreMenuIcon />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toggleInstall(app)}
                            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#007A5A] rounded hover:bg-[#148567] transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {selectedApp && (() => {
        const SelectedIcon = selectedApp.icon;
        return (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedApp(null)}
          />
          <div className="fixed bottom-0 left-[330px] right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-[#E8E8E8] shrink-0">
                  <SelectedIcon />
                </div>
                <div className="flex-1">
                  <h3 className="text-[22px] font-bold text-[#1D1C1D]">{selectedApp.name}</h3>
                  <p className="text-[14px] text-[#616061] mt-1">{selectedApp.category}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded hover:bg-[#F8F8F8] text-[#616061]"
                >
                  <CloseIcon />
                </button>
              </div>
              <p className="text-[15px] text-[#1D1C1D] leading-relaxed mb-6">{selectedApp.desc}</p>
              <div className="flex gap-3">
                {installed.has(selectedApp.id) ? (
                  <button
                    onClick={() => {
                      openApp(selectedApp);
                      setSelectedApp(null);
                    }}
                    className="px-5 py-2.5 bg-[#007A5A] text-white font-bold rounded hover:bg-[#148567]"
                  >
                    Open in Slack
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      toggleInstall(selectedApp);
                      setSelectedApp(null);
                    }}
                    className="px-5 py-2.5 bg-[#007A5A] text-white font-bold rounded hover:bg-[#148567]"
                  >
                    Add to Slack
                  </button>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2.5 border border-[#868686] rounded font-medium hover:bg-[#F8F8F8]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
        );
      })()}
    </div>
  );
}

function GoogleDriveIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={GOOGLE_DRIVE_LOGO}
      alt="Google Drive"
      className="w-full h-full object-contain bg-white p-0.5"
    />
  );
}

function ZoomIcon() {
  return (
    <div className="w-full h-full bg-[#2D8CFF] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
        <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8.5l3.5-2.3A1 1 0 0123 13v5a1 1 0 01-1.45.89L18 16.6V18a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      </svg>
    </div>
  );
}

function JiraIcon() {
  return (
    <div className="w-full h-full bg-[#0052CC] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#2684FF" d="M11.5 2L2 12.5l4.5 4.5L16 7.5z" />
        <path fill="#57D9A3" d="M13 7.5L7.5 13l4.5 4.5L22 7.5z" opacity="0.8" />
      </svg>
    </div>
  );
}

function GitHubIcon() {
  return (
    <div className="w-full h-full bg-[#24292F] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    </div>
  );
}

function AsanaIcon() {
  return (
    <div className="w-full h-full bg-[#F06A6A] flex items-center justify-center gap-1">
      <div className="w-2.5 h-2.5 rounded-full bg-white" />
      <div className="w-2.5 h-2.5 rounded-full bg-white" />
      <div className="w-2.5 h-2.5 rounded-full bg-white" />
    </div>
  );
}

function FigmaIcon() {
  return (
    <div className="w-full h-full bg-[#1E1E1E] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <circle cx="8" cy="6" r="3" fill="#F24E1E" />
        <circle cx="8" cy="12" r="3" fill="#A259FF" />
        <circle cx="8" cy="18" r="3" fill="#1ABCFE" />
        <circle cx="14" cy="6" r="3" fill="#FF7262" />
        <circle cx="14" cy="12" r="3" fill="#0ACF83" />
      </svg>
    </div>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );
}

function ShortcutIcon() {
  return (
    <svg className="w-5 h-5 text-[#611F69]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  );
}

function MoreMenuIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
