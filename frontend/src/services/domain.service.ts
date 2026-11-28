import type { Role } from "@/lib/roles";

import { api } from "./api";
import type {
  AssistantAnswer,
  Catalog,
  Classification,
  Comment,
  Donation,
  Drive,
  DriveReport,
  Facility,
  Id,
  Impact,
  LifecycleEvent,
  Listing,
  MarketRate,
  MyRate,
  Need,
  Offer,
  Paged,
  PickupStatus,
  Pickup,
  PlatformAnalytics,
  Post,
  PriceEstimate,
  PublicTrack,
  Reward,
  RewardsMe,
  Summary,
  WasteItem,
} from "./models";
import type { User } from "./types";

type Params = Record<string, string | number | boolean | undefined | null>;
const clean = (p?: Params) =>
  Object.fromEntries(
    Object.entries(p ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
const get = async <T>(url: string, params?: Params) =>
  (await api.get<T>(url, { params: clean(params) })).data;
const post = async <T>(url: string, body?: unknown) => (await api.post<T>(url, body ?? {})).data;
const put = async <T>(url: string, body?: unknown) => (await api.put<T>(url, body ?? {})).data;
const patch = async <T>(url: string, body?: unknown) => (await api.patch<T>(url, body ?? {})).data;
const del = async <T>(url: string) => (await api.delete<T>(url)).data;

// ---- Phase 2 ----
export const itemsApi = {
  catalog: () => get<Catalog>("/catalog"),
  classify: (title: string, description: string) =>
    post<{ classification: Classification }>("/classify", { title, description }).then(
      (r) => r.classification,
    ),
  create: async (fields: Record<string, string | number | undefined>, files: File[]) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields))
      if (v !== undefined && v !== "") form.append(k, String(v));
    files.forEach((f) => form.append("images", f));
    return (await api.post<{ item: WasteItem }>("/items", form)).data.item;
  },
  list: (p?: Params) => get<Paged<WasteItem>>("/items", p),
  get: (id: Id) => get<{ item: WasteItem; events: LifecycleEvent[] }>(`/items/${id}`),
  update: (
    id: Id,
    body: Partial<
      Pick<WasteItem, "title" | "description" | "category" | "condition" | "weightKg" | "ageYears">
    >,
  ) => patch<{ item: WasteItem }>(`/items/${id}`, body),
  remove: (id: Id) => del(`/items/${id}`),
};

// ---- Phase 3 ----
export interface FacilityInput {
  name: string;
  type: string;
  description?: string | undefined;
  lat: number;
  lng: number;
  phone?: string | undefined;
  hours?: string | undefined;
  address: { line1: string; city: string; state?: string | undefined; pincode: string };
  acceptedCategories: string[];
  certifications: string[];
}
export const facilitiesApi = {
  search: (p?: Params) => get<{ items: Facility[] }>("/facilities", p).then((r) => r.items),
  mine: () => get<{ items: Facility[] }>("/facilities/mine").then((r) => r.items),
  create: (b: FacilityInput) => post<{ facility: Facility }>("/facilities", b),
  update: (id: Id, b: FacilityInput) => put<{ facility: Facility }>(`/facilities/${id}`, b),
  remove: (id: Id) => del(`/facilities/${id}`),
  adminList: (p?: Params) => get<Paged<Facility>>("/admin/facilities", p),
  verify: (id: Id, verified: boolean) =>
    post<{ facility: Facility }>(`/admin/facilities/${id}/verify`, { verified }),
};
export interface PickupInput {
  items: Id[];
  description?: string | undefined;
  address: { line1: string; city: string; state?: string | undefined; pincode: string };
  preferredDate: string;
  slot: string;
  frequency: string;
  estimatedWeightKg?: number | undefined;
  notes?: string | undefined;
}
export const pickupsApi = {
  list: (p?: Params) => get<Paged<Pickup>>("/pickups", p),
  get: (id: Id) => get<{ pickup: Pickup }>(`/pickups/${id}`).then((r) => r.pickup),
  create: (b: PickupInput) => post<{ pickup: Pickup }>("/pickups", b).then((r) => r.pickup),
  accept: (id: Id) => post<{ pickup: Pickup }>(`/pickups/${id}/accept`).then((r) => r.pickup),
  setStatus: (
    id: Id,
    b: {
      status: PickupStatus;
      note?: string | undefined;
      verifiedWeightKg?: number | undefined;
      payoutInr?: number | undefined;
      facilityId?: Id | undefined;
    },
  ) => post<{ pickup: Pickup }>(`/pickups/${id}/status`, b).then((r) => r.pickup),
  cancel: (id: Id) => post<{ pickup: Pickup }>(`/pickups/${id}/cancel`).then((r) => r.pickup),
};

