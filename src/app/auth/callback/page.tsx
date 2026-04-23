"use client";

import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign-in\u2026");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          router.replace("/login?error=oauth_failed");
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?error=oauth_failed");
        return;
      }

      if (!user.email?.endsWith("@neu.edu.ph")) {
        await supabase.auth.signOut();
        router.replace("/login?error=domain");
        return;
      }

      setStatus("Checking account status\u2026");

      const { data: profile } = await supabase
        .from("users")
        .select("is_blocked")
        .eq("user_id", user.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        router.replace("/login?error=blocked");
        return;
      }

      router.replace("/board");
    }

    handleCallback();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EEEEEE]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.12)] overflow-hidden">
        <div className="h-1.5 w-full bg-[#64CCC5]" />
        <div className="p-10 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#64CCC5]/10 border-2 border-[#64CCC5]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#64CCC5] text-3xl animate-spin">progress_activity</span>
          </div>
          <div>
            <p className="text-[#053B50] font-headline font-black text-lg tracking-tight mb-1">{status}</p>
            <p className="text-gray-400 font-body text-sm">Please wait while we verify your account.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
