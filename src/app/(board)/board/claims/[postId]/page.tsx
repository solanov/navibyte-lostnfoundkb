"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { finalizeP2PReturnAction } from "@/src/app/admin/actions/posts";
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

  const [post, setPost] = useState<PostSummary | null>(null);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    const accessToken = session?.access_token;

    if (!user || !accessToken) {
      router.push("/login");
      return;
    }
    setCurrentUserId(user.id);

    try {
      const result = await fetchOwnedPostClaimsAction(accessToken, postId);
      setPost(result.post as PostSummary);
      setClaims(result.claims as ClaimRequest[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims.");
    }

    setLoading(false);
  }, [postId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmP2PHandoff = async (claimId: string) => {
    const confirmed = window.confirm(
      "Confirm that you have physically handed this item to the claimant? This cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading(claimId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Authentication token missing.");

      await finalizeP2PReturnAction(accessToken, postId, claimId);
      notify("Item successfully marked as handed off.", "success");
      await loadData();
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f3f3] p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-5xl text-[#ba1a1a] mb-4 block">
            error
          </span>
          <h2 className="text-xl font-black text-[#002433] mb-2">
            Access Denied
          </h2>
          <p className="text-[#41484c] mb-6">{error}</p>
          <Link
            href="/board/claims"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#44afa9] text-white font-bold rounded-xl hover:bg-[#3b9691] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Board
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
        {/* Info Banner */}
        <div className="bg-[#002433]/5 border border-[#002433]/10 rounded-2xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-[#002433] mt-0.5 shrink-0">
            info
          </span>
          <div className="text-sm text-[#002433]">
            <p className="font-bold mb-1">How this works</p>
            <p className="text-[#41484c] leading-relaxed">
              Students who believe this item is theirs will submit claim
              requests here. For{" "}
              <strong>P2P claims</strong>, you confirm the handoff directly after the student verifies ownership via the messaging chat. For{" "}
              <strong>Office claims</strong>, staff will handle the verification and release.
            </p>
          </div>
        </div>

        {/* Claims List */}
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
                {/* Claim Header */}
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

                {/* Verification Description */}
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

                {/* Admin Notes / Rejection Reason */}
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

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#002433]/5">
                  <p className="text-[11px] text-[#41484c]/60">
                    Submitted {formatDate(claim.created_at)}
                  </p>

                  {/* P2P Finder Confirm Handoff — only when approved */}
                  {claim.flow_type === "P2P" &&
                    claim.status === "Approved" &&
                    post?.reported_by === currentUserId && (
                      <button
                        onClick={() =>
                          handleConfirmP2PHandoff(claim.claim_id)
                        }
                        disabled={actionLoading === claim.claim_id}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
