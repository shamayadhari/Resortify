import { createFileRoute, Navigate, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { hasDashboard } from "@/lib/roles";
import { tokenStore } from "@/services/token-store";

export const Route = createFileRoute("/_authenticated")({
  // The session lives in this browser (JWT in localStorage), so the gate runs client-side only.
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!tokenStore.get()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-emerald" aria-label="Loading your account" />
      </div>
    );
  }
  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" search={{ redirect: location.href }} replace />;
  }
  if (!hasDashboard(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
