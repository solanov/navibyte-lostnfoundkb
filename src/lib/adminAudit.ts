export type AuditState = Record<string, unknown> | null;

export type AuditLogRecord = {
  log_id: number;
  post_id: string | null;
  actor_id: string | null;
  action: string;
  previous_state: AuditState;
  new_state: AuditState;
  created_at: string;
};

export type AuditCategoryKey =
  | "claims"
  | "deleted_items"
  | "returns"
  | "disposal"
  | "user_accounts"
  | "other";

export const AUDIT_CATEGORY_LABELS: Record<AuditCategoryKey, string> = {
  claims: "Claims",
  deleted_items: "Deleted Items",
  returns: "Returns",
  disposal: "Disposal",
  user_accounts: "User Accounts",
  other: "Other Activity",
};

function readStateValue(state: AuditState, key: string) {
  return state && key in state ? state[key] : null;
}

export function getAuditLogFlowType(log: Pick<AuditLogRecord, "action" | "previous_state" | "new_state">) {
  const newFlow = readStateValue(log.new_state, "flow_type");
  if (newFlow === "P2P" || newFlow === "Office") {
    return newFlow;
  }

  const previousFlow = readStateValue(log.previous_state, "flow_type");
  if (previousFlow === "P2P" || previousFlow === "Office") {
    return previousFlow;
  }

  if (log.action.startsWith("P2P_")) return "P2P";
  if (log.action.startsWith("OFFICE_") || log.action === "CLAIM_VERIFIED") {
    return "Office";
  }

  return null;
}

function getClaimOutcome(state: AuditState) {
  const claimStatus = readStateValue(state, "claim_status");
  if (typeof claimStatus === "string") return claimStatus;

  const status = readStateValue(state, "status");
  return typeof status === "string" ? status : null;
}

function isClaimAuditLog(log: Pick<AuditLogRecord, "action" | "previous_state" | "new_state">) {
  if (getAuditLogFlowType(log)) {
    return true;
  }

  if (
    typeof readStateValue(log.new_state, "claim_id") === "string" ||
    typeof readStateValue(log.previous_state, "claim_id") === "string"
  ) {
    return true;
  }

  if (
    typeof readStateValue(log.new_state, "claim_status") === "string" ||
    typeof readStateValue(log.previous_state, "claim_status") === "string"
  ) {
    return true;
  }

  return log.action.startsWith("CLAIM_") ||
    log.action.startsWith("P2P_") ||
    log.action.startsWith("OFFICE_");
}

export function isAuditLogVisibleToAdmin(log: Pick<AuditLogRecord, "action" | "previous_state" | "new_state">) {
  const flowType = getAuditLogFlowType(log);
  if (flowType !== "P2P") {
    return true;
  }

  const nextState = getClaimOutcome(log.new_state);
  const previousState = getClaimOutcome(log.previous_state);

  return ["Rejected", "Released", "Returned"].includes(nextState ?? "") ||
    ["Rejected", "Released", "Returned"].includes(previousState ?? "");
}

export function getAuditCategory(log: Pick<AuditLogRecord, "action" | "previous_state" | "new_state">): AuditCategoryKey {
  if (["POST_DELETED_BY_USER", "POST_DELETED_BY_ADMIN"].includes(log.action)) {
    return "deleted_items";
  }

  if (log.action === "DISPOSAL_APPROVED") {
    return "disposal";
  }

  if (["ACCOUNT_SUSPENDED", "ACCOUNT_RESTORED"].includes(log.action)) {
    return "user_accounts";
  }

  if (log.action === "POST_MARKED_RETURNED") {
    return "returns";
  }

  if (isClaimAuditLog(log)) {
    return "claims";
  }

  return "other";
}

export function getAuditCategoryLabel(log: Pick<AuditLogRecord, "action" | "previous_state" | "new_state">) {
  return AUDIT_CATEGORY_LABELS[getAuditCategory(log)];
}

export function getAuditTargetValue(
  log: Pick<AuditLogRecord, "post_id" | "action" | "previous_state" | "new_state">
) {
  if (log.post_id) {
    return log.post_id;
  }

  const newUserId = readStateValue(log.new_state, "user_id");
  if (typeof newUserId === "string" && newUserId.trim()) {
    return newUserId;
  }

  const previousUserId = readStateValue(log.previous_state, "user_id");
  if (typeof previousUserId === "string" && previousUserId.trim()) {
    return previousUserId;
  }

  const newClaimId = readStateValue(log.new_state, "claim_id");
  if (typeof newClaimId === "string" && newClaimId.trim()) {
    return newClaimId;
  }

  const previousClaimId = readStateValue(log.previous_state, "claim_id");
  if (typeof previousClaimId === "string" && previousClaimId.trim()) {
    return previousClaimId;
  }

  return log.action.startsWith("ACCOUNT_") ? "ACCOUNT" : "SYSTEM";
}
