"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!email || !password) {
      return toast.error("Please enter both email and password.");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return toast.error(error.message);
      }

      // If email confirmation is enabled
      if (data.user && !data.session) {
        toast.success(
          "Account created successfully! Please check your email to verify your account.",
        );
      } else {
        // If email confirmation is disabled
        toast.success("Signup successful! You are now logged in.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return toast(error.message);
    router.push("/chat");
    router.refresh();
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/chat`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const features = [
    {
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      title: "PDF Intelligence",
      desc: "Parse any document instantly",
    },
    {
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: "Real-time Answers",
      desc: "With page-level citations",
    },
    {
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      title: "Multi-document",
      desc: "Manage your whole library",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#0d0d14] font-sans">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-[42%] flex-col justify-between bg-[#0d0d14] px-14 py-12">
        <div className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.3px] text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-linear-to-br from-[#7c6af7] to-[#9b8cff]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span>
            Rag<em className="not-italic text-[#7c6af7]">AI</em>
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <h2 className="mb-4 text-3xl font-bold leading-[1.2] tracking-[-0.8px] text-white">
            Chat with your
            <br />
            <em className="not-italic text-[#7c6af7]">documents</em>
            <br />
            instantly.
          </h2>

          <p className="mb-10 max-w-[300px] text-sm leading-6 text-[#6b6b8a]">
            Upload PDFs and ask questions. Get precise answers with source
            citations in seconds.
          </p>

          <div className="flex flex-col gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3.5 rounded-xl border border-white/5 bg-[#13131f] px-[18px] py-3.5 transition hover:border-[#7c6af7]/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7c6af7]/10 text-[#9b8cff]">
                  {f.icon}
                </div>

                <div>
                  <h4 className="mb-0.5 text-[13px] font-semibold text-[#e0e0f0]">
                    {f.title}
                  </h4>
                  <p className="text-xs text-[#5a5a78]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#3a3a55]">
          © 2025 RagAI · All rights reserved
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full items-center justify-center border-l border-white/5 bg-[#0a0a11] px-5 py-6 md:w-[58%] md:px-10 md:py-12">
        <div className="w-full max-w-[440px] rounded-[20px] border border-white/10 bg-[#111120] px-6 py-7 md:px-10 md:py-9">
          {/* Tabs */}
          <div className="mb-7 flex rounded-[10px] bg-white/4 p-1">
            <button
              className={`flex-1 rounded-[7px] px-3 py-[9px] text-sm font-medium transition ${
                tab === "signin"
                  ? "bg-linear-to-br from-[#7c6af7] to-[#6658e8] text-white shadow-[0_2px_12px_rgba(124,106,247,0.35)]"
                  : "bg-transparent text-[#6b6b8a] hover:text-[#9090b0]"
              }`}
              onClick={() => setTab("signin")}
            >
              Sign In
            </button>

            <button
              className={`flex-1 rounded-[7px] px-3 py-[9px] text-sm font-medium transition ${
                tab === "signup"
                  ? "bg-linear-to-br from-[#7c6af7] to-[#6658e8] text-white shadow-[0_2px_12px_rgba(124,106,247,0.35)]"
                  : "bg-transparent text-[#6b6b8a] hover:text-[#9090b0]"
              }`}
              onClick={() => setTab("signup")}
            >
              Sign Up
            </button>
          </div>

          <h1 className="mb-1.5 text-[22px] font-bold tracking-[-0.4px] text-white">
            {tab === "signin" ? "Welcome back" : "Create account"}
          </h1>

          <p className="mb-6 text-[13px] text-[#5a5a78]">
            {tab === "signin"
              ? "Sign in to your RagAI account to continue."
              : "Start chatting with your documents for free."}
          </p>

          <button
            onClick={handleGoogle}
            className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/10 bg-[#1a1a2e] p-[11px] text-sm font-medium text-[#d0d0e8] transition hover:border-white/15 hover:bg-[#1f1f38]"
          >
            <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3 text-xs text-[#3a3a55] before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            or continue with email
          </div>

          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#5a5a78]">
            Email Address
          </label>

          <div className="relative mb-[18px]">
            <input
              className="w-full rounded-[10px] border border-white/10 bg-[#0d0d1a] px-3.5 py-[11px] text-sm text-[#d0d0e8] outline-none transition placeholder:text-[#3a3a55] focus:border-[#7c6af7]/50"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#5a5a78]">
            Password
          </label>

          <div className="relative mb-[18px]">
            <input
              className="w-full rounded-[10px] border border-white/10 bg-[#0d0d1a] px-3.5 py-[11px] pr-[42px] text-sm text-[#d0d0e8] outline-none transition placeholder:text-[#3a3a55] focus:border-[#7c6af7]/50"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center p-1 text-[#4a4a68] transition hover:text-[#7c6af7]"
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {tab === "signin" && (
            <div className="-mt-2.5 mb-6 flex justify-end">
              <button className="text-xs text-[#7c6af7] transition hover:text-[#9b8cff]">
                Forgot password?
              </button>
            </div>
          )}

          <button
            onClick={tab === "signin" ? login : signUp}
            disabled={loading}
            className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-linear-to-br from-[#7c6af7] to-[#6658e8] p-3 text-[15px] font-semibold text-white shadow-[0_4px_20px_rgba(124,106,247,0.3)] transition hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(124,106,247,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading
              ? "Please wait…"
              : tab === "signin"
                ? "Sign In →"
                : "Create Account →"}
          </button>

          <p className="text-center text-[13px] text-[#4a4a68]">
            {tab === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setTab("signup")}
                  className="font-medium text-[#7c6af7] transition hover:text-[#9b8cff]"
                >
                  Create one free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setTab("signin")}
                  className="font-medium text-[#7c6af7] transition hover:text-[#9b8cff]"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
