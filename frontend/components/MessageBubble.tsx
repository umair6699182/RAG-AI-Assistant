interface Source {
  document_id?: string;
  filename?: string;
  page_number?: number;
  chunk_index?: number;
  chunk_preview?: string;
  score?: number;
  file_id?: string;
  metadata?: {
    chunk_index?: number;
    file_name?: string;
    page_number?: number;
    retrieval_type?: string;
    score?: number;
  };
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isTyping?: boolean;
}

export default function MessageBubble({
  role,
  content,
  sources,
  isTyping = false,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-2.5 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-[26px] h-[26px] rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[11px] font-semibold ${
          isUser
            ? "bg-linear-to-br from-[#3d3d5c] to-[#5a5a80] text-[#a78bfa]"
            : "bg-linear-to-br from-[#5a4fcf] to-[#7c6af7] text-white"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      <div
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Typing */}
        {isTyping ? (
          <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1c1c28] border border-white/[0.07] rounded-2xl rounded-tl-[4px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#5a5a6e] animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "1.2s",
                }}
              />
            ))}

            <span className="text-[11px] text-[#5a5a6e] ml-1">
              Thinking...
            </span>
          </div>
        ) : (
          <div
            className={`max-w-[72%] px-3.5 py-2.5 text-[12.5px] leading-[1.6] whitespace-pre-wrap wrap-break-word ${
              isUser
                ? "bg-[#7c6af7] text-white rounded-2xl rounded-tr-[4px]"
                : "bg-[#1c1c28] text-white border border-white/[0.07] rounded-2xl rounded-tl-[4px]"
            }`}
          >
            {content}
          </div>
        )}

        {/* Sources */}
        {!isUser &&
          sources &&
          sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 max-w-[72%]">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="max-w-[260px] px-2.5 py-1.5 rounded-lg border border-[#7c6af7]/18 bg-[#7c6af7]/8 hover:bg-[#7c6af7]/14 transition-colors duration-150"
                >
                  <p className="text-[10px] font-medium text-[#a78bfa] truncate max-w-[220px]">
                    {src.filename ||
                      src.metadata?.file_name ||
                      "Document Source"}
                  </p>

                  <p className="text-[9px] text-[#7d7d90] mt-0.5">
                    {getSourceLabel(src)}
                  </p>

                  {src.chunk_preview && (
                    <p className="mt-1 line-clamp-2 text-[9.5px] leading-4 text-[#d7d7e8]/75">
                      {src.chunk_preview}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function getSourceLabel(src: Source) {
  const pageNumber = src.page_number ?? src.metadata?.page_number;
  const chunkIndex = src.chunk_index ?? src.metadata?.chunk_index;
  const score = src.score ?? src.metadata?.score;

  const parts = [];

  if (typeof pageNumber === "number") {
    parts.push(`Page ${pageNumber}`);
  }

  if (typeof chunkIndex === "number") {
    parts.push(`Chunk ${chunkIndex + 1}`);
  }

  if (typeof score === "number") {
    parts.push(`Score ${score.toFixed(3)}`);
  }

  return parts.join(" · ") || "Retrieved source";
}
