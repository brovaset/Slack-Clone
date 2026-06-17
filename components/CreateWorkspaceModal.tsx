"use client";

import { useApp } from "@/lib/context/AppContext";
import { LIMITS } from "@/lib/security";
import { sanitizeWorkspaceName } from "@/lib/security/sanitize";
import type { Workspace } from "@/lib/types";
import { useState } from "react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspace: Workspace) => void;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreated,
}: CreateWorkspaceModalProps) {
  const { createWorkspace, workspaces } = useApp();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const safeName = sanitizeWorkspaceName(name);
    if (!safeName) {
      setError("Enter a workspace name.");
      return;
    }
    if (workspaces.some((w) => w.name.toLowerCase() === safeName.toLowerCase())) {
      setError("You already belong to a workspace with that name.");
      return;
    }

    setSubmitting(true);
    try {
      const workspace = await createWorkspace(safeName);
      onCreated?.(workspace);
      setName("");
      onClose();
    } catch {
      setError("Could not create workspace. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 mx-4">
        <h2 className="text-[28px] font-bold text-[#1D1C1D] mb-2 leading-tight">
          Create a workspace
        </h2>
        <p className="text-[15px] text-[#616061] mb-6 leading-relaxed">
          Workspaces are shared spaces where teams communicate. You&apos;ll get
          #general and #random channels automatically.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-[15px] font-bold text-[#1D1C1D] mb-2" htmlFor="workspaceName">
            Workspace name
          </label>
          <input
            id="workspaceName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Acme Marketing"
            maxLength={LIMITS.workspaceName}
            required
            className="w-full px-3 py-2.5 border border-[#868686] rounded-md text-[15px] focus:outline-none focus:border-[#1264A3] mb-1"
          />
          {error && <p className="text-[13px] text-[#E01E5A] mb-3">{error}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[15px] font-bold text-[#616061] hover:bg-[#F8F8F8] rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#007A5A] text-white font-bold rounded-md hover:bg-[#148567] text-[15px] disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
