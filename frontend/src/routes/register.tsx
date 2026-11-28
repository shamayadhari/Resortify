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
import {
  REGISTRABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  PARTNER_ROLES,
  type Role,
} from "@/lib/roles";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { useState } from "react";
import { NativeSelect } from "@/components/app/kit";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Resortify" },
      {
        name: "description",
        content: "Join Resortify and give your electronics a responsible next life.",
      },
      { property: "og:title", content: "Join Resortify" },
      { property: "og:description", content: "Create a free Resortify account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("citizen");
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const mutation = useMutation({
    mutationFn: async (v: RegisterInput) => {
      await authService.register({ name: v.name, email: v.email, password: v.password, role });
      // The account is active straight away, so sign the person in.
      return login(v.email, v.password);
    },
    onSuccess: () => navigate({ to: "/dashboard", replace: true }),
  });

  if (status === "authenticated" && !mutation.isPending && !mutation.isSuccess)
    return <Navigate to="/dashboard" replace />;

  return (
    <AuthShell
      title="Join Resortify"
      subtitle="Choose how you will use Resortify. You can sign in right away."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        {mutation.isError && <FormAlert>{mutation.error.message}</FormAlert>}
        <FormField
          id="role"
          label="I am joining as"
          hint={
            ROLE_DESCRIPTIONS[role] +
            (PARTNER_ROLES.includes(role)
              ? " Partner accounts are verified by our team before they can take actions."
              : "")
          }
        >
          <NativeSelect id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {REGISTRABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
        </FormField>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters, with a letter and a number."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </FormField>
        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
        </FormField>
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </AuthShell>
  );
}
