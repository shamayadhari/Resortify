import { api } from "./api";
import type { Address, MessageResponse, User } from "./types";

export const userService = {
  async updateProfile(input: { name: string; phone: string; address: Address }): Promise<User> {
    const { data } = await api.patch("/users/me", input);
    return data.user;
  },
  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post("/users/me/avatar", form);
    return data.user;
  },
  async changePassword(input: { currentPassword: string; newPassword: string }): Promise<MessageResponse> {
    const { data } = await api.patch("/users/me/password", input);
    return data;
  },
};
