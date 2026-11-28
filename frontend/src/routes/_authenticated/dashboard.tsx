import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import type { ReactNode } from "react";
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

import {
  EmptyState,
  ErrorNote,
  ItemThumb,
  Loading,
  Page,
  PageHeader,
  Panel,
  Pill,
  QueryView,
  Stat,
  VerificationBanner,
  useCatalog,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { ITEM_STATUS, PICKUP_STATUS, dateLabel, kg } from "@/lib/format";
import { resolveApiAssetUrl } from "@/lib/config";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { analyticsApi, itemsApi, pickupsApi } from "@/services/domain.service";
import type { Summary } from "@/services/models";
import type { User } from "@/services/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Resortify" },
      { name: "description", content: "Your Resortify dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const sum = (v: unknown) =>
  v && typeof v === "object"
    ? Object.values(v as Record<string, number>).reduce((a, b) => a + b, 0)
    : 0;
const at = (v: unknown, k: string) =>
  v && typeof v === "object" ? ((v as Record<string, number>)[k] ?? 0) : 0;

function Dashboard() {
  const { user } = useAuth();
  const summary = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: analyticsApi.summary,
    refetchInterval: 60_000,
  });
  if (!user) return null;
  const firstName = user.name.split(" ")[0];
  const role = user.role as Role;

  return (
    <Page>
      <PageHeader
        eyebrow={`${ROLE_LABELS[role]} dashboard`}
        title={role === "admin" ? "Platform overview" : `Hello, ${firstName}.`}
        subtitle={
          role === "citizen" ? "Here's where your items will start their next lives." : undefined
        }
      />
      <div className="mt-8 space-y-6">
        <VerificationBanner />
        {summary.isPending && <Loading rows={2} />}
        {summary.isError && (
          <ErrorNote error={summary.error} onRetry={() => void summary.refetch()} />
        )}
        {summary.data && <RoleBody role={role} s={summary.data} user={user} />}
      </div>
    </Page>
  );
}

function Stats({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function Action({
  to,
  children,
  variant = "soft",
}: {
  to: string;
  children: ReactNode;
  variant?: "hero" | "soft";
}) {
  return (
    <Button asChild variant={variant}>
      <Link to={to as "/dashboard"}>{children}</Link>
    </Button>
  );
}

function RoleBody({ role, s, user }: { role: Role; s: Summary; user: User }) {
  switch (role) {
    case "citizen":
    case "organization":
      return <CitizenBody s={s} user={user} org={role === "organization"} />;
    case "collection_partner":
      return (
        <>
          <Stats>
            <Stat
              label="Open pickups near you"
              value={num(s.openPickups)}
              hint={user.address?.city ? `In ${user.address.city}` : "Add your city to filter"}
            />
            <Stat
              label="Active jobs"
              value={
                at(s.pickups, "accepted") + at(s.pickups, "on_the_way") + at(s.pickups, "collected")
              }
            />
            <Stat label="Delivered" value={at(s.pickups, "delivered")} />
            <Stat label="Drives claimed" value={sum(s.drives)} />
          </Stats>
          <div className="flex flex-wrap gap-3">
            <Action to="/pickups" variant="hero">
              Find pickups <ArrowRight />
            </Action>
            <Action to="/drives">Collection drives</Action>
            <Action to="/facilities">Collection points</Action>
          </div>
        </>
      );
    case "recycler":
      return (
        <>
          <Stats>
            <Stat label="Waiting to be weighed" value={num(s.incoming)} />
            <Stat label="Weighed, to process" value={num(s.received)} />
            <Stat label="Items recycled" value={num(s.processed)} />
            <Stat label="Recycled weight" value={kg(num(s.processedKg))} />
          </Stats>
          <div className="flex flex-wrap gap-3">
            <Action to="/recycler" variant="hero">
              Open recycling desk <ArrowRight />
            </Action>
            <Action to="/facilities">My facilities ({num(s.facilities)})</Action>
            <Action to="/prices">My rates</Action>
          </div>
        </>
      );
    case "scrap_dealer":
      return (
        <>
          <Stats>
            <Stat label="Pending offers" value={at(s.offers, "pending")} />
            <Stat label="Accepted offers" value={at(s.offers, "accepted")} />
            <Stat
              label="Rates published"
              value={num(s.rates)}
              hint="Two dealers in a city set the local average"
            />
            <Stat label="Listings in your city" value={num(s.listingsInCity)} />
          </Stats>
          <div className="flex flex-wrap gap-3">
            <Action to="/marketplace" variant="hero">
              Browse marketplace <ArrowRight />
            </Action>
            <Action to="/prices">Publish rates</Action>
            <Action to="/facilities">My facilities ({num(s.facilities)})</Action>
          </div>
        </>
      );
    case "ngo":
      return (
        <>
          <Stats>
            <Stat label="New offers" value={at(s.donations, "pledged")} />
            <Stat label="Accepted, awaiting handover" value={at(s.donations, "accepted")} />
            <Stat label="Received" value={at(s.donations, "received")} />
            <Stat label="Open needs" value={num(s.openNeeds)} />
          </Stats>
          <div className="flex flex-wrap gap-3">
            <Action to="/donations" variant="hero">
              Manage donations <ArrowRight />
            </Action>
            <Action to="/facilities">My locations</Action>
          </div>
        </>
      );
    case "admin":
      return <AdminBody s={s} />;
  }
}

function profileChecklist(user: User) {
  return [
    { label: "Add a profile photo", done: !!user.avatarUrl },
    { label: "Add a phone number", done: !!user.phone },
    { label: "Add your city and PIN code", done: !!user.address?.city && !!user.address?.pincode },
  ];
}

function CitizenBody({ s, user, org }: { s: Summary; user: User; org: boolean }) {
  const items = useQuery({
    queryKey: ["items", "recent"],
    queryFn: () => itemsApi.list({ limit: 4 }),
  });
  const pickups = useQuery({
    queryKey: ["pickups", "active"],
    queryFn: () => pickupsApi.list({ limit: 4 }),
  });
  const { label } = useCatalog();
  const checklist = profileChecklist(user);
  const done = checklist.filter((c) => c.done).length;
  const active =
    pickups.data?.items.filter((p) => !["delivered", "cancelled"].includes(p.status)) ?? [];

  return (
    <>
      <Stats>
        <Stat label="Items reported" value={sum(s.items)} />
        <Stat
          label="Active pickups"
          value={
            at(s.pickups, "requested") +
            at(s.pickups, "accepted") +
            at(s.pickups, "on_the_way") +
            at(s.pickups, "collected")
          }
        />
        <Stat label="Active listings" value={num(s.activeListings)} />
        {org ? (
          <Stat label="Drives" value={sum(s.drives)} />
        ) : (
          <Stat label="Reward points" value={num(s.points)} />
        )}
      </Stats>

      <div className="flex flex-wrap gap-3">
        <Action to="/items/new" variant="hero">
          Scan or report an item <ArrowRight />
        </Action>
        <Action to="/pickups">Request a pickup</Action>
        <Action to="/map">Find a recycler</Action>
        {org && <Action to="/drives">Plan a drive</Action>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel
          title="Recent items"
          actions={
            <Link to="/items" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          }
        >
          <QueryView
            query={items}
            empty={(d) =>
              d.items.length === 0 ? (
                <EmptyState
                  title="No items yet"
                  action={
                    <Action to="/items/new" variant="hero">
                      Report your first item
                    </Action>
                  }
                >
                  Report an item to see its best next life.
                </EmptyState>
              ) : null
            }
          >
            {(d) => (
              <ul className="divide-y divide-border">
                {d.items.map((i) => (
                  <li key={i._id}>
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: i._id }}
                      className="flex items-center gap-4 py-3 hover:opacity-90"
                    >
                      <ItemThumb
                        url={resolveApiAssetUrl(i.images[0]?.url)}
                        alt=""
                        className="size-12"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{i.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {label(i.category)} · {kg(i.weightKg)}
                        </p>
                      </div>
                      <Pill tone={ITEM_STATUS[i.status].tone}>{ITEM_STATUS[i.status].label}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>

        <div className="space-y-6">
          <Panel title="Pickups in progress">
            <QueryView
              query={pickups}
              empty={() =>
                active.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pickups in progress.</p>
                ) : null
              }
            >
              {() => (
                <ul className="space-y-3">
                  {active.map((p) => (
                    <li key={p._id}>
                      <Link
                        to="/pickups/$pickupId"
                        params={{ pickupId: p._id }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:bg-secondary/50"
                      >
                        <span className="text-sm font-medium">
                          {dateLabel(p.preferredDate)} · {p.items.length || "Recurring"}{" "}
                          {p.items.length ? "item(s)" : "pickup"}
                        </span>
                        <Pill tone={PICKUP_STATUS[p.status].tone}>
                          {PICKUP_STATUS[p.status].label}
                        </Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </QueryView>
          </Panel>

          {done < checklist.length && (
            <Panel
              title="Complete your profile"
              actions={
                <span className="text-sm font-semibold text-muted-foreground">
                  {done}/{checklist.length}
                </span>
              }
            >
              <Progress value={(done / checklist.length) * 100} className="h-2 bg-secondary" />
              <ul className="mt-4 space-y-2">
                {checklist.map((i) => (
                  <li key={i.label} className="flex items-center gap-3 text-sm">
                    {i.done ? (
                      <CheckCircle2 className="size-5 text-success" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/50" />
                    )}
                    <span
                      className={i.done ? "text-muted-foreground line-through" : "text-foreground"}
                    >
                      {i.label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Your city and PIN code let us match you with collectors, dealers and NGOs in your
                area, and fill in pickup forms for you.
              </p>
              <Button asChild variant="hero" className="mt-4">
                <Link to="/profile">
                  Edit profile <ArrowRight />
                </Link>
              </Button>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function AdminBody({ s }: { s: Summary }) {
  const q = useQuery({ queryKey: ["analytics", "platform"], queryFn: analyticsApi.platform });
  return (
    <>
      <Stats>
        <Stat label="Partners awaiting verification" value={num(s.pendingPartners)} />
        <Stat label="Unverified facilities" value={num(s.unverifiedFacilities)} />
        <Stat label="Reported posts" value={num(s.reportedPosts)} />
        <Stat label="Users" value={num(s.users)} />
      </Stats>
      <div className="flex flex-wrap gap-3">
        <Action to="/admin/users" variant="hero">
          Review partners <ArrowRight />
        </Action>
        <Action to="/admin/facilities">Verify facilities</Action>
        <Action to="/admin/moderation">Moderation & inbox</Action>
      </div>
      <QueryView query={q}>
        {(d) => (
          <>
            <Stats>
              <Stat label="Items reported" value={d.totals.items} hint={kg(d.totals.weightKg)} />
              <Stat
                label="Recovered"
                value={kg(d.totals.recoveredKg)}
                hint="Recycled, donated or sold"
              />
              <Stat
                label="CO₂ avoided (estimate)"
                value={`${d.totals.co2KgAvoidedEstimate.toLocaleString("en-IN")} kg`}
              />
              <Stat label="Verified facilities" value={d.totals.verifiedFacilities} />
            </Stats>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Items reported per month">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={d.monthlyItems} margin={{ left: -20, right: 8, top: 8 }}>
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
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Items by category">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={d.byCategory.slice(0, 8)}
                    margin={{ left: -20, right: 8, top: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      fontSize={10}
                      interval={0}
                      angle={-25}
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
              <Panel title="Pickups per month">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={d.monthlyPickups} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Pickups"
                      fill="var(--color-chart-2)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Top recyclers by weight">
                {d.topRecyclers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recycled items yet.</p>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {d.topRecyclers.map((r, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {i + 1}. {r.name ?? "Unknown"}
                        </span>
                        <span className="font-semibold">
                          {kg(r.kg)} · {r.n} items
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>
            <p className="text-xs text-muted-foreground">{d.note}</p>
          </>
        )}
      </QueryView>
    </>
  );
}
