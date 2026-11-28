import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Email verification — Resortify" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  return (
    <AuthShell
      title="Email verification"
      subtitle="Email verification is planned for a later phase."
      footer={
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <strong>Phase 2 feature.</strong> Resortify accounts are activated
          immediately after registration, so no verification email is required
          in the current release.
        </p>
        <Button asChild variant="hero" size="xl" className="w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
