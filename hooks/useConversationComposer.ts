"use client";

import { useApp } from "@/lib/context/AppContext";
import { useEffect, useState } from "react";

export function useConversationComposer(
  targetId: string | null,
  targetType: "channel" | "dm",
  targetName: string
) {
  const {
    getComposerText,
    setComposerText,
    clearComposerText,
    saveDraft,
    drafts,
    deleteDraft,
  } = useApp();

  const composerKey =
    targetId ? `${targetType}:${targetId}` : "";

  const [text, setText] = useState("");

  useEffect(() => {
    if (!composerKey) {
      setText("");
      return;
    }
    const fromMemory = getComposerText(composerKey);
    const fromDraft = drafts.find(
      (d) => d.target === targetName && d.targetType === targetType
    )?.content;
    setText(fromMemory || fromDraft || "");
  }, [composerKey, targetName, targetType, getComposerText, drafts]);

  function updateText(value: string) {
    setText(value);
    if (!composerKey) return;
    setComposerText(composerKey, value);
    if (value.trim()) {
      saveDraft(value, targetName, targetType);
    } else {
      const existing = drafts.find(
        (d) => d.target === targetName && d.targetType === targetType
      );
      if (existing) deleteDraft(existing.id);
    }
  }

  function clearAfterSend() {
    setText("");
    if (!composerKey) return;
    clearComposerText(composerKey);
    const existing = drafts.find(
      (d) => d.target === targetName && d.targetType === targetType
    );
    if (existing) deleteDraft(existing.id);
  }

  return { text, setText: updateText, clearAfterSend };
}
