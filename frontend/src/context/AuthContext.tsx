import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { authService } from "@/services/auth.service";
import { tokenStore, UNAUTHORIZED_EVENT } from "@/services/token-store";
import type { User } from "@/services/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // undefined = not read yet (SSR / before hydration), null = no token.
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setToken(tokenStore.get());
    const onUnauthorized = () => {
      setToken(null);
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.me,
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });

  let status: AuthStatus;
  if (token === undefined) status = "loading";
  else if (!token) status = "unauthenticated";
  else if (meQuery.data) status = "authenticated";
  else if (meQuery.isError) status = "unauthenticated";
  else status = "loading";

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken, user } = await authService.login({ email, password });
      tokenStore.set(newToken);
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setToken(newToken);
      return user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    tokenStore.clear();
    setToken(null);
  }, [queryClient]);

  const setUser = useCallback(
    (user: User) => queryClient.setQueryData(ME_QUERY_KEY, user),
    [queryClient],
  );

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: meQuery.data ?? null, login, logout, setUser, refreshUser }),
    [status, meQuery.data, login, logout, setUser, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
