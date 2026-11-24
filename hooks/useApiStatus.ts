import { useQuery } from "@tanstack/react-query";

import { isApiConfigured } from "@/lib/config";
import { authService } from "@/services/auth.service";

export type ApiStatus = "not_configured" | "checking" | "online" | "offline";

export function useApiStatus(): ApiStatus {
  const q = useQuery({
    queryKey: ["api", "health"],
    queryFn: authService.health,
    enabled: isApiConfigured,
    retry: 1,
    staleTime: 30_000,
  });
  if (!isApiConfigured) return "not_configured";
  if (q.isPending) return "checking";
  return q.isSuccess ? "online" : "offline";
}