// ---- Phase 4 ----
export const marketApi = {
  list: (p?: Params) => get<Paged<Listing>>("/marketplace", p),
  get: (id: Id) => get<{ listing: Listing; myOffer: Offer | null }>(`/marketplace/${id}`),
  create: (b: {
    itemId?: Id | undefined;
    title: string;
    description?: string | undefined;
    category: string;
    condition: string;
    weightKg: number;
    price: number;
  }) => post<{ listing: Listing }>("/marketplace", b),
  withdraw: (id: Id) => del(`/marketplace/${id}`),
  complete: (id: Id) => post<{ listing: Listing }>(`/marketplace/${id}/complete`),
  offer: (id: Id, b: { price: number; message?: string | undefined }) =>
    post<{ offer: Offer }>(`/marketplace/${id}/offers`, b),
  offers: (id: Id) => get<{ offers: Offer[] }>(`/marketplace/${id}/offers`).then((r) => r.offers),
  myOffers: () => get<{ offers: Offer[] }>("/marketplace/offers/mine").then((r) => r.offers),
  respond: (offerId: Id, accept: boolean) => post(`/offers/${offerId}/respond`, { accept }),
  withdrawOffer: (offerId: Id) => post(`/offers/${offerId}/withdraw`),
};
export const pricesApi = {
  estimate: (p: Params) => get<PriceEstimate>("/prices/estimate", p),
  market: (city?: string) => get<{ city: string; rates: MarketRate[] }>("/prices/market", { city }),
  mine: () => get<{ rates: MyRate[] }>("/prices/rates/mine").then((r) => r.rates),
  save: (rates: MyRate[]) => put<{ rates: MyRate[] }>("/prices/rates", { rates }),
};
export const recyclerApi = {
  items: (stage: "incoming" | "received" | "processed", p?: Params) =>
    get<Paged<WasteItem & { facility?: { name: string } }>>("/recycler/items", { stage, ...p }),
  receive: (id: Id, receivedWeightKg: number) =>
    post<{ item: WasteItem; weightMismatch: boolean }>(`/recycler/items/${id}/receive`, {
      receivedWeightKg,
    }),
  process: (id: Id, recoveredMaterials: { material: string; kg: number }[], note?: string) =>
    post<{ item: WasteItem }>(`/recycler/items/${id}/process`, { recoveredMaterials, note }),
};

// ---- Phase 5 ----
export const trackApi = {
  get: (code: string) => get<PublicTrack>(`/track/${encodeURIComponent(code)}`),
};
export const ngoApi = {
  ngos: (city?: string) =>
    get<{ ngos: Pick<User, "_id" | "name" | "address" | "avatarUrl">[] }>("/ngos", { city }).then(
      (r) => r.ngos,
    ),
  needs: (p?: Params) => get<Paged<Need>>("/needs", p),
  createNeed: (b: {
    title: string;
    description?: string | undefined;
    categories: string[];
    quantity: number;
  }) => post<{ need: Need }>("/needs", b),
  closeNeed: (id: Id) => post(`/needs/${id}/close`),
  donations: (p?: Params) => get<Paged<Donation>>("/donations", p),
  donate: (b: { itemId: Id; ngoId: Id; needId?: Id | undefined; message?: string | undefined }) =>
    post<{ donation: Donation }>("/donations", b),
  respond: (id: Id, accept: boolean) => post(`/donations/${id}/respond`, { accept }),
  receive: (id: Id) => post(`/donations/${id}/receive`),
  cancel: (id: Id) => post(`/donations/${id}/cancel`),
};
export const drivesApi = {
  list: (p?: Params) => get<Paged<Drive>>("/drives", p),
  create: (b: {
    title: string;
    description?: string | undefined;
    date: string;
    address: { line1: string; city: string; state?: string | undefined; pincode: string };
    expectedWeightKg?: number | undefined;
    categories: string[];
  }) => post<{ drive: Drive }>("/drives", b),
  claim: (id: Id) => post(`/drives/${id}/claim`),
  complete: (id: Id, b: { actualWeightKg: number; itemCount?: number | undefined }) =>
    post(`/drives/${id}/complete`, b),
  cancel: (id: Id) => post(`/drives/${id}/cancel`),
  report: (id: Id) => get<{ report: DriveReport }>(`/drives/${id}/report`).then((r) => r.report),
};

