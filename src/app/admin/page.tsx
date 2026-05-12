"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { fetchAdminData } from "./actions/fetchData";
import { verifyClaimAction, disposeItemAction, adminDeletePostAction } from "./actions/items";
import { fetchFlaggedPostsAction, fetchPostReportDetailsAction, dismissReportsAction, actionReportDeletePostAction, FlaggedPost, ReportDetail } from "./actions/reports";
import { updateUserBlockAction } from "./actions/users";
import {
  buildOwnedClaimOverview,
  ClaimOverviewEntry,
  ClaimOverviewItemRow,
  ClaimOverviewRequestRow,
} from "@/src/lib/claimOverview";
import {
  AUDIT_CATEGORY_LABELS,
  AuditCategoryKey,
  getAuditCategory,
  getAuditCategoryLabel,
  getAuditTargetValue,
} from "@/src/lib/adminAudit";
import { resolveIcon } from "@/src/lib/resolveIcon";

type AdminTab = "overview" | "vault" | "users" | "claims" | "disposal" | "audit" | "reports" | "exports";
type ItemStatus = "Reported" | "Found" | "Returned" | "Released" | "Purged";
type UserRole = "Public" | "Staff" | "Admin";

type AdminProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  is_blocked: boolean;
};

type CategoryRow = {
  name: string | null;
  icon_identifier: string | null;
};

type LostItem = {
  post_id: string;
  category_id: number | null;
  color: string | null;
  zone: string | null;
  general_description: string | null;
  hidden_note: string | null;
  bin_number: string | null;
  status: ItemStatus;
  image_url: string | null;
  reported_by: string;
  last_handled_by: string | null;
  created_timestamp: string;
  last_edited_timestamp: string;
  deleted_by?: string | null;
  deletion_reason?: string | null;
  deleted_at?: string | null;
  returned_at?: string | null;
  categories: CategoryRow | CategoryRow[] | null;
};

type AuditLog = {
  log_id: number;
  post_id: string | null;
  actor_id: string | null;
  action: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  created_at: string;
};

type ClaimRequestSummary = {
  claim_id: string;
  post_id: string;
  flow_type: "P2P" | "Office";
  status: "Pending" | "Approved" | "Rejected" | "Released";
  created_at: string;
  updated_at: string;
};

type ModalState =
  | { type: "verify"; item: LostItem }
  | { type: "suspend"; user: AdminProfile }
  | { type: "restore"; user: AdminProfile }
  | { type: "history"; user: AdminProfile }
  | { type: "dispose"; item: LostItem }
  | { type: "adminDelete"; item: LostItem }
  | { type: "reviewPost"; item: LostItem }
  | null;

