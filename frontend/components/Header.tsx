"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

const NAV_ITEMS = ["Chat", "Documents", "History", "Settings"];

export default function Header() {
  const [active, setActive] = useState("Chat");
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between px-5 h-[52px] border-b border-white/[0.07] bg-[#0a0a0f]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#7c6af7] to-[#a78bfa] flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
            <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM11.5 9a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
          </svg>
        </div>

        <span className="font-bold text-[15px] tracking-tight text-white">
          Rag<span className="text-[#a78bfa]">AI</span>
        </span>
      </div>

      <nav className="flex gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-150 ${
              active === item
                ? "bg-white/8 text-white border-white/12"
                : "text-[#8b8b9a] border-transparent hover:text-white hover:border-white/12"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#7c6af7]/15 text-[#a78bfa] border border-[#7c6af7]/25">
          Pro
        </span>

        <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#5a4fcf] to-[#7c6af7] flex items-center justify-center text-[11px] font-semibold text-white cursor-pointer select-none">
          JD
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 cursor-pointer rounded-full text-[12px] font-medium text-red-300 border border-red-400/20 bg-red-500/10 hover:bg-red-500/20 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
