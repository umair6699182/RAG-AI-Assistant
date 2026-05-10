"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/client";

export type WorkspaceView = "chat" | "documents" | "history" | "settings";

interface HeaderProps {
  activeView: WorkspaceView;
  documentCount: number;
  onViewChange: (view: WorkspaceView) => void;
  user: User | null;
}

const NAV_ITEMS: Array<{
  label: string;
  value: WorkspaceView;
  icon: ReactNode;
}> = [
  {
    label: "Chat",
    value: "chat",
    icon: <path d="M3 3h10v7H6l-3 3V3z" />,
  },
  {
    label: "Documents",
    value: "documents",
    icon: (
      <path d="M5 2h5l3 3v9H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM10 2v4h4" />
    ),
  },
  {
    label: "History",
    value: "history",
    icon: <path d="M8 3a5 5 0 1 1-4.2 2.3M3 3v3h3M8 5v3l2 1" />,
  },
  {
    label: "Settings",
    value: "settings",
    icon: (
      <path d="M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
    ),
  },
];

export default function Header({
  activeView,
  documentCount,
  onViewChange,
  user,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const displayName = getDisplayName(user);
  const email = user?.email || "Signed in";
  const avatarUrl = getAvatarUrl(user);
  const initials = getInitials(displayName || email);
  const provider = getProvider(user);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between gap-2 border-b border-white/[0.07] bg-[#0a0a0f]/95 px-3 backdrop-blur-md md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#7c6af7] to-[#a78bfa]">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="white">
            <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM11.5 9a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
          </svg>
        </div>

        <div className="min-w-0">
          <span className="block text-[15px] font-bold tracking-tight text-white">
            Rag<span className="text-[#a78bfa]">AI</span>
          </span>
          <span className="block truncate text-[10px] text-[#5a5a6e]">
            {documentCount} document{documentCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <nav className="flex min-w-0 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => onViewChange(item.value)}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-all duration-150 ${
              activeView === item.value
                ? "bg-white/10 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                : "text-[#8b8b9a] hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {item.icon}
            </svg>
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      <div ref={menuRef} className="relative flex items-center gap-2.5">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-1.5 py-1.5 text-left transition hover:bg-white/[0.07] sm:w-[190px] sm:justify-start sm:px-2"
        >
          <Avatar
            avatarUrl={avatarUrl}
            initials={initials}
          />

          <span className="hidden min-w-0 flex-1 sm:block">
            <span className="block truncate text-[12px] font-semibold text-white">
              {displayName}
            </span>
            <span className="block truncate text-[10px] text-[#6f6f82]">
              {email}
            </span>
          </span>

          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="hidden text-[#7d7d90] sm:block"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[46px] z-50 w-[270px] rounded-xl border border-white/[0.08] bg-[#12121a] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center gap-2.5 border-b border-white/[0.07] pb-3">
              <Avatar
                avatarUrl={avatarUrl}
                initials={initials}
                large
              />

              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-[#6f6f82]">
                  {email}
                </p>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                <p className="text-[10px] uppercase text-[#5a5a6e]">
                  Provider
                </p>
                <p className="mt-1 truncate text-[12px] font-medium text-white">
                  {provider}
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                <p className="text-[10px] uppercase text-[#5a5a6e]">
                  Library
                </p>
                <p className="mt-1 text-[12px] font-medium text-white">
                  {documentCount} PDFs
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setMenuOpen(false);
                onViewChange("settings");
              }}
              className="mb-2 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[12px] font-medium text-[#d7d7e8] hover:bg-white/[0.06]"
            >
              Account settings
              <span className="text-[#6f6f82]">Open</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Avatar({
  avatarUrl,
  initials,
  large = false,
}: {
  avatarUrl?: string;
  initials: string;
  large?: boolean;
}) {
  const size = large ? "h-10 w-10 text-[13px]" : "h-8 w-8 text-[11px]";

  if (avatarUrl) {
    return (
      <span
        className={`${size} shrink-0 rounded-full border border-white/10 bg-cover bg-center`}
        style={{
          backgroundImage: `url(${avatarUrl})`,
        }}
      />
    );
  }

  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#5a4fcf] to-[#7c6af7] font-semibold text-white`}
    >
      {initials}
    </span>
  );
}

function getDisplayName(user: User | null) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getAvatarUrl(user: User | null) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
}

function getProvider(user: User | null) {
  const provider = user?.app_metadata?.provider;

  if (!provider) {
    return "Email";
  }

  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
