"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.endsWith("@neu.edu.ph")) {
      setError("Only @neu.edu.ph email addresses are allowed.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("users")
          .select("is_blocked")
          .eq("user_id", userId)
          .single();

        if (profile?.is_blocked) {
          await supabase.auth.signOut();
          setError("Your account has been suspended. Please contact the administrator.");
          return;
        }
      }

      router.push("/board");
    } finally {
      setLoading(false);
    }
  }

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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 pt-20 bg-[#EEEEEE]">
      <div className="w-full max-w-5xl flex flex-col md:flex-row shadow-[0_20px_60px_rgba(5,59,80,0.14)] rounded-2xl overflow-hidden z-10 relative">

        <div className="hidden md:flex md:w-1/2 relative bg-[#053B50] p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#64CCC5]/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#64CCC5]/8 translate-y-1/3 -translate-x-1/3" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#64CCC5]/20 border border-[#64CCC5]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#64CCC5] text-xl">account_balance</span>
              </div>
              <span className="text-white font-headline font-black tracking-tighter text-xl">NEU Lost &amp; Found KB</span>
            </div>
            <h2 className="text-white font-headline text-4xl font-extrabold leading-tight tracking-tight mb-5">
              Secure <br /><span className="text-[#64CCC5]">Knowledge</span><br />Vault
            </h2>
            <p className="text-white/60 font-body text-base max-w-xs leading-relaxed">
              Access the NEU community&apos;s centralized lost and found board. Institutional credentials required.
            </p>
            <div className="mt-8 p-4 rounded-xl border border-[#64CCC5]/20 bg-[#64CCC5]/5 flex items-start gap-3">
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
            <div className="flex items-center gap-2 mb-1 md:hidden">
              <span className="material-symbols-outlined text-[#64CCC5] text-lg">account_balance</span>
              <span className="text-[#053B50] font-headline font-black text-sm tracking-tight">NEU Lost &amp; Found KB</span>
            </div>
            <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight">Login to Knowledge Board</h1>
            <p className="text-gray-400 text-sm font-body mt-1">Use your institutional NEU credentials.</p>
          </div>

          {error && (
            <div id="login-error-banner" role="alert" className="mb-6 flex items-start gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50">
              <span className="material-symbols-outlined text-red-500 text-lg mt-0.5 shrink-0">error</span>
              <p className="text-red-700 text-sm font-body font-medium leading-snug">{error}</p>
            </div>
          )}

          <form id="login-form" className="space-y-5" onSubmit={handleEmailLogin} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-[11px] font-label font-bold uppercase tracking-widest text-[#053B50]">
                Institutional Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-colors group-focus-within:text-[#64CCC5]">alternate_email</span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@neu.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEEEEE]/60 border-2 border-[#EEEEEE] rounded-xl text-[#053B50] placeholder:text-gray-400 focus:outline-none focus:border-[#64CCC5] focus:bg-white transition-all font-body text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="block text-[11px] font-label font-bold uppercase tracking-widest text-[#053B50]">
                  Password
                </label>
                <Link href="#" className="text-[10px] font-label font-bold text-[#64CCC5] hover:underline uppercase tracking-wider">Forgot?</Link>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-colors group-focus-within:text-[#64CCC5]">lock</span>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEEEEE]/60 border-2 border-[#EEEEEE] rounded-xl text-[#053B50] placeholder:text-gray-400 focus:outline-none focus:border-[#64CCC5] focus:bg-white transition-all font-body text-sm"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-col gap-3">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Verifying...
                  </>
                ) : (
                  <>Login <span className="material-symbols-outlined text-sm">arrow_forward</span></>
                )}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-gray-400 text-[11px] font-label uppercase tracking-widest">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button
                id="login-google-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 border-2 border-[#EEEEEE] bg-white text-[#053B50] font-headline font-semibold rounded-xl flex items-center justify-center gap-3 hover:border-[#64CCC5]/40 hover:bg-[#EEEEEE]/40 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="mt-1 text-center text-gray-400 text-[11px] font-label uppercase tracking-widest">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-[#053B50] font-bold hover:text-[#64CCC5] transition-colors">Register</Link>
              </p>
            </div>
          </form>

          <footer className="mt-10 flex justify-center items-center gap-4 text-[11px] font-label font-medium text-gray-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-[#053B50] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="#" className="hover:text-[#053B50] transition-colors">Terms</Link>
          </footer>
        </div>
      </div>
    </main>
  );
}