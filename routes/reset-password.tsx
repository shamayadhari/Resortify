import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { AuthShell } from "@/components/site/AuthShell";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Choose a new password — Resortify" },
      { name: "description", content: "Set a new password for your Resortify account." },
      { property: "og:title", content: "Choose a new password — Resortify" },
      { property: "og:description", content: "Finish resetting your Resortify password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

type Values = z.infer<typeof resetPasswordSchema>;

function ResetPassword() {
  const { token } = Route.useSearch();
  const form = useForm<Values>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  const mutation = useMutation({ mutationFn: (v: Values) => authService.resetPassword(token ?? "", v.password) });
  const { errors } = form.formState;

  if (!token) {
    return (
      <AuthShell title="Reset link incomplete" subtitle="This link is missing its token. Request a fresh one.">
        <Button asChild variant="hero"><Link to="/forgot-password">Request a new link</Link></Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      {mutation.isSuccess ? (
        <div className="space-y-5">
          <FormAlert tone="success">{mutation.data.message || "Your password has been updated."}</FormAlert>
          <Button asChild variant="hero" size="xl"><Link to="/login">Sign in</Link></Button>
        </div>
      ) : (
        <form className="space-y-5" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
          {mutation.isError && <FormAlert>{mutation.error.message}</FormAlert>}
          <FormField id="password" label="New password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
          </FormField>
          <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...form.register("confirmPassword")} />
          </FormField>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />} Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
