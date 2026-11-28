import type { Role } from "@/lib/roles";

export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: Address;
  avatarUrl?: string;
  status: "active" | "suspended";
  partnerVerified?: boolean;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageResponse {
  message: string;
}
