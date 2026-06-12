"use client";

import { isImageAttachment } from "@/lib/uploads";

interface MessageAttachmentContentProps {
  url: string;
  name: string;
  type: string;
}

export default function MessageAttachmentContent({
  url,
  name,
  type,
}: MessageAttachmentContentProps) {
  if (isImageAttachment(type)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-1 max-w-sm"
      >
        <img
          src={url}
          alt={name}
          className="rounded-lg border border-[#E8E8E8] max-h-80 w-auto object-contain"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mt-1 px-3 py-2 rounded-lg border border-[#E8E8E8] bg-[#F8F8F8] hover:bg-[#E8F5FA] text-[#1264A3] text-[15px] font-medium max-w-sm"
    >
      <FileIcon />
      <span className="truncate">{name}</span>
    </a>
  );
}

function FileIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
