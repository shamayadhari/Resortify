import { api } from "./api";
import type { MessageResponse } from "./types";

export const contactService = {
  async send(input: { name: string; email: string; message: string }): Promise<MessageResponse> {
    const { data } = await api.post("/contact", input);
    return data;
  },
};
