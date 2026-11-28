import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { UserAvatar } from "@/components/app/UserAvatar";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/roles";
import {
  changePasswordSchema,
  profileSchema,
  validateAvatarFile,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validation";
import type { User } from "@/services/types";
import { userService } from "@/services/user.service";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Resortify" },
      { name: "description", content: "Manage your Resortify profile, photo and password." },
      { property: "og:title", content: "Your profile — Resortify" },
      { property: "og:description", content: "Manage your Resortify profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-12">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">Your profile</h1>
      <div className="mt-8 space-y-6">
        <AvatarCard user={user} />
        <DetailsCard user={user} />
        <PasswordCard />
      </div>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-paper p-6 shadow-soft md:p-8">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function AvatarCard({ user }: { user: User }) {
  const { setUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: (f: File) => userService.uploadAvatar(f),
    onSuccess: (updated) => {
      setUser(updated);
      setFile(null);
      toast.success("Profile photo updated");
    },
  });

  return (
    <Card title="Profile photo" description="JPG, PNG or WebP, up to 2 MB.">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <UserAvatar user={user} src={preview} className="size-24 text-2xl" />
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Choose a profile photo"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (!f) return;
              const err = validateAvatarFile(f);
              setFileError(err);
              setFile(err ? null : f);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="soft" onClick={() => inputRef.current?.click()}>
              <Camera /> Choose photo
            </Button>
            {file && (
              <>
                <Button type="button" variant="hero" disabled={mutation.isPending} onClick={() => mutation.mutate(file)}>
                  {mutation.isPending && <Loader2 className="animate-spin" />} Save photo
                </Button>
                <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setFile(null)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          {fileError && <p className="text-xs font-medium text-destructive">{fileError}</p>}
          {mutation.isError && <p className="text-xs font-medium text-destructive">{mutation.error.message}</p>}
        </div>
      </div>
    </Card>
  );
}

function DetailsCard({ user }: { user: User }) {
  const { setUser } = useAuth();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
      line1: user.address?.line1 ?? "",
      city: user.address?.city ?? "",
      state: user.address?.state ?? "",
      pincode: user.address?.pincode ?? "",
    },
  });
  const { errors, isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (v: ProfileInput) =>
      userService.updateProfile({
        name: v.name,
        phone: v.phone,
        address: { line1: v.line1, city: v.city, state: v.state, pincode: v.pincode },
      }),
    onSuccess: (updated, v) => {
      setUser(updated);
      form.reset(v);
      toast.success("Profile saved");
    },
  });

  return (
    <Card title="Your details">
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm">
        <span className="font-semibold text-foreground">{user.email}</span>
        <span className="ml-auto rounded-full border border-border bg-paper px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>
      <form className="grid gap-5 sm:grid-cols-2" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        {mutation.isError && <div className="sm:col-span-2"><FormAlert>{mutation.error.message}</FormAlert></div>}
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
        </FormField>
        <FormField id="phone" label="Mobile number" error={errors.phone?.message} hint="Optional. Used by collection partners from Phase 2.">
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...form.register("phone")} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField id="line1" label="Address" error={errors.line1?.message}>
            <Input id="line1" autoComplete="street-address" {...form.register("line1")} />
          </FormField>
        </div>
        <FormField id="city" label="City" error={errors.city?.message}>
          <Input id="city" autoComplete="address-level2" {...form.register("city")} />
        </FormField>
        <FormField id="state" label="State" error={errors.state?.message}>
          <Input id="state" autoComplete="address-level1" {...form.register("state")} />
        </FormField>
        <FormField id="pincode" label="PIN code" error={errors.pincode?.message}>
          <Input id="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} aria-invalid={!!errors.pincode} {...form.register("pincode")} />
        </FormField>
        <div className="flex items-end sm:justify-end">
          <Button type="submit" variant="hero" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors } = form.formState;
  const mutation = useMutation({
    mutationFn: (v: ChangePasswordInput) =>
      userService.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "Password changed");
    },
  });

  return (
    <Card title="Change password">
      <form className="grid gap-5 sm:grid-cols-3" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        {mutation.isError && <div className="sm:col-span-3"><FormAlert>{mutation.error.message}</FormAlert></div>}
        <FormField id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
          <Input id="currentPassword" type="password" autoComplete="current-password" {...form.register("currentPassword")} />
        </FormField>
        <FormField id="newPassword" label="New password" error={errors.newPassword?.message}>
          <Input id="newPassword" type="password" autoComplete="new-password" {...form.register("newPassword")} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
        <div className="sm:col-span-3 flex justify-end">
          <Button type="submit" variant="hero" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />} Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
