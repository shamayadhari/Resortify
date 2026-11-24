import { api } from "./api";
import type { MessageResponse, User } from "./types";

export const authService = {
  async health(): Promise<{ ok: boolean }> {
    const { data } = await api.get("/health", { timeout: 8000 });
    return data;
  },
  async register(input: { name: string; email: string; password: string }): Promise<MessageResponse> {
    const { data } = await api.post("/auth/register", { ...input, role: "citizen" });
    return data;
  },
  async verifyEmail(token: string): Promise<MessageResponse> {
    const { data } = await api.post("/auth/verify-email", { token });
    return data;
  },
  async resendVerification(email: string): Promise<MessageResponse> {
    const { data } = await api.post("/auth/resend-verification", { email });
    return data;
  },
  async login(input: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const { data } = await api.post("/auth/login", input);
    return data;
  },
  async forgotPassword(email: string): Promise<MessageResponse> {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },
  async resetPassword(token: string, password: string): Promise<MessageResponse> {
    const { data } = await api.post("/auth/reset-password", { token, password });
    return data;
  },
  async me(): Promise<User> {
    const { data } = await api.get("/auth/me");
    return data.user;
  },
};
