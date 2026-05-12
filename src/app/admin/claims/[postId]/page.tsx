"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { supabase } from "@/src/lib/supabase";
import {
  markClaimReturnedByAdminAction,
  rejectClaimAction,
} from "@/src/app/admin/actions/items";
import { fetchAdminPostClaimsAction } from "@/src/app/admin/actions/claims";
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

export default function AdminClaimsPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { notify } = useNotification();
  const postId = resolvedParams.postId;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.push("/login");
    }
  }, [accessToken, authLoading, router]);

  const { data, error, isLoading, mutate } = useSWR(
    accessToken ? ["admin-post-claims", accessToken, postId] : null,
    () => fetchAdminPostClaimsAction(accessToken as string, postId),
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

  const handleMarkReturned = async (
    claimId: string,
    claimantName: string
  ) => {
    const confirmed = window.confirm(
      `Mark this item as returned to ${claimantName}? This will remove it from the public board and reject the other active claims.`
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
          await markClaimReturnedByAdminAction(accessToken, postId, claimId);
          return optimisticData;
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      notify("Item marked as returned and removed from the public board.", "success");
    } catch (err) {
      notify(`Error: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingClaimId || !rejectionReason.trim()) return;

    setActionLoading(rejectingClaimId + "-reject");
    try {
      if (!accessToken) throw new Error("Authentication token missing.");

      const nextTimestamp = new Date().toISOString();
      const optimisticData = data
        ? {
            ...data,
            claims: data.claims.map((claim) =>
              claim.claim_id === rejectingClaimId
                ? {
                    ...claim,
                    status: "Rejected" as ClaimRequest["status"],
                    admin_notes: rejectionReason,
                    updated_at: nextTimestamp,
                  }
                : claim
            ),
          }
        : data;

      await mutate(
        async () => {
          await rejectClaimAction(accessToken, rejectingClaimId, rejectionReason);
          return optimisticData;
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      notify("Claim rejected.", "success");
      setRejectingClaimId(null);
      setRejectionReason("");
    } catch (err) {
      notify(`Error: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const [title] = (post?.general_description ?? "").split("\n\n");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a] mb-4 block">
            error
          </span>
          <h2 className="text-xl font-black text-[#002433] mb-2">Error</h2>
          <p className="text-[#41484c] mb-6">{errorMessage}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#44afa9] text-white font-bold rounded-xl hover:bg-[#3b9691] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3f3]">
      <div className="bg-white border-b border-[#002433]/5 px-6 py-5 flex items-center gap-4">
        <Link
          href="/admin"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f5f3f3] text-[#41484c] transition-colors"
          aria-label="Back to admin"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#44afa9] mb-0.5">
            Admin · Claims Management
          </p>
          <h1 className="text-lg font-black text-[#002433] truncate">
            {title || "Item Claims"}
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
        <div className="bg-white rounded-2xl border border-[#002433]/5 p-5 flex gap-4 items-start">
          <div className="w-10 h-10 bg-[#002433]/5 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#002433]">
              {post?.categories?.icon_identifier ?? "help_outline"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#002433] truncate">{title}</p>
            <p className="text-xs text-[#41484c] mt-0.5">Zone: {post?.zone}</p>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#002433]/5 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[#41484c]/30 mb-4 block">
              assignment
            </span>
            <p className="font-bold text-[#002433] mb-1">No claims yet</p>
            <p className="text-sm text-[#41484c]">
              Claim requests will appear here as students submit them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-[#41484c] px-1">
              {claims.length} claim{claims.length !== 1 ? "s" : ""} total
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
                      Student ID: {claim.claimant_school_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        STATUS_STYLES[claim.status] ??
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {claim.status}
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

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#002433]/5 flex-wrap">
                  <p className="text-[11px] text-[#41484c]/60">
                    Submitted {formatDate(claim.created_at)}
                  </p>

                  {post?.status !== "Returned" &&
                    post?.status !== "Released" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {["Pending", "Approved"].includes(claim.status) && (
                          <button
                            onClick={() =>
                              handleMarkReturned(
                                claim.claim_id,
                                claim.claimant_name
                              )
                            }
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#002433] text-white text-xs font-black rounded-xl hover:bg-[#05364b] transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              assignment_turned_in
                            </span>
                            {actionLoading === claim.claim_id + "-returned"
                              ? "Marking..."
                              : "Mark as Returned"}
                          </button>
                        )}

                        {["Pending", "Approved"].includes(claim.status) && (
                          <button
                            onClick={() => {
                              setRejectingClaimId(claim.claim_id);
                              setRejectionReason("");
                            }}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-black rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              cancel
                            </span>
                            Reject
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

      {rejectingClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-black text-[#002433] mb-1">
              Reject Claim
            </h2>
            <p className="text-sm text-[#41484c] mb-4">
              Provide a reason so the student understands why their claim was
              rejected.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Description did not match the hidden details of the item."
              className="w-full border border-[#002433]/10 rounded-xl px-4 py-3 text-sm text-[#002433] bg-[#f5f3f3] resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#44afa9]/30"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectingClaimId(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#002433]/10 text-sm font-bold text-[#41484c] hover:bg-[#f5f3f3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || !!actionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-black hover:bg-[#a31717] transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
