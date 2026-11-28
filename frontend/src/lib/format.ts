import type { Condition, ItemStatus, PickupStatus } from "@/services/models";

export const inr = (n: number | null | undefined) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;
export const inrRange = (r: { min: number; max: number } | null | undefined) =>
  r ? (r.max <= 0 ? "₹0" : `${inr(r.min)} – ${inr(r.max)}`) : "—";
export const kg = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n * 100) / 100} kg`;
export const dateLabel = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
export const dateTimeLabel = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const ITEM_STATUS: Record<ItemStatus, { label: string; tone: Tone }> = {
  reported: { label: "Reported", tone: "neutral" },
  pickup_requested: { label: "Pickup requested", tone: "info" },
  collected: { label: "Collected", tone: "info" },
  delivered: { label: "At recycler", tone: "info" },
  processed: { label: "Recycled", tone: "success" },
  listed: { label: "Listed for sale", tone: "info" },
  donation_pending: { label: "Donation pending", tone: "warning" },
  sold: { label: "Sold", tone: "success" },
  donated: { label: "Donated", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};
export const PICKUP_STATUS: Record<PickupStatus, { label: string; tone: Tone }> = {
  requested: { label: "Waiting for a collector", tone: "warning" },
  accepted: { label: "Collector assigned", tone: "info" },
  on_the_way: { label: "On the way", tone: "info" },
  collected: { label: "Collected", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};
export const CONDITION_LABEL: Record<Condition, string> = {
  working: "Working",
  repairable: "Needs repair",
  not_working: "Not working",
};
export const SLOT_LABEL = {
  morning: "Morning (8–12)",
  afternoon: "Afternoon (12–4)",
  evening: "Evening (4–8)",
} as const;
export const FREQUENCY_LABEL = {
  once: "One time",
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
} as const;
export const FACILITY_LABEL = {
  recycler: "Recycler",
  scrap_dealer: "Scrap dealer",
  ngo: "NGO",
  collection_point: "Collection point",
} as const;

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-accent text-accent-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/30 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export const idOf = (v: { _id: string } | string | null | undefined) =>
  typeof v === "string" ? v : (v?._id ?? "");
export const nameOf = (v: { name: string } | string | null | undefined) =>
  typeof v === "string" || !v ? "" : v.name;
export const today = () => new Date().toISOString().slice(0, 10);
