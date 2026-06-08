"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import Header, { WorkspaceView } from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import Footer from "@/components/Footer";
import {
  DocumentsPanel,
  HistoryPanel,
  SettingsPanel,
} from "@/components/WorkspacePanels";
import { supabase } from "@/lib/supabaseClient";

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

export default function Page() {
  const router = useRouter();
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [activeView, setActiveView] =
    useState<WorkspaceView>("chat");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSelectDoc = useCallback((doc: Doc | null) => {
    setSelectedDoc(doc);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/");
      } else {
        setUser(data.session.user);
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  const totalChunks = documents.reduce(
    (total, doc) => total + (doc.total_chunks || 0),
    0,
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      <Header
        activeView={activeView}
        documentCount={documents.length}
        onViewChange={setActiveView}
        user={user}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeDocId={selectedDoc?.document_id}
          onDocumentsChange={setDocuments}
          onSelectDoc={handleSelectDoc}
        />

        {activeView === "chat" && (
          <ChatBox
            key={selectedDoc?.document_id ?? "no-document"}
            documentId={selectedDoc?.document_id}
            documentName={selectedDoc?.name}
          />
        )}

        {activeView === "documents" && (
          <DocumentsPanel
            documents={documents}
            selectedDoc={selectedDoc}
            onOpenChat={() => setActiveView("chat")}
            onSelectDoc={handleSelectDoc}
          />
        )}

        {activeView === "history" && (
          <HistoryPanel
            selectedDoc={selectedDoc}
            onOpenChat={() => setActiveView("chat")}
          />
        )}

        {activeView === "settings" && (
          <SettingsPanel
            documentCount={documents.length}
            totalChunks={totalChunks}
            user={user}
            onUserUpdated={setUser}
          />
        )}
      </div>

      <Footer
        documentCount={documents.length}
        totalChunks={totalChunks}
      />
    </div>
  );
}
