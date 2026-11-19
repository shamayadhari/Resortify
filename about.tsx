import { createFileRoute } from "@tanstack/react-router";

import { PageIntro, PublicLayout } from "@/components/site/PublicLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Resortify — Our mission for a circular India" },
      { name: "description", content: "Why Resortify exists: to give every discarded item its best possible next life, with scrap dealers, recyclers and NGOs as partners." },
      { property: "og:title", content: "About Resortify" },
      { property: "og:description", content: "Our mission: reuse first, recycle well, and dispose only when nothing can be recovered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const PRINCIPLES = [
  { title: "Reuse before recycling", text: "Recycling is good. Keeping an item in use is better. Our recommendations always consider repair, reuse and donation first." },
  { title: "Include, don't replace", text: "India's informal scrap network already recovers enormous amounts of material. We build tools for kabadiwalas and dealers, not around them." },
  { title: "Transparency over hype", text: "We label predictions as predictions, show where prices come from, and say when availability was last confirmed." },
  { title: "Verified impact", text: "Rewards and impact numbers count only activities a partner has confirmed, each one only once." },
];

function About() {
  return (
    <PublicLayout>
      <PageIntro eyebrow="About" title="Waste is mostly a missing connection.">
        <p>
          A chair with a loose leg, a box of old textbooks, a stack of cardboard. Each has someone who
          could use it: a neighbour, an NGO, a dealer, a recycler. Resortify makes that connection
          simple, local and trustworthy.
        </p>
      </PageIntro>
      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <article key={p.title} className="rounded-3xl border border-border bg-paper p-8 shadow-soft">
              <span className="font-display text-sm text-emerald">Principle 0{i + 1}</span>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">{p.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
        <p className="mt-12 max-w-2xl text-sm text-muted-foreground">
          Resortify is a working name while the final brand is chosen.
        </p>
      </section>
    </PublicLayout>
  );
}
