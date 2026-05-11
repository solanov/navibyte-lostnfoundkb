"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmailVerified() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function handleLanding() {
      // When Supabase redirects here after email verification it may include
      // a ?code= (PKCE) or hash tokens (implicit). Exchange the code if
      // present so the session is consumed, then immediately sign out so the
      // user arrives at the login page from a clean, unauthenticated state.
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (code) {
        // Best-effort exchange — we don't block the UI on failure because
        // the email is already verified server-side regardless.
        await supabase.auth.exchangeCodeForSession(code).catch(() => null);
      }

      // Sign out to clear any auto-session Supabase created on redirect.
      await supabase.auth.signOut();

      // Trigger entrance animation after clean-up.
      setTimeout(() => setMounted(true), 50);
    }

    handleLanding();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EEEEEE] overflow-hidden">
      {/* Ambient background blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#64CCC5]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-[#053B50]/8 blur-3xl" />
      </div>

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.14)] overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#053B50] via-[#64CCC5] to-[#44afa9]" />

          <div className="p-10 flex flex-col items-center text-center">
            {/* Animated checkmark icon */}
            <div
              className={`relative mb-8 transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
            >
              {/* Outer pulse ring */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[#64CCC5]/20 animate-ping"
                style={{ animationDuration: "2.4s" }}
              />
              {/* Icon container */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#64CCC5]/20 to-[#44afa9]/10 border-2 border-[#64CCC5]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#44afa9] text-5xl [font-variation-settings:'FILL'_1,'wght'_500]">
                  verified
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1
              className={`text-[#053B50] font-headline font-black text-3xl tracking-tight mb-3 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Email Verified!
            </h1>

            {/* Subtext */}
            <p
              className={`text-gray-500 font-body text-base leading-relaxed max-w-xs mb-8 transition-all duration-700 delay-[400ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Your NEU institutional email has been successfully confirmed. You
              can now log in and access the Knowledge Board.
            </p>

            {/* Success badge */}
            <div
              className={`w-full p-4 rounded-xl border border-[#64CCC5]/30 bg-[#64CCC5]/5 flex items-center gap-3 mb-8 transition-all duration-700 delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="material-symbols-outlined text-[#44afa9] text-lg shrink-0 [font-variation-settings:'FILL'_1]">
                check_circle
              </span>
              <p className="text-[#053B50] font-body text-sm font-medium text-left leading-snug">
                Verification successful — your account is now active.
              </p>
            </div>

            {/* CTA button */}
            <div
              className={`w-full transition-all duration-700 delay-[600ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link
                id="verified-login-btn"
                href="/login"
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm">
                  login
                </span>
                Log in to Your Account
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {/* Footer links */}
          <div className="px-10 pb-8 flex justify-center gap-4 text-[11px] font-label font-medium text-gray-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-[#053B50] transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="#" className="hover:text-[#053B50] transition-colors">
              Terms
            </Link>
          </div>
        </div>

        {/* Footer tagline */}
        <p className="mt-6 text-center text-gray-400 text-[11px] font-label uppercase tracking-widest">
          New Era University &mdash; Est. 1975
        </p>
      </div>
    </main>
  );
}
