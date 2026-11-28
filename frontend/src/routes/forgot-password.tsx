import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Password recovery — Resortify" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  return (
    <AuthShell
      title="Password recovery"
      subtitle="Email-based password recovery is planned for a later phase."
      footer={
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <strong>Phase 2 feature.</strong> The current Resortify API does not send
          password-reset emails or issue password-reset tokens yet.
        </p>
        <Button asChild variant="hero" size="xl" className="w-full">
          <Link to="/login">Return to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
