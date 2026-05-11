"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import {
  approveOfficeClaimAction,
  finalizeOfficeReleaseAction,
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

const FLOW_LABELS: Record<string, string> = {
  P2P: "Student-to-Student",
  Office: "Office Pickup",
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

import { use } from "react";

export default function AdminClaimsPage({ params }: { params: Promise<{ postId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { notify } = useNotification();
  const postId = resolvedParams.postId;

  const [post, setPost] = useState<PostSummary | null>(null);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const getAccessToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Authentication token missing.");
    return token;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const token = await getAccessToken();

    try {
      const result = await fetchAdminPostClaimsAction(token, postId);
      setPost(result.post as unknown as PostSummary);
      setClaims(result.claims as ClaimRequest[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims.");
    }

    setLoading(false);
  }, [postId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (claimId: string) => {
    setActionLoading(claimId + "-approve");
    try {
      const token = await getAccessToken();
      await approveOfficeClaimAction(token, claimId);
      notify("Claim approved. Student can now collect the item.", "success");
      await loadData();
    } catch (err) {
      notify(`Error: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalizeRelease = async (claimId: string) => {
    const confirmed = window.confirm(
      "Confirm that the student has physically collected the item from the office? This cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading(claimId + "-release");
    try {
      const token = await getAccessToken();
      await finalizeOfficeReleaseAction(token, claimId);
      notify("Item released. Record updated to Released.", "success");
      await loadData();
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
      const token = await getAccessToken();
      await rejectClaimAction(token, rejectingClaimId, rejectionReason);
      notify("Claim rejected.", "success");
      setRejectingClaimId(null);
      setRejectionReason("");
      await loadData();
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
          <span className="material-symbols-outlined text-4xl animate-pulse">hourglass_top</span>
          <p className="text-sm font-bold uppercase tracking-widest">Loading claims...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a] mb-4 block">error</span>
          <h2 className="text-xl font-black text-[#002433] mb-2">Error</h2>
          <p className="text-[#41484c] mb-6">{error}</p>
          <Link href="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-[#44afa9] text-white font-bold rounded-xl hover:bg-[#3b9691] transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3f3]">
      {/* Page Header */}
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
        {/* Post Metadata */}
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

        {/* Claims List */}
        {claims.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#002433]/5 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[#41484c]/30 mb-4 block">assignment</span>
            <p className="font-bold text-[#002433] mb-1">No claims yet</p>
            <p className="text-sm text-[#41484c]">Claim requests will appear here as students submit them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-[#41484c] px-1">
              {claims.length} claim{claims.length !== 1 ? "s" : ""} total
            </p>
            {claims.map((claim) => (
              <div key={claim.claim_id} className="bg-white rounded-2xl shadow-sm border border-[#002433]/5 p-5">
                {/* Claim Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-black text-[#002433]">{claim.claimant_name}</p>
                    <p className="text-xs text-[#41484c] mt-0.5">Student ID: {claim.claimant_school_id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[claim.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {claim.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#002433]/5 text-[#002433] border border-[#002433]/10">
                      {FLOW_LABELS[claim.flow_type] ?? claim.flow_type}
                    </span>
                  </div>
                </div>

                {/* Verification Description */}
                {claim.item_description_verification && (
                  <div className="bg-[#f5f3f3] rounded-xl p-4 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#41484c] mb-1">
                      Claimant's Item Description
                    </p>
                    <p className="text-sm text-[#002433] leading-relaxed">
                      {claim.item_description_verification}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                {claim.admin_notes && (
                  <div className={`rounded-xl p-4 mb-4 ${claim.status === "Rejected" ? "bg-red-50 border border-red-100" : "bg-blue-50 border border-blue-100"}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#41484c] mb-1">
                      {claim.status === "Rejected" ? "Rejection Reason" : "Staff Notes"}
                    </p>
                    <p className="text-sm text-[#002433] leading-relaxed">{claim.admin_notes}</p>
                  </div>
                )}

                {/* Footer: Timestamps + Actions */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#002433]/5 flex-wrap">
                  <p className="text-[11px] text-[#41484c]/60">
                    Submitted {formatDate(claim.created_at)}
                  </p>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Office: Approve Pending */}
                    {claim.flow_type === "Office" && claim.status === "Pending" && (
                      <button
                        onClick={() => handleApprove(claim.claim_id)}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                        {actionLoading === claim.claim_id + "-approve" ? "Approving..." : "Approve"}
                      </button>
                    )}

                    {/* Office: Finalize Release (when Approved) */}
                    {claim.flow_type === "Office" && claim.status === "Approved" && (
                      <button
                        onClick={() => handleFinalizeRelease(claim.claim_id)}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[15px]">handshake</span>
                        {actionLoading === claim.claim_id + "-release" ? "Finalizing..." : "Confirm Pickup"}
                      </button>
                    )}

                    {/* Reject (any Pending or Approved) */}
                    {["Pending", "Approved"].includes(claim.status) && (
                      <button
                        onClick={() => {
                          setRejectingClaimId(claim.claim_id);
                          setRejectionReason("");
                        }}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-black rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[15px]">cancel</span>
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectingClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-black text-[#002433] mb-1">Reject Claim</h2>
            <p className="text-sm text-[#41484c] mb-4">
              Provide a reason so the student understands why their claim was rejected.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Description did not match the hidden details of the item."
              className="w-full border border-[#002433]/10 rounded-xl px-4 py-3 text-sm text-[#002433] bg-[#f5f3f3] resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#44afa9]/30"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectingClaimId(null); setRejectionReason(""); }}
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
