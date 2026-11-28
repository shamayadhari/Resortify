import type { Address, User } from "./types";

export type Id = string;
export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type Condition = "working" | "repairable" | "not_working";
export type ItemStatus =
  | "reported"
  | "pickup_requested"
  | "collected"
  | "delivered"
  | "processed"
  | "listed"
  | "donation_pending"
  | "sold"
  | "donated"
  | "cancelled";

export interface CategoryInfo {
  key: string;
  label: string;
  typicalWeightKg: number;
  hazardous: boolean;
  materials: string[];
}
export interface Catalog {
  categories: CategoryInfo[];
  conditions: { key: Condition; label: string }[];
}

export interface PriceRange {
  min: number;
  max: number;
}
export interface RecommendationOption {
  action: "sell" | "donate" | "recycle" | "repair";
  title: string;
  reason: string;
  estimatedValue: PriceRange | null;
  co2KgAvoided: number;
}
export interface Recommendations {
  options: RecommendationOption[];
  warnings: string[];
  materials: string[];
  price: PriceEstimate;
}
export interface PriceEstimate {
  weightKg: number;
  weightAssumed: boolean;
  scrap: PriceRange & { ratePerKg: number };
  resale: PriceRange;
  basis: { rateSource: string; conditionFactor: number; ageFactor: number };
  disclaimer: string;
  category?: string;
  condition?: Condition;
  city?: string;
}

export interface WasteItem {
  _id: Id;
  owner: Id;
  title: string;
  description: string;
  category: string;
  condition: Condition;
  weightKg: number;
  ageYears: number;
  images: { url: string }[];
  classification?: {
    category: string;
    confidence: number;
    matched: string[];
    source: string;
    confirmed: boolean;
  };
  status: ItemStatus;
  trackingCode: string;
  city: string;
  collectedWeightKg?: number;
  receivedWeightKg?: number;
  certificate?: {
    id: string;
    issuedAt: string;
    recoveredMaterials: { material: string; kg: number }[];
  };
  createdAt: string;
  recommendations?: Recommendations;
}
export interface LifecycleEvent {
  type: string;
  label: string;
  note?: string;
  at: string;
  actorRole?: string;
}

export interface Classification {
  category: string;
  label: string;
  confidence: number;
  matched: string[];
  alternatives: string[];
  source: string;
}

export type FacilityType = "recycler" | "scrap_dealer" | "ngo" | "collection_point";
export interface Facility {
  _id: Id;
  name: string;
  type: FacilityType;
  description: string;
  address: Address;
  location: { coordinates: [number, number] };
  phone?: string;
  hours?: string;
  acceptedCategories: string[];
  certifications: string[];
  verified: boolean;
  active: boolean;
  distanceKm?: number;
  owner?: Id | { _id: Id; name: string; email: string; role: string };
}

export type PickupStatus =
  "requested" | "accepted" | "on_the_way" | "collected" | "delivered" | "cancelled";
export interface Pickup {
  _id: Id;
  requester: Pick<User, "_id" | "name" | "phone" | "avatarUrl"> | Id;
  partner?: Pick<User, "_id" | "name" | "phone" | "avatarUrl"> | null;
  items: Pick<
    WasteItem,
    "_id" | "title" | "category" | "condition" | "weightKg" | "images" | "status" | "trackingCode"
  >[];
  description: string;
  address: Address;
  preferredDate: string;
  slot: "morning" | "afternoon" | "evening";
  frequency: "once" | "daily" | "weekly" | "monthly";
  estimatedWeightKg: number;
  verifiedWeightKg?: number;
  payoutInr?: number;
  notes: string;
  status: PickupStatus;
  facility?: Pick<Facility, "_id" | "name" | "type" | "address"> | null;
  history: { status: string; at: string; note?: string }[];
  createdAt: string;
}

export interface Listing {
  _id: Id;
  seller:
    { _id: Id; name: string; avatarUrl?: string; role: string; partnerVerified?: boolean } | Id;
  item?: Id;
  title: string;
  description: string;
  category: string;
  condition: Condition;
  weightKg: number;
  price: number;
  images: { url: string }[];
  city: string;
  status: "active" | "reserved" | "sold" | "withdrawn";
  reference?: PriceRange;
  createdAt: string;
}
export interface Offer {
  _id: Id;
  listing: Id | Pick<Listing, "_id" | "title" | "price" | "status" | "category" | "images">;
  bidder: { _id: Id; name: string; role: string; partnerVerified?: boolean } | Id;
  price: number;
  message: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  fairness: "below" | "fair" | "above" | "unknown";
  createdAt: string;
}
export interface MarketRate {
  category: string;
  label: string;
  defaultPerKg: number;
  localAveragePerKg: number | null;
  dealers: number;
}
export interface MyRate {
  category: string;
  ratePerKg: number;
}

