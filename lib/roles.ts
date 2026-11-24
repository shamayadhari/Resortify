export const ROLES = [
  "citizen",
  "scrap_dealer",
  "recycler",
  "collection_partner",
  "ngo",
  "organization",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  citizen: "Citizen",
  scrap_dealer: "Scrap dealer",
  recycler: "Recycler",
  collection_partner: "Collection partner",
  ngo: "NGO",
  organization: "Business / College",
  admin: "Administrator",
};

/** Roles that can register in the current phase. */
export const REGISTRABLE_ROLES: Role[] = ["citizen"];

/** Roles whose dashboards exist in the current phase. */
export const ROLES_WITH_DASHBOARD: Role[] = ["citizen"];

export function hasDashboard(role: string | undefined | null): boolean {
  return !!role && (ROLES_WITH_DASHBOARD as string[]).includes(role);
}
