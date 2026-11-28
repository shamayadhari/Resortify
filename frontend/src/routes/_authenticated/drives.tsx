import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  EmptyState,
  Page,
  PageHeader,
  Pager,
  Panel,
  Pill,
  QueryView,
  Spinner,
  VerificationBanner,
  useCatalog,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel, kg, nameOf, today, type Tone } from "@/lib/format";
import { drivesApi } from "@/services/domain.service";
import type { Drive, DriveReport } from "@/services/models";

export const Route = createFileRoute("/_authenticated/drives")({
  head: () => ({
    meta: [{ title: "Collection drives — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Drives,
});

const TONE: Record<Drive["status"], Tone> = {
  open: "warning",
  claimed: "info",
  completed: "success",
  cancelled: "danger",
};

function Drives() {
  const { user } = useAuth();
  const isOrg = user?.role === "organization";
  return (
    <Page>
      <PageHeader
        eyebrow="Collection drives"
        title={isOrg ? "Your collection drives" : "Drives to collect"}
        subtitle={
          isOrg
            ? "Plan a bulk collection for your business or college. A collector or recycler claims it, and you get a report when it is done."
            : "Open drives in your city. Claim one, collect, then record the actual weight."
        }
      />
      <div className="mt-8 space-y-6">
        {!isOrg && <VerificationBanner />}
        {isOrg && <DriveForm />}
        <DriveList scope={isOrg ? undefined : "open"} />
        {!isOrg && user?.role !== "admin" && <DriveList scope="mine" />}
      </div>
    </Page>
  );
}

function DriveForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { categories } = useCatalog();
  const a = user?.address;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "",
    description: "",
    date: today(),
    line1: a?.line1 ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    pincode: a?.pincode ?? "",
    expectedWeightKg: "",
  });
  const [cats, setCats] = useState<string[]>([]);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const create = useMutation({
    mutationFn: () =>
      drivesApi.create({
        title: f.title.trim(),
        description: f.description.trim(),
        date: new Date(`${f.date}T09:00:00`).toISOString(),
        expectedWeightKg: f.expectedWeightKg ? Number(f.expectedWeightKg) : undefined,
        categories: cats,
        address: {
          line1: f.line1.trim(),
          city: f.city.trim(),
          state: f.state.trim(),
          pincode: f.pincode.trim(),
        },
      }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["drives"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const valid =
    f.title.trim().length >= 3 &&
    f.line1.trim().length >= 3 &&
    f.city.trim().length >= 2 &&
    /^[1-9][0-9]{5}$/.test(f.pincode.trim());
  if (!open)
    return (
      <div>
        <Button type="button" variant="hero" onClick={() => setOpen(true)}>
          Plan a drive
        </Button>
      </div>
    );
  return (
    <Panel title="Plan a collection drive">
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate();
        }}
      >
        {create.isError && <FormAlert>{create.error.message}</FormAlert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="dt" label="Title">
            <Input id="dt" value={f.title} maxLength={100} onChange={set("title")} />
          </FormField>
          <FormField id="dd" label="Date">
            <Input id="dd" type="date" min={today()} value={f.date} onChange={set("date")} />
          </FormField>
          <FormField id="dl" label="Address">
            <Input id="dl" value={f.line1} onChange={set("line1")} />
          </FormField>
          <FormField id="dc" label="City">
            <Input id="dc" value={f.city} onChange={set("city")} />
          </FormField>
          <FormField id="dp" label="PIN code" hint="6 digits">
            <Input
              id="dp"
              inputMode="numeric"
              maxLength={6}
              value={f.pincode}
              onChange={set("pincode")}
            />
          </FormField>
          <FormField id="dw" label="Expected weight (kg)">
            <Input
              id="dw"
              type="number"
              min="0"
              value={f.expectedWeightKg}
              onChange={set("expectedWeightKg")}
            />
          </FormField>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Expected categories</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs has-[:checked]:border-emerald has-[:checked]:bg-accent/40"
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-[var(--color-emerald)]"
                  checked={cats.includes(c.key)}
                  onChange={(e) =>
                    setCats((s) =>
                      e.target.checked ? [...s, c.key] : s.filter((x) => x !== c.key),
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" variant="hero" disabled={create.isPending || !valid}>
            {create.isPending && <Spinner />} Create drive
          </Button>
          <Button type="button" variant="soft" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function DriveList({ scope }: { scope?: "open" | "mine" | undefined }) {
  const { user } = useAuth();
  const isOrg = user?.role === "organization";
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["drives", scope, page],
    queryFn: () => drivesApi.list({ scope, page }),
    placeholderData: (p) => p,
    refetchInterval: 30_000,
  });
  return (
    <Panel
      title={
        scope === "open"
          ? "Open in your city"
          : scope === "mine"
            ? "Drives you claimed"
            : "All drives"
      }
    >
      <QueryView
        query={q}
        empty={(d) => (d.items.length === 0 ? <EmptyState title="No drives" /> : null)}
      >
        {(d) => (
          <>
            <ul className="divide-y divide-border">
              {d.items.map((x) => (
                <DriveRow key={x._id} d={x} isOrg={isOrg} />
              ))}
            </ul>
            <Pager data={d} onPage={setPage} />
          </>
        )}
      </QueryView>
    </Panel>
  );
}

function DriveRow({ d, isOrg }: { d: Drive; isOrg: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [w, setW] = useState("");
  const [n, setN] = useState("");
  const [report, setReport] = useState<DriveReport | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["drives"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const m = useMutation({
    mutationFn: async (k: "claim" | "complete" | "cancel" | "report") => {
      if (k === "claim") return drivesApi.claim(d._id);
      if (k === "cancel") return drivesApi.cancel(d._id);
      if (k === "report") return setReport(await drivesApi.report(d._id));
      return drivesApi.complete(d._id, {
        actualWeightKg: Number(w),
        itemCount: n ? Number(n) : undefined,
      });
    },
    onSuccess: refresh,
  });
  const mine = typeof d.claimedBy === "object" && d.claimedBy?._id === user?._id;
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{d.title}</p>
          <p className="text-sm text-muted-foreground">
            {dateLabel(d.date)} · {d.address.line1}, {d.address.city} · ~{kg(d.expectedWeightKg)} ·{" "}
            {nameOf(d.organization as never)}
            {d.claimedBy ? ` · collector ${d.claimedBy.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={TONE[d.status]}>{d.status}</Pill>
          {!isOrg && d.status === "open" && (
            <Button
              type="button"
              size="sm"
              variant="emerald"
              disabled={m.isPending}
              onClick={() => m.mutate("claim")}
            >
              Claim
            </Button>
          )}
          {isOrg && ["open", "claimed"].includes(d.status) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={m.isPending}
              onClick={() => {
                if (window.confirm("Cancel this drive?")) m.mutate("cancel");
              }}
            >
              Cancel
            </Button>
          )}
          {d.status === "completed" && (isOrg || mine) && (
            <Button
              type="button"
              size="sm"
              variant="soft"
              disabled={m.isPending}
              onClick={() => m.mutate("report")}
            >
              Report
            </Button>
          )}
        </div>
      </div>
      {m.isError && (
        <div className="mt-2">
          <FormAlert>{m.error.message}</FormAlert>
        </div>
      )}
      {mine && d.status === "claimed" && (
        <form
          noValidate
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(w) > 0) m.mutate("complete");
          }}
        >
          <FormField id={`w${d._id}`} label="Actual weight (kg)">
            <Input
              id={`w${d._id}`}
              type="number"
              step="0.1"
              min="0.1"
              className="w-36"
              value={w}
              onChange={(e) => setW(e.target.value)}
            />
          </FormField>
          <FormField id={`n${d._id}`} label="Items counted">
            <Input
              id={`n${d._id}`}
              type="number"
              min="0"
              className="w-32"
              value={n}
              onChange={(e) => setN(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="emerald" disabled={m.isPending || !(Number(w) > 0)}>
            Complete drive
          </Button>
        </form>
      )}
      {report && (
        <div className="mt-3 rounded-xl border border-emerald bg-accent/40 p-4 text-sm print:border-black">
          <p className="font-semibold">Drive report {report.certificateId}</p>
          <p>
            {report.title} · {report.organization}
            {report.collectedBy ? ` · collected by ${report.collectedBy}` : ""}
          </p>
          <p>
            {dateLabel(report.date)} · {report.address.line1}, {report.address.city}
          </p>
          <p>
            {report.itemCount} items · {kg(report.actualWeightKg)} · ≈ {report.co2KgAvoidedEstimate}{" "}
            kg CO₂ avoided (estimate)
          </p>
          <p className="text-xs text-muted-foreground">{report.co2Note}</p>
          <Button
            type="button"
            size="sm"
            variant="soft"
            className="mt-2 print:hidden"
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      )}
    </li>
  );
}
