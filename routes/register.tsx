import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { AuthShell } from "@/components/site/AuthShell";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Resortify" },
      { name: "description", content: "Join Resortify as a citizen and start finding the best next life for your items." },
      { property: "og:title", content: "Join Resortify" },
      { property: "og:description", content: "Create a free citizen account on Resortify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const { status } = useAuth();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const mutation = useMutation({
    mutationFn: (v: RegisterInput) => authService.register({ name: v.name, email: v.email, password: v.password }),
  });
  const resend = useMutation({ mutationFn: (email: string) => authService.resendVerification(email) });

  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  if (mutation.isSuccess) {
    const email = mutation.variables.email;
    return (
      <AuthShell title="Check your inbox" subtitle={<>We sent a verification link to <strong className="text-foreground">{email}</strong>.</>}>
        <div className="space-y-5 rounded-2xl border border-border bg-paper p-6 shadow-soft">
          <MailCheck className="size-8 text-emerald" />
          <p className="text-sm text-muted-foreground">
            Open the link in that email to activate your account, then sign in. It can take a minute
            to arrive; check your spam folder too.
          </p>
          {resend.isSuccess && <FormAlert tone="success">{resend.data.message || "Sent again."}</FormAlert>}
          {resend.isError && <FormAlert>{resend.error.message}</FormAlert>}
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <Link to="/login">Go to sign in</Link>
            </Button>
            <Button variant="soft" disabled={resend.isPending} onClick={() => resend.mutate(email)}>
              {resend.isPending && <Loader2 className="animate-spin" />} Resend email
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Join Resortify"
      subtitle="Create your citizen account. Partner accounts for dealers, recyclers and NGOs open in a later phase."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        {mutation.isError && <FormAlert>{mutation.error.message}</FormAlert>}
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...form.register("confirmPassword")} />
        </FormField>
        <Button type="submit" variant="hero" size="xl" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </AuthShell>
  );
}
