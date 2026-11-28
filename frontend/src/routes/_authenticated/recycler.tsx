import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  EmptyState,
  ItemThumb,
  Page,
  PageHeader,
  Pager,
  Panel,
  QueryView,
  Spinner,
  VerificationBanner,
  useCatalog,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveApiAssetUrl } from "@/lib/config";
import { CONDITION_LABEL, dateLabel, kg } from "@/lib/format";
import { recyclerApi } from "@/services/domain.service";
import type { WasteItem } from "@/services/models";

export const Route = createFileRoute("/_authenticated/recycler")({
  head: () => ({
    meta: [{ title: "Recycling desk — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Desk,
});

const STAGES = [
  {
    key: "incoming",
    label: "To weigh",
    hint: "Delivered by collectors. Weigh each item at intake.",
  },
  {
    key: "received",
    label: "To process",
    hint: "Weighed. Record what you recovered to issue the certificate.",
  },
  { key: "processed", label: "Recycled", hint: "Certificates issued." },
] as const;

function Desk() {
  const [stage, setStage] = useState<(typeof STAGES)[number]["key"]>("incoming");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["recycler", stage, page],
    queryFn: () => recyclerApi.items(stage, { page }),
    refetchInterval: 20_000,
    placeholderData: (p) => p,
  });
  return (
    <Page>
      <PageHeader
        eyebrow="Recycler"
        title="Recycling desk"
        subtitle={STAGES.find((s) => s.key === stage)?.hint}
      />
      <div className="mt-6">
        <VerificationBanner />
      </div>
      <div role="tablist" className="mt-2 flex gap-2">
        {STAGES.map((s) => (
          <Button
            key={s.key}
            role="tab"
            aria-selected={stage === s.key}
            type="button"
            variant={stage === s.key ? "hero" : "soft"}
            onClick={() => {
              setStage(s.key);
              setPage(1);
            }}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <Panel className="mt-6">
        <QueryView
          query={q}
          empty={(d) =>
            d.items.length === 0 ? (
              <EmptyState title="Nothing here">
                Deliveries to your facilities show up automatically.
              </EmptyState>
            ) : null
          }
        >
          {(d) => (
            <>
              <ul className="divide-y divide-border">
                {d.items.map((i) => (
                  <DeskRow key={i._id} item={i} stage={stage} />
                ))}
              </ul>
              <Pager data={d} onPage={setPage} />
            </>
          )}
        </QueryView>
      </Panel>
    </Page>
  );
}

function DeskRow({
  item,
  stage,
}: {
  item: WasteItem & { facility?: { name: string } };
  stage: string;
}) {
  const { label } = useCatalog();
  const qc = useQueryClient();
  const done = () => {
    void qc.invalidateQueries({ queryKey: ["recycler"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const [w, setW] = useState("");
  const [note, setNote] = useState("");
  const [mats, setMats] = useState([{ material: "", kg: "" }]);
  const receive = useMutation({
    mutationFn: () => recyclerApi.receive(item._id, Number(w)),
    onSuccess: (r) => {
      setNote(
        r.weightMismatch
          ? "This differs by more than 20% from the collector's measurement. It has been noted on the item's timeline."
          : "",
      );
      done();
    },
  });
  const process = useMutation({
    mutationFn: () =>
      recyclerApi.process(
        item._id,
        mats
          .filter((m) => m.material.trim() && Number(m.kg) >= 0)
          .map((m) => ({ material: m.material.trim(), kg: Number(m.kg) })),
      ),
    onSuccess: done,
  });
  const err = receive.error ?? process.error;

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-4">
        <ItemThumb url={resolveApiAssetUrl(item.images[0]?.url)} alt="" className="size-14" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-muted-foreground">
            {label(item.category)} · {CONDITION_LABEL[item.condition]} · owner {kg(item.weightKg)},
            collector {kg(item.collectedWeightKg)}
            {item.receivedWeightKg != null ? `, intake ${kg(item.receivedWeightKg)}` : ""}
            {item.facility ? ` · ${item.facility.name}` : ""}
          </p>
          {stage === "processed" && item.certificate && (
            <p className="text-xs text-muted-foreground">
              Certificate {item.certificate.id} · {dateLabel(item.certificate.issuedAt)}
            </p>
          )}
        </div>
      </div>
      {note && (
        <p role="status" className="mt-3 rounded-xl bg-warning/20 px-3 py-2 text-sm">
          {note}
        </p>
      )}
      {err && (
        <div className="mt-3">
          <FormAlert>{err.message}</FormAlert>
        </div>
      )}
      {stage === "incoming" && (
        <form
          noValidate
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(w) > 0) receive.mutate();
          }}
        >
          <FormField id={`w-${item._id}`} label="Intake weight (kg)">
            <Input
              id={`w-${item._id}`}
              type="number"
              step="0.01"
              min="0.01"
              className="w-40"
              value={w}
              onChange={(e) => setW(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="emerald" disabled={receive.isPending || !(Number(w) > 0)}>
            {receive.isPending && <Spinner />} Record weight
          </Button>
        </form>
      )}
      {stage === "received" && (
        <form
          noValidate
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            process.mutate();
          }}
        >
          <p className="text-sm font-semibold">Recovered materials</p>
          {mats.map((m, i) => (
            <div key={i} className="flex flex-wrap gap-3">
              <Input
                aria-label="Material"
                placeholder="Material, e.g. Copper"
                className="w-56"
                value={m.material}
                onChange={(e) =>
                  setMats((s) =>
                    s.map((x, j) => (j === i ? { ...x, material: e.target.value } : x)),
                  )
                }
              />
              <Input
                aria-label="Weight in kg"
                type="number"
                step="0.01"
                min="0"
                placeholder="kg"
                className="w-28"
                value={m.kg}
                onChange={(e) =>
                  setMats((s) => s.map((x, j) => (j === i ? { ...x, kg: e.target.value } : x)))
                }
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="soft"
              size="sm"
              onClick={() => setMats((s) => [...s, { material: "", kg: "" }])}
            >
              Add material
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={process.isPending || !mats.some((m) => m.material.trim() && m.kg !== "")}
            >
              {process.isPending && <Spinner />} Issue certificate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Recovered weight can't exceed the intake weight. The certificate is public via the
            item's QR code.
          </p>
        </form>
      )}
    </li>
  );
}
