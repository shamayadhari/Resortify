import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { AuthShell } from "@/components/site/AuthShell";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { safeRedirect } from "@/lib/redirect";
import { hasDashboard } from "@/lib/roles";
import { loginSchema, type LoginInput } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Resortify" },
      { name: "description", content: "Sign in to your Resortify account." },
      { property: "og:title", content: "Sign in — Resortify" },
      { property: "og:description", content: "Access your Resortify dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const { status, login } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (v: LoginInput) => login(v.email, v.password),
    onSuccess: (user) => {
      if (!hasDashboard(user.role)) {
        navigate({ to: "/unauthorized", replace: true });
        return;
      }
      navigate({ to: safeRedirect(redirect), replace: true });
    },
  });

  if (status === "authenticated" && !mutation.isPending && !mutation.isSuccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue giving things a second life."
      footer={
        <>
          New to Resortify?{" "}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        {mutation.isError && (
          <FormAlert>{mutation.error.message}</FormAlert>
        )}
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </FormField>
        <Button type="submit" variant="hero" size="xl" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" />} Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
