"use client";

import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { fetchAdminData } from "./actions/fetchData";
import { verifyClaimAction, disposeItemAction, adminDeletePostAction } from "./actions/items";
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

type AdminTab = "vault" | "users" | "claims" | "disposal" | "audit" | "reports";
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
  { id: "vault", label: "Secure Vault", icon: "enhanced_encryption" },
  { id: "users", label: "User Management", icon: "group" },
  { id: "claims", label: "My Post Claims", icon: "assignment" },
  { id: "disposal", label: "Disposal Queue", icon: "delete_sweep" },
  { id: "audit", label: "Audit Trail", icon: "history_edu" },
  { id: "reports", label: "Reports", icon: "summarize" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("vault");
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

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setError("No valid access token available.");
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAdminData(accessToken);
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
      <main className="min-h-screen bg-surface-container-low p-8 pt-24">
        <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-xl bg-white shadow-sm" />
      </main>
    );
  }

  if (error && !profile) {
    return <AccessState message={error} />;
  }

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <header className="fixed top-0 z-[60] flex h-16 w-full items-center justify-between bg-[#053B50]/90 px-4 text-white shadow-[0_20px_40px_rgba(0,36,51,0.06)] backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={36} height={36} className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-all duration-300 will-change-transform" />
          <span className="font-headline text-lg font-black tracking-tight drop-shadow-md">NEUvigate Admin</span>
        </div>
        <div className="hidden max-w-md flex-1 px-8 md:block">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45">search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vault, users, logs..."
              className="w-full rounded-full border border-white/10 bg-white/10 py-2 pl-10 pr-4 text-sm text-white outline-none transition focus:ring-2 focus:ring-[#44afa9] placeholder:text-white/45"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/board" className="hidden rounded-full px-3 py-2 text-sm font-bold text-white/70 transition hover:text-white md:inline-flex">
            Board
          </Link>
          <button onClick={handleLogout} className="rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Logout">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 flex-col border-r border-outline-variant/20 bg-white p-6 pt-20 shadow-xl shadow-[#002433]/5 md:flex">
        <div className="mb-8 flex items-center gap-4 px-2">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-container text-white">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="font-headline text-sm font-bold text-primary">Admin Console</h2>
            <p className="text-xs text-on-surface-variant">System Oversight</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 font-label text-[11px] font-bold uppercase tracking-widest">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-left transition ${
                activeTab === tab.id
                  ? "translate-x-1 bg-[#44afa9]/10 text-[#44afa9]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setActiveTab("reports")} className="mt-auto flex w-full items-center justify-center gap-2 rounded-md bg-primary-container py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary">
          <span className="material-symbols-outlined text-base">summarize</span>
          Generate Report
        </button>
      </aside>

      <main className="px-4 pb-24 pt-24 md:ml-72 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                  activeTab === tab.id ? "bg-primary text-white" : "bg-white text-slate-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {notice && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-[#44afa9]/25 bg-[#8df4ec]/20 px-4 py-3 text-sm font-semibold text-primary">
              {notice}
              <button onClick={() => setNotice(null)} className="text-on-surface-variant">Dismiss</button>
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {activeTab === "vault" && <VaultView items={activeItems} onReview={(item) => setModal({ type: "reviewPost", item })} onDelete={(item) => setModal({ type: "adminDelete", item })} />}
          {activeTab === "users" && <UsersView users={filteredUsers} items={items} onSuspend={(user) => setModal({ type: "suspend", user })} onRestore={(user) => setModal({ type: "restore", user })} onHistory={(user) => setModal({ type: "history", user })} />}
          {activeTab === "claims" && <ClaimsDeskView entries={ownedClaimEntries} />}
          {activeTab === "disposal" && <DisposalView items={disposalItems} onDispose={(item) => setModal({ type: "dispose", item })} />}
          {activeTab === "audit" && <AuditView logs={auditLogs} />}
          {activeTab === "reports" && <ReportsView itemCount={items.length} returnedCount={returnedItems.length} blockedCount={blockedUsers.length} onExport={exportReport} />}
        </div>
      </main>

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
      <PageHeader eyebrow="System Logs" title="Audit Trail" description="Student-to-student claim logs appear only after the handoff is completed, while student-to-admin claims remain visible throughout the office flow." />
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

function ReportsView({ itemCount, returnedCount, blockedCount, onExport }: { itemCount: number; returnedCount: number; blockedCount: number; onExport: (type: string, startDate: string, endDate: string) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState("User Activity");
  const [startDate, setStartDate] = useState(today.slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(today);

  return (
    <>
      <PageHeader eyebrow="Institutional Export" title="System Reports" description="Configure and export institutional data parameters." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onExport(type, startDate, endDate);
          }}
          className="rounded-xl bg-white p-8 shadow-[0_20px_40px_rgba(0,36,51,0.06)]"
        >
          <label className="mb-3 block font-headline text-lg font-bold text-primary">Report Parameter</label>
          <select value={type} onChange={(event) => setType(event.target.value)} className="mb-8 w-full rounded-md border border-outline-variant/30 bg-surface py-3.5 pl-4 pr-10 text-on-surface outline-none focus:ring-2 focus:ring-[#44afa9]">
            <option>User Activity</option>
            <option>Audit Logs</option>
            <option>Disposal Manifest</option>
          </select>
          <label className="mb-3 block font-headline text-lg font-bold text-primary">Temporal Range</label>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-md border border-outline-variant/30 bg-surface px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#44afa9]" />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-md border border-outline-variant/30 bg-surface px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#44afa9]" />
          </div>
          <button className="mt-8 flex items-center justify-center gap-2 rounded-md bg-[#64CCC5] px-6 py-3 font-bold uppercase tracking-wider text-white shadow-lg shadow-[#64CCC5]/20 transition hover:brightness-95">
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </form>
        <div className="grid gap-4">
          <MetricCard label="Tracked Items" value={itemCount} icon="inventory_2" />
          <MetricCard label="Returned Items" value={returnedCount} icon="assignment_turned_in" />
          <MetricCard label="Suspended Accounts" value={blockedCount} icon="block" />
        </div>
      </div>
    </>
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
  return category?.icon_identifier ?? "inventory_2";
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
