"use client";

import { useApp } from "@/lib/context/AppContext";
import { getAvatarColor, messageSenderName } from "@/lib/utils";
import ChannelFeed from "./ChannelFeed";
import DmFeed from "./DmFeed";
import MoreView from "./MoreView";

interface MainContentProps {
  displayName: string;
  userId: string;
}

export default function MainContent({ displayName, userId }: MainContentProps) {
  const { railView, messages, members, openChannel, getChannel } = useApp();

  if (railView === "home") {
    return <ChannelFeed displayName={displayName} userId={userId} />;
  }

  if (railView === "dms") {
    return <DmFeed displayName={displayName} userId={userId} />;
  }

  if (railView === "activity") {
    return (
      <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
        <header className="px-5 h-[49px] border-b border-[#E8E8E8] flex items-center">
          <h2 className="font-bold text-[#1D1C1D] text-[18px]">Activity</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <p className="text-[15px] text-[#616061] py-8 text-center">
              No activity yet. Messages in your channels will appear here.
            </p>
          ) : (
            [...messages]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .slice(0, 20)
              .map((m) => {
                const sender = messageSenderName(m, members);
                return (
                <button
                  key={m.id}
                  onClick={() => openChannel(m.channel_id)}
                  className="w-full text-left p-4 rounded-lg border border-[#E8E8E8] hover:bg-[#F8F8F8] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-6 h-6 rounded text-white text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: getAvatarColor(sender) }}
                    >
                      {sender.charAt(0)}
                    </span>
                    <span className="font-bold text-[15px]">{sender}</span>
                    <span className="text-[13px] text-[#616061]">
                      in #{getChannel(m.channel_id)?.name}
                    </span>
                  </div>
                  <p className="text-[15px] text-[#1D1C1D]">{m.content}</p>
                </button>
                );
              })
          )}
        </div>
      </div>
    );
  }

  if (railView === "files") {
    const files = messages
      .filter((m) => m.content.includes("[Attached:"))
      .map((m) => ({
        id: m.id,
        name: m.content.match(/\[Attached: (.+?)\]/)?.[1] ?? "file",
        from: messageSenderName(m, members),
        channel: getChannel(m.channel_id)?.name ?? "",
      }));

    return (
      <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
        <header className="px-5 h-[49px] border-b border-[#E8E8E8] flex items-center">
          <h2 className="font-bold text-[#1D1C1D] text-[18px]">Files</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {files.length === 0 ? (
            <p className="text-[15px] text-[#616061] py-8 text-center">
              No files shared yet. Attach a file in any message to see it here.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => openChannel(messages.find((m) => m.id === f.id)!.channel_id)}
                    className="w-full flex items-center gap-3 p-3 rounded hover:bg-[#F8F8F8] border border-[#E8E8E8] text-left"
                  >
                    <div className="w-10 h-10 bg-[#E8F5FA] rounded flex items-center justify-center text-[#1264A3]">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-[15px]">{f.name}</p>
                      <p className="text-[13px] text-[#616061]">
                        Shared by {f.from} in #{f.channel}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (railView === "more") {
    return <MoreView />;
  }

  return null;
}
