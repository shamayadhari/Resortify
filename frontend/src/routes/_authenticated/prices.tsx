import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  CategorySelect,
  NativeSelect,
  Page,
  PageHeader,
  Panel,
  QueryView,
  Spinner,
  VerificationBanner,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { CONDITION_LABEL, inr, inrRange } from "@/lib/format";
import { pricesApi } from "@/services/domain.service";
import type { Condition } from "@/services/models";

export const Route = createFileRoute("/_authenticated/prices")({
  head: () => ({
    meta: [{ title: "Fair price — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Prices,
});

function Prices() {
  const { user } = useAuth();
  const isDealer = user?.role === "scrap_dealer" || user?.role === "recycler";
  return (
    <Page>
      <PageHeader
        eyebrow="Fair price & weight"
        title={isDealer ? "Your rates" : "Fair price guide"}
        subtitle="Ranges are indicative. Real prices come from dealers' published rates per kg and the weights measured at pickup and intake."
      />
      <div className="mt-8 space-y-6">
        {isDealer && (
          <>
            <VerificationBanner />
            <RatesEditor />
          </>
        )}
        <Calculator />
        <Market />
      </div>
    </Page>
  );
}

function Calculator() {
  const [f, setF] = useState({
    category: "laptop",
    condition: "working" as Condition,
    weightKg: "2",
    ageYears: "2",
  });
  const q = useQuery({
    queryKey: ["estimate", f],
    queryFn: () => pricesApi.estimate(f),
    enabled: Number(f.weightKg) > 0,
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Panel title="Price calculator">
      <div className="grid gap-4 sm:grid-cols-4">
        <FormField id="pc" label="Category">
          <CategorySelect
            id="pc"
            value={f.category}
            onChange={(v) => setF((s) => ({ ...s, category: v }))}
          />
        </FormField>
        <FormField id="pcond" label="Condition">
          <NativeSelect id="pcond" value={f.condition} onChange={set("condition")}>
            {Object.entries(CONDITION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="pw" label="Weight (kg)">
          <Input
            id="pw"
            type="number"
            min="0.01"
            step="0.1"
            value={f.weightKg}
            onChange={set("weightKg")}
          />
        </FormField>
        <FormField id="pa" label="Age (years)">
          <Input
            id="pa"
            type="number"
            min="0"
            max="40"
            value={f.ageYears}
            onChange={set("ageYears")}
          />
        </FormField>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2" aria-live="polite">
        {q.data && (
          <>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Resale value</p>
              <p className="mt-1 font-display text-2xl font-semibold">{inrRange(q.data.resale)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Condition factor {q.data.basis.conditionFactor}, age factor {q.data.basis.ageFactor}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Scrap value by weight
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">{inrRange(q.data.scrap)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {inr(q.data.scrap.ratePerKg)}/kg · {q.data.basis.rateSource}
              </p>
            </div>
          </>
        )}
      </div>
      {q.data && <p className="mt-3 text-xs text-muted-foreground">{q.data.disclaimer}</p>}
    </Panel>
  );
}

function Market() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["prices", "market", user?.address?.city],
    queryFn: () => pricesApi.market(),
  });
  return (
    <Panel
      title="Scrap rates per kg"
      description={
        q.data?.city
          ? `Default table and the local average for ${q.data.city} (shown once two or more dealers publish a rate).`
          : "Add your city in your profile to see local dealer averages."
      }
    >
      <QueryView query={q}>
        {(d) => (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Default</th>
                  <th className="py-2 pr-4 font-medium">Local average</th>
                  <th className="py-2 font-medium">Dealers</th>
                </tr>
              </thead>
              <tbody>
                {d.rates.map((r) => (
                  <tr key={r.category} className="border-b border-border/60">
                    <td className="py-2 pr-4">{r.label}</td>
                    <td className="py-2 pr-4">{inr(r.defaultPerKg)}</td>
                    <td className="py-2 pr-4 font-semibold">
                      {r.localAveragePerKg ? inr(r.localAveragePerKg) : "—"}
                    </td>
                    <td className="py-2">{r.dealers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryView>
    </Panel>
  );
}

function RatesEditor() {
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ["prices", "mine"], queryFn: pricesApi.mine });
  const market = useQuery({
    queryKey: ["prices", "market", "defaults"],
    queryFn: () => pricesApi.market(),
  });
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    if (mine.data)
      setVals(Object.fromEntries(mine.data.map((r) => [r.category, String(r.ratePerKg)])));
  }, [mine.data]);
  const save = useMutation({
    mutationFn: () =>
      pricesApi.save(
        Object.entries(vals)
          .filter(([, v]) => v !== "" && Number(v) >= 0)
          .map(([category, v]) => ({ category, ratePerKg: Number(v) })),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["prices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  return (
    <Panel
      title="Publish your buying rates (₹ per kg)"
      description="Citizens and recyclers see the local average of published rates. Leave a category empty if you don't buy it."
    >
      <QueryView query={market}>
        {(m) => (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {save.isError && <FormAlert>{save.error.message}</FormAlert>}
            {save.isSuccess && <FormAlert tone="success">Rates saved.</FormAlert>}
            <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {m.rates.map((r) => (
                <FormField
                  key={r.category}
                  id={`r-${r.category}`}
                  label={r.label}
                  hint={`Default ${inr(r.defaultPerKg)}/kg`}
                >
                  <Input
                    id={`r-${r.category}`}
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={vals[r.category] ?? ""}
                    onChange={(e) => setVals((s) => ({ ...s, [r.category]: e.target.value }))}
                  />
                </FormField>
              ))}
            </div>
            <Button type="submit" variant="hero" className="mt-5" disabled={save.isPending}>
              {save.isPending && <Spinner />} Save rates
            </Button>
          </form>
        )}
      </QueryView>
    </Panel>
  );
}
