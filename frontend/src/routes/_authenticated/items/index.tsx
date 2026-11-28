import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import {
  EmptyState,
  ItemThumb,
  NativeSelect,
  Page,
  PageHeader,
  Pager,
  Panel,
  Pill,
  QueryView,
  useCatalog,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveApiAssetUrl } from "@/lib/config";
import { CONDITION_LABEL, ITEM_STATUS, dateLabel, kg } from "@/lib/format";
import { itemsApi } from "@/services/domain.service";

export const Route = createFileRoute("/_authenticated/items/")({
  head: () => ({
    meta: [{ title: "My items — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Items,
});

function Items() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { label } = useCatalog();
  const query = useQuery({
    queryKey: ["items", "list", page, status, q],
    queryFn: () => itemsApi.list({ page, status, q }),
    placeholderData: (p) => p,
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Items"
        title="My items"
        actions={
          <Button asChild variant="hero">
            <Link to="/items/new">Report an item</Link>
          </Button>
        }
      />
      <Panel className="mt-8">
        <div className="mb-5 flex flex-wrap gap-3">
          <Input
            aria-label="Search items"
            placeholder="Search by title"
            className="max-w-xs"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <NativeSelect
            aria-label="Filter by status"
            className="max-w-[14rem]"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(ITEM_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <QueryView
          query={query}
          empty={(d) =>
            d.items.length === 0 ? (
              <EmptyState
                title="No items found"
                action={
                  <Button asChild variant="hero">
                    <Link to="/items/new">Report an item</Link>
                  </Button>
                }
              >
                {status || q
                  ? "Try clearing the filters."
                  : "Report your first item to see its best next life."}
              </EmptyState>
            ) : null
          }
        >
          {(d) => (
            <>
              <ul className="divide-y divide-border">
                {d.items.map((i) => (
                  <li key={i._id}>
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: i._id }}
                      className="flex items-center gap-4 py-4 hover:opacity-90"
                    >
                      <ItemThumb
                        url={resolveApiAssetUrl(i.images[0]?.url)}
                        alt=""
                        className="size-16"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{i.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {label(i.category)} · {CONDITION_LABEL[i.condition]} · {kg(i.weightKg)} ·{" "}
                          {dateLabel(i.createdAt)}
                        </p>
                      </div>
                      <Pill tone={ITEM_STATUS[i.status].tone}>{ITEM_STATUS[i.status].label}</Pill>
                    </Link>
                  </li>
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
