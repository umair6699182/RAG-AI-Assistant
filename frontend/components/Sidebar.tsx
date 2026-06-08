"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ApiDocument,
  deleteDocument,
  listDocuments,
  processDocument,
} from "@/services/api";
import { toast } from "sonner";

interface Doc {
  id: string;
  document_id: string;
  name: string;
  size: string;
  file_size?: number;
  total_chunks?: number;
  storage_path: string;
  status?: "pending" | "processing" | "completed" | "failed";
  error_message?: string | null;
}

interface SidebarProps {
  activeDocId?: string;
  onDocumentsChange?: (docs: Doc[]) => void;
  onSelectDoc?: (doc: Doc | null) => void;
  onUpload?: (file: File) => void;
}

export default function Sidebar({
  activeDocId,
  onDocumentsChange,
  onSelectDoc,
  onUpload,
}: SidebarProps) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(
    null,
  );

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedDocuments() {
      try {
        const { documents } = await listDocuments();
        const loadedDocs = documents.map(toDoc);

        if (cancelled) return;

        setDocs(loadedDocs);
        onDocumentsChange?.(loadedDocs);

        if (loadedDocs.length > 0) {
          onSelectDoc?.(loadedDocs[0]);
        }
      } catch (error) {
        console.error("Load documents error:", error);

        if (!cancelled) {
          toast.error("Failed to load saved documents.");
        }
      } finally {
        if (!cancelled) {
          setLoadingDocs(false);
        }
      }
    }

    loadSavedDocuments();

    return () => {
      cancelled = true;
    };
  }, [onDocumentsChange, onSelectDoc]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return toast.error("No file selected.");
    }

    if (file.type !== "application/pdf") {
      return toast.error("Please upload a valid PDF file.");
    }

    if (file.size === 0) {
      return toast.error("PDF file is empty.");
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("File size must be less than 10MB.");
    }

    setUploading(true);

    const loadingToast = toast.loading("Uploading PDF...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return toast.error("Please sign in again before uploading.", {
          id: loadingToast,
        });
      }

      // Generate unique storage path
      const safeFileName = file.name.replace(/[^\w.-]+/g, "_");
      const filePath = `uploads/${session.user.id}/${crypto.randomUUID()}-${safeFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);

        return toast.error(
          error.message || "Failed to upload PDF.",
          {
            id: loadingToast,
          },
        );
      }

      // Update loading toast
      toast.loading("Processing document...", {
        id: loadingToast,
      });

      // Process document in backend
      const processData = await processDocument(
        data.path,
        file.size,
        file.name,
      );
      const newDoc = toDoc(processData);

      // Update UI
      const nextDocs = [newDoc, ...docs];

      setDocs(nextDocs);
      onDocumentsChange?.(nextDocs);

      onSelectDoc?.(newDoc);

      onUpload?.(file);

      toast.success("PDF uploaded & processed successfully!", {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Upload error:", error);

      toast.error("Something went wrong during upload.", {
        id: loadingToast,
      });
    } finally {
      setUploading(false);

      // Reset input
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (
    e: React.MouseEvent<HTMLButtonElement>,
    doc: Doc,
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${doc.name}" and its chat history?`,
    );

    if (!confirmed) return;

    try {
      setDeletingDocId(doc.document_id);

      await deleteDocument(doc.document_id);

      const remainingDocs = docs.filter(
        (item) => item.document_id !== doc.document_id,
      );

      setDocs(remainingDocs);
      onDocumentsChange?.(remainingDocs);

      if (activeDocId === doc.document_id) {
        onSelectDoc?.(remainingDocs[0] ?? null);
      }

      toast.success("Document deleted.");
    } catch (error) {
      console.error("Delete document error:", error);
      toast.error("Failed to delete document.");
    } finally {
      setDeletingDocId(null);
    }
  };

  // Storage calculation
  const totalBytes = docs.reduce((acc, doc) => {
    return acc + (doc.file_size || 0);
  }, 0);

  const storagePct = Math.min(
    (totalBytes / (25 * 1024 * 1024)) * 100,
    100,
  ).toFixed(0);

  return (
    <aside className="w-[350px] border-r border-white/[0.07] bg-[#111118] flex flex-col shrink-0">
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-[#5a5a6e] mb-2.5">
          Library
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center cursor-pointer gap-1.5 w-full px-2.5 py-2 rounded-lg border border-dashed border-[#7c6af7]/35 bg-[#7c6af7]/6 text-[#a78bfa] text-[12px] font-medium transition-all duration-150 hover:border-[#7c6af7]/60 hover:bg-[#7c6af7]/12 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="shrink-0"
          >
            <path d="M8 10V4M5 7l3-3 3 3" />

            <rect
              x="2"
              y="11"
              width="12"
              height="3"
              rx="1"
            />
          </svg>

          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      {/* Documents */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5">
        {loadingDocs && (
          <p className="text-[11px] text-[#5a5a6e] px-2 py-3">
            Loading saved PDFs...
          </p>
        )}

        {!loadingDocs && docs.length === 0 && (
          <p className="text-[11px] text-[#5a5a6e] px-2 py-3">
            No PDFs uploaded yet.
          </p>
        )}

        {docs.map((doc) => {
          const isActive = activeDocId === doc.id;

          return (
            <div
              key={doc.id}
              onClick={() => {
                onSelectDoc?.(doc);
              }}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer border transition-all duration-150 ${
                isActive
                  ? "bg-[#7c6af7]/10 border-[#7c6af7]/20"
                  : "border-transparent hover:bg-white/4 hover:border-white/[0.07]"
              }`}
            >
              {/* PDF Icon */}
              <div
                className={`w-[26px] h-[32px] rounded flex items-center justify-center text-[8px] font-bold tracking-wider shrink-0 ${
                  isActive
                    ? "bg-[#7c6af7]/20 text-[#a78bfa] border border-[#7c6af7]/30"
                    : "bg-[#e04b4b]/15 text-[#e04b4b] border border-[#e04b4b]/20"
                }`}
              >
                PDF
              </div>

              {/* Document Info */}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-white truncate leading-tight">
                  {doc.name.replace(".pdf", "")}
                </p>

                <p className="text-[10px] text-[#5a5a6e] mt-0.5">
                  {doc.size}

                  {doc.total_chunks
                    ? ` · ${doc.total_chunks} chunks`
                    : ""}
                </p>

                <p className={`mt-1 text-[10px] ${getStatusTextClass(doc.status)}`}>
                  {getStatusLabel(doc.status)}
                </p>
              </div>

              {/* Active Indicator */}
              <button
                onClick={(e) => handleDeleteDocument(e, doc)}
                disabled={deletingDocId === doc.document_id}
                title="Delete document"
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#5a5a6e] hover:text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 4h10M6 4V3h4v1M5 4v8h6V4" />
                </svg>
              </button>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c6af7] shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Storage */}
      <div className="px-3.5 py-3 border-t border-white/[0.07]">
        <div className="flex justify-between text-[10px] text-[#5a5a6e] mb-1.5">
          <span>Storage</span>

          <span>{storagePct}%</span>
        </div>

        <div className="h-[3px] rounded-full bg-white/6 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#7c6af7] to-[#a78bfa] transition-all duration-500"
            style={{
              width: `${storagePct}%`,
            }}
          />
        </div>
      </div>
    </aside>
  );
}

function toDoc(doc: ApiDocument): Doc {
  const fileSize = doc.file_size || 0;

  return {
    id: doc.document_id || doc.id,
    document_id: doc.document_id || doc.id,
    name: doc.name || doc.file_name || "Untitled PDF",
    size: formatFileSize(fileSize),
    file_size: fileSize,
    total_chunks: doc.total_chunks || 0,
    storage_path: doc.storage_path,
    status: doc.status || "completed",
    error_message: doc.error_message,
  };
}

function formatFileSize(bytes: number) {
  if (!bytes) {
    return "0 MB";
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusLabel(status?: Doc["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return "Completed";
  }
}

function getStatusTextClass(status?: Doc["status"]) {
  switch (status) {
    case "pending":
      return "text-amber-200";
    case "processing":
      return "text-sky-200";
    case "failed":
      return "text-red-200";
    default:
      return "text-emerald-200";
  }
}
