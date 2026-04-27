"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import { useState } from "react";

type PageState = "idle" | "loading" | "sent";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [pageState, setPageState] = useState<PageState>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);

    // Client-side domain check for immediate UX feedback.
    // The API call is still made for any syntactically valid email so the
    // server's response stays generic regardless of whether the account exists.
    if (!email.endsWith("@neu.edu.ph")) {
      setFieldError("Only @neu.edu.ph email addresses are allowed.");
      return;
    }

    setPageState("loading");

    // Fire-and-forget: we intentionally ignore success/error to prevent
    // user enumeration. The same success UI is shown either way.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setPageState("sent");
  }

  /* ── Sent state ── */
  if (pageState === "sent") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 pt-20 bg-[#EEEEEE]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.14)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#053B50] via-[#64CCC5] to-[#44afa9]" />

            <div className="p-10 flex flex-col items-center text-center">
              {/* Icon */}
              <div className="relative mb-8">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[#64CCC5]/20 animate-ping"
                  style={{ animationDuration: "2.4s" }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#64CCC5]/20 to-[#44afa9]/10 border-2 border-[#64CCC5]/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#44afa9] text-5xl [font-variation-settings:'FILL'_1,'wght'_500]">
                    mark_email_read
                  </span>
                </div>
              </div>

              <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight mb-3">
                Check Your Inbox
              </h1>

              <p className="text-gray-500 font-body text-base leading-relaxed max-w-xs mb-8">
                If that email is registered, you&apos;ll receive a password
                reset link shortly. Check your{" "}
                <strong className="text-[#053B50]">@neu.edu.ph</strong> inbox.
              </p>

              {/* Info callout */}
              <div className="w-full p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3 mb-8 text-left">
                <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5 shrink-0">
                  schedule
                </span>
                <p className="text-amber-800 font-body text-sm leading-relaxed">
                  The reset link expires in{" "}
                  <strong>1 hour</strong> and can only be used once. If you
                  don&apos;t see the email, check your spam folder.
                </p>
              </div>

              <Link
                id="forgot-back-to-login-btn"
                href="/login"
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Back to Login
              </Link>
            </div>

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

          <p className="mt-6 text-center text-gray-400 text-[11px] font-label uppercase tracking-widest">
            New Era University &mdash; Est. 1975
          </p>
        </div>
      </main>
    );
  }

  /* ── Request form ── */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 pt-20 bg-[#EEEEEE]">
      <div className="w-full max-w-5xl flex flex-col md:flex-row shadow-[0_20px_60px_rgba(5,59,80,0.14)] rounded-2xl overflow-hidden z-10 relative">

        {/* Left panel */}
        <div className="hidden md:flex md:w-1/2 relative bg-[#053B50] p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#64CCC5]/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#64CCC5]/8 translate-y-1/3 -translate-x-1/3" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#64CCC5]/20 border border-[#64CCC5]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#64CCC5] text-xl">
                  account_balance
                </span>
              </div>
              <span className="text-white font-headline font-black tracking-tighter text-xl">
                NEU Lost &amp; Found KB
              </span>
            </div>
            <h2 className="text-white font-headline text-4xl font-extrabold leading-tight tracking-tight mb-5">
              Recover<br />
              <span className="text-[#64CCC5]">Your</span>
              <br />
              Access
            </h2>
            <p className="text-white/60 font-body text-base max-w-xs leading-relaxed">
              Enter your institutional email and we&apos;ll send a secure
              password reset link — valid for one hour.
            </p>
            <div className="mt-8 p-4 rounded-xl border border-[#64CCC5]/20 bg-[#64CCC5]/5 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#64CCC5] text-lg mt-0.5">
                lock_reset
              </span>
              <p className="text-white/70 text-sm font-body leading-relaxed">
                Reset links are{" "}
                <strong className="text-[#64CCC5]">
                  time-limited &amp; single-use
                </strong>{" "}
                for your security.
              </p>
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex gap-4 items-center">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/40 text-xs font-label uppercase tracking-widest">
                Est. 1975
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center bg-white">
          <div className="mb-8">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-1 md:hidden">
              <span className="material-symbols-outlined text-[#64CCC5] text-lg">
                account_balance
              </span>
              <span className="text-[#053B50] font-headline font-black text-sm tracking-tight">
                NEU Lost &amp; Found KB
              </span>
            </div>
            <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight">
              Forgot Password
            </h1>
            <p className="text-gray-400 text-sm font-body mt-1">
              Enter your <strong>@neu.edu.ph</strong> email to receive a reset
              link.
            </p>
          </div>

          {/* Field error */}
          {fieldError && (
            <div
              id="forgot-error-banner"
              role="alert"
              className="mb-6 flex items-start gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50"
            >
              <span className="material-symbols-outlined text-red-500 text-lg mt-0.5 shrink-0">
                error
              </span>
              <p className="text-red-700 text-sm font-body font-medium leading-snug">
                {fieldError}
              </p>
            </div>
          )}

          <form
            id="forgot-password-form"
            className="space-y-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-[11px] font-label font-bold uppercase tracking-widest text-[#053B50]"
              >
                Institutional Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-colors group-focus-within:text-[#64CCC5]">
                  alternate_email
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@neu.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={pageState === "loading"}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEEEEE]/60 border-2 border-[#EEEEEE] rounded-xl text-[#053B50] placeholder:text-gray-400 focus:outline-none focus:border-[#64CCC5] focus:bg-white transition-all font-body text-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-col gap-3">
              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={pageState === "loading"}
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pageState === "loading" ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Sending Link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <span className="material-symbols-outlined text-sm">
                      send
                    </span>
                  </>
                )}
              </button>

              <p className="mt-1 text-center text-gray-400 text-[11px] font-label uppercase tracking-widest">
                Remembered it?{" "}
                <Link
                  href="/login"
                  className="text-[#053B50] font-bold hover:text-[#64CCC5] transition-colors"
                >
                  Back to Login
                </Link>
              </p>
            </div>
          </form>

          <footer className="mt-10 flex justify-center items-center gap-4 text-[11px] font-label font-medium text-gray-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-[#053B50] transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="#" className="hover:text-[#053B50] transition-colors">
              Terms
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
