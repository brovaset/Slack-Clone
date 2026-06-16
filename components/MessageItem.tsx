"use client";

import { useApp } from "@/lib/context/AppContext";
import type { DmMessage, Message } from "@/lib/types";
import { formatMessageTime, getAvatarColor, messageSenderName } from "@/lib/utils";
import MessageAttachmentContent from "./MessageAttachmentContent";

interface MessageItemProps {
  message: Message | DmMessage;
  isGrouped?: boolean;
}

export default function MessageItem({ message, isGrouped = false }: MessageItemProps) {
  const { members } = useApp();
  const displayName = messageSenderName(message, members);

  if (isGrouped) {
    return (
      <div className="flex gap-2 px-5 py-0.5 hover:bg-[#F8F8F8] group -mt-0.5">
        <div className="w-9 shrink-0 flex items-start justify-center">
          <span className="text-[11px] text-[#616061] opacity-0 group-hover:opacity-100 pt-0.5">
            {formatMessageTime(message.created_at)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {message.content && (
            <p className="text-[#1D1C1D] text-[15px] leading-[22px] break-words">
              {message.content}
            </p>
          )}
          {message.attachment_url && message.attachment_name && message.attachment_type && (
            <MessageAttachmentContent
              url={message.attachment_url}
              name={message.attachment_name}
              type={message.attachment_type}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-5 py-1 hover:bg-[#F8F8F8] group mt-2 first:mt-0">
      <div
        className="w-9 h-9 rounded text-white flex items-center justify-center text-[15px] font-bold shrink-0"
        style={{ backgroundColor: getAvatarColor(displayName) }}
      >
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 leading-tight mb-0.5">
          <span className="font-extrabold text-[#1D1C1D] text-[15px] hover:underline cursor-pointer">
            {displayName}
          </span>
          <span className="text-[12px] text-[#616061] tabular-nums shrink-0">
            {formatMessageTime(message.created_at)}
          </span>
        </div>
        {message.content && (
          <p className="text-[#1D1C1D] text-[15px] leading-[22px] break-words">
            {message.content}
          </p>
        )}
        {message.attachment_url && message.attachment_name && message.attachment_type && (
          <MessageAttachmentContent
            url={message.attachment_url}
            name={message.attachment_name}
            type={message.attachment_type}
          />
        )}
      </div>
    </div>
  );
}
