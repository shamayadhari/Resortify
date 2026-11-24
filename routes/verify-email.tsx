import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";

import { AuthShell } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — Resortify" },
      { name: "description", content: "Confirm your email address to activate your Resortify account." },
      { property: "og:title", content: "Verify your email — Resortify" },
      { property: "og:description", content: "Activate your Resortify account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { token } = Route.useSearch();
  const mutation = useMutation({ mutationFn: (t: string) => authService.verifyEmail(t) });
  const started = useRef(false);

  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      mutation.mutate(token);
    }
  }, [token, mutation]);

  let title = "Verifying your email…";
  let body = <Loader2 className="size-8 animate-spin text-emerald" />;
  if (!token) {
    title = "Verification link incomplete";
    body = <p className="text-muted-foreground">This link is missing its token. Open the link from your email again, or request a new one from the sign-in page.</p>;
  } else if (mutation.isSuccess) {
    title = "Email verified";
    body = (
      <div className="space-y-5">
        <CheckCircle2 className="size-10 text-success" />
        <p className="text-muted-foreground">{mutation.data.message || "Your account is active. You can sign in now."}</p>
        <Button asChild variant="hero" size="xl"><Link to="/login">Sign in</Link></Button>
      </div>
    );
  } else if (mutation.isError) {
    title = "We couldn't verify that link";
    body = (
      <div className="space-y-5">
        <XCircle className="size-10 text-destructive" />
        <p className="text-muted-foreground">{mutation.error.message}</p>
        <Button asChild variant="soft"><Link to="/login">Back to sign in</Link></Button>
      </div>
    );
  }

  return <AuthShell title={title}>{body}</AuthShell>;
}