// ---- Phase 6 ----
export const rewardsApi = {
  me: (page = 1) => get<RewardsMe>("/rewards/me", { page }),
  catalog: (all?: boolean) =>
    get<{ rewards: Reward[] }>("/rewards/catalog", { all }).then((r) => r.rewards),
  redeem: (rewardId: Id) =>
    post<{ redemption: { code: string; title: string }; points: number }>("/rewards/redeem", {
      rewardId,
    }),
  leaders: () =>
    get<{ leaders: { name: string; points: number }[] }>("/rewards/leaderboard").then(
      (r) => r.leaders,
    ),
  create: (b: {
    title: string;
    description?: string | undefined;
    cost: number;
    stock?: number | undefined;
    active?: boolean | undefined;
  }) => post("/rewards", b),
  update: (
    id: Id,
    b: {
      title: string;
      description?: string | undefined;
      cost: number;
      stock?: number | undefined;
      active?: boolean | undefined;
    },
  ) => put(`/rewards/${id}`, b),
};
export const communityApi = {
  posts: (p?: Params) => get<Paged<Post>>("/community/posts", p),
  create: (b: { kind: string; title: string; body: string }) =>
    post<{ post: Post }>("/community/posts", b),
  like: (id: Id) => post<{ liked: boolean; likeCount: number }>(`/community/posts/${id}/like`),
  remove: (id: Id) => del(`/community/posts/${id}`),
  report: (id: Id) => post(`/community/posts/${id}/report`),
  comments: (id: Id) =>
    get<{ comments: Comment[] }>(`/community/posts/${id}/comments`).then((r) => r.comments),
  comment: (id: Id, body: string) => post(`/community/posts/${id}/comments`, { body }),
  removeComment: (id: Id) => del(`/community/comments/${id}`),
};
export const assistantApi = {
  ask: (message: string) => post<AssistantAnswer>("/assistant/ask", { message }),
  topics: () =>
    get<{ topics: { id: string; title: string }[] }>("/assistant/topics").then((r) => r.topics),
};
export const analyticsApi = {
  me: () => get<Impact>("/analytics/me"),
  platform: () => get<PlatformAnalytics>("/analytics/platform"),
  summary: () => get<Summary>("/dashboard/summary"),
};
export const adminApi = {
  users: (p?: Params) => get<Paged<User>>("/admin/users", p),
  updateUser: (
    id: Id,
    b: { status?: "active" | "suspended"; partnerVerified?: boolean | undefined },
  ) => patch<{ user: User }>(`/admin/users/${id}`, b),
  contact: (p?: Params) =>
    get<
      Paged<{
        _id: Id;
        name: string;
        email: string;
        message: string;
        handled: boolean;
        createdAt: string;
      }>
    >("/admin/contact", p),
  handleContact: (id: Id, handled: boolean) => post(`/admin/contact/${id}/handled`, { handled }),
  reportedPosts: () =>
    get<{ posts: (Post & { reportCount: number })[] }>("/admin/posts/reported").then(
      (r) => r.posts,
    ),
  setPostStatus: (id: Id, status: "hidden" | "visible") =>
    post(`/admin/posts/${id}/status`, { status }),
  audit: (p?: Params) =>
    get<
      Paged<{
        _id: Id;
        action: string;
        at: string;
        actor?: { name: string };
        target?: { kind: string; id: string };
      }>
    >("/admin/audit", p),
};
export type { Role };
