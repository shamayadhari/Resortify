import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Timeline } from "@/components/app/Timeline";
import { ErrorNote, Loading, Pill } from "@/components/app/kit";
import { PageIntro, PublicLayout } from "@/components/site/PublicLayout";
import { resolveApiAssetUrl } from "@/lib/config";
import { CONDITION_LABEL, ITEM_STATUS, dateLabel, kg } from "@/lib/format";
import { trackApi } from "@/services/domain.service";

export const Route = createFileRoute("/track/$code")({
  head: () => ({
    meta: [
      { title: "Item tracking — Resortify" },
      {
        name: "description",
        content: "Follow an electronic item's journey from reporting to recycling.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Track,
});

function Track() {
  const { code } = Route.useParams();
  const q = useQuery({
    queryKey: ["track", code],
    queryFn: () => trackApi.get(code),
    retry: false,
  });

  return (
    <PublicLayout>
      <PageIntro eyebrow="QR tracking" title="Item journey">
        <p>
          Code {code.toUpperCase()}. This page never shows the owner's name, address or contact
          details.
        </p>
      </PageIntro>
      <section className="container-page max-w-3xl py-12">
        {q.isPending && <Loading />}
        {q.isError && <ErrorNote error={q.error} />}
        {q.data && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-border bg-paper p-6 shadow-soft">
              {q.data.item.image && (
                <img
                  src={resolveApiAssetUrl(q.data.item.image)}
                  alt={q.data.item.title}
                  className="size-24 rounded-xl object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-semibold">{q.data.item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q.data.item.categoryLabel} · {CONDITION_LABEL[q.data.item.condition]} · reported{" "}
                  {dateLabel(q.data.item.reportedAt)}
                </p>
                <div className="mt-2">
                  <Pill tone={ITEM_STATUS[q.data.item.status].tone}>
                    {ITEM_STATUS[q.data.item.status].label}
                  </Pill>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
              <h3 className="mb-4 text-lg font-semibold">Timeline</h3>
              <Timeline events={q.data.events} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              {[
                ["Reported", q.data.item.weights.ownerKg],
                ["Collected", q.data.item.weights.collectedKg],
                ["Received", q.data.item.weights.receivedKg],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-2xl border border-border bg-paper p-4">
                  <p className="text-muted-foreground">{k} weight</p>
                  <p className="text-xl font-semibold">{kg(v as number | null)}</p>
                </div>
              ))}
            </div>
            {q.data.item.facility && (
              <p className="text-sm text-muted-foreground">
                Delivered to{" "}
                <strong className="text-foreground">{q.data.item.facility.name}</strong>
                {q.data.item.facility.city ? `, ${q.data.item.facility.city}` : ""}.
              </p>
            )}
            {q.data.item.certificate && (
              <div className="rounded-3xl border border-emerald bg-accent/40 p-6">
                <h3 className="text-lg font-semibold">
                  Recycling certificate {q.data.item.certificate.id}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Issued {dateLabel(q.data.item.certificate.issuedAt)}
                  {q.data.item.certificate.recycler
                    ? ` by ${q.data.item.certificate.recycler}`
                    : ""}
                  .
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {q.data.item.certificate.recoveredMaterials.map((m) => (
                    <li key={m.material} className="rounded-full bg-paper px-3 py-1 text-sm">
                      {m.material}: {kg(m.kg)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
