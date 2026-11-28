import { api } from "./api";
import type { Role } from "@/lib/roles";
import type { MessageResponse, User } from "./types";

export const authService = {
  async health(): Promise<{ ok: boolean }> {
    const { data } = await api.get("/health", { timeout: 8000 });
    return data;
  },
  async register(input: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<MessageResponse> {
    const { data } = await api.post("/auth/register", { role: "citizen", ...input });
    return data;
  },
  async login(input: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const { data } = await api.post("/auth/login", input);
    return data;
  },
  async me(): Promise<User> {
    const { data } = await api.get("/auth/me");
    return data.user;
  },
};
