import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";

import { PageIntro, PublicLayout } from "@/components/site/PublicLayout";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Resortify features & roadmap" },
      {
        name: "description",
        content:
          "What Resortify offers: reporting, recommendations, recycling map, pickups, marketplace, fair pricing, QR tracking, donations, rewards and more.",
      },
      { property: "og:title", content: "Resortify features & roadmap" },
      { property: "og:description", content: "Every Resortify module, with its rollout phase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Features,
});

const MODULES: { phase: number; title: string; text: string }[] = [
  {
    phase: 1,
    title: "Accounts for every role",
    text: "Citizens, dealers, recyclers, collectors, NGOs, organisations and administrators, each with their own dashboard.",
  },
  {
    phase: 2,
    title: "Item reporting with photos",
    text: "Describe an e-waste item, add up to four photos, and get a category suggestion you can correct.",
  },
  {
    phase: 2,
    title: "Next-life recommendations",
    text: "Ranked repair, sell, donate or recycle options with reasons, indicative values and safety warnings.",
  },
  {
    phase: 3,
    title: "Recycling map",
    text: "Nearby recyclers, dealers, NGOs and collection points by category, with a clear Verified badge.",
  },
  {
    phase: 3,
    title: "Pickups with live status",
    text: "Book one-time, daily, weekly or monthly e-waste pickups and follow each step from request to delivery.",
  },
  {
    phase: 4,
    title: "Reuse marketplace",
    text: "List working or repairable items, receive offers flagged against a fair range, and agree a sale.",
  },
  {
    phase: 4,
    title: "Fair price & weight",
    text: "Indicative price ranges, dealer-published rates per kg, and weights recorded at pickup and at intake.",
  },
  {
    phase: 4,
    title: "Dealer and recycler tools",
    text: "Publish rates, weigh deliveries, record recovered materials and issue recycling certificates.",
  },
  {
    phase: 5,
    title: "QR lifecycle tracking",
    text: "Every item gets a QR code and a public page showing its journey, with no personal details.",
  },
  {
    phase: 5,
    title: "NGO donations",
    text: "NGOs post what they need and citizens donate working devices to verified organisations.",
  },
  {
    phase: 5,
    title: "Organisation drives",
    text: "Businesses and colleges plan bulk collection drives and get a completion report.",
  },
  {
    phase: 6,
    title: "Rewards",
    text: "Points for real actions, levels, badges and a catalogue to redeem them.",
  },
  {
    phase: 6,
    title: "Community",
    text: "Share tips, ask questions and announce events, with reporting and moderation.",
  },
  {
    phase: 6,
    title: "Recycling assistant",
    text: "Answers from Resortify's built-in guide. It is a searchable guide, not an AI model, and says so when it doesn't know.",
  },
  {
    phase: 6,
    title: "Impact analytics",
    text: "Your totals and charts, and platform-wide analytics for administrators. CO2 figures are labelled estimates.",
  },
  {
    phase: 7,
    title: "Security & reliability",
    text: "Role-based access, partner verification, input guards, rate limits, audit log, tests and deployment files.",
  },
];

const CURRENT_PHASE = 7;

function Features() {
  return (
    <PublicLayout>
      <PageIntro eyebrow="Features" title="Everything Resortify does today.">
        <p>
          Every module below is live. Figures such as prices and CO2 savings are indicative
          estimates and are labelled that way in the app.
        </p>
      </PageIntro>
      <section className="container-page py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const live = m.phase <= CURRENT_PHASE;
            return (
              <article
                key={m.title}
                className="flex flex-col rounded-2xl border border-border bg-paper p-6 shadow-soft"
              >
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
