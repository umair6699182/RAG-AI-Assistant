"use client";

import { useState } from "react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import Footer from "@/components/Footer";

interface Doc {
  id: string;
  document_id: string;
  name: string;
  size: string;
  total_chunks?: number;
  storage_path: string;
}

export default function Page() {
  const [selectedDoc, setSelectedDoc] =
    useState<Doc | null>(null);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeDocId={selectedDoc?.document_id}
          onSelectDoc={(doc) => {
            setSelectedDoc(doc);
          }}
        />

        {/* Chat */}
        <ChatBox
          documentId={selectedDoc?.document_id}
          documentName={selectedDoc?.name}
        />
      </div>

      <Footer />
    </div>
  );
}