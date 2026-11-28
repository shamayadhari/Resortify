import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState, Page, PageHeader, Panel, QueryView, Stat } from "@/components/app/kit";
import { ITEM_STATUS, kg } from "@/lib/format";
import { analyticsApi } from "@/services/domain.service";
import type { ItemStatus } from "@/services/models";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({
    meta: [{ title: "My impact — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Impact,
});

function Impact() {
  const q = useQuery({ queryKey: ["analytics", "me"], queryFn: analyticsApi.me });
  return (
    <Page>
      <PageHeader
        eyebrow="Impact"
        title="My impact"
        subtitle="What your items have achieved so far."
      />
      <div className="mt-8 space-y-6">
        <QueryView
          query={q}
          empty={(d) =>
            d.totals.items === 0 ? (
              <EmptyState title="No impact yet">
                Report your first item and it will show up here.
              </EmptyState>
            ) : null
          }
        >
          {(d) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Items reported" value={d.totals.items} hint={kg(d.totals.weightKg)} />
                <Stat
                  label="Given a next life"
                  value={d.totals.recoveredItems}
                  hint="Recycled, donated or sold"
                />
                <Stat label="Weight recovered" value={kg(d.totals.recoveredKg)} />
                <Stat
                  label="CO₂ avoided"
                  value={`${d.totals.co2KgAvoidedEstimate} kg`}
                  hint="Estimate"
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Items per month">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={d.monthly} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Items"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="By category">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={d.byCategory} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="label"
                        fontSize={10}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Items"
                        fill="var(--color-chart-3)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              </div>
              <Panel title="Where your items are">
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {d.byStatus.map((s) => (
                    <li
                      key={s.status}
                      className="flex justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
                    >
                      <span>{ITEM_STATUS[s.status as ItemStatus]?.label ?? s.status}</span>
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
              </Panel>
              <p className="text-xs text-muted-foreground">{d.note}</p>
            </>
          )}
        </QueryView>
      </div>
    </Page>
  );
}
