"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Doc {
  id: string;
  name: string;
  size: string;
  pages: number;
  storage_path?: string;
}

interface SidebarProps {
  activeDocId?: string;
  onSelectDoc?: (doc: Doc) => void;
  onUpload?: (file: File) => void;
}

export default function Sidebar({
  activeDocId,
  onSelectDoc,
  onUpload,
}: SidebarProps) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return toast.error("No file selected.");
    }

    if (file.type !== "application/pdf") {
      return toast.error("Please upload a valid PDF file.");
    }

    // Optional: File size validation (example: 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("File size must be less than 10MB.");
    }

    setUploading(true);

    // Loading toast
    const loadingToast = toast.loading("Uploading PDF...");

    try {
      const filePath = `uploads/${crypto.randomUUID()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);

        toast.dismiss(loadingToast);
        return toast.error(error.message || "Failed to upload PDF.");
      }

      // Update loading state
      toast.loading("Processing document...", {
        id: loadingToast,
      });

      const processResponse = await fetch(
        "http://localhost:8000/process-document",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storage_path: data.path,
          }),
        },
      );

      const processData = await processResponse.json();

      if (!processResponse.ok) {
        console.error("Process document error:", processData);

        toast.dismiss(loadingToast);

        return toast.error(processData.detail || "Document processing failed.");
      }

      const newDoc: Doc = {
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        pages: processData.pages || 0,
        storage_path: data.path,
      };

      setDocs((prev) => [newDoc, ...prev]);
      setSelected(newDoc.id);

      onSelectDoc?.(newDoc);
      onUpload?.(file);

      toast.success("PDF uploaded & processed successfully!", {
        id: loadingToast,
      });
    } catch (error) {
      console.error(error);

      toast.dismiss(loadingToast);

      toast.error("Something went wrong during upload.");
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const totalMB = docs.reduce((acc, d) => {
    return acc + Number(d.size.replace(" MB", ""));
  }, 0);

  const storagePct = Math.min((totalMB / 25) * 100, 100).toFixed(0);

  return (
    <aside className="w-[350px] border-r border-white/[0.07] bg-[#111118] flex flex-col shrink-0">
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
          className="flex items-center cursor-pointer gap-1.5 w-full px-2.5 py-2 rounded-lg border border-dashed border-[#7c6af7]/35 bg-[#7c6af7]/06 text-[#a78bfa] text-[12px] font-medium transition-all duration-150 hover:border-[#7c6af7]/60 hover:bg-[#7c6af7]/12 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <rect x="2" y="11" width="12" height="3" rx="1" />
          </svg>

          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5">
        {docs.length === 0 && (
          <p className="text-[11px] text-[#5a5a6e] px-2 py-3">
            No PDFs uploaded yet.
          </p>
        )}

        {docs.map((doc) => {
          const isActive = selected === doc.id || activeDocId === doc.id;

          return (
            <div
              key={doc.id}
              onClick={() => {
                setSelected(doc.id);
                onSelectDoc?.(doc);
              }}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer border transition-all duration-150 ${
                isActive
                  ? "bg-[#7c6af7]/10 border-[#7c6af7]/20"
                  : "border-transparent hover:bg-white/4 hover:border-white/[0.07]"
              }`}
            >
              <div
                className={`w-[26px] h-[32px] rounded flex items-center justify-center text-[8px] font-bold tracking-wider shrink-0 ${
                  isActive
                    ? "bg-[#7c6af7]/20 text-[#a78bfa] border border-[#7c6af7]/30"
                    : "bg-[#e04b4b]/15 text-[#e04b4b] border border-[#e04b4b]/20"
                }`}
              >
                PDF
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-white truncate leading-tight">
                  {doc.name.replace(".pdf", "")}
                </p>

                <p className="text-[10px] text-[#5a5a6e] mt-0.5">
                  {doc.size}
                  {doc.pages > 0 ? ` · ${doc.pages}p` : ""}
                </p>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c6af7] shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3.5 py-3 border-t border-white/[0.07]">
        <div className="flex justify-between text-[10px] text-[#5a5a6e] mb-1.5">
          <span>Storage</span>
          <span>{storagePct}%</span>
        </div>

        <div className="h-[3px] rounded-full bg-white/6 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#7c6af7] to-[#a78bfa] transition-all duration-500"
            style={{ width: `${storagePct}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
