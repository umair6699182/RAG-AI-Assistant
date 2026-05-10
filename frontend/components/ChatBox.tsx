"use client";

import { useEffect, useRef, useState } from "react";

import MessageBubble from "./MessageBubble";

interface Source {
  content: string;
  document_id?: string;
  file_id?: string;
  metadata?: {
    chunk_index?: number;
    file_name?: string;
    pages?: number;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ChatBoxProps {
  documentId?: string;
  documentName?: string;
}

const HINTS = [
  "Summarize this document",
  "What are the key findings?",
  "Explain the main idea",
  "Give me important points",
];

export default function ChatBox({
  documentId,
  documentName,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Upload and select a document to start chatting with your AI assistant.",
    },
  ]);

  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<
    string | undefined
  >();

  const bottomRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Reset chat when document changes
  useEffect(() => {
    if (!documentId) return;

    setConversationId(undefined);

    setMessages([
      {
        role: "assistant",
        content: `I've indexed "${documentName || "your document"}". Ask me anything about it.`,
      },
    ]);
  }, [documentId, documentName]);

  const send = async (text?: string) => {
    const q = (text ?? question).trim();

    if (!q || loading || !documentId) return;

    const userMessage: Message = {
      role: "user",
      content: q,
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      sources: [],
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ]);

    setQuestion("");

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/chat/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: q,
            document_id: documentId,
            conversation_id: conversationId,
            match_count: 5,
          }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("Streaming failed");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");

        buffer = events.pop() || "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;

          const jsonString = event.replace("data: ", "");

          const data = JSON.parse(jsonString);

          // Conversation ID
          if (data.type === "conversation") {
            setConversationId(data.conversation_id);
          }

          // Sources
          if (data.type === "sources") {
            setMessages((prev) => {
              const updated = [...prev];

              const lastIndex = updated.length - 1;

              updated[lastIndex] = {
                ...updated[lastIndex],
                sources: data.sources || [],
              };

              return updated;
            });
          }

          // Streaming tokens
          if (data.type === "token") {
            setMessages((prev) => {
              const updated = [...prev];

              const lastIndex = updated.length - 1;

              updated[lastIndex] = {
                ...updated[lastIndex],
                content:
                  updated[lastIndex].content + data.content,
              };

              return updated;
            });
          }

          // Error
          if (data.type === "error") {
            throw new Error(
              data.message || "Streaming failed",
            );
          }

          // Done
          if (data.type === "done") {
            break;
          }
        }
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => {
        const updated = [...prev];

        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          role: "assistant",
          content:
            "Something went wrong while generating the response.",
        };

        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      send();
    }
  };

  const clearChat = () => {
    setConversationId(undefined);

    setMessages([
      {
        role: "assistant",
        content: documentId
          ? `Chat cleared. Ask me anything about "${documentName}".`
          : "Upload a document to begin chatting.",
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0f] min-w-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.07] bg-[#0a0a0f]/80 shrink-0">
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="#7c6af7"
            strokeWidth="1.5"
          >
            <path d="M2 3h12v8H2zM5 11l-1 2M11 11l1 2M5 13h6" />
          </svg>

          <span
            className="text-[13px] font-semibold text-white"
            style={{
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Chat Session
          </span>

          {documentName && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7c6af7]/12 text-[#a78bfa] border border-[#7c6af7]/20 font-medium">
              {documentName}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={clearChat}
            title="Clear chat"
            className="w-7 h-7 rounded-lg border border-white/12 bg-[#111118] flex items-center justify-center text-[#8b8b9a] hover:text-white hover:bg-white/8 transition-all duration-150"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 4h10M6 4V3h4v1M5 4v8h6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-3.5">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            sources={msg.sources}
          />
        ))}

        {loading && (
          <div className="text-[11px] text-[#5a5a6e]">
            AI is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.07] bg-[#0a0a0f]/90 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#111118] border border-white/12 rounded-xl px-3 py-2 focus-within:border-[#7c6af7]/45 transition-colors duration-150">
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={!documentId || loading}
              placeholder={
                documentId
                  ? "Ask a question about your document..."
                  : "Upload & select a document first..."
              }
              className="flex-1 bg-transparent border-none outline-none text-white text-[12.5px] resize-none placeholder:text-[#5a5a6e] leading-[1.4] font-['DM_Sans',sans-serif] max-h-28 overflow-y-auto disabled:opacity-50"
            />
          </div>

          {/* Send */}
          <button
            onClick={() => send()}
            disabled={
              loading ||
              !question.trim() ||
              !documentId
            }
            className="w-9 h-9 rounded-xl bg-linear-to-br from-[#7c6af7] to-[#a78bfa] flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="white"
            >
              <path d="M14 2L2 7l5 2 2 5 5-12z" />
            </svg>
          </button>
        </div>

        {/* Hint Chips */}
        {documentId && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {HINTS.map((hint, i) => (
              <span
                key={hint}
                className="flex items-center gap-1.5"
              >
                <button
                  onClick={() => send(hint)}
                  disabled={loading}
                  className="text-[10px] text-[#5a5a6e] hover:text-[#8b8b9a] transition-colors duration-150 disabled:opacity-40"
                >
                  {hint}
                </button>

                {i < HINTS.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-[#5a5a6e]" />
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}