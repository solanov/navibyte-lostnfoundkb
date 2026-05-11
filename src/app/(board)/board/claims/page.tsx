"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import SideNav from "@/src/components/layout/SideNav";
import BottomNavBar from "@/src/components/layout/BottomNavBar";
import { supabase } from "@/src/lib/supabase";
import { fetchOwnedClaimsOverviewAction } from "@/src/app/admin/actions/claims";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Released: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PublicClaimsOverviewPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setAccessToken(sessionData.session?.access_token ?? null);
      setAuthLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const {
    data: entries = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    accessToken ? ["owned-claims-overview", accessToken] : null,
    () => fetchOwnedClaimsOverviewAction(accessToken as string),
    {
      fallbackData: [],
    }
  );

  const loading = authLoading || (Boolean(accessToken) && isLoading);
  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;
  const isAuthenticated = Boolean(accessToken);

  return (
    <div className="bg-[#fbf9f8] text-[#41484c] min-h-screen font-body selection:bg-[#8df4ec] selection:text-[#002433] pb-24 md:pb-0">
      <div className="flex min-h-screen">
        <SideNav />

        <main className="flex-1 bg-[#fbf9f8] p-4 pt-20 md:pt-16 md:pl-16 md:pr-12 min-w-0 transition-all duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#44afa9]">
                  Claims Monitor
                </p>
                <h1 className="mt-2 text-[32px] md:text-[40px] font-black tracking-[-0.02em] leading-tight text-[#002433] font-headline">
                  Claims On Your Posts
                </h1>
                <p className="mt-2 text-sm font-medium text-[#41484c]">
                  Review claim activity across items you reported and jump into each post&apos;s claim history.
                </p>
              </div>
              <Link
                href="/board"
                className="hidden md:inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#002433] shadow-[0_10px_30px_rgba(0,36,51,0.04)] transition hover:bg-[#f5f3f3]"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Board
              </Link>
            </div>

            <div className="rounded-2xl border border-[#002433]/5 bg-white shadow-[0_20px_40px_rgba(0,36,51,0.03)]">
              <div className="border-b border-[#002433]/5 px-5 py-4 md:px-6">
                <p className="text-xs font-black uppercase tracking-widest text-[#41484c]">
                  Your claim queue
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center px-6 py-16">
                  <div className="text-center text-[#41484c]">
                    <span className="material-symbols-outlined text-4xl animate-pulse">hourglass_top</span>
                    <p className="mt-3 text-sm font-bold uppercase tracking-widest">
                      Loading claims
                    </p>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-[#41484c]/30">lock</span>
                  <p className="mt-4 text-lg font-black text-[#002433]">Sign in required</p>
                  <p className="mt-2 text-sm text-[#41484c]">
                    Sign in to review claim requests on the items you posted.
                  </p>
                  <Link
                    href="/login"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#44afa9] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    Sign in
                  </Link>
                </div>
              ) : errorMessage ? (
                <div className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-[#ba1a1a]">error</span>
                  <p className="mt-4 text-lg font-black text-[#002433]">Unable to load claims</p>
                  <p className="mt-2 text-sm text-[#41484c]">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => void mutate()}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#002433] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#053b50]"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Try again
                  </button>
                </div>
              ) : entries.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-[#41484c]/30">assignment</span>
                  <p className="mt-4 text-lg font-black text-[#002433]">No claims yet</p>
                  <p className="mt-2 text-sm text-[#41484c]">
                    Claim requests will appear here once someone submits a claim on one of your posts.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#002433]/5">
                  {entries.map((entry) => (
                    <div
                      key={entry.postId}
                      className="flex flex-col gap-4 px-5 py-5 md:px-6 md:py-6 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#002433]/5 text-[#002433]">
                          <span className="material-symbols-outlined">{entry.iconIdentifier}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black text-[#002433]">
                            {entry.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#41484c]">
                            <span>{entry.zone}</span>
                            <span className="text-[#41484c]/40">•</span>
                            <span>{entry.categoryName}</span>
                            <span className="text-[#41484c]/40">•</span>
                            <span>Latest activity {formatDate(entry.latestClaimAt)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#002433]/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#002433]">
                              {entry.totalClaims} total
                            </span>
                            {entry.pendingClaims > 0 && (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                {entry.pendingClaims} pending
                              </span>
                            )}
                            {entry.approvedClaims > 0 && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                                {entry.approvedClaims} approved
                              </span>
                            )}
                            {entry.rejectedClaims > 0 && (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-700">
                                {entry.rejectedClaims} rejected
                              </span>
                            )}
                            {entry.releasedClaims > 0 && (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                {entry.releasedClaims} released
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <div className="flex flex-col items-start lg:items-end">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                              entry.totalClaims === 0 
                                ? "bg-gray-50 text-gray-600 border-gray-200" 
                                : STATUS_STYLES[entry.latestClaimStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {entry.totalClaims === 0 ? "No Claims" : `Latest: ${entry.latestClaimStatus}`}
                          </span>
                          {entry.totalClaims > 0 && (
                            <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#41484c]/60">
                              {entry.latestFlowType === "P2P" ? "Student-to-student" : "Office pickup"}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/board/claims/${entry.postId}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#44afa9] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
                        >
                          View claims
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <BottomNavBar />
    </div>
  );
}
