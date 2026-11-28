import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import {
  CategorySelect,
  EmptyState,
  ItemThumb,
  NativeSelect,
  Page,
  PageHeader,
  Pager,
  Pill,
  QueryView,
  VerificationBanner,
  useCatalog,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiAssetUrl } from "@/lib/config";
import { CONDITION_LABEL, inr, kg, nameOf } from "@/lib/format";
import { marketApi } from "@/services/domain.service";

export const Route = createFileRoute("/_authenticated/marketplace/")({
  head: () => ({
    meta: [{ title: "Marketplace — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Market,
});

function Market() {
  const { user } = useAuth();
  const { label } = useCatalog();
  const [f, setF] = useState({
    q: "",
    category: "",
    condition: "",
    city: user?.address?.city ?? "",
    sort: "new",
    mine: false,
  });
  const [page, setPage] = useState(1);
  const set = (k: keyof typeof f, v: string | boolean) => {
    setF((s) => ({ ...s, [k]: v }));
    setPage(1);
  };
  const q = useQuery({
    queryKey: ["market", f, page],
    queryFn: () => marketApi.list({ ...f, mine: f.mine || undefined, page }),
    placeholderData: (p) => p,
  });
  const canSell = ["citizen", "organization", "scrap_dealer", "recycler"].includes(
    user?.role ?? "",
  );

  return (
    <Page wide>
      <PageHeader
        eyebrow="Marketplace"
        title="Reuse marketplace"
        subtitle="Working and repairable electronics, and scrap by weight. Offers are compared with a fair range."
        actions={
          canSell ? (
            <Button asChild variant="hero">
              <Link to="/marketplace/new">List an item</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mt-6">
        <VerificationBanner />
      </div>
      <div className="mt-2 grid gap-3 md:grid-cols-6">
        <Input
          aria-label="Search"
          placeholder="Search listings"
          className="md:col-span-2"
          value={f.q}
          onChange={(e) => set("q", e.target.value)}
        />
        <CategorySelect
          value={f.category}
          onChange={(v) => set("category", v)}
          includeAll="All categories"
        />
        <NativeSelect
          aria-label="Condition"
          value={f.condition}
          onChange={(e) => set("condition", e.target.value)}
        >
          <option value="">Any condition</option>
          {Object.entries(CONDITION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
        <Input
          aria-label="City"
          placeholder="City"
          value={f.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <NativeSelect
          aria-label="Sort"
          value={f.sort}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="new">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </NativeSelect>
      </div>
      {canSell && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-emerald)]"
            checked={f.mine}
            onChange={(e) => set("mine", e.target.checked)}
          />{" "}
          Only my listings
        </label>
      )}
      <div className="mt-6">
        <QueryView
          query={q}
          empty={(d) =>
            d.items.length === 0 ? (
              <EmptyState title="No listings found">
                Try different filters, or clear the city.
              </EmptyState>
            ) : null
          }
        >
          {(d) => (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {d.items.map((l) => (
                  <li key={l._id}>
                    <Link
                      to="/marketplace/$listingId"
                      params={{ listingId: l._id }}
                      className="block rounded-2xl border border-border bg-paper p-4 shadow-soft transition-shadow hover:shadow-lift"
                    >
                      <ItemThumb
                        url={resolveApiAssetUrl(l.images[0]?.url)}
                        alt=""
                        className="h-36 w-full"
                      />
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground">{l.title}</p>
                        {l.status !== "active" && <Pill tone="warning">{l.status}</Pill>}
                      </div>
                      <p className="mt-1 text-xl font-semibold text-primary">{inr(l.price)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {label(l.category)} · {CONDITION_LABEL[l.condition]} · {kg(l.weightKg)}
                        {l.city ? ` · ${l.city}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {nameOf(l.seller as never)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Pager data={d} onPage={setPage} />
            </>
          )}
        </QueryView>
      </div>
    </Page>
  );
}