export interface Need {
  _id: Id;
  title: string;
  description: string;
  categories: string[];
  quantity: number;
  city: string;
  status: "open" | "closed";
  ngo: { _id: Id; name: string } | Id;
}
export interface Donation {
  _id: Id;
  status: "pledged" | "accepted" | "rejected" | "received" | "cancelled";
  message: string;
  item: Pick<
    WasteItem,
    "_id" | "title" | "category" | "condition" | "weightKg" | "images" | "trackingCode"
  >;
  donor: { _id: Id; name: string; phone?: string; address?: Address };
  ngo: { _id: Id; name: string; address?: Address };
  createdAt: string;
}
export interface Drive {
  _id: Id;
  title: string;
  description: string;
  date: string;
  address: Address;
  expectedWeightKg: number;
  categories: string[];
  status: "open" | "claimed" | "completed" | "cancelled";
  organization: { _id: Id; name: string } | Id;
  claimedBy?: { _id: Id; name: string; phone?: string } | null;
  actualWeightKg?: number;
  itemCount?: number;
  certificateId?: string;
  notes: string;
}
export interface DriveReport {
  certificateId: string;
  title: string;
  organization: string;
  collectedBy: string | null;
  date: string;
  completedAt: string;
  address: Address;
  itemCount: number;
  actualWeightKg: number;
  co2KgAvoidedEstimate: number;
  co2Note: string;
}

export interface PublicTrack {
  item: {
    trackingCode: string;
    title: string;
    category: string;
    categoryLabel?: string;
    condition: Condition;
    status: ItemStatus;
    image: string | null;
    facility: { name: string; city?: string } | null;
    weights: { ownerKg: number; collectedKg: number | null; receivedKg: number | null };
    certificate: {
      id: string;
      issuedAt: string;
      recycler: string | null;
      recoveredMaterials: { material: string; kg: number }[];
    } | null;
    reportedAt: string;
  };
  events: { type: string; label: string; at: string; actorRole?: string }[];
}

export interface RewardsMe {
  points: number;
  level: { name: string; next: { name: string; at: number } | null };
  badges: { key: string; label: string; earned: boolean }[];
  rules: Record<string, number>;
  ledger: Paged<{ points: number; reason: string; at: string }>;
  redemptions: { _id: Id; title: string; cost: number; code: string; createdAt: string }[];
}
export interface Reward {
  _id: Id;
  title: string;
  description: string;
  cost: number;
  stock?: number;
  active: boolean;
}

export interface Post {
  _id: Id;
  kind: "tip" | "question" | "event";
  title: string;
  body: string;
  author: { _id: Id; name: string; avatarUrl?: string; role: string };
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
}
export interface Comment {
  _id: Id;
  body: string;
  author: { _id: Id; name: string; role: string };
  createdAt: string;
}

export interface AssistantAnswer {
  found: boolean;
  answer: string;
  sources: { id: string; title: string }[];
  actions: { label: string; to: string }[];
  related?: { id: string; title: string; answer: string }[];
  itemHint: { category: string; label: string } | null;
}

export interface Impact {
  totals: {
    items: number;
    weightKg: number;
    recoveredItems: number;
    recoveredKg: number;
    co2KgAvoidedEstimate: number;
  };
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; label: string; count: number }[];
  monthly: { month: string; value: number }[];
  note: string;
}
export interface PlatformAnalytics {
  users: { role: string; count: number }[];
  totals: {
    users: number;
    items: number;
    weightKg: number;
    recoveredKg: number;
    co2KgAvoidedEstimate: number;
    verifiedFacilities: number;
    unverifiedFacilities: number;
    activeListings: number;
    donationsReceived: number;
    drivesCompleted: number;
  };
  itemsByStatus: { status: string; count: number }[];
  byCategory: { category: string; label: string; count: number; kg: number }[];
  monthlyItems: { month: string; value: number }[];
  monthlyPickups: { month: string; value: number }[];
  pickupFunnel: { status: string; count: number }[];
  topRecyclers: { name: string; kg: number; n: number }[];
  note: string;
}

type Counts = Record<string, number>;
export interface Summary {
  role: string;
  partnerVerified?: boolean | undefined;
  points?: number;
  items?: Counts;
  pickups?: Counts;
  donations?: Counts;
  drives?: Counts;
  offers?: Counts;
  activeListings?: number;
  openPickups?: number;
  facilities?: number;
  incoming?: number;
  received?: number;
  processed?: number;
  processedKg?: number;
  rates?: number;
  listingsInCity?: number;
  openNeeds?: number;
  pendingPartners?: number;
  unverifiedFacilities?: number;
  reportedPosts?: number;
  users?: number;
}