const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: "overview", label: "Dashboard", icon: "dashboard" },
  { id: "vault", label: "Secure Vault", icon: "enhanced_encryption" },
  { id: "users", label: "User Management", icon: "group" },
  { id: "claims", label: "My Post Claims", icon: "assignment" },
  { id: "disposal", label: "Disposal Queue", icon: "delete_sweep" },
  { id: "audit", label: "Audit Trail", icon: "history_edu" },
  { id: "reports", label: "Flagged Posts", icon: "flag" },
  { id: "exports", label: "Export Reports", icon: "summarize" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isProtectedAdminAccount(user: Pick<AdminProfile, "role">) {
  return user.role === "Admin";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [items, setItems] = useState<LostItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequestSummary[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Added Avatar State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Profile Popover State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    // Fetch the Avatar URL directly from Auth Metadata
    setAvatarUrl(currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null);

    const sessionToken = sessionData.session?.access_token;
    if (!sessionToken) {
      setError("No valid access token available.");
      setLoading(false);
      return;
    }

    setAccessToken(sessionToken);

    try {
      const data = await fetchAdminData(sessionToken);
      setProfile(data.profile);
      setUsers(data.users as AdminProfile[]);
      setItems(data.items as LostItem[]);
      setAuditLogs(data.auditLogs as AuditLog[]);
      setClaimRequests((data.claimRequests || []) as ClaimRequestSummary[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
    
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdminData]);

  const filteredItems = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return items;
    return items.filter((item) => {
      const text = [
        item.post_id,
        item.status,
        item.zone,
        item.bin_number,
        item.general_description,
        item.hidden_note,
        categoryName(item),
      ].join(" ").toLowerCase();
      return text.includes(needle);
    });
  }, [items, query]);

  const filteredUsers = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return users;
    return users.filter((user) => [user.full_name, user.email, user.role].join(" ").toLowerCase().includes(needle));
  }, [users, query]);

  const filteredAuditLogs = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return auditLogs;
    return auditLogs.filter((log) => {
      const text = [
        log.action.replaceAll("_", " "),
        log.actor_id,
        getAuditCategoryLabel(log),
        getAuditTargetValue(log),
        stateSummary(log.new_state),
      ].join(" ").toLowerCase();
      return text.includes(needle);
    });
  }, [auditLogs, query]);

  const disposalItems = useMemo(
    () => filteredItems.filter((item) => item.status !== "Returned" && item.status !== "Purged" && itemAgeDays(item) >= 120),
    [filteredItems],
  );

  const activeItems = filteredItems.filter((item) => item.status !== "Purged");
  const returnedItems = items.filter((item) => item.status === "Returned");
  const blockedUsers = users.filter((user) => user.is_blocked);
  const ownedClaimEntries = useMemo<ClaimOverviewEntry[]>(
    () =>
      profile
        ? buildOwnedClaimOverview(
            filteredItems as unknown as ClaimOverviewItemRow[],
            claimRequests as ClaimOverviewRequestRow[],
            profile.user_id
          )
        : [],
    [claimRequests, filteredItems, profile]
  );

  async function verifyClaim(item: LostItem, claimantName: string, studentId: string) {
    if (!profile) return;
    setBusy(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      setError("Authentication token missing.");
      setBusy(false);
      return;
    }

    const previous = { status: item.status, last_handled_by: item.last_handled_by };
    
    try {
      await verifyClaimAction(accessToken, item.post_id, claimantName, studentId, previous);
      setNotice("Claim verified and item marked as Returned.");
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.post_id === item.post_id
            ? {
                ...currentItem,
                status: "Returned",
                last_handled_by: profile.user_id,
              }
            : currentItem
        )
      );
      setModal(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
    
    setBusy(false);
  }

  async function updateUserBlock(user: AdminProfile, blocked: boolean, reason: string) {
    if (!profile) return;
    setBusy(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setError("Authentication token missing.");
      setBusy(false);
      return;
    }

    try {
      await updateUserBlockAction(accessToken, user.user_id, user.is_blocked, blocked, reason);
      setNotice(blocked ? "Account suspended." : "Account restored.");
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.user_id === user.user_id
            ? { ...currentUser, is_blocked: blocked }
            : currentUser
        )
      );
      setModal(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }

    setBusy(false);
  }

  async function disposeItem(item: LostItem, method: string, reason: string) {
    if (!profile) return;
    setBusy(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setError("Authentication token missing.");
      setBusy(false);
      return;
    }

    const previous = { status: item.status, bin_number: item.bin_number };

    try {
      await disposeItemAction(accessToken, item.post_id, method, reason, previous);
      setNotice("Disposal audit approved and item moved to Purged.");
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.post_id === item.post_id
            ? {
                ...currentItem,
                status: "Purged",
                last_handled_by: profile.user_id,
              }
            : currentItem
        )
      );
      setModal(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }

    setBusy(false);
  }

  async function adminDeletePost(item: LostItem, reason: string) {
    if (!profile) return;
    setBusy(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setError("Authentication token missing.");
      setBusy(false);
      return;
    }

    try {
      await adminDeletePostAction(accessToken, item.post_id, reason);
      setNotice("Post deleted and moved to Purged.");
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.post_id === item.post_id
            ? {
                ...currentItem,
                status: "Purged",
                deleted_by: profile.user_id,
                deletion_reason: reason,
                deleted_at: new Date().toISOString(),
                last_handled_by: profile.user_id,
              }
            : currentItem
        )
      );
      setModal(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }

    setBusy(false);
  }

  function exportReport(type: string, startDate: string, endDate: string) {
    const rows = reportRows(type, startDate, endDate, items, users, auditLogs);
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type.toLowerCase().replaceAll(" ", "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Report exported as CSV.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdfcfc] p-8 pt-24">
        <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-xl bg-white shadow-sm" />
      </main>
    );
  }

  if (error && !profile) {
    return <AccessState message={error} />;
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-[#002433] flex">
      
      {/* Sidebar */}
      <aside className="sticky top-0 z-50 hidden h-screen w-[280px] shrink-0 flex-col border-r border-[#002433]/5 bg-[#f5f3f3] px-5 py-8 transition-all duration-300 ease-in-out md:flex">
        
        {/* Logo & Branding */}
        <div className="mb-10 flex items-center gap-4 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#002433] shadow-[0_10px_20px_rgba(0,36,51,0.15)]">
            <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={24} height={24} />
          </div>
          <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
            <h1 className="font-headline text-xl font-black leading-tight tracking-tight text-[#002433]">NEUvigate</h1>
            <p className="mt-0.5 text-xs font-black uppercase tracking-widest text-[#44afa9]">Admin</p>
          </div>
        </div>

        {/* Tab Navigation — scrollable so all 8 tabs fit without pushing the profile card off */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-0.5 scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[#ffffff] font-bold text-[#002433] shadow-[0_8px_16px_rgba(0,36,51,0.04)]"
                  : "text-[#41484c] hover:bg-[#ffffff]/60 hover:text-[#002433]"
              }`}
            >
              <span className="material-symbols-outlined shrink-0 text-[20px]" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
              <span className="text-sm tracking-wide">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Pinned User Dock */}
        <div className="mt-auto space-y-2">
          <Link
            href="/board"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[#41484c] transition-all hover:bg-[#ffffff]/60 hover:bg-[#002433]/5"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Return to Board</span>
          </Link>

          {/* Profile Popover Toggle */}
          <div className="relative" ref={profileMenuRef}>
            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-0 mb-3 flex w-64 flex-col overflow-visible rounded-2xl border border-[#002433]/5 bg-white shadow-[0_4px_24px_rgba(0,36,51,0.12)] z-50">
                {/* Arrow */}
                <div className="absolute -bottom-1.5 left-7 h-3 w-3 rotate-45 border-b border-r border-[#002433]/5 bg-white"></div>

                {/* Header */}
                <div className="relative z-10 rounded-t-2xl border-b border-[#002433]/5 bg-white p-4">
                  <p className="truncate text-sm font-bold text-[#002433]" title={profile?.full_name || profile?.email || ""}>
                    {profile?.full_name || profile?.email || "Admin User"}
                  </p>
                  <span className="mt-1.5 inline-block rounded bg-[#44afa9]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#44afa9]">
                    {profile?.role || "ADMIN"}
                  </span>
                </div>

                {/* Footer / Sign Out */}
                <div className="relative z-10 rounded-b-2xl bg-[#f5f3f3]/50 p-2">
                  <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#41484c] transition-all hover:bg-[#ba1a1a] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span className="text-xs font-bold">Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trigger Button */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[#ffffff] p-3 shadow-[0_10px_30px_rgba(0,36,51,0.03)] transition-all duration-300 hover:border-[#002433]/5 hover:shadow-[0_10px_30px_rgba(0,36,51,0.08)] focus:outline-none focus:ring-2 focus:ring-[#44afa9]/20"
              aria-label="Admin Profile Menu"
              aria-expanded={isProfileMenuOpen}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-[#f5f3f3]">
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-[#41484c]">account_circle</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between text-left transition-opacity duration-300">
                <div className="min-w-0 pr-2">
                  <p className="truncate text-sm font-bold text-[#002433]">{profile?.full_name || profile?.email?.split('@')[0] || "Admin"}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-[#44afa9]">{profile?.role || "Admin"}</p>
                </div>
                <span className={`material-symbols-outlined text-[#41484c]/40 transition-transform duration-200 group-hover:text-[#41484c] ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                  expand_less
                </span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-hidden px-4 py-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          
        {/* Universal Search Bar (Hidden on Dashboard & Reports) */}
          {["vault", "users", "claims", "disposal", "audit"].includes(activeTab) && (
            <div className="mb-8 flex items-center animate-in fade-in duration-200">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#41484c]/50">
                  search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search vault, users, logs..."
                  className="w-full rounded-2xl border border-[#002433]/10 bg-white py-3 pl-11 pr-4 text-sm text-[#002433] shadow-[0_2px_10px_rgba(0,36,51,0.02)] outline-none transition-all hover:border-[#002433]/20 focus:border-[#44afa9] focus:ring-1 focus:ring-[#44afa9] placeholder:text-[#41484c]/50"
                />
              </div>
            </div>
          )}

          {/* Mobile Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                  activeTab === tab.id ? "bg-[#002433] text-white" : "bg-white text-slate-500 shadow-sm border border-[#002433]/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {notice && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-[#44afa9]/25 bg-[#8df4ec]/20 px-5 py-4 text-sm font-bold text-[#002433]">
              {notice}
              <button onClick={() => setNotice(null)} className="text-[#41484c] hover:text-[#002433]">Dismiss</button>
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Render Active View */}
          {activeTab === "overview" && <OverviewDashboard items={items} users={users} claims={claimRequests} />}
          {activeTab === "vault" && <VaultView items={activeItems} onReview={(item) => setModal({ type: "reviewPost", item })} onDelete={(item) => setModal({ type: "adminDelete", item })} />}
          {activeTab === "users" && <UsersView users={filteredUsers} items={items} onSuspend={(user) => setModal({ type: "suspend", user })} onRestore={(user) => setModal({ type: "restore", user })} onHistory={(user) => setModal({ type: "history", user })} />}
          {activeTab === "claims" && <ClaimsDeskView entries={ownedClaimEntries} />}
          {activeTab === "disposal" && <DisposalView items={disposalItems} onDispose={(item) => setModal({ type: "dispose", item })} />}
          {activeTab === "audit" && <AuditView logs={filteredAuditLogs} />}
          {activeTab === "reports" && <FlaggedPostsView accessToken={accessToken ?? ''} />}
          {activeTab === "exports" && <ExportsView itemCount={items.length} returnedCount={returnedItems.length} blockedCount={blockedUsers.length} onExport={exportReport} />}
        </div>
      </main>

      {/* Modals */}
      {modal?.type === "verify" && <VerifyModal item={modal.item} busy={busy} onClose={() => setModal(null)} onSubmit={verifyClaim} />}
      {modal?.type === "suspend" && <AccountModal mode="suspend" user={modal.user} busy={busy} onClose={() => setModal(null)} onSubmit={updateUserBlock} />}
      {modal?.type === "restore" && <AccountModal mode="restore" user={modal.user} busy={busy} onClose={() => setModal(null)} onSubmit={updateUserBlock} />}
      {modal?.type === "history" && <HistoryModal user={modal.user} items={items.filter((item) => item.reported_by === modal.user.user_id)} onClose={() => setModal(null)} />}
      {modal?.type === "dispose" && <DisposeModal item={modal.item} busy={busy} onClose={() => setModal(null)} onSubmit={disposeItem} />}
      {modal?.type === "adminDelete" && <AdminDeleteModal item={modal.item} busy={busy} onClose={() => setModal(null)} onSubmit={adminDeletePost} />}
      {modal?.type === "reviewPost" && <ReviewPostModal item={modal.item} onClose={() => setModal(null)} />}
    </div>
  );
}

function OverviewDashboard({ items, users, claims }: { items: LostItem[]; users: AdminProfile[]; claims: ClaimRequestSummary[] }) {
  // --- Dynamic Date Range State (Default: Last 7 Days) ---
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // --- Core Analytics ---
  const lostCount = items.filter((i) => i.status === "Reported").length;
  const foundCount = items.filter((i) => i.status === "Found").length;
  const returnedCount = items.filter((i) => i.status === "Returned" || i.status === "Released").length;
  const purgedCount = items.filter((i) => i.status === "Purged").length;
  const total = items.length || 1;

  const pendingClaims = claims.filter((c) => c.status === "Pending");

  // --- Dynamic Chart Math ---
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];
  
  // Safely loop through selected dates
  if (start <= end) {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateArray.push(new Date(d).toISOString().slice(0, 10));
    }
  }

  // Cap at 90 days to prevent browser lag if an admin selects a massive multi-year range
  const safeDateArray = dateArray.slice(0, 90);

  const chartData = safeDateArray.map((dateStr) => {
    const count = items.filter((item) => item.created_timestamp.startsWith(dateStr)).length;
    return {
      dateStr,
      label: new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    };
  });
  
  // Find max value to scale the Y-axis relatively (minimum 1 to avoid dividing by zero)
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        eyebrow="System Analytics"
        title="Admin Dashboard"
        description="Real-time overview of system metrics, asset statuses, and recent platform activity."
      />

      {/* Top Metrics Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Assets Tracked" value={items.length} icon="inventory_2" />
        <MetricCard label="Active Claims" value={pendingClaims.length} icon="assignment" />
        <MetricCard label="Assets Returned" value={returnedCount} icon="task_alt" />
        <MetricCard label="Registered Users" value={users.length} icon="group" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Left Column: Charts */}
        <div className="space-y-6">
          
          {/* Dynamic Trend Line Chart */}
          <div className="rounded-xl border border-outline-variant/15 bg-white p-6 shadow-[0_10px_30px_rgba(0,36,51,0.02)]">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h3 className="font-headline text-lg font-bold text-primary">System Activity Trend</h3>
              
              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md border border-outline-variant/30 bg-surface px-2.5 py-1.5 text-xs font-bold text-on-surface outline-none focus:border-[#44afa9] focus:ring-1 focus:ring-[#44afa9]"
                />
                <span className="text-on-surface-variant text-xs font-bold">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md border border-outline-variant/30 bg-surface px-2.5 py-1.5 text-xs font-bold text-on-surface outline-none focus:border-[#44afa9] focus:ring-1 focus:ring-[#44afa9]"
                />
              </div>
            </div>

              {chartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm font-semibold text-on-surface-variant">
                Invalid date range selected.
              </div>
            ) : (
              <div className="relative mt-4 h-56 w-full border-b border-outline-variant/20">
                {/* SVG Line Background with entrance animation */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible animate-in fade-in zoom-in-[98%] duration-700" preserveAspectRatio="none">
                  {/* Fill Area underneath line */}
                  <polygon 
                    fill="rgba(141, 244, 236, 0.15)" 
                    points={`0,100 ${chartData.map((d, i) => `${(i / Math.max(chartData.length - 1, 1)) * 100},${(1 - d.count / maxCount) * 100}`).join(' ')} 100,100`}
                    style={{ transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                  {/* The Line */}
                  <polyline 
                    fill="none" 
                    stroke="#44afa9" 
                    strokeWidth="2.5" 
                    vectorEffect="non-scaling-stroke"
                    points={chartData.map((d, i) => `${(i / Math.max(chartData.length - 1, 1)) * 100},${(1 - d.count / maxCount) * 100}`).join(' ')} 
                    style={{ transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
                
                {/* Interaction & Tooltip Layer */}
                <div className="absolute inset-0 animate-in fade-in duration-700 delay-150 fill-mode-both">
                  {chartData.map((d, i) => {
                    // Calculate EXACT mathematical percentages to match SVG
                    const xPercent = (i / Math.max(chartData.length - 1, 1)) * 100;
                    const yPercent = (1 - d.count / maxCount) * 100;

                    return (
                      <div 
                        key={d.dateStr} // Keying by date allows React to smoothly track and glide existing points
                        className="absolute group z-10"
                        style={{ 
                          left: `${xPercent}%`, 
                          top: `${yPercent}%`,
                          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        {/* Invisible larger hit target for easier hovering on mobile/mouse */}
                        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer" />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 mb-3 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#053b50] px-3 py-1.5 text-xs font-bold text-white shadow-lg group-hover:block">
                          {d.label}: {d.count} item{d.count !== 1 ? 's' : ''}
                          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#053b50]"></div>
                        </div>
                        
                        {/* Point Marker */}
                        <div className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-[#44afa9] bg-white shadow-sm transition-all duration-200 group-hover:scale-150 group-hover:bg-[#44afa9]" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Smart X-Axis Labels (Only shows Start, Middle, and End to prevent overlapping) */}
            {chartData.length > 0 && (
              <div className="mt-3 flex justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>{chartData[0]?.label}</span>
                {chartData.length > 2 && <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>}
                <span>{chartData[chartData.length - 1]?.label}</span>
              </div>
            )}
          </div>

          {/* Status Breakdown Progress Bar */}
          <div className="rounded-xl border border-outline-variant/15 bg-white p-6 shadow-[0_10px_30px_rgba(0,36,51,0.02)]">
            <h3 className="mb-4 font-headline text-lg font-bold text-primary">Asset Status Breakdown</h3>
            
            <div className="mb-4 flex h-5 w-full overflow-hidden rounded-full bg-surface-container">
              <div style={{ width: `${(lostCount / total) * 100}%` }} className="bg-amber-400 transition-all duration-500" title={`Lost: ${lostCount}`}></div>
              <div style={{ width: `${(foundCount / total) * 100}%` }} className="bg-blue-400 transition-all duration-500" title={`Found: ${foundCount}`}></div>
              <div style={{ width: `${(returnedCount / total) * 100}%` }} className="bg-emerald-400 transition-all duration-500" title={`Returned: ${returnedCount}`}></div>
              <div style={{ width: `${(purgedCount / total) * 100}%` }} className="bg-red-400 transition-all duration-500" title={`Purged: ${purgedCount}`}></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-primary sm:grid-cols-4">
              <div className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full bg-amber-400"></span> Lost ({lostCount})</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full bg-blue-400"></span> Found ({foundCount})</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full bg-emerald-400"></span> Returned ({returnedCount})</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full bg-red-400"></span> Purged ({purgedCount})</div>
            </div>
          </div>
        </div>

        {/* Right Column: Action Items */}
        <div className="rounded-xl border border-outline-variant/15 bg-white p-6 shadow-[0_10px_30px_rgba(0,36,51,0.02)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold text-primary">Pending Actions</h3>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
              {pendingClaims.length} Tasks
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/30 py-12 text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 text-4xl opacity-30">check_circle</span>
                <p className="text-sm font-semibold">No pending claims to review.</p>
              </div>
            ) : (
              pendingClaims.slice(0, 6).map((claim) => (
                <Link
                  key={claim.claim_id}
                  href={`/admin/claims/${claim.post_id}`}
                  className="group flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 transition-all hover:border-[#44afa9]/30 hover:bg-[#8df4ec]/10"
                >
                  <div>
                    <p className="font-bold text-primary text-sm transition-colors group-hover:text-[#053b50]">
                      Review Post {reference(claim.post_id)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {claim.flow_type} Flow · {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-outline transition-transform group-hover:translate-x-1 group-hover:text-[#44afa9]">
                    chevron_right
                  </span>
                </Link>
              ))
            )}
            
            {pendingClaims.length > 6 && (
              <p className="text-center text-xs font-bold text-on-surface-variant pt-2">
                + {pendingClaims.length - 6} more pending claims
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function VaultView({ items, onReview, onDelete }: { items: LostItem[]; onReview: (item: LostItem) => void; onDelete: (item: LostItem) => void }) {
  return (
    <>
      <PageHeader eyebrow="Secure Repository" title="Secure Vault" description="Central repository for high-value assets requiring administrative oversight and unredacted verification." />
      <div className="overflow-hidden rounded-xl border border-outline-variant/15 bg-white shadow-[0_20px_40px_rgba(0,36,51,0.02)]">
        <div className="hidden grid-cols-12 gap-4 bg-surface-container-high px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary md:grid">
          <div className="col-span-3">Asset Details</div>
          <div className="col-span-2">Unredacted View</div>
          <div className="col-span-3">Hidden Note</div>
          <div className="col-span-2">Log Date</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <div className="divide-y divide-surface-container-low">
          {items.map((item) => (
            <div key={item.post_id} className="grid gap-4 px-6 py-5 transition hover:bg-surface-bright md:grid-cols-12 md:items-center">
              <div className="md:col-span-3">
                <p className="font-headline font-bold text-primary">{itemTitle(item)}</p>
                <p className="mt-1 w-fit rounded bg-surface-container px-2 py-0.5 font-mono text-xs text-on-surface-variant">REF: {reference(item.post_id)}</p>
                <p className="mt-2 text-xs text-on-surface-variant">{categoryName(item)} · {item.color ?? "No color"}</p>
              </div>
              <div className="md:col-span-2">
                <ItemThumb item={item} />
              </div>
              <div className="border-l-2 border-[#44afa9]/30 pl-3 text-sm italic leading-6 text-on-surface-variant md:col-span-3">
                {item.hidden_note || "No hidden note provided."}
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-semibold text-primary">{formatDate(item.created_timestamp)}</p>
                <StatusPill status={item.status} />
              </div>
              <div className="flex justify-start md:col-span-2 md:justify-end pr-2">
                <EllipsisMenu 
                  onReview={() => onReview(item)}
                  onDelete={() => onDelete(item)}
                />
              </div>
            </div>
          ))}
          {items.length === 0 && <EmptyState label="No secure vault records found." />}
        </div>
      </div>
    </>
  );
}

function UsersView({ users, items, onSuspend, onRestore, onHistory }: { users: AdminProfile[]; items: LostItem[]; onSuspend: (user: AdminProfile) => void; onRestore: (user: AdminProfile) => void; onHistory: (user: AdminProfile) => void }) {
  return (
    <>
      <PageHeader eyebrow="System Oversight" title="User Management" description="Suspend, restore, and review posting history for NEU institutional accounts." />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-container-high text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="rounded-tl-lg px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Institutional Email</th>
                <th className="px-6 py-4">Posts</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="rounded-tr-lg px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {users.map((user) => {
                const postCount = items.filter((item) => item.reported_by === user.user_id).length;
                return (
                  <tr key={user.user_id} className="transition hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.full_name ?? user.email ?? "NEU"} />
                        <div>
                          <p className="font-bold text-primary">{user.full_name ?? "Unnamed User"}</p>
                          <p className="text-xs text-on-surface-variant">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{postCount}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.is_blocked ? "bg-red-50 text-red-700" : "bg-[#8df4ec]/30 text-primary"}`}>
                        {user.is_blocked ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onHistory(user)} className="rounded-md border border-outline-variant/30 px-3 py-2 text-xs font-bold text-secondary transition hover:bg-surface-container-low">History</button>
                        {user.is_blocked ? (
                          <button onClick={() => onRestore(user)} className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-container">Restore</button>
                        ) : isProtectedAdminAccount(user) ? (
                          <span className="inline-flex items-center rounded-md border border-[#44afa9]/25 bg-[#8df4ec]/15 px-3 py-2 text-xs font-bold text-primary">
                            Protected Admin
                          </span>
                        ) : (
                          <button onClick={() => onSuspend(user)} className="rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700">Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <EmptyState label="No users found." />}
      </div>
    </>
  );
}

function DisposalView({ items, onDispose }: { items: LostItem[]; onDispose: (item: LostItem) => void }) {
  return (
    <>
      <PageHeader eyebrow="Lifecycle Control" title="Disposal Queue" description="Review and authorize items that have exceeded the institutional retention window." />
      <div className="mb-4 flex items-center gap-2 text-lg font-bold text-red-700">
        <span className="material-symbols-outlined">warning</span>
        Overdue Assets
      </div>
      <div className="overflow-hidden rounded-xl border border-outline-variant/15 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-container-high text-xs font-bold uppercase tracking-wider text-primary">
              <tr>
                <th className="p-4">Asset Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {items.map((item) => (
                <tr key={item.post_id} className="transition hover:bg-red-50/60">
                  <td className="p-4">
                    <div className="flex gap-4">
                      <ItemThumb item={item} />
                      <div>
                        <p className="font-bold text-primary">{itemTitle(item)}</p>
                        <p className="text-xs text-on-surface-variant">ID: {reference(item.post_id)}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-outline">Unclaimed &gt; {itemAgeDays(item)} Days</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-red-700">{Math.max(0, itemAgeDays(item) - 120)} Days Overdue</p>
                    <p className="text-xs text-on-surface-variant">Final review required</p>
                  </td>
                  <td className="p-4"><BinBadge bin={item.bin_number} /></td>
                  <td className="p-4 text-right">
                    <button onClick={() => onDispose(item)} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-container">Initiate Audit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <EmptyState label="No assets currently meet disposal criteria." />}
      </div>
    </>
  );
}

function AuditView({ logs }: { logs: AuditLog[] }) {
  const groupedLogs = useMemo(() => {
    const groups = new Map<AuditCategoryKey, AuditLog[]>();

    logs.forEach((log) => {
      const category = getAuditCategory(log);
      const current = groups.get(category) || [];
      current.push(log);
      groups.set(category, current);
    });

    return (Object.keys(AUDIT_CATEGORY_LABELS) as AuditCategoryKey[])
      .map((category) => ({
        category,
        label: AUDIT_CATEGORY_LABELS[category],
        logs: groups.get(category) || [],
      }))
      .filter((group) => group.logs.length > 0);
  }, [logs]);

  return (
    <>
      <PageHeader eyebrow="System Logs" title="Audit Trail" description="Review claim activity, account events, returns, deletions, and disposal history from one consolidated audit stream." />
      <div className="mb-6 flex flex-wrap gap-2">
        {groupedLogs.map((group) => (
          <span key={group.category} className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            {group.label}: {group.logs.length}
          </span>
        ))}
      </div>
      <div className="space-y-6">
        {groupedLogs.map((group) => (
          <div key={group.category} className="overflow-hidden rounded-xl border border-outline-variant/15 bg-white shadow-sm">
            <div className="border-b border-outline-variant/10 bg-surface-container-high px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{group.label}</p>
              <p className="mt-1 text-sm text-primary">{group.logs.length} logged event{group.logs.length === 1 ? "" : "s"}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-white text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Actor ID</th>
                    <th className="px-6 py-4">Action Taken</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {group.logs.map((log) => (
                    <tr key={log.log_id} className="transition hover:bg-surface-container-low/50">
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{formatDateTime(log.created_at)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">{shortId(log.actor_id)}</td>
                      <td className="px-6 py-4 font-bold text-primary">{log.action.replaceAll("_", " ")}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-primary-fixed/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {getAuditCategoryLabel(log)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{shortId(getAuditTargetValue(log))}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{stateSummary(log.new_state)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {logs.length === 0 && <EmptyState label="No audit entries found." />}
        {groupedLogs.length === 0 && logs.length > 0 && <EmptyState label="No categorized audit entries found." />}
      </div>
    </>
  );
}

function ClaimsDeskView({ entries }: { entries: ClaimOverviewEntry[] }) {
  return (
    <>
      <PageHeader
        eyebrow="Claim Oversight"
        title="Claims On My Posts"
        description="Track claim activity on items you personally reported and open the full review flow for each post."
      />
      <div className="overflow-hidden rounded-xl border border-outline-variant/15 bg-white shadow-[0_20px_40px_rgba(0,36,51,0.02)]">
        <div className="hidden grid-cols-12 gap-4 bg-surface-container-high px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary md:grid">
          <div className="col-span-4">Post</div>
          <div className="col-span-3">Claim Summary</div>
          <div className="col-span-3">Latest Activity</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <div className="divide-y divide-surface-container-low">
          {entries.map((entry) => (
            <div key={entry.postId} className="grid gap-4 px-6 py-5 transition hover:bg-surface-bright md:grid-cols-12 md:items-center">
              <div className="flex items-start gap-4 md:col-span-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-fixed/15 text-primary">
                  <span className="material-symbols-outlined">{entry.iconIdentifier}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-headline font-bold text-primary">{entry.title}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {entry.zone} · {entry.categoryName}
                  </p>
                  <StatusPill status={entry.itemStatus as ItemStatus} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-3">
                <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {entry.totalClaims} total
                </span>
                {entry.pendingClaims > 0 && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {entry.pendingClaims} pending
                  </span>
                )}
                {entry.approvedClaims > 0 && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    {entry.approvedClaims} approved
                  </span>
                )}
                {entry.rejectedClaims > 0 && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                    {entry.rejectedClaims} rejected
                  </span>
                )}
                {entry.releasedClaims > 0 && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {entry.releasedClaims} released
                  </span>
                )}
              </div>
              <div className="space-y-2 md:col-span-3">
                <p className="text-sm font-semibold text-primary">{formatDateTime(entry.latestClaimAt)}</p>
              </div>
              <div className="flex justify-start md:col-span-2 md:justify-end">
                <Link
                  href={`/admin/claims/${entry.postId}`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary-container"
                >
                  Review Claims
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
          {entries.length === 0 && <EmptyState label="No claim requests on your posts yet." />}
        </div>
      </div>
    </>
  );
}

// ── ExportsView ── Restored CSV download feature ──────────────────────────────
function ExportsView({
  itemCount,
  returnedCount,
  blockedCount,
  onExport,
}: {
  itemCount: number;
  returnedCount: number;
  blockedCount: number;
  onExport: (type: string, startDate: string, endDate: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState("User Activity");
  const [startDate, setStartDate] = useState(today.slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(today);

  const EXPORT_TYPES = [
    { value: "User Activity", icon: "group", description: "All registered users with role and block status." },
    { value: "Audit Logs", icon: "history_edu", description: "Time-filtered staff action log with categories." },
    { value: "Disposal Manifest", icon: "delete_sweep", description: "Items eligible for or already purged." },
    { value: "Item Inventory", icon: "inventory_2", description: "All tracked items with status, zone, and bin." },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Institutional Export"
        title="System Reports"
        description="Configure and download institutional data as CSV for reporting, auditing, or compliance."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Export Form */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onExport(type, startDate, endDate);
          }}
          className="rounded-xl bg-white p-8 shadow-[0_20px_40px_rgba(0,36,51,0.06)]"
        >
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#41484c]/60">Report Type</p>
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {EXPORT_TYPES.map((et) => (
              <label
                key={et.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  type === et.value
                    ? "border-[#44afa9] bg-[#8df4ec]/10 text-[#002433]"
                    : "border-[#002433]/10 hover:border-[#44afa9]/30 hover:bg-[#f5f3f3] text-[#41484c]"
                }`}
              >
                <input
                  type="radio"
                  name="export-type"
                  value={et.value}
                  checked={type === et.value}
                  onChange={() => setType(et.value)}
                  className="sr-only"
                />
                <span
                  className={`material-symbols-outlined shrink-0 text-xl ${type === et.value ? "text-[#44afa9]" : "text-[#41484c]/50"}`}
                  style={{ fontVariationSettings: type === et.value ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {et.icon}
                </span>
                <div>
                  <p className="text-sm font-bold">{et.value}</p>
                  <p className="mt-0.5 text-xs text-[#41484c]/60">{et.description}</p>
                </div>
              </label>
            ))}
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#41484c]/60">Date Range</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#41484c]/60">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-[#002433]/10 bg-[#f5f3f3] px-4 py-3 text-sm outline-none transition focus:border-[#44afa9] focus:ring-1 focus:ring-[#44afa9]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#41484c]/60">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-[#002433]/10 bg-[#f5f3f3] px-4 py-3 text-sm outline-none transition focus:border-[#44afa9] focus:ring-1 focus:ring-[#44afa9]"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-8 flex items-center gap-2.5 rounded-xl bg-[#64CCC5] px-6 py-3.5 font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(100,204,197,0.3)] transition hover:brightness-95 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
            Download CSV
          </button>
        </form>

        {/* Quick Stats */}
        <div className="grid content-start gap-4">
          <MetricCard label="Tracked Items" value={itemCount} icon="inventory_2" />
          <MetricCard label="Returned Items" value={returnedCount} icon="assignment_turned_in" />
          <MetricCard label="Suspended Accounts" value={blockedCount} icon="block" />
        </div>
      </div>
    </>
  );
}

function FlaggedPostsView({ accessToken }: { accessToken: string }) {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState<Record<string, ReportDetail[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<FlaggedPost | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchFlaggedPostsAction(accessToken)
      .then((data) => setFlaggedPosts(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reports.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function loadDetails(postId: string) {
    if (expandedPostId === postId) { setExpandedPostId(null); return; }
    setExpandedPostId(postId);
    if (reportDetails[postId]) return;
    setLoadingDetails(postId);
    try {
      const details = await fetchPostReportDetailsAction(accessToken, postId);
      setReportDetails((prev) => ({ ...prev, [postId]: details }));
    } catch { /* silently fail */ }
    setLoadingDetails(null);
  }

  async function handleDismiss(postId: string) {
    setActionBusy(postId + '-dismiss');
    try {
      await dismissReportsAction(accessToken, postId);
      setFlaggedPosts((prev) => prev.filter((p) => p.post_id !== postId));
      setNotice('Reports dismissed. Post remains visible.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss.');
    }
    setActionBusy(null);
  }

  async function handleDelete(post: FlaggedPost) {
    if (!deleteReason.trim()) return;
    setActionBusy(post.post_id + '-delete');
    try {
      await actionReportDeletePostAction(accessToken, post.post_id, deleteReason.trim());
      setFlaggedPosts((prev) => prev.filter((p) => p.post_id !== post.post_id));
      setNotice(`Post deleted and all reports marked as Actioned.`);
      setDeleteModal(null);
      setDeleteReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post.');
    }
    setActionBusy(null);
  }

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Content Moderation"
        title="Flagged Posts"
        description="User-submitted reports of suspicious or inappropriate posts. Review each report and take action."
      />

      {notice && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[#44afa9]/25 bg-[#8df4ec]/20 px-5 py-4 text-sm font-bold text-[#002433]">
          {notice}
          <button onClick={() => setNotice(null)} className="text-[#41484c] hover:text-[#002433]">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => <div key={n} className="h-24 rounded-xl bg-white" />)}
        </div>
      ) : flaggedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#002433]/10 bg-white py-20 text-center">
          <span className="material-symbols-outlined mb-3 text-5xl text-[#41484c]/25">verified_user</span>
          <p className="font-bold text-[#41484c]/50">No flagged posts. The board looks clean.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flaggedPosts.map((post) => {
            const ref = `AC-${post.post_id.substring(0, 4).toUpperCase()}`;
            const [title] = (post.general_description || '').split('\n\n');
            const isExpanded = expandedPostId === post.post_id;
            const details = reportDetails[post.post_id] ?? [];

            return (
              <div key={post.post_id} className="overflow-hidden rounded-xl border border-[#002433]/5 bg-white shadow-[0_2px_8px_rgba(0,36,51,0.04)]">
                {/* Row header */}
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Report count badge */}
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-red-50">
                      <span className="text-xl font-black text-[#ba1a1a]">{post.total_reports}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#ba1a1a]/60">reports</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[#002433]">{title || 'Unknown Item'}</p>
                        <span className="rounded bg-[#002433]/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#41484c]">{ref}</span>
                        <StatusPill status={post.item_status as ItemStatus} />
                      </div>
                      <p className="mt-1 text-xs text-[#41484c]/60">
                        Posted by {post.original_poster_name || 'Unknown'} · {post.original_poster_email || ''}
                      </p>
                      <p className="text-[10px] font-semibold text-[#41484c]/40 mt-0.5">
                        Last report: {new Date(post.latest_report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => loadDetails(post.post_id)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#002433]/10 px-3 py-2 text-xs font-bold text-[#41484c] transition hover:bg-[#f5f3f3]"
                    >
                      <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                      {isExpanded ? 'Hide' : 'View Reports'}
                    </button>
                    <button
                      onClick={() => handleDismiss(post.post_id)}
                      disabled={actionBusy === post.post_id + '-dismiss'}
                      className="flex items-center gap-1.5 rounded-lg border border-[#002433]/10 px-3 py-2 text-xs font-bold text-[#41484c] transition hover:bg-[#f5f3f3] disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Dismiss
                    </button>
                    <button
                      onClick={() => { setDeleteModal(post); setDeleteReason(''); }}
                      disabled={actionBusy === post.post_id + '-delete'}
                      className="flex items-center gap-1.5 rounded-lg bg-[#ba1a1a] px-3 py-2 text-xs font-bold text-white transition hover:brightness-105 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete Post
                    </button>
                  </div>
                </div>

                {/* Expanded report details */}
                {isExpanded && (
                  <div className="border-t border-[#002433]/5 bg-[#f5f3f3] px-5 py-4">
                    {loadingDetails === post.post_id ? (
                      <p className="text-xs font-semibold text-[#41484c]/50">Loading report details…</p>
                    ) : details.length === 0 ? (
                      <p className="text-xs font-semibold text-[#41484c]/50">No details available.</p>
                    ) : (
                      <div className="space-y-3">
                        {details.map((d) => {
                          const reporter = Array.isArray(d.reporter) ? d.reporter[0] : d.reporter;
                          return (
                            <div key={d.report_id} className="rounded-lg bg-white p-3 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#ba1a1a]">{d.reason}</span>
                                  <span className="text-[10px] font-semibold text-[#41484c]/50">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#41484c]/40">{d.status}</span>
                              </div>
                              {d.details && <p className="mt-1.5 text-xs text-[#41484c]">{d.details}</p>}
                              <p className="mt-1 text-[10px] text-[#41484c]/50">By: {reporter?.full_name || reporter?.email || 'Anonymous'}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#002433]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,36,51,0.2)]">
            <div className="flex items-center justify-between bg-[#ba1a1a] px-6 py-5">
              <div>
                <h2 className="font-headline text-xl font-bold text-white">Delete Post</h2>
                <p className="mt-0.5 text-sm text-red-100">This will purge the post and action all reports.</p>
              </div>
              <button onClick={() => setDeleteModal(null)} className="text-red-100 hover:text-white">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-[#f5f3f3] p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#41484c]/60">Post</p>
                <p className="mt-1 text-sm font-bold text-[#002433] line-clamp-2">{(deleteModal.general_description || '').split('\n\n')[0]}</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#41484c]">Deletion Reason <span className="text-[#ba1a1a]">*</span></span>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  placeholder="State the reason for removing this post..."
                  className="w-full rounded-md border border-[#002433]/10 bg-[#f5f3f3] px-4 py-3 text-sm outline-none focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]"
                />
              </label>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteModal(null)} className="rounded-md border border-[#002433]/10 px-5 py-3 text-sm font-bold text-[#41484c] hover:bg-[#f5f3f3]">Cancel</button>
                <button
                  onClick={() => handleDelete(deleteModal)}
                  disabled={!deleteReason.trim() || actionBusy === deleteModal.post_id + '-delete'}
                  className="rounded-md bg-[#ba1a1a] px-5 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionBusy === deleteModal.post_id + '-delete' ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VerifyModal({ item, busy, onClose, onSubmit }: { item: LostItem; busy: boolean; onClose: () => void; onSubmit: (item: LostItem, claimantName: string, studentId: string) => void }) {
  const [claimantName, setClaimantName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [visualConfirmed, setVisualConfirmed] = useState(false);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(item, claimantName, studentId);
  }

  return (
    <ModalShell title="Claim Audit Protocol" subtitle="Verification Step 2 of 2" onClose={onClose}>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Visual Evidence</label>
            <div className="relative h-64 overflow-hidden rounded-lg bg-surface-container">
              <ItemImage item={item} />
              <span className="absolute right-4 top-4 rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold text-on-tertiary-fixed">Unredacted View</span>
            </div>
          </div>
          <div>
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Security Artifact</label>
            <div className="relative h-64 overflow-hidden rounded-lg bg-surface-container-low p-6">
              <div className="absolute left-0 top-0 h-full w-2 bg-secondary" />
              <h3 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold text-secondary">
                <span className="material-symbols-outlined">lock</span>
                Hidden Note
              </h3>
              <p className="leading-7 text-on-surface">{item.hidden_note || "No hidden note provided."}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-surface-container-low p-6">
          <div className="grid gap-4 border-b border-surface-variant/50 pb-6 md:grid-cols-2">
            <Field label="Claimant Name" value={claimantName} onChange={setClaimantName} required />
            <Field label="Student ID" value={studentId} onChange={setStudentId} required />
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-on-surface-variant">
            <input type="checkbox" checked={visualConfirmed} onChange={(event) => setVisualConfirmed(event.target.checked)} className="mt-1 h-5 w-5 rounded border-outline-variant text-[#44afa9]" />
            I confirm visual features match the hidden note description exactly.
          </label>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-on-surface-variant">
            <input type="checkbox" checked={identityConfirmed} onChange={(event) => setIdentityConfirmed(event.target.checked)} className="mt-1 h-5 w-5 rounded border-outline-variant text-[#44afa9]" />
            Digital E-Signature provided and identity verified via institutional credentials.
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md px-5 py-3 font-bold text-on-surface-variant transition hover:bg-surface-container-low">Cancel</button>
          <button disabled={busy || !visualConfirmed || !identityConfirmed || !claimantName || !studentId} className="rounded-md bg-[#44afa9] px-5 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
            Confirm Return
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AccountModal({ mode, user, busy, onClose, onSubmit }: { mode: "suspend" | "restore"; user: AdminProfile; busy: boolean; onClose: () => void; onSubmit: (user: AdminProfile, blocked: boolean, reason: string) => void }) {
  const [reason, setReason] = useState("");
  const isSuspend = mode === "suspend";

  return (
    <ModalShell title={isSuspend ? "Suspend Account" : "Restore Account"} subtitle={user.email ?? "NEU account"} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-7 text-on-surface-variant">
          {isSuspend ? "Suspending this account prevents the user from signing in and interacting with the board." : "Restoring this account re-enables sign-in and board access."}
        </p>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Administrative reason..." className="min-h-32 w-full rounded-lg border border-outline-variant/30 bg-surface p-4 outline-none focus:ring-2 focus:ring-[#44afa9]" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-5 py-3 font-bold text-on-surface-variant transition hover:bg-surface-container-low">Cancel</button>
          <button onClick={() => onSubmit(user, isSuspend, reason)} disabled={busy || !reason.trim()} className={`rounded-md px-5 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${isSuspend ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-container"}`}>
            {isSuspend ? "Suspend Account" : "Restore Account"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function HistoryModal({ user, items, onClose }: { user: AdminProfile; items: LostItem[]; onClose: () => void }) {
  return (
    <ModalShell title="Posting History" subtitle={user.email ?? "NEU account"} onClose={onClose}>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.post_id} className="flex items-center justify-between rounded-lg border border-outline-variant/15 bg-surface p-4">
            <div>
              <p className="font-bold text-primary">{itemTitle(item)}</p>
              <p className="text-xs text-on-surface-variant">{reference(item.post_id)} · {formatDate(item.created_timestamp)}</p>
            </div>
            <StatusPill status={item.status} />
          </div>
        ))}
        {items.length === 0 && <EmptyState label="This user has no posting history." />}
      </div>
    </ModalShell>
  );
}

function DisposeModal({ item, busy, onClose, onSubmit }: { item: LostItem; busy: boolean; onClose: () => void; onSubmit: (item: LostItem, method: string, reason: string) => void }) {
  const [method, setMethod] = useState("Institutional Storage Disposal");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ModalShell title="Initiate Disposal Audit" subtitle={reference(item.post_id)} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-lg bg-red-50 p-4 text-sm leading-7 text-red-800">
          This operation changes the item status to Purged and removes it from active public and staff queues.
        </div>
        <Field label="Disposal Method" value={method} onChange={setMethod} required />
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Audit rationale and handling notes..." className="min-h-32 w-full rounded-lg border border-outline-variant/30 bg-surface p-4 outline-none focus:ring-2 focus:ring-[#44afa9]" />
        <label className="flex cursor-pointer items-start gap-3 text-sm text-on-surface-variant">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5 rounded border-outline-variant text-red-600" />
          I confirm the retention window has elapsed and disposal authorization is documented.
        </label>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-5 py-3 font-bold text-on-surface-variant transition hover:bg-surface-container-low">Cancel</button>
          <button onClick={() => onSubmit(item, method, reason)} disabled={busy || !confirmed || !reason.trim()} className="rounded-md bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            Approve Disposal
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function AdminDeleteModal({ item, busy, onClose, onSubmit }: { item: LostItem; busy: boolean; onClose: () => void; onSubmit: (item: LostItem, reason: string) => void }) {
  const [reason, setReason] = useState("");

  return (
    <ModalShell title="Delete Post" subtitle={reference(item.post_id)} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-lg bg-red-50 p-4 text-sm leading-7 text-red-800">
          This operation changes the item status to Purged and hides it from the public board. The original poster will see this deletion reason in their archive.
        </div>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Administrative deletion reason (required)..." className="min-h-32 w-full rounded-lg border border-outline-variant/30 bg-surface p-4 outline-none focus:ring-2 focus:ring-[#44afa9]" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-5 py-3 font-bold text-on-surface-variant transition hover:bg-surface-container-low">Cancel</button>
          <button onClick={() => onSubmit(item, reason)} disabled={busy || !reason.trim()} className="rounded-md bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            Delete Post
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ReviewPostModal({ item, onClose }: { item: LostItem; onClose: () => void }) {
  const [title, ...descParts] = (item.general_description || "").split("\n\n");
  const description = descParts.join("\n\n");

  return (
    <ModalShell title="Review Post" subtitle={reference(item.post_id)} onClose={onClose}>
      <div className="space-y-6">
        <div>
          {item.image_url ? (
            <div className="h-64 overflow-hidden rounded-lg border border-outline-variant/15 bg-surface-container shadow-sm">
              <img src={item.image_url} alt={title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="grid h-64 place-items-center rounded-lg border border-outline-variant/15 bg-surface-container-low text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl">image_not_supported</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-primary">{title || "Item Details"}</h3>
          <StatusPill status={item.status} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Location</span>
            <p className="font-semibold text-primary">{item.zone || "Unknown"}</p>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</span>
            <p className="font-semibold text-primary">{categoryName(item)}</p>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Color</span>
            <p className="font-semibold text-primary">{item.color || "None"}</p>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bin Number</span>
            <p className="font-semibold text-primary">{item.bin_number || "None"}</p>
          </div>
        </div>
        {description && (
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Detailed Description</span>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{description}</p>
          </div>
        )}
        {item.hidden_note && (
          <div className="rounded-lg border border-[#44afa9]/30 bg-[#8df4ec]/10 p-4">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#44afa9]">
              <span className="material-symbols-outlined text-sm">lock</span>
              Hidden Security Note
            </span>
            <p className="text-sm leading-relaxed text-primary">{item.hidden_note}</p>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="rounded-md bg-surface-container-low px-5 py-3 font-bold text-primary transition hover:bg-surface-container-high">Close Review</button>
        </div>
      </div>
    </ModalShell>
  );
}

function EllipsisMenu({ onVerify, onReview, onDelete }: { onVerify?: () => void; onReview: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
      >
        <span className="material-symbols-outlined text-2xl">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-lg border border-outline-variant/20 bg-white shadow-lg">
          <div className="flex flex-col py-1">
            {onVerify && (
              <button
                onClick={() => {
                  setOpen(false);
                  onVerify();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-container-low text-left"
              >
                <span className="material-symbols-outlined text-[20px]">verified</span>
                Verify Claim
              </button>
            )}
            <button
              onClick={() => {
                setOpen(false);
                onReview();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-container-low text-left"
            >
              <span className="material-symbols-outlined text-[20px]">visibility</span>
              Review Post
            </button>
            <div className="my-1 h-px w-full bg-outline-variant/20" />
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 text-left"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              Delete Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-8">
      <span className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{eyebrow}</span>
      <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">{description}</p>
    </header>
  );
}

function ModalShell({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002433]/30 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-[0_20px_40px_rgba(0,36,51,0.18)]">
        <div className="flex items-center justify-between bg-primary-container px-8 py-6">
          <div>
            <h2 className="font-headline text-2xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-on-primary-container">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-on-primary-container transition hover:text-white">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-8">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full rounded-md border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-[#44afa9]" />
    </label>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <span className="material-symbols-outlined text-3xl text-[#44afa9]">{icon}</span>
      <p className="mt-4 text-3xl font-black text-primary">{value}</p>
      <p className="text-sm font-semibold text-on-surface-variant">{label}</p>
    </div>
  );
}

function AccessState({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface-container-low p-8">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <span className="material-symbols-outlined text-5xl text-red-600">lock</span>
        <h1 className="mt-4 font-headline text-2xl font-black text-primary">Admin Access Required</h1>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">{message}</p>
        <Link href="/board" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 font-bold text-white">Return to Board</Link>
      </div>
    </main>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-10 text-center text-on-surface-variant">
      <span className="material-symbols-outlined mb-3 text-5xl opacity-40">inbox</span>
      <p className="font-semibold">{label}</p>
    </div>
  );
}

function ItemThumb({ item }: { item: LostItem }) {
  return (
    <div className="h-16 w-16 overflow-hidden rounded-md border border-outline-variant/20 bg-surface-container">
      <ItemImage item={item} />
    </div>
  );
}

function ItemImage({ item }: { item: LostItem }) {
  if (item.image_url) {
    return <img src={item.image_url} alt={itemTitle(item)} className="h-full w-full object-cover" />;
  }

  return (
    <div className="grid h-full w-full place-items-center bg-surface-container-high text-primary">
      <span className="material-symbols-outlined">{categoryIcon(item)}</span>
    </div>
  );
}

function BinBadge({ bin }: { bin: string | null }) {
  return (
    <div className="inline-flex w-fit items-center gap-1.5 rounded-sm bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed">
      <span className="material-symbols-outlined text-xs">inventory_2</span>
      {bin || "No Bin"}
    </div>
  );
}

function StatusPill({ status }: { status: ItemStatus }) {
  const classes = {
    Reported: "bg-primary-fixed text-on-primary-fixed",
    Found: "bg-[#8df4ec]/35 text-primary",
    Returned: "bg-green-50 text-green-700",
    Released: "bg-emerald-50 text-emerald-700",
    Purged: "bg-red-50 text-red-700",
  }[status];
  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${classes}`}>{status}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-fixed text-xs font-black text-on-primary-fixed-variant">{initials || "NE"}</div>;
}

function itemTitle(item: LostItem) {
  return item.general_description?.split("\n\n")[0] || categoryName(item) || "Unknown Item";
}

function categoryName(item: LostItem) {
  const category = Array.isArray(item.categories) ? item.categories[0] : item.categories;
  return category?.name ?? "Uncategorized";
}

function categoryIcon(item: LostItem) {
  const category = Array.isArray(item.categories) ? item.categories[0] : item.categories;
  return resolveIcon(category?.icon_identifier, "inventory_2");
}

function reference(id: string) {
  return `AC-${id.substring(0, 4).toUpperCase()}`;
}

function shortId(id: string | null) {
  return id ? id.substring(0, 8) : "N/A";
}

function itemAgeDays(item: LostItem) {
  const created = new Date(item.created_timestamp).getTime();
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function stateSummary(state: Record<string, unknown> | null) {
  if (!state) return "No notes";
  return Object.entries(state)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

function reportRows(type: string, startDate: string, endDate: string, items: LostItem[], users: AdminProfile[], logs: AuditLog[]) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime() + 86_399_999;

  if (type === "User Activity") {
    return [
      ["Name", "Email", "Role", "Status"],
      ...users.map((user) => [user.full_name ?? "", user.email ?? "", user.role, user.is_blocked ? "Suspended" : "Active"]),
    ];
  }

  if (type === "Audit Logs") {
    return [
      ["Timestamp", "Staff ID", "Action", "Category", "Post ID", "Notes"],
      ...logs
        .filter((log) => inRange(log.created_at, start, end))
        .map((log) => [
          log.created_at,
          log.actor_id ?? "",
          log.action,
          getAuditCategoryLabel(log),
          getAuditTargetValue(log),
          stateSummary(log.new_state),
        ]),
    ];
  }

  if (type === "Disposal Manifest") {
    return [
      ["Reference", "Title", "Status", "Bin", "Age Days"],
      ...items
        .filter((item) => item.status === "Purged" || itemAgeDays(item) >= 120)
        .map((item) => [reference(item.post_id), itemTitle(item), item.status, item.bin_number ?? "", String(itemAgeDays(item))]),
    ];
  }

  return [
    ["Reference", "Title", "Category", "Status", "Zone", "Bin", "Created"],
    ...items
      .filter((item) => inRange(item.created_timestamp, start, end))
      .map((item) => [reference(item.post_id), itemTitle(item), categoryName(item), item.status, item.zone ?? "", item.bin_number ?? "", item.created_timestamp]),
  ];
}

function inRange(value: string, start: number, end: number) {
  const time = new Date(value).getTime();
  return time >= start && time <= end;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
