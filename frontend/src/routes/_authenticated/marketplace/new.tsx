import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  CategorySelect,
  NativeSelect,
  Page,
  PageHeader,
  Panel,
  Spinner,
  VerificationBanner,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONDITION_LABEL, inrRange } from "@/lib/format";
import { itemsApi, marketApi, pricesApi } from "@/services/domain.service";
import type { Condition } from "@/services/models";

export const Route = createFileRoute("/_authenticated/marketplace/new")({
  validateSearch: (s: Record<string, unknown>): { itemId?: string | undefined } => ({
    itemId: typeof s["itemId"] === "string" ? s["itemId"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "List an item — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: NewListing,
});

function NewListing() {
  const { itemId } = Route.useSearch();
  const navigate = useNavigate();
  const item = useQuery({
    queryKey: ["items", itemId],
    queryFn: () => itemsApi.get(itemId!),
    enabled: !!itemId,
  });
  const [f, setF] = useState({
    title: "",
    description: "",
    category: "laptop",
    condition: "working" as Condition,
    weightKg: "",
    price: "",
  });
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    const i = item.data?.item;
    if (i)
      setF((s) => ({
        ...s,
        title: i.title,
        description: i.description,
        category: i.category,
        condition: i.condition,
        weightKg: String(i.weightKg),
      }));
  }, [item.data]);

  const est = useQuery({
    queryKey: ["estimate", f.category, f.condition, f.weightKg, item.data?.item.ageYears],
    queryFn: () =>
      pricesApi.estimate({
        category: f.category,
        condition: f.condition,
        weightKg: f.weightKg,
        ageYears: item.data?.item.ageYears,
      }),
    enabled: Number(f.weightKg) > 0,
  });
  const range = est.data
    ? f.condition === "not_working"
      ? est.data.scrap
      : est.data.resale
    : null;

  const create = useMutation({
    mutationFn: () =>
      marketApi.create({
        itemId,
        title: f.title.trim(),
        description: f.description.trim(),
        category: f.category,
        condition: f.condition,
        weightKg: Number(f.weightKg),
        price: Number(f.price),
      }),
    onSuccess: (r) =>
      navigate({ to: "/marketplace/$listingId", params: { listingId: r.listing._id } }),
  });
  const valid =
    f.title.trim().length >= 2 && Number(f.weightKg) > 0 && f.price !== "" && Number(f.price) >= 0;
  const locked = !!itemId;

  return (
    <Page>
      <PageHeader eyebrow="Marketplace" title="List an item for sale" />
      <div className="mt-6">
        <VerificationBanner />
      </div>
      <form
        noValidate
        className="mt-2 grid gap-6 lg:grid-cols-[1.3fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) create.mutate();
        }}
      >
        <Panel title="Listing">
          <div className="space-y-5">
            {create.isError && <FormAlert>{create.error.message}</FormAlert>}
            {item.isError && <FormAlert>{item.error.message}</FormAlert>}
            <FormField
              id="title"
              label="Title"
              error={touched && f.title.trim().length < 2 ? "Enter a title" : undefined}
            >
              <Input id="title" value={f.title} onChange={set("title")} maxLength={100} />
            </FormField>
            <FormField id="description" label="Description">
              <Textarea
                id="description"
                rows={3}
                maxLength={1000}
                value={f.description}
                onChange={set("description")}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField id="category" label="Category">
                <CategorySelect
                  id="category"
                  value={f.category}
                  onChange={(v) => setF((s) => ({ ...s, category: v }))}
                />
              </FormField>
              <FormField id="condition" label="Condition">
                <NativeSelect
                  id="condition"
                  value={f.condition}
                  onChange={set("condition")}
                  disabled={locked}
                >
                  {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                id="weightKg"
                label="Weight (kg)"
                error={touched && !(Number(f.weightKg) > 0) ? "Enter a weight" : undefined}
              >
                <Input
                  id="weightKg"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={f.weightKg}
                  onChange={set("weightKg")}
                />
              </FormField>
            </div>
            <FormField
              id="price"
              label="Asking price (₹)"
              error={
                touched && (f.price === "" || Number(f.price) < 0) ? "Enter a price" : undefined
              }
            >
              <Input id="price" type="number" min="0" value={f.price} onChange={set("price")} />
            </FormField>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Fair price guide">
            {est.isFetching ? (
              <p className="text-sm text-muted-foreground">Calculating…</p>
            ) : range ? (
              <>
                <p className="font-display text-3xl font-semibold">{inrRange(range)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.condition === "not_working" ? "Scrap value by weight" : "Typical resale range"}{" "}
                  · {est.data?.basis.rateSource}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{est.data?.disclaimer}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="soft"
                  className="mt-3"
                  onClick={() =>
                    setF((s) => ({ ...s, price: String(Math.round((range.min + range.max) / 2)) }))
                  }
                >
                  Use the middle of the range
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter the weight to see an indicative range.
              </p>
            )}
          </Panel>
          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={create.isPending}
          >
            {create.isPending && <Spinner />} Publish listing
          </Button>
        </div>
      </form>
    </Page>
  );
}
