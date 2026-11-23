import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  HandHeart,
  Hammer,
  Map,
  QrCode,
  Recycle,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Store,
  Trash2,
  Users,
} from "lucide-react";

import heroImg from "@/assets/hero-sorting.jpg";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resortify — Find the best next life for every item" },
      {
        name: "description",
        content:
          "Repair, reuse, resell, donate or recycle. Resortify connects households with scrap dealers, recyclers and NGOs near them.",
      },
      { property: "og:title", content: "Resortify — Find the best next life for every item" },
      {
        property: "og:description",
        content: "A reuse-first circular economy platform connecting citizens, scrap dealers, recyclers and NGOs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NEXT_LIVES = [
  { icon: Hammer, label: "Repair", text: "Fix it and keep using it." },
  { icon: RefreshCcw, label: "Reuse", text: "Give it a new purpose at home." },
  { icon: Store, label: "Resell", text: "Sell to someone nearby who needs it." },
  { icon: HandHeart, label: "Donate", text: "Match with a verified NGO's needs." },
  { icon: Recycle, label: "Recycle", text: "Route it to a facility that accepts it." },
  { icon: Trash2, label: "Dispose safely", text: "Only when nothing can be recovered." },
];

const PILLARS = [
  { icon: BadgeCheck, title: "Smart next-life recommendations", text: "Transparent, rule-based ranking that explains why each option fits your item." },
  { icon: Map, title: "Verified local recycling", text: "Facility availability shows when it was last confirmed, never guessed." },
  { icon: Scale, title: "Fair prices, real weights", text: "Dealer-published prices per kilogram, with estimated and verified weights on every receipt." },
  { icon: QrCode, title: "QR lifecycle tracking", text: "Every batch gets an ID and QR code with a timestamped, append-only journey." },
  { icon: Users, title: "Scrap dealers included", text: "Traditional kabadiwalas get digital tools, not replaced by them." },
  { icon: ShieldCheck, title: "Rewards only when verified", text: "Green points are awarded after a partner confirms the activity, once." },
];

function Index() {
  return (
    <PublicLayout>
      {/* Opening */}
      <section className="bg-hero relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow animate-rise">Circular economy, made local</p>
            <h1 className="mt-5 animate-rise text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl [animation-delay:80ms]">
              Every item deserves a <em className="font-normal text-emerald">next life</em>.
            </h1>
            <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
              Resortify helps you decide whether to repair, reuse, resell, donate or recycle what you
              no longer need, and connects you with the dealers, recyclers and NGOs around you.
            </p>
            <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
              <Button asChild variant="hero" size="xl">
                <Link to="/register">
                  Create a free account <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="soft" size="xl">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade [animation-delay:200ms]">
            <div className="overflow-hidden rounded-[2rem] shadow-lift">
              <img
                src={heroImg}
                alt="A repair and sorting workbench with a wooden chair, glass bottles, cans, cardboard and folded textiles"
                width={1600}
                height={1104}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 rounded-2xl border border-border bg-paper/95 p-4 shadow-soft backdrop-blur sm:left-auto sm:w-72">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Example</p>
              <p className="mt-1 font-display text-lg text-foreground">Old wooden chair</p>
              <ol className="mt-3 space-y-1.5 text-sm">
                <li className="flex justify-between"><span>1. Repair</span><span className="text-muted-foreground">loose joint</span></li>
                <li className="flex justify-between"><span>2. Donate</span><span className="text-muted-foreground">NGO need nearby</span></li>
                <li className="flex justify-between"><span>3. Resell</span><span className="text-muted-foreground">local demand</span></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Six next lives */}
      <section className="container-page py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Reuse first</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            Six possible futures. We start with the best one.
          </h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {NEXT_LIVES.map((n, i) => (
            <div key={n.label} className="group bg-paper p-7 transition-colors hover:bg-secondary/60">
              <div className="flex items-center justify-between">
                <n.icon className="size-6 text-emerald" />
                <span className="font-display text-sm text-muted-foreground">0{i + 1}</span>
              </div>
              <p className="mt-6 font-display text-2xl text-foreground">{n.label}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{n.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-forest-gradient text-forest-foreground">
        <div className="container-page py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.4fr]">
            <div>
              <p className="eyebrow">Built on trust</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Honest information, or no information.</h2>
              <p className="mt-5 text-forest-foreground/75">
                Resortify never invents prices, facilities or availability. What you see comes from
                verified partners, and we tell you when it was last confirmed.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {PILLARS.map((p) => (
                <div key={p.title} className="rounded-2xl border border-forest-foreground/10 bg-forest-foreground/[0.04] p-6">
                  <p.icon className="size-5 text-emerald" />
                  <p className="mt-4 font-semibold">{p.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-forest-foreground/70">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20 md:py-28">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[2rem] border border-border bg-paper p-8 shadow-soft md:flex-row md:items-center md:p-12">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Start with one item.</h2>
            <p className="mt-3 text-muted-foreground">
              Create your citizen account today. New tools roll out phase by phase: scanner,
              pickups, marketplace and tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/register">Join Resortify</Link>
            </Button>
            <Button asChild variant="soft" size="xl">
              <Link to="/features">View roadmap</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
