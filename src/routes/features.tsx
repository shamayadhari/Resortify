import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";

import { PageIntro, PublicLayout } from "@/components/site/PublicLayout";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Resortify features & roadmap" },
      { name: "description", content: "What Resortify offers today and what's coming next: scanner, recommendations, recycling map, pickups, marketplace, fair pricing, QR tracking and more." },
      { property: "og:title", content: "Resortify features & roadmap" },
      { property: "og:description", content: "Every Resortify module, with its rollout phase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Features,
});

const MODULES: { phase: number; title: string; text: string }[] = [
  { phase: 1, title: "Citizen accounts", text: "Sign up, verify your email, manage your profile and photo." },
  { phase: 2, title: "Daily waste pickup", text: "Send your daily household waste to local garbage collectors near you. Schedule doorstep collection, sort by category (wet, dry, recyclable, e-waste), track each pickup, and pay or earn fairly." },
  { phase: 3, title: "Smart waste scanner", text: "Photo-based category suggestions with confidence scores and manual correction." },
  { phase: 3, title: "Next-life recommendations", text: "Ranked repair, reuse, resale, donation, recycling or disposal options with reasons." },
  { phase: 4, title: "Recycling map", text: "Nearby facilities by material, with hours, contact details and last-confirmed availability." },
  { phase: 4, title: "Pickup booking", text: "Schedule collections and follow live status from request to completion." },
  { phase: 5, title: "Reuse marketplace", text: "List, sell, donate or exchange used goods locally, with messaging and reviews." },
  { phase: 5, title: "Fair price & weight", text: "Dealer-published prices per kg, verified weights and receipts." },
  { phase: 6, title: "QR lifecycle tracking", text: "Batch IDs and QR codes with a timestamped history of every step." },
  { phase: 6, title: "NGO donations", text: "Match reusable goods with verified NGO requirements." },
  { phase: 6, title: "Business & college bulk waste", text: "Organisation dashboards, scheduled pickups and monthly reports." },
  { phase: 7, title: "Green score & community", text: "Verified rewards, challenges, drives and illegal-dumping reports." },
  { phase: 7, title: "Recycling assistant", text: "Answers grounded in Resortify's verified facility and partner data." },
];

const CURRENT_PHASE = 1;

function Features() {
  return (
    <PublicLayout>
      <PageIntro eyebrow="Features & roadmap" title="Built in the open, one phase at a time.">
        <p>Resortify rolls out in phases. Here's exactly what works today and what's next.</p>
      </PageIntro>
      <section className="container-page py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const live = m.phase <= CURRENT_PHASE;
            return (
              <article key={m.title} className="flex flex-col rounded-2xl border border-border bg-paper p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  {live ? (
                    <Badge className="gap-1 rounded-full bg-success text-success-foreground hover:bg-success">
                      <CheckCircle2 className="size-3.5" /> Available now
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 rounded-full text-muted-foreground">
                      <Clock className="size-3.5" /> Phase {m.phase}
                    </Badge>
                  )}
                </div>
                <h2 className="mt-5 text-xl font-semibold text-foreground">{m.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}
