"use client";

import { useApp } from "@/lib/context/AppContext";
import { LIMITS, sanitizeChannelName } from "@/lib/security";
import type { Channel } from "@/lib/types";
import { useState } from "react";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}

export default function CreateChannelModal({
  isOpen,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const { addChannel, channels } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = sanitizeChannelName(name);
    if (!normalized) {
      setError("Use letters, numbers, hyphens, or underscores only.");
      return;
    }
    if (channels.some((c) => c.name === normalized)) {
      setError("A channel with that name already exists.");
      return;
    }

    const channel = await addChannel(normalized, description);
    if (!channel) {
      // addChannel shows a toast with the real error (RLS, duplicate name, etc.)
      return;
    }

    onCreated(channel);
    setName("");
    setDescription("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 mx-4">
        <h2 className="text-[28px] font-bold text-[#1D1C1D] mb-2 leading-tight">
          Create a channel
        </h2>
        <p className="text-[15px] text-[#616061] mb-6 leading-relaxed">
          Channels are where your team communicates. They&apos;re best organized
          around a topic — #marketing, for example.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="channelName" className="block text-[15px] font-bold text-[#1D1C1D] mb-2">
              Name
            </label>
            <div className="flex items-center border border-[#868686] rounded focus-within:border-[#1264A3] focus-within:shadow-[0_0_0_1px_#1264A3]">
              <span className="pl-3 text-[#616061] text-[15px]">#</span>
              <input
                id="channelName"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value.replace(/^#+/, "").replace(/^\s+/, ""))
                }
                required
                maxLength={LIMITS.channelName}
                pattern="[a-zA-Z0-9][a-zA-Z0-9-_]*"
                className="flex-1 px-2 py-2 focus:outline-none text-[15px]"
                placeholder="e.g. plan-budget"
              />
            </div>
          </div>

          <div>
            <label htmlFor="channelDescription" className="block text-[15px] font-bold text-[#1D1C1D] mb-2">
              Description <span className="font-normal text-[#616061]">(optional)</span>
            </label>
            <input
              id="channelDescription"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={LIMITS.channelDescription}
              className="w-full px-3 py-2 border border-[#868686] rounded focus:outline-none focus:border-[#1264A3] focus:shadow-[0_0_0_1px_#1264A3] text-[15px]"
              placeholder="What's this channel about?"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[15px] text-[#1D1C1D] border border-[#868686] rounded hover:bg-[#F8F8F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-[15px] bg-[#007A5A] text-white font-bold rounded hover:bg-[#148567]"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
