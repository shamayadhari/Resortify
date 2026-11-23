import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, MailWarning } from "lucide-react";

import { UPCOMING } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/services/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Resortify" },
      { name: "description", content: "Your Resortify citizen dashboard." },
      { property: "og:title", content: "Dashboard — Resortify" },
      { property: "og:description", content: "Your Resortify citizen dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function profileChecklist(user: User) {
  return [
    { label: "Verify your email", done: user.emailVerified },
    { label: "Add a profile photo", done: !!user.avatarUrl },
    { label: "Add a phone number", done: !!user.phone },
    { label: "Add your city and PIN code", done: !!user.address?.city && !!user.address?.pincode },
  ];
}

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const items = profileChecklist(user);
  const done = items.filter((i) => i.done).length;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <p className="eyebrow">Citizen dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">Hello, {firstName}.</h1>
      <p className="mt-2 text-muted-foreground">Here's where your items will start their next lives.</p>

      {!user.emailVerified && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning/15 p-4 text-sm text-warning-foreground">
          <MailWarning className="mt-0.5 size-4 shrink-0" />
          <p>Your email isn't verified yet. Check your inbox for the verification link.</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-3xl border border-border bg-paper p-6 shadow-soft md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Complete your profile</h2>
            <span className="text-sm font-semibold text-muted-foreground">{done}/{items.length}</span>
          </div>
          <Progress value={(done / items.length) * 100} className="mt-4 h-2 bg-secondary" />
          <ul className="mt-6 space-y-3">
            {items.map((i) => (
              <li key={i.label} className="flex items-center gap-3 text-sm">
                {i.done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground/50" />}
                <span className={i.done ? "text-muted-foreground line-through" : "text-foreground"}>{i.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">
            Your city and PIN code help us match you with nearby dealers, recyclers and NGOs as they join.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/profile">Edit profile <ArrowRight /></Link>
          </Button>
        </section>

        <section className="bg-forest-gradient rounded-3xl p-6 text-forest-foreground shadow-soft md:p-8">
          <h2 className="text-xl font-semibold">What's coming to your dashboard</h2>
          <p className="mt-2 text-sm text-forest-foreground/70">
            These tools open phase by phase. Nothing here is live yet, and we'll say so clearly until it is.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {UPCOMING.map((m) => (
              <li key={m.label} className="flex items-center gap-3 rounded-xl border border-forest-foreground/10 bg-forest-foreground/[0.04] px-3 py-2.5 text-sm">
                <m.icon className="size-4 text-emerald" />
                <span className="flex-1">{m.label}</span>
                <span className="text-xs text-forest-foreground/55">Phase {m.phase}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
