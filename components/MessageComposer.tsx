"use client";

import { EMOJI_LIST } from "@/lib/constants";
import { useApp } from "@/lib/context/AppContext";
import { LIMITS } from "@/lib/security";
import { sanitizeFileName } from "@/lib/security/sanitize";
import { showToast } from "@/lib/toast";
import { useRef, useState } from "react";

interface MessageComposerProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
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
  const { setIsRecording, isRecording, saveDraft, members } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

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
      onSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const safeName = sanitizeFileName(file.name);
      insertAtCursor(`[Attached: ${safeName}] `);
      showToast(`Attached ${safeName}`);
    }
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

  function toggleRecording() {
    if (isRecording) {
      setIsRecording(false);
      const voiceText = "[Voice message: 0:12]";
      onChange(value.trim() ? `${value} ${voiceText}` : voiceText);
      showToast("Voice message recorded — press send to share");
    } else {
      setIsRecording(true);
      setShowEmoji(false);
      setShowMentions(false);
    }
  }

  function handleDraft() {
    if (value.trim()) saveDraft(value, target, targetType);
  }

  const mentionCandidates = members.filter((m) => m.name !== "You");

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
        accept="image/*,.pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <div
          className={`border rounded-lg overflow-hidden focus-within:border-[#1264A3] transition-colors shadow-sm ${
            isRecording ? "border-[#E01E5A]" : "border-[#868686]"
          }`}
        >
          {isRecording && (
            <div className="px-3 py-1.5 bg-[#FEF1F2] text-[#E01E5A] text-[13px] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E01E5A] animate-pulse" />
              Recording audio message...
              <button
                type="button"
                onClick={() => setIsRecording(false)}
                className="ml-auto text-[#616061] hover:text-[#1D1C1D]"
              >
                Cancel
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
              <ComposerBtn title="Attach" onClick={() => fileInputRef.current?.click()}>
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
              <ComposerBtn
                title="Record"
                onClick={toggleRecording}
                active={isRecording}
              >
                <MicIcon />
              </ComposerBtn>
              <ComposerBtn
                title="Send a snippet"
                onClick={() => {
                  insertAtCursor("```\ncode here\n```");
                  showToast("Code snippet added");
                }}
              >
                <SnippetIcon />
              </ComposerBtn>
              <button
                type="submit"
                disabled={!value.trim()}
                className="p-1.5 rounded disabled:opacity-30 hover:bg-[#F8F8F8] transition-colors"
                title="Send"
              >
                <SendArrowIcon active={!!value.trim()} />
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
function MicIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>;
}
function SnippetIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
}
function SendArrowIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-[#007A5A]" : "text-[#ABABAD]"}`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
  );
}
