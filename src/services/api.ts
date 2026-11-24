import axios, { AxiosError } from "axios";

import { API_BASE_URL, isApiConfigured } from "@/lib/config";
import { tokenStore, UNAUTHORIZED_EVENT } from "./token-store";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Convert anything thrown by Axios into an ApiError with a readable message. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ error?: { code?: string; message?: string; details?: unknown }; message?: string }>;
    if (!err.response) {
      return new ApiError(
        "We couldn't reach the Resortify server. Check your connection and try again.",
        0,
        "NETWORK_ERROR",
      );
    }
    const body = err.response.data;
    const message =
      body?.error?.message ?? body?.message ?? `Request failed (${err.response.status})`;
    const code = body?.error?.code ?? `HTTP_${err.response.status}`;
    return new ApiError(message, err.response.status, code, body?.error?.details);
  }
  return new ApiError(error instanceof Error ? error.message : "Something went wrong", 0, "UNKNOWN");
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 20000,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  if (!isApiConfigured) {
    return Promise.reject(
      new ApiError(
        "Resortify's server isn't connected yet, so this action can't be completed.",
        0,
        "API_NOT_CONFIGURED",
      ),
    );
  }
  const token = tokenStore.get();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiError = toApiError(error);
    // A 401 on a request that carried a token means the session is no longer valid.
    const sentToken = axios.isAxiosError(error) && !!error.config?.headers?.Authorization;
    if (apiError.status === 401 && sentToken && typeof window !== "undefined") {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(apiError);
  },
);
