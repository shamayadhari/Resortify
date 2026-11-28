import { createFileRoute, Link } from "@tanstack/react-router";

import { PageIntro, PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Resortify works — From scan to second life" },
      { name: "description", content: "Identify an item, get ranked next-life options, act on them locally, and follow your waste batch from pickup to final outcome." },
      { property: "og:title", content: "How Resortify works" },
      { property: "og:description", content: "Identify, decide, act, track and earn verified green points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { title: "Identify the item", text: "Snap a photo or pick a category. Suggestions from the scanner are clearly marked as predictions, and you can correct them." },
  { title: "Tell us its condition", text: "Working, repairable or broken. Condition changes everything about what happens next." },
  { title: "Get ranked next-life options", text: "Repair, reuse, resell, donate, recycle or dispose. Each option comes with a plain explanation of why it ranks where it does." },
  { title: "Act locally", text: "Book a pickup, list it on the reuse marketplace, donate to a verified NGO, or find a facility on the map." },
  { title: "Track the journey", text: "Collected items join a batch with its own ID and QR code. Every step, from collection to final outcome, is recorded with time and actor." },
  { title: "Earn verified points", text: "Green points arrive only after a partner confirms the activity, and never twice for the same one." },
];

function HowItWorks() {
  return (
    <PublicLayout>
      <PageIntro eyebrow="How it works" title="From “what do I do with this?” to a second life.">
        <p>Six steps, designed to keep as much as possible in use and out of landfill.</p>
      </PageIntro>
      <section className="container-page py-20">
        <ol className="relative space-y-6 border-l border-border pl-8 md:pl-12">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="absolute -left-[3.05rem] top-1 grid size-9 place-items-center rounded-full bg-primary font-display text-sm text-primary-foreground md:-left-[4.05rem]">
                {i + 1}
              </span>
              <div className="rounded-2xl border border-border bg-paper p-6 shadow-soft">
                <h2 className="text-xl font-semibold text-foreground">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/register">Create your account</Link>
          </Button>
          <Button asChild variant="soft" size="xl">
            <Link to="/features">What's available now</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
