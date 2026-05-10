const FOOTER_LINKS = ["Privacy", "Docs", "Support"];

interface FooterProps {
  documentCount: number;
  totalChunks: number;
}

export default function Footer({
  documentCount,
  totalChunks,
}: FooterProps) {
  return (
    <footer className="h-9 border-t border-white/[0.07] flex items-center justify-between px-5 bg-[#080812]/95 shrink-0">
      <div className="flex items-center gap-3">
        {/* Status */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#5a5a6e]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#22c55e]" />
          System online
        </div>

        <div className="w-px h-3 bg-white/[0.07]" />

        {/* Docs */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#5a5a6e]">
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
          </svg>
          {documentCount} documents · {totalChunks} chunks
        </div>

        <div className="w-px h-3 bg-white/[0.07]" />

        {/* Model */}
        <span className="text-[10px] text-[#5a5a6e]">Model: gpt-4o-mini</span>
      </div>

      {/* Links */}
      <div className="flex gap-3">
        {FOOTER_LINKS.map((link) => (
          <button
            key={link}
            className="text-[10px] text-[#5a5a6e] hover:text-[#8b8b9a] transition-colors duration-150"
          >
            {link}
          </button>
        ))}
      </div>
    </footer>
  );
}
