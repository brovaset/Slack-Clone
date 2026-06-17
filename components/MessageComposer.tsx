"use client";

import { EMOJI_LIST } from "@/lib/constants";
import { useApp } from "@/lib/context/AppContext";
import { LIMITS } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/uploadValidation";
import { formatBytes, isImageAttachment, validateChatUpload } from "@/lib/uploads";
import { useEffect, useRef, useState } from "react";

interface MessageComposerProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string, file?: File) => Promise<void>;
  target: string;
  targetType: "channel" | "dm";
}

export default function MessageComposer({
  placeholder,
  value,
  onChange,
  onSend,
  target,
  targetType,
}: MessageComposerProps) {
  const { saveDraft, members } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearPendingFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateChatUpload(file);
    if (validationError) {
      showToast(validationError);
      e.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(isImageAttachment(file.type) ? URL.createObjectURL(file) : null);
    e.target.value = "";
  }

  function handleEmoji(emoji: string) {
    insertAtCursor(emoji);
    setShowEmoji(false);
  }

  function handleMention(name: string) {
    insertAtCursor(`@${name} `);
    setShowMentions(false);
  }

  function handleDraft() {
    if (value.trim()) saveDraft(value, target, targetType);
  }

  async function handleSend() {
    if (!value.trim() && !pendingFile) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await onSend(value.trim(), pendingFile ?? undefined);
      onChange("");
      clearPendingFile();
    } catch {
      // Parent shows toast; keep pending file so user can retry or remove.
    } finally {
      setIsSending(false);
    }
  }

  const canSend = !isSending && (value.trim().length > 0 || pendingFile !== null);
  const mentionCandidates = members.filter((m) => !m.name.endsWith("(you)"));

  return (
    <div className="px-5 pb-6 pt-2 shrink-0 relative">
      {showEmoji && (
        <div className="absolute bottom-full left-5 mb-2 bg-white border border-[#E8E8E8] rounded-lg shadow-lg p-2 flex flex-wrap gap-1 z-20 w-64">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmoji(emoji)}
              className="w-8 h-8 hover:bg-[#F8F8F8] rounded text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {showMentions && (
        <div className="absolute bottom-full left-5 mb-2 bg-white border border-[#E8E8E8] rounded-lg shadow-lg py-1 z-20 w-56 max-h-48 overflow-y-auto">
          {mentionCandidates.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleMention(m.name)}
              className="w-full px-3 py-2 text-left text-[15px] hover:bg-[#F8F8F8]"
            >
              @{m.name}
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_FILE_EXTENSIONS.join(",")}
        onChange={handleFileChange}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <div className="border border-[#868686] rounded-lg overflow-hidden focus-within:border-[#1264A3] transition-colors shadow-sm">
          {pendingFile && (
            <div className="px-3 pt-3 flex items-start gap-2">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={pendingFile.name}
                  className="h-16 w-16 rounded object-cover border border-[#E8E8E8]"
                />
              ) : (
                <div className="h-16 w-16 rounded border border-[#E8E8E8] bg-[#F8F8F8] flex items-center justify-center text-[#616061] text-xs px-1 text-center truncate">
                  {pendingFile.name}
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-[13px] font-bold text-[#1D1C1D] truncate">{pendingFile.name}</p>
                <p className="text-[12px] text-[#616061]">
                  {formatBytes(pendingFile.size)} · Ready to send
                </p>
              </div>
              <button
                type="button"
                onClick={clearPendingFile}
                className="text-[#616061] hover:text-[#E01E5A] p-1"
                title="Remove attachment"
              >
                <RemoveIcon />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleDraft}
            placeholder={placeholder}
            rows={1}
            maxLength={LIMITS.message}
            className="w-full px-3 pt-3 pb-1 resize-none focus:outline-none text-[15px] text-[#1D1C1D] leading-[22px] min-h-[44px]"
          />
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-0.5">
              <ComposerBtn title="Attach file or image" onClick={() => fileInputRef.current?.click()}>
                <PlusIcon />
              </ComposerBtn>
              <ComposerBtn
                title="Formatting"
                onClick={() => {
                  insertAtCursor("**bold text**");
                  showToast("Bold formatting added");
                }}
              >
                <FormatIcon />
              </ComposerBtn>
              <ComposerBtn
                title="Mention"
                onClick={() => {
                  setShowMentions(!showMentions);
                  setShowEmoji(false);
                }}
                active={showMentions}
              >
                <AtIcon />
              </ComposerBtn>
              <ComposerBtn
                title="Emoji"
                onClick={() => {
                  setShowEmoji(!showEmoji);
                  setShowMentions(false);
                }}
                active={showEmoji}
              >
                <EmojiIcon />
              </ComposerBtn>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="submit"
                disabled={!canSend}
                className="p-1.5 rounded disabled:opacity-30 hover:bg-[#F8F8F8] transition-colors"
                title={isSending ? "Uploading…" : "Send"}
              >
                <SendArrowIcon active={canSend} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ComposerBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#E8F5FA] text-[#1264A3]"
          : "text-[#616061] hover:bg-[#F8F8F8] hover:text-[#1D1C1D]"
      }`}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
}
function FormatIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 4a1 1 0 011-1h6a1 1 0 110 2H9.414l-1.293 6.293A1 1 0 008 12H5a1 1 0 110-2h1.586l1.293-6.293A1 1 0 006 4z" clipRule="evenodd" /></svg>;
}
function AtIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" /></svg>;
}
function EmojiIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" /></svg>;
}
function SendArrowIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-[#007A5A]" : "text-[#ABABAD]"}`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
  );
}
function RemoveIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
