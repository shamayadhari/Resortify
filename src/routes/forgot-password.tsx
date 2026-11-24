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
import { forgotPasswordSchema } from "@/lib/validation";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Resortify" },
      { name: "description", content: "Request a password reset link for your Resortify account." },
      { property: "og:title", content: "Reset your password — Resortify" },
      { property: "og:description", content: "Get a password reset link by email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const mutation = useMutation({ mutationFn: (v: { email: string }) => authService.forgotPassword(v.email) });
  const { errors } = form.formState;

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to set a new one."
      footer={<Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">Back to sign in</Link>}
    >
      {mutation.isSuccess ? (
        <FormAlert tone="success">
          {mutation.data.message || "If an account exists for that email, a reset link is on its way."}
        </FormAlert>
      ) : (
        <form className="space-y-5" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
          {mutation.isError && <FormAlert>{mutation.error.message}</FormAlert>}
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
          </FormField>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />} Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
