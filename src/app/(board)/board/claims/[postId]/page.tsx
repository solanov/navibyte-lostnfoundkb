"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { supabase } from "@/src/lib/supabase";
import {
  finalizeP2PReturnAction,
  markClaimReturnedByOwnerAction,
} from "@/src/app/admin/actions/posts";
import { fetchOwnedPostClaimsAction } from "@/src/app/admin/actions/claims";
import { useNotification } from "@/src/hooks/useNotification";

interface ClaimRequest {
  claim_id: string;
  post_id: string;
  claimant_id: string | null;
  claimant_name: string;
  claimant_school_id: string;
  item_description_verification: string | null;
  flow_type: "P2P" | "Office";
  status: "Pending" | "Approved" | "Rejected" | "Released";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PostSummary {
  post_id: string;
  general_description: string;
  status: string;
  zone: string;
  current_possession: string | null;
  reported_by: string;
  categories?: { name: string; icon_identifier: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Released: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const FLOW_LABELS: Record<string, string> = {
  P2P: "Student-to-Student",
  Office: "Office Pickup",
};

const RETURN_REJECTION_NOTE = "Item marked as returned to another claimant.";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserClaimsPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const postId = params.postId as string;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setAccessToken(session?.access_token ?? null);
      setCurrentUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setCurrentUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.push("/login");
    }
  }, [accessToken, authLoading, router]);

  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? ["owned-post-claims", accessToken, postId] : null,
    () => fetchOwnedPostClaimsAction(accessToken as string, postId),
    {
      keepPreviousData: true,
    }
  );

  const post = (data?.post as PostSummary | undefined) ?? null;
  const claims = (data?.claims as ClaimRequest[] | undefined) ?? [];
  const loading = authLoading || (Boolean(accessToken) && isLoading);
  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  const buildReturnedOptimisticData = (claimId: string, nextTimestamp: string) =>
    data
      ? {
          ...data,
          post: data.post ? { ...data.post, status: "Returned" } : data.post,
          claims: data.claims.map((claim) => {
            if (claim.claim_id === claimId) {
              return {
                ...claim,
                status: "Released" as ClaimRequest["status"],
                updated_at: nextTimestamp,
              };
            }

            if (["Pending", "Approved"].includes(claim.status)) {
              return {
                ...claim,
                status: "Rejected" as ClaimRequest["status"],
                admin_notes: RETURN_REJECTION_NOTE,
                updated_at: nextTimestamp,
              };
            }

            return claim;
          }),
        }
      : data;

  const handleConfirmP2PHandoff = async (claimId: string) => {
    const confirmed = window.confirm(
      "Confirm that you have physically handed this item to the claimant? This cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading(claimId);
    try {
      if (!accessToken) throw new Error("Authentication token missing.");

      const nextTimestamp = new Date().toISOString();
      const optimisticData = data
        ? {
            ...data,
            post: data.post ? { ...data.post, status: "Released" } : data.post,
            claims: data.claims.map((claim) =>
              claim.claim_id === claimId
                ? {
                    ...claim,
                    status: "Released" as ClaimRequest["status"],
                    updated_at: nextTimestamp,
                  }
                : claim
            ),
          }
        : data;

      await mutate(
        async () => {
          await finalizeP2PReturnAction(accessToken, postId, claimId);
          return optimisticData;
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      notify("Item successfully marked as handed off.", "success");
    } catch (err) {
      notify(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReturned = async (
    claimId: string,
    claimantName: string
  ) => {
    const confirmed = window.confirm(
      `Mark this item as returned to ${claimantName}? This will remove it from the public board and close the other active claims.`
    );
    if (!confirmed) return;

    setActionLoading(claimId + "-returned");
    try {
      if (!accessToken) throw new Error("Authentication token missing.");

      const nextTimestamp = new Date().toISOString();
      const optimisticData = buildReturnedOptimisticData(
        claimId,
        nextTimestamp
      );

      await mutate(
        async () => {
          await markClaimReturnedByOwnerAction(accessToken, postId, claimId);
          return optimisticData;
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      notify(
        "Item marked as returned and removed from the public board.",
        "success"
      );
    } catch (err) {
      notify(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const [title] = (post?.general_description ?? "").split("\n\n");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f3f3]">
        <div className="flex flex-col items-center gap-3 text-[#41484c]">
          <span className="material-symbols-outlined text-4xl animate-pulse">
            hourglass_top
          </span>
          <p className="text-sm font-bold uppercase tracking-widest">
            Loading claims...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f3f3] p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a] mb-4 block">
            error
          </span>
          <h2 className="text-xl font-black text-[#002433] mb-2">
            Access Denied
          </h2>
          <p className="text-[#41484c] mb-6">{errorMessage}</p>
          <Link
            href="/board/claims"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#44afa9] text-white font-bold rounded-xl hover:bg-[#3b9691] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3f3]">
      <div className="bg-white border-b border-[#002433]/5 px-6 py-5 flex items-center gap-4">
        <Link
          href="/board/claims"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f5f3f3] text-[#41484c] transition-colors"
          aria-label="Back to claims overview"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#44afa9] mb-0.5">
            Claims Management
          </p>
          <h1 className="text-lg font-black text-[#002433] truncate">
            {title || "Your Item"}
          </h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            post?.status === "Released" || post?.status === "Returned"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-[#44afa9]/10 text-[#44afa9] border-[#44afa9]/20"
          }`}
        >
          {post?.status}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-[#002433]/5 border border-[#002433]/10 rounded-2xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-[#002433] mt-0.5 shrink-0">
            info
          </span>
          <div className="text-sm text-[#002433]">
            <p className="font-bold mb-1">How this works</p>
            <p className="text-[#41484c] leading-relaxed">
              Students who believe this item is theirs will submit claim
              requests here. For <strong>P2P claims</strong>, you can mark the
              matching claim as returned once the handoff is complete. For{" "}
              <strong>Office claims</strong>, staff can resolve the pickup for
              you from the admin side.
            </p>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#002433]/5 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[#41484c]/30 mb-4 block">
              assignment
            </span>
            <p className="font-bold text-[#002433] mb-1">No claims yet</p>
            <p className="text-sm text-[#41484c]">
              You&apos;ll see claim requests here as students submit them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-[#41484c] px-1">
              {claims.length} claim{claims.length !== 1 ? "s" : ""} submitted
            </p>
            {claims.map((claim) => (
              <div
                key={claim.claim_id}
                className="bg-white rounded-2xl shadow-sm border border-[#002433]/5 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-black text-[#002433]">
                      {claim.claimant_name}
                    </p>
                    <p className="text-xs text-[#41484c] mt-0.5">
                      ID: {claim.claimant_school_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        STATUS_STYLES[claim.status] ??
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {claim.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#002433]/5 text-[#002433] border border-[#002433]/10">
                      {FLOW_LABELS[claim.flow_type] ?? claim.flow_type}
                    </span>
                  </div>
                </div>

                {claim.item_description_verification && (
                  <div className="bg-[#f5f3f3] rounded-xl p-4 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#41484c] mb-1">
                      Claimant&apos;s Item Description
                    </p>
                    <p className="text-sm text-[#002433] leading-relaxed">
                      {claim.item_description_verification}
                    </p>
                  </div>
                )}

                {claim.admin_notes && (
                  <div
                    className={`rounded-xl p-4 mb-4 ${
                      claim.status === "Rejected"
                        ? "bg-red-50 border border-red-100"
                        : "bg-blue-50 border border-blue-100"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#41484c] mb-1">
                      {claim.status === "Rejected"
                        ? "Rejection Reason"
                        : "Staff Notes"}
                    </p>
                    <p className="text-sm text-[#002433] leading-relaxed">
                      {claim.admin_notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#002433]/5">
                  <p className="text-[11px] text-[#41484c]/60">
                    Submitted {formatDate(claim.created_at)}
                  </p>

                  {post?.reported_by === currentUserId &&
                    post?.status !== "Returned" &&
                    post?.status !== "Released" && (
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {["Pending", "Approved"].includes(claim.status) && (
                          <button
                            onClick={() =>
                              handleMarkReturned(
                                claim.claim_id,
                                claim.claimant_name
                              )
                            }
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#002433] text-white text-xs font-black rounded-xl hover:bg-[#05364b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              assignment_turned_in
                            </span>
                            {actionLoading === claim.claim_id + "-returned"
                              ? "Marking..."
                              : "Mark as Returned"}
                          </button>
                        )}

                        {claim.flow_type === "P2P" &&
                          claim.status === "Approved" && (
                            <button
                              onClick={() =>
                                handleConfirmP2PHandoff(claim.claim_id)
                              }
                              disabled={!!actionLoading}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                handshake
                              </span>
                              {actionLoading === claim.claim_id
                                ? "Confirming..."
                                : "Confirm Handoff"}
                            </button>
                          )}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
