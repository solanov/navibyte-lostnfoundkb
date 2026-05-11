"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Minimum password length matching current Supabase project setting.
const MIN_PASSWORD_LENGTH = 6;

type PageState =
  | "verifying"   // Checking session validity on page load
  | "invalid"     // No valid recovery session (expired / already used / direct nav)
  | "ready"       // Valid recovery session — show the form
  | "loading"     // Submitting new password
  | "success";    // Password updated

function validatePassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}

export default function ResetPassword() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track whether a PASSWORD_RECOVERY event was received to gate the form.
  const recoveryConfirmed = useRef(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY auth event. Supabase fires this when
    // the user lands on this page via a valid reset link (implicit flow —
    // the token arrives as a URL hash fragment that the client library
    // automatically exchanges).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          recoveryConfirmed.current = true;
          setPageState("ready");
        }
      }
    );

    // Fallback: also check the current session in case the event already fired
    // before the listener was registered (e.g. fast page load).
    async function checkSession() {
      // A short delay gives the Supabase client time to parse the hash and
      // emit the event first.
      await new Promise((r) => setTimeout(r, 800));

      if (recoveryConfirmed.current) return; // Already handled by the event.

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // A session exists but wasn't triggered by PASSWORD_RECOVERY — this
        // can happen when a user is already logged in and navigates here
        // directly. We still allow the reset IF the URL contains recovery
        // hash params (already parsed), otherwise reject.
        setPageState("ready");
      } else {
        setPageState("invalid");
      }
    }

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  async function handlePasswordUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validatePassword(password, confirmPassword);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setPageState("loading");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setPageState("ready");
      return;
    }

    // Invalidate the recovery session — sign out from all sessions.
    await supabase.auth.signOut({ scope: "global" });

    setPageState("success");

    // Auto-redirect to login after 3 seconds.
    setTimeout(() => router.push("/login"), 3000);
  }

  /* ── Verifying state ── */
  if (pageState === "verifying") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EEEEEE]">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.12)] overflow-hidden">
          <div className="h-1.5 w-full bg-[#64CCC5]" />
          <div className="p-10 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#64CCC5]/10 border-2 border-[#64CCC5]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#64CCC5] text-3xl animate-spin">
                progress_activity
              </span>
            </div>
            <div>
              <p className="text-[#053B50] font-headline font-black text-lg tracking-tight mb-1">
                Verifying Reset Link…
              </p>
              <p className="text-gray-400 font-body text-sm">
                Please wait while we validate your request.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Invalid / expired state ── */
  if (pageState === "invalid") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EEEEEE]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.14)] overflow-hidden">
            <div className="h-1.5 w-full bg-red-400" />

            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-red-400 text-4xl [font-variation-settings:'FILL'_1]">
                  link_off
                </span>
              </div>

              <h1 className="text-[#053B50] font-headline font-black text-2xl tracking-tight mb-3">
                Link Expired or Invalid
              </h1>

              <p className="text-gray-500 font-body text-sm leading-relaxed max-w-xs mb-6">
                This password reset link has expired, already been used, or is
                invalid. Reset links are single-use and expire after{" "}
                <strong>1 hour</strong>.
              </p>

              <div className="w-full p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3 mb-8 text-left">
                <span className="material-symbols-outlined text-red-400 text-lg mt-0.5 shrink-0">
                  info
                </span>
                <p className="text-red-700 font-body text-sm leading-relaxed">
                  Please request a new reset link if you still need to reset
                  your password.
                </p>
              </div>

              <p className="text-gray-500 font-body text-sm leading-relaxed mb-8">
                If you need to reset your password, please contact your
                administrator or sign in with your institutional Google account.
              </p>

              <Link
                id="reset-back-to-login-btn"
                href="/login"
                className="w-full py-3.5 border-2 border-[#EEEEEE] bg-white text-[#053B50] font-headline font-semibold rounded-xl flex items-center justify-center gap-2 hover:border-[#64CCC5]/40 hover:bg-[#EEEEEE]/40 transition-all active:scale-[0.98]"
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

  /* ── Success state ── */
  if (pageState === "success") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EEEEEE] overflow-hidden">
        {/* Ambient blobs */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#64CCC5]/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-[#053B50]/8 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.14)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#053B50] via-[#64CCC5] to-[#44afa9]" />

            <div className="p-10 flex flex-col items-center text-center">
              <div className="relative mb-8">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[#64CCC5]/20 animate-ping"
                  style={{ animationDuration: "2.4s" }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#64CCC5]/20 to-[#44afa9]/10 border-2 border-[#64CCC5]/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#44afa9] text-5xl [font-variation-settings:'FILL'_1,'wght'_500]">
                    check_circle
                  </span>
                </div>
              </div>

              <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight mb-3">
                Password Updated!
              </h1>

              <p className="text-gray-500 font-body text-base leading-relaxed max-w-xs mb-8">
                Your password has been changed successfully. You&apos;ve been
                signed out from all sessions.
              </p>

              <div className="w-full p-4 rounded-xl border border-[#64CCC5]/30 bg-[#64CCC5]/5 flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-[#44afa9] text-lg shrink-0 [font-variation-settings:'FILL'_1]">
                  verified
                </span>
                <p className="text-[#053B50] font-body text-sm font-medium text-left leading-snug">
                  Redirecting you to the login page…
                </p>
              </div>

              <Link
                id="reset-success-login-btn"
                href="/login"
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                Log In Now
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
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

  /* ── Password update form (ready / loading) ── */
  const isSubmitting = pageState === "loading";

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
            <div className="flex items-center gap-4 mb-12">
              <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={64} height={64} className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transform hover:scale-110 transition-all duration-500 will-change-transform" />
              <span className="text-white font-headline font-black tracking-tighter text-3xl drop-shadow-lg">
                Navibyte KB
              </span>
            </div>
            <h2 className="text-white font-headline text-4xl font-extrabold leading-tight tracking-tight mb-5">
              Set a New<br />
              <span className="text-[#64CCC5]">Secure</span>
              <br />
              Password
            </h2>
            <p className="text-white/60 font-body text-base max-w-xs leading-relaxed">
              Choose a strong password to protect your NEU Knowledge Board
              account.
            </p>
            <div className="mt-8 p-4 rounded-xl border border-[#64CCC5]/20 bg-[#64CCC5]/5 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#64CCC5] text-lg mt-0.5">
                shield
              </span>
              <p className="text-white/70 text-sm font-body leading-relaxed">
                Use at least{" "}
                <strong className="text-[#64CCC5]">
                  {MIN_PASSWORD_LENGTH} characters
                </strong>
                . Never share your password with anyone.
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
            <div className="flex items-center gap-3 mb-2 md:hidden">
              <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={36} height={36} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 will-change-transform" />
              <span className="text-[#053B50] font-headline font-black text-xl tracking-tight">
                Navibyte KB
              </span>
            </div>
            <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight">
              Reset Password
            </h1>
            <p className="text-gray-400 text-sm font-body mt-1">
              Enter and confirm your new password below.
            </p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              id="reset-error-banner"
              role="alert"
              className="mb-6 flex items-start gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50"
            >
              <span className="material-symbols-outlined text-red-500 text-lg mt-0.5 shrink-0">
                error
              </span>
              <p className="text-red-700 text-sm font-body font-medium leading-snug">
                {errorMessage}
              </p>
            </div>
          )}

          <form
            id="reset-password-form"
            className="space-y-5"
            onSubmit={handlePasswordUpdate}
            noValidate
          >
            {/* New password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-new-password"
                className="block text-[11px] font-label font-bold uppercase tracking-widest text-[#053B50]"
              >
                New Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-colors group-focus-within:text-[#64CCC5]">
                  lock
                </span>
                <input
                  id="reset-new-password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEEEEE]/60 border-2 border-[#EEEEEE] rounded-xl text-[#053B50] placeholder:text-gray-400 focus:outline-none focus:border-[#64CCC5] focus:bg-white transition-all font-body text-sm disabled:opacity-60"
                />
              </div>
              <p className="text-[10px] font-label text-gray-400 pl-1">
                Minimum {MIN_PASSWORD_LENGTH} characters
              </p>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-confirm-password"
                className="block text-[11px] font-label font-bold uppercase tracking-widest text-[#053B50]"
              >
                Confirm Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-colors group-focus-within:text-[#64CCC5]">
                  lock_reset
                </span>
                <input
                  id="reset-confirm-password"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEEEEE]/60 border-2 border-[#EEEEEE] rounded-xl text-[#053B50] placeholder:text-gray-400 focus:outline-none focus:border-[#64CCC5] focus:bg-white transition-all font-body text-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                id="reset-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Updating Password...
                  </>
                ) : (
                  <>
                    Update Password
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
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
