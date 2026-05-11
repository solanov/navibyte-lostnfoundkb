export type ClaimFlowType = "P2P" | "Office";
export type ClaimStatus = "Pending" | "Approved" | "Rejected" | "Released";

type CategoryShape =
  | {
      name?: string | null;
      icon_identifier?: string | null;
    }
  | Array<{
      name?: string | null;
      icon_identifier?: string | null;
    }>
  | null
  | undefined;

export interface ClaimOverviewItemRow {
  post_id: string;
  general_description: string | null;
  status: string;
  zone: string | null;
  reported_by: string;
  created_timestamp?: string | null;
  categories?: CategoryShape;
}

export interface ClaimOverviewRequestRow {
  claim_id: string;
  post_id: string;
  flow_type: ClaimFlowType;
  status: ClaimStatus;
  created_at: string;
  updated_at: string;
}

export interface ClaimOverviewEntry {
  postId: string;
  title: string;
  zone: string;
  itemStatus: string;
  categoryName: string;
  iconIdentifier: string;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  releasedClaims: number;
  latestClaimAt: string;
  latestClaimStatus: ClaimStatus;
  latestFlowType: ClaimFlowType;
}

function normalizeCategory(categories: CategoryShape) {
  if (!categories) {
    return null;
  }

  return Array.isArray(categories) ? categories[0] ?? null : categories;
}

export function getClaimOverviewTitle(item: Pick<ClaimOverviewItemRow, "general_description">) {
  return item.general_description?.split("\n\n")[0]?.trim() || "Untitled item";
}

export function buildOwnedClaimOverview(
  items: ClaimOverviewItemRow[],
  claims: ClaimOverviewRequestRow[],
  ownerId: string
) {
  const claimsByPostId = new Map<string, ClaimOverviewRequestRow[]>();

  claims.forEach((claim) => {
    const grouped = claimsByPostId.get(claim.post_id) || [];
    grouped.push(claim);
    claimsByPostId.set(claim.post_id, grouped);
  });

  return items
    .filter((item) => item.reported_by === ownerId)
    .map((item) => {
      const groupedClaims = (claimsByPostId.get(item.post_id) || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (groupedClaims.length === 0) {
        const category = normalizeCategory(item.categories);
        return {
          postId: item.post_id,
          title: getClaimOverviewTitle(item),
          zone: item.zone || "Unknown location",
          itemStatus: item.status,
          categoryName: category?.name || "Uncategorized",
          iconIdentifier: category?.icon_identifier || "assignment",
          totalClaims: 0,
          pendingClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
          releasedClaims: 0,
          latestClaimAt: item.created_timestamp || new Date().toISOString(),
          latestClaimStatus: "Pending" as ClaimStatus,
          latestFlowType: "P2P" as ClaimFlowType,
        } satisfies ClaimOverviewEntry;
      }

      const latestClaim = groupedClaims[0];
      const category = normalizeCategory(item.categories);

      return {
        postId: item.post_id,
        title: getClaimOverviewTitle(item),
        zone: item.zone || "Unknown location",
        itemStatus: item.status,
        categoryName: category?.name || "Uncategorized",
        iconIdentifier: category?.icon_identifier || "assignment",
        totalClaims: groupedClaims.length,
        pendingClaims: groupedClaims.filter((claim) => claim.status === "Pending").length,
        approvedClaims: groupedClaims.filter((claim) => claim.status === "Approved").length,
        rejectedClaims: groupedClaims.filter((claim) => claim.status === "Rejected").length,
        releasedClaims: groupedClaims.filter((claim) => claim.status === "Released").length,
        latestClaimAt: latestClaim.created_at,
        latestClaimStatus: latestClaim.status,
        latestFlowType: latestClaim.flow_type,
      } satisfies ClaimOverviewEntry;
    })
    .filter((entry): entry is ClaimOverviewEntry => entry !== null)
    .sort(
      (a, b) => new Date(b.latestClaimAt).getTime() - new Date(a.latestClaimAt).getTime()
    );
}
