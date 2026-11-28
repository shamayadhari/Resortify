import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Leaf } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { Timeline } from "@/components/app/Timeline";
import { FormAlert } from "@/components/site/FormField";
import {
  ItemThumb,
  Page,
  PageHeader,
  Panel,
  Pill,
  QueryView,
  Spinner,
  useCatalog,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { resolveApiAssetUrl } from "@/lib/config";
import { CONDITION_LABEL, ITEM_STATUS, dateLabel, inrRange, kg } from "@/lib/format";
import { itemsApi } from "@/services/domain.service";
import type { RecommendationOption, WasteItem } from "@/services/models";

export const Route = createFileRoute("/_authenticated/items/$itemId")({
  head: () => ({ meta: [{ title: "Item — Resortify" }, { name: "robots", content: "noindex" }] }),
  component: ItemDetail,
});

function ItemDetail() {
  const { itemId } = Route.useParams();
  const query = useQuery({
    queryKey: ["items", itemId],
    queryFn: () => itemsApi.get(itemId),
    refetchInterval: 30_000,
  });
  return (
    <Page>
      <QueryView query={query} rows={4}>
        {({ item, events }) => <Body item={item} events={events} />}
      </QueryView>
    </Page>
  );
}

function Body({
  item,
  events,
}: {
  item: WasteItem;
  events: { label: string; note?: string; at: string }[];
}) {
  const { label } = useCatalog();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const editable = item.status === "reported";
  const trackUrl = `${window.location.origin}/track/${item.trackingCode}`;
  const remove = useMutation({
    mutationFn: () => itemsApi.remove(item._id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["items"] });
      void navigate({ to: "/items" });
    },
  });
  const rec = item.recommendations;

  return (
    <>
      <PageHeader
        eyebrow={label(item.category)}
        title={item.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Pill tone={ITEM_STATUS[item.status].tone}>{ITEM_STATUS[item.status].label}</Pill>{" "}
            {CONDITION_LABEL[item.condition]} · {kg(item.weightKg)} · reported{" "}
            {dateLabel(item.createdAt)}
          </span>
        }
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {item.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {item.images.map((im, i) => (
                <a key={im.url} href={resolveApiAssetUrl(im.url)} target="_blank" rel="noreferrer">
                  <ItemThumb
                    url={resolveApiAssetUrl(im.url)}
                    alt={`Photo ${i + 1} of ${item.title}`}
                    className="size-32"
                  />
                </a>
              ))}
            </div>
          )}
          {item.description && <p className="text-foreground">{item.description}</p>}

          {rec && editable && (
            <Panel
              title="Best next life"
              description="Ranked for this item's condition. Values are indicative estimates."
            >
              <ol className="space-y-4">
                {rec.options.map((o, i) => (
                  <Option key={o.action} o={o} first={i === 0} itemId={item._id} />
                ))}
              </ol>
              {rec.warnings.length > 0 && (
                <div className="mt-5 rounded-xl border border-warning/50 bg-warning/20 p-4 text-sm text-warning-foreground">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="size-4" /> Handle with care
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {rec.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                {rec.price.disclaimer} Basis: {rec.price.basis.rateSource}
                {rec.price.weightAssumed ? ", typical weight assumed" : ""}.
              </p>
            </Panel>
          )}

          {item.certificate && (
            <Panel title="Recycling certificate">
              <p className="text-sm text-muted-foreground">
                Certificate <strong className="text-foreground">{item.certificate.id}</strong>{" "}
                issued {dateLabel(item.certificate.issuedAt)}.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.certificate.recoveredMaterials.map((m) => (
                  <li
                    key={m.material}
                    className="flex justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
                  >
                    <span>{m.material}</span>
                    <strong>{kg(m.kg)}</strong>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Journey">
            <Timeline events={events} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Tracking code"
            description="Anyone who scans this sees the item's journey, never your personal details."
          >
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl bg-white p-3">
                <QRCodeSVG
                  value={trackUrl}
                  size={150}
                  marginSize={1}
                  title={`QR code for ${item.trackingCode}`}
                />
              </div>
              <p className="font-mono text-sm font-semibold">{item.trackingCode}</p>
              <Button asChild variant="soft" size="sm">
                <Link to="/track/$code" params={{ code: item.trackingCode }}>
                  Open public page
                </Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
                Print label
              </Button>
            </div>
          </Panel>
          <Panel title="Weights">
            <dl className="space-y-2 text-sm">
              <Row k="You reported" v={kg(item.weightKg)} />
              <Row k="Collector measured" v={kg(item.collectedWeightKg)} />
              <Row k="Recycler weighed" v={kg(item.receivedWeightKg)} />
            </dl>
          </Panel>
          {editable && (
            <Panel title="Manage">
              {remove.isError && <FormAlert>{remove.error.message}</FormAlert>}
              {!confirm ? (
                <Button type="button" variant="outline" onClick={() => setConfirm(true)}>
                  Delete this item
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm">
                    Delete "{item.title}" and its photos? This can't be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate()}
                    >
                      {remove.isPending && <Spinner />} Delete
                    </Button>
                    <Button type="button" variant="soft" onClick={() => setConfirm(false)}>
                      Keep
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="font-semibold">{v}</dd>
  </div>
);

function Option({ o, first, itemId }: { o: RecommendationOption; first: boolean; itemId: string }) {
  const target = {
    sell: "/marketplace/new",
    donate: "/donations",
    recycle: "/pickups",
    repair: "/map",
  }[o.action];
  const cta = {
    sell: "List it for sale",
    donate: "Choose an NGO",
    recycle: "Request a pickup",
    repair: "Find a repair or recycling point",
  }[o.action];
  return (
    <li
      className={`rounded-2xl border p-4 ${first ? "border-emerald bg-accent/40" : "border-border"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            {first && <Pill tone="success">Recommended</Pill>} {o.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{o.reason}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
            {o.estimatedValue && (
              <span>
                Indicative value:{" "}
                <strong className="text-foreground">{inrRange(o.estimatedValue)}</strong>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Leaf className="size-3.5 text-emerald" /> ≈ {o.co2KgAvoided} kg CO₂ avoided
              (estimate)
            </span>
          </p>
        </div>
        <Button asChild variant={first ? "hero" : "soft"} size="sm">
          <Link to={target as "/pickups"} search={{ itemId } as never}>
            {cta}
          </Link>
        </Button>
      </div>
    </li>
  );
}
