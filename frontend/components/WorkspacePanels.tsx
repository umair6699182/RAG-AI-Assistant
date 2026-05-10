"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { getDocumentMessages, ChatHistoryMessage } from "@/services/api";
import { supabase } from "@/lib/supabaseClient";

interface Doc {
  id: string;
  document_id: string;
  name: string;
  size: string;
  file_size?: number;
  total_chunks?: number;
  storage_path: string;
}

interface DocumentsPanelProps {
  documents: Doc[];
  selectedDoc: Doc | null;
  onOpenChat: () => void;
  onSelectDoc: (doc: Doc) => void;
}

interface HistoryPanelProps {
  selectedDoc: Doc | null;
  onOpenChat: () => void;
}

interface SettingsPanelProps {
  documentCount: number;
  totalChunks: number;
  user: User | null;
  onUserUpdated: (user: User) => void;
}

export function DocumentsPanel({
  documents,
  selectedDoc,
  onOpenChat,
  onSelectDoc,
}: DocumentsPanelProps) {
  const totalChunks = documents.reduce(
    (total, doc) => total + (doc.total_chunks || 0),
    0,
  );

  return (
    <section className="flex-1 overflow-y-auto bg-[#0a0a0f] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">
            Documents
          </h1>
          <p className="mt-1 text-[12px] text-[#6f6f82]">
            {documents.length} PDFs indexed · {totalChunks} chunks
          </p>
        </div>

        <button
          onClick={onOpenChat}
          disabled={!selectedDoc}
          className="rounded-lg border border-[#7c6af7]/25 bg-[#7c6af7]/12 px-3 py-2 text-[12px] font-semibold text-[#c7bfff] transition hover:bg-[#7c6af7]/18 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Open chat
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Total PDFs" value={documents.length.toString()} />
        <Metric label="Active chunks" value={totalChunks.toString()} />
        <Metric
          label="Selected"
          value={selectedDoc ? "Ready" : "None"}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr] border-b border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase text-[#6f6f82]">
          <span>Name</span>
          <span>Chunks</span>
          <span>Status</span>
        </div>

        {documents.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#6f6f82]">
            No documents in your library yet.
          </div>
        ) : (
          documents.map((doc) => {
            const isActive = selectedDoc?.document_id === doc.document_id;

            return (
              <button
                key={doc.document_id}
                onClick={() => onSelectDoc(doc)}
                className={`grid w-full grid-cols-[1.4fr_0.7fr_0.7fr] items-center border-b border-white/[0.05] px-4 py-3 text-left transition last:border-b-0 ${
                  isActive
                    ? "bg-[#7c6af7]/10"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-white">
                    {doc.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-[#5a5a6e]">
                    {doc.storage_path}
                  </span>
                </span>

                <span className="text-[12px] text-[#d7d7e8]">
                  {doc.total_chunks || 0}
                </span>

                <span
                  className={`w-fit rounded-full border px-2 py-1 text-[10px] font-medium ${
                    isActive
                      ? "border-[#7c6af7]/30 bg-[#7c6af7]/15 text-[#c7bfff]"
                      : "border-emerald-400/15 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {isActive ? "Selected" : "Indexed"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export function HistoryPanel({
  selectedDoc,
  onOpenChat,
}: HistoryPanelProps) {
  if (!selectedDoc) {
    return (
      <section className="flex-1 overflow-y-auto bg-[#0a0a0f] p-6">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-tight text-white">
            History
          </h1>
          <p className="mt-1 text-[12px] text-[#6f6f82]">
            Select a document to inspect messages.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#101018] px-4 py-8 text-center text-[12px] text-[#6f6f82]">
          No document selected.
        </div>
      </section>
    );
  }

  return (
    <HistoryContent
      selectedDoc={selectedDoc}
      onOpenChat={onOpenChat}
    />
  );
}

function HistoryContent({
  selectedDoc,
  onOpenChat,
}: {
  selectedDoc: Doc;
  onOpenChat: () => void;
}) {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        const data = await getDocumentMessages(selectedDoc.document_id);

        if (cancelled) return;

        setMessages(data.messages);
        setConversationId(data.conversation_id);
      } catch (error) {
        console.error("History load error:", error);

        if (!cancelled) {
          toast.error("Failed to load history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedDoc]);

  return (
    <section className="flex-1 overflow-y-auto bg-[#0a0a0f] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">
            History
          </h1>
          <p className="mt-1 text-[12px] text-[#6f6f82]">
            {selectedDoc.name}
          </p>
        </div>

        <button
          onClick={onOpenChat}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-[#d7d7e8] transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue chat
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Metric label="Messages" value={messages.length.toString()} />
        <Metric
          label="Conversation"
          value={conversationId ? "Saved" : "None"}
        />
        <Metric
          label="Document"
          value="Selected"
        />
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#101018]">
        {loading ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#6f6f82]">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#6f6f82]">
            No saved messages for this document.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id || `${message.role}-${message.created_at}`}
              className="border-b border-white/[0.06] px-4 py-3 last:border-b-0"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    message.role === "user"
                      ? "bg-[#7c6af7]/15 text-[#c7bfff]"
                      : "bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {message.role === "user" ? "You" : "Assistant"}
                </span>
                {message.created_at && (
                  <span className="text-[10px] text-[#5a5a6e]">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                )}
              </div>

              <p className="whitespace-pre-wrap text-[12.5px] leading-6 text-[#e8e8f4]">
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function SettingsPanel({
  documentCount,
  totalChunks,
  user,
  onUserUpdated,
}: SettingsPanelProps) {
  const [displayName, setDisplayName] = useState(() =>
    getDisplayName(user),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const nextName = displayName.trim();

    if (!nextName) {
      toast.error("Display name is required.");
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: nextName,
          name: nextName,
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        onUserUpdated(data.user);
      }

      toast.success("Profile updated.");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex-1 overflow-y-auto bg-[#0a0a0f] p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-1 text-[12px] text-[#6f6f82]">
          Account, workspace, and session controls.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_0.8fr] gap-5">
        <div className="rounded-xl border border-white/[0.07] bg-[#101018] p-4">
          <h2 className="text-[14px] font-semibold text-white">
            Profile
          </h2>

          <label className="mt-4 block text-[11px] font-semibold uppercase text-[#6f6f82]">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/[0.09] bg-[#0b0b12] px-3 py-2 text-[13px] text-white outline-none transition focus:border-[#7c6af7]/50"
          />

          <label className="mt-4 block text-[11px] font-semibold uppercase text-[#6f6f82]">
            Email
          </label>
          <div className="mt-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[13px] text-[#d7d7e8]">
            {user?.email || "Unknown"}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-5 rounded-lg bg-[#7c6af7] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#8a7cff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>

        <div className="space-y-3">
          <Metric label="Documents" value={documentCount.toString()} />
          <Metric label="Chunks" value={totalChunks.toString()} />
          <Metric
            label="Provider"
            value={getProvider(user)}
          />
          <Metric
            label="User ID"
            value={user?.id ? user.id.slice(0, 8) : "Unknown"}
          />
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#101018] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase text-[#6f6f82]">
        {label}
      </p>
      <p className="mt-1 truncate text-[17px] font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function getDisplayName(user: User | null) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    ""
  );
}

function getProvider(user: User | null) {
  const provider = user?.app_metadata?.provider;

  if (!provider) {
    return "Email";
  }

  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
