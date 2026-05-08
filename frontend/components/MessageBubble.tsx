interface Source {
  label: string;
  page?: number;
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
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-[26px] h-[26px] rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[11px] font-semibold ${
          isUser
            ? "bg-linear-to-br from-[#3d3d5c] to-[#5a5a80] text-[#a78bfa]"
            : "bg-linear-to-br from-[#5a4fcf] to-[#7c6af7] text-white"
        }`}
      >
        {isUser ? "JD" : "R"}
      </div>

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        {isTyping ? (
          <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1c1c28] border border-white/[0.07] rounded-2xl rounded-tl-[4px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#5a5a6e] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1.2s" }}
              />
            ))}
            <span className="text-[11px] text-[#5a5a6e] ml-1">
              Retrieving relevant sections…
            </span>
          </div>
        ) : (
          <div
            className={`max-w-[72%] px-3.5 py-2.5 text-[12.5px] leading-[1.55] ${
              isUser
                ? "bg-[#7c6af7] text-white rounded-2xl rounded-tr-[4px]"
                : "bg-[#1c1c28] text-white border border-white/[0.07] rounded-2xl rounded-tl-[4px]"
            }`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Source chips */}
        {!isUser && sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sources.map((src, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded border bg-[#7c6af7]/08 text-[#a78bfa] border-[#7c6af7]/18 cursor-pointer hover:bg-[#7c6af7]/16 transition-colors duration-100"
              >
                {src.label}
                {src.page ? ` · p.${src.page}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}