import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password — Resortify" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="Setting a new password from an email link is planned for a later phase."
      footer={
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <strong>Phase 2 feature.</strong> Password-reset tokens and email delivery
          are not implemented by the current Resortify API.
        </p>
        <Button asChild variant="hero" size="xl" className="w-full">
          <Link to="/login">Return to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
