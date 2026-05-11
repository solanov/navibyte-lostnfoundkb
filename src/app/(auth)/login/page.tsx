"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "domain") setError("Only @neu.edu.ph email addresses are allowed.");
    if (err === "blocked") setError("Your account has been suspended. Please contact the administrator.");
    if (err === "oauth_failed") setError("Google sign-in failed. Please try again.");
  }, []);

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "neu.edu.ph" },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 pt-8 bg-[#EEEEEE]">
      <div className="w-full max-w-5xl flex flex-col md:flex-row shadow-[0_20px_60px_rgba(5,59,80,0.14)] rounded-2xl overflow-hidden z-10 relative">

        <div className="hidden md:flex md:w-1/2 relative bg-[#053B50] p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#64CCC5]/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#64CCC5]/8 translate-y-1/3 -translate-x-1/3" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={64} height={64} className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transform hover:scale-110 transition-all duration-500 will-change-transform" />
              <span className="text-white font-headline font-black tracking-tighter text-3xl drop-shadow-lg">NEUvigate</span>
            </div>
            <h2 className="text-white font-headline text-4xl font-extrabold leading-tight tracking-tight mb-5">
              Secure <br /><span className="text-[#64CCC5]">Knowledge</span><br />Vault
            </h2>
            <p className="text-white/60 font-body text-base max-w-xs leading-relaxed">
              Access the NEU community&apos;s centralized lost and found board. Institutional credentials required.
            </p>
            <div className="mt-8 p-2 mb-6 rounded-xl border border-[#64CCC5]/20 bg-[#64CCC5]/5 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#64CCC5] text-lg mt-0.5">shield</span>
              <p className="text-white/70 text-sm font-body leading-relaxed">
                Access restricted to verified <strong className="text-[#64CCC5]">@neu.edu.ph</strong> accounts only.
              </p>
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex gap-4 items-center">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/40 text-xs font-label uppercase tracking-widest">Est. 1975</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2 md:hidden">
              <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={36} height={36} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 will-change-transform" />
              <span className="text-[#053B50] font-headline font-black text-xl tracking-tight">NEUvigate</span>
            </div>
            <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight">Login to Knowledge Board</h1>
            <p className="text-gray-400 text-sm font-body mt-1">Use your institutional NEU Google account.</p>
          </div>

          {error && (
            <div id="login-error-banner" role="alert" className="mb-6 flex items-start gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50">
              <span className="material-symbols-outlined text-red-500 text-lg mt-0.5 shrink-0">error</span>
              <p className="text-red-700 text-sm font-body font-medium leading-snug">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              id="login-google-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 px-4 border-2 border-[#EEEEEE] bg-white text-[#053B50] font-headline font-semibold rounded-xl flex items-center justify-center gap-3 hover:border-[#64CCC5]/40 hover:bg-[#EEEEEE]/40 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Redirecting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            
          </div>

          <footer className="mt-10 flex justify-center items-center gap-4 text-[11px] font-label font-medium text-gray-400 uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[#053B50] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#053B50] transition-colors">Terms</Link>
          </footer>
        </div>
      </div>
    </main>
  );
}