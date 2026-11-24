import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, type Role } from "@/lib/roles";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Not available for your account — Resortify" },
      { name: "description", content: "This area of Resortify isn't available for your account type yet." },
      { property: "og:title", content: "Not available — Resortify" },
      { property: "og:description", content: "This area isn't available for your account type yet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Unauthorized,
});

function Unauthorized() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : null;

  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-border bg-paper p-8 text-center shadow-soft">
        <ShieldAlert className="mx-auto size-10 text-emerald" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Not available for this account</h1>
        <p className="mt-3 text-muted-foreground">
          {roleLabel
            ? `The ${roleLabel} dashboard opens in a later phase. Right now only citizen accounts have a dashboard.`
            : "You don't have access to that area."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="soft"><Link to="/">Back home</Link></Button>
          {user && (
            <Button
              variant="hero"
              onClick={async () => {
                await logout();
                navigate({ to: "/login", replace: true });
              }}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
