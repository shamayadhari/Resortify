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

/** Roles that can register from the sign-up form. Administrators are created on the server. */
export const REGISTRABLE_ROLES: Role[] = ROLES.filter((r) => r !== "admin");

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  citizen: "Report items, get pickups, sell, donate and earn rewards.",
  scrap_dealer: "Buy items, publish your rates and make offers.",
  recycler: "Receive deliveries, process items and issue certificates.",
  collection_partner: "Collect from doorsteps and deliver to recyclers.",
  ngo: "Post what you need and receive donated devices.",
  organization: "Run bulk collection drives for your business or college.",
  admin: "Verify partners and oversee the platform.",
};

/** Partner roles act only after an administrator verifies them. */
export const PARTNER_ROLES: Role[] = ["scrap_dealer", "recycler", "collection_partner", "ngo"];

/** Every role has a dashboard now. */
export const ROLES_WITH_DASHBOARD: Role[] = [...ROLES];

export function hasDashboard(role: string | undefined | null): boolean {
  return !!role && (ROLES_WITH_DASHBOARD as string[]).includes(role);
}
