import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Award, Trophy } from "lucide-react";
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
  Stat,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel } from "@/lib/format";
import { rewardsApi } from "@/services/domain.service";
import type { Reward } from "@/services/models";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [{ title: "Rewards — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Rewards,
});

function Rewards() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminRewards /> : <Mine />;
}

const RULE_LABEL: Record<string, string> = {
  item_reported: "Report an item",
  pickup_completed: "Complete a pickup",
  per_kg_recycled: "Per kg recycled (max 100 per item)",
  item_donated: "Donation received by an NGO",
  item_sold: "Sell an item",
  post_created: "Community post (first 3 a day)",
  first_item_bonus: "Your first item",
};

function Mine() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const me = useQuery({
    queryKey: ["rewards", "me", page],
    queryFn: () => rewardsApi.me(page),
    placeholderData: (p) => p,
  });
  const catalog = useQuery({
    queryKey: ["rewards", "catalog"],
    queryFn: () => rewardsApi.catalog(),
  });
  const board = useQuery({ queryKey: ["rewards", "leaders"], queryFn: rewardsApi.leaders });
  const [got, setGot] = useState<{ title: string; code: string } | null>(null);
  const redeem = useMutation({
    mutationFn: (id: string) => rewardsApi.redeem(id),
    onSuccess: (r) => {
      setGot(r.redemption);
      void qc.invalidateQueries({ queryKey: ["rewards"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Rewards"
        title="Your rewards"
        subtitle="Points are earned only for real actions, and each action pays once."
      />
      <div className="mt-8 space-y-6">
        <QueryView query={me}>
          {(d) => (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Points" value={d.points} />
                <Stat
                  label="Level"
                  value={d.level.name}
                  hint={
                    d.level.next
                      ? `${d.level.next.at - d.points} points to ${d.level.next.name}`
                      : "Top level"
                  }
                />
                <Stat
                  label="Badges"
                  value={`${d.badges.filter((b) => b.earned).length}/${d.badges.length}`}
                />
              </div>
              {d.level.next && (
                <Progress
                  aria-label="Progress to next level"
                  value={Math.min(100, (d.points / d.level.next.at) * 100)}
                  className="h-2 bg-secondary"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {d.badges.map((b) => (
                  <span
                    key={b.key}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${b.earned ? "border-emerald bg-accent/40 font-semibold" : "border-border text-muted-foreground"}`}
                  >
                    <Award className="size-4" />
                    {b.label}
                    {!b.earned && " (locked)"}
                  </span>
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="How to earn">
                  <ul className="space-y-2 text-sm">
                    {Object.entries(d.rules).map(([k, v]) => (
                      <li key={k} className="flex justify-between">
                        <span>{RULE_LABEL[k] ?? k}</span>
                        <strong>+{v}</strong>
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="History">
                  {d.ledger.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <>
                      <ul className="divide-y divide-border text-sm">
                        {d.ledger.items.map((l, i) => (
                          <li key={i} className="flex justify-between py-2">
                            <span>
                              {l.reason}
                              <span className="block text-xs text-muted-foreground">
                                {dateLabel(l.at)}
                              </span>
                            </span>
                            <strong className={l.points < 0 ? "text-destructive" : "text-success"}>
                              {l.points > 0 ? "+" : ""}
                              {l.points}
                            </strong>
                          </li>
                        ))}
                      </ul>
                      <Pager data={d.ledger} onPage={setPage} />
                    </>
                  )}
                </Panel>
              </div>
              {d.redemptions.length > 0 && (
                <Panel title="Your vouchers">
                  <ul className="space-y-2 text-sm">
                    {d.redemptions.map((r) => (
                      <li key={r._id} className="flex justify-between">
                        <span>{r.title}</span>
                        <code className="font-semibold">{r.code}</code>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </>
          )}
        </QueryView>

        <Panel title="Redeem points">
          {got && (
            <FormAlert tone="success">
              Redeemed {got.title}. Your code is <strong>{got.code}</strong>.
            </FormAlert>
          )}
          {redeem.isError && <FormAlert>{redeem.error.message}</FormAlert>}
          <QueryView
            query={catalog}
            empty={(d) =>
              d.length === 0 ? (
                <EmptyState title="The catalogue is empty">
                  Rewards will appear here when the team adds them.
                </EmptyState>
              ) : null
            }
          >
            {(list) => (
              <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((r) => (
                  <li key={r._id} className="rounded-2xl border border-border p-4">
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                    <p className="mt-2 flex items-center justify-between">
                      <strong className="text-primary">{r.cost} points</strong>
                      {r.stock != null && (
                        <span className="text-xs text-muted-foreground">{r.stock} left</span>
                      )}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="hero"
                      className="mt-3"
                      disabled={
                        redeem.isPending || r.stock === 0 || (me.data?.points ?? 0) < r.cost
                      }
                      onClick={() => redeem.mutate(r._id)}
                    >
                      {r.stock === 0
                        ? "Out of stock"
                        : (me.data?.points ?? 0) < r.cost
                          ? "Not enough points"
                          : "Redeem"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>

        <Panel
          title="Leaderboard"
          description="Top citizens by points. Only first names and an initial are shown."
        >
          <QueryView
            query={board}
            empty={(d) =>
              d.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nobody has points yet.</p>
              ) : null
            }
          >
            {(l) => (
              <ol className="space-y-2 text-sm">
                {l.map((x, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 ? (
                        <Trophy className="size-4 text-warning" />
                      ) : (
                        <span className="w-4 text-center text-muted-foreground">{i + 1}</span>
                      )}
                      {x.name}
                    </span>
                    <strong>{x.points}</strong>
                  </li>
                ))}
              </ol>
            )}
          </QueryView>
        </Panel>
      </div>
    </Page>
  );
}

function AdminRewards() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["rewards", "admin"], queryFn: () => rewardsApi.catalog(true) });
  const [f, setF] = useState({ title: "", description: "", cost: "", stock: "" });
  const reset = () => {
    setF({ title: "", description: "", cost: "", stock: "" });
    void qc.invalidateQueries({ queryKey: ["rewards"] });
  };
  const create = useMutation({
    mutationFn: () =>
      rewardsApi.create({
        title: f.title.trim(),
        description: f.description.trim(),
        cost: Number(f.cost),
        stock: f.stock === "" ? undefined : Number(f.stock),
      }),
    onSuccess: reset,
  });
  const toggle = useMutation({
    mutationFn: (r: Reward) =>
      rewardsApi.update(r._id, {
        title: r.title,
        description: r.description,
        cost: r.cost,
        ...(r.stock != null ? { stock: r.stock } : {}),
        active: !r.active,
      }),
    onSuccess: reset,
  });
  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Rewards catalogue"
        subtitle="What people can redeem their points for."
      />
      <div className="mt-8 space-y-6">
        <Panel title="Add a reward">
          <form
            noValidate
            className="grid gap-4 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (f.title.trim().length >= 3 && Number(f.cost) >= 1) create.mutate();
            }}
          >
            {create.isError && (
              <div className="sm:col-span-4">
                <FormAlert>{create.error.message}</FormAlert>
              </div>
            )}
            <div className="sm:col-span-2">
              <FormField id="rt" label="Title">
                <Input
                  id="rt"
                  value={f.title}
                  onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))}
                />
              </FormField>
            </div>
            <FormField id="rc" label="Cost (points)">
              <Input
                id="rc"
                type="number"
                min="1"
                value={f.cost}
                onChange={(e) => setF((s) => ({ ...s, cost: e.target.value }))}
              />
            </FormField>
            <FormField id="rs" label="Stock" hint="Empty = unlimited">
              <Input
                id="rs"
                type="number"
                min="0"
                value={f.stock}
                onChange={(e) => setF((s) => ({ ...s, stock: e.target.value }))}
              />
            </FormField>
            <div className="sm:col-span-4">
              <FormField id="rd" label="Description">
                <Input
                  id="rd"
                  maxLength={300}
                  value={f.description}
                  onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="sm:col-span-4">
              <Button type="submit" variant="hero" disabled={create.isPending}>
                {create.isPending && <Spinner />} Add reward
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title="Catalogue">
          <QueryView
            query={q}
            empty={(d) =>
              d.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rewards yet.</p>
              ) : null
            }
          >
            {(list) => (
              <ul className="divide-y divide-border">
                {list.map((r) => (
                  <li
                    key={r._id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {r.title} {!r.active && <Pill>Hidden</Pill>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.cost} points{r.stock != null ? ` · ${r.stock} in stock` : " · unlimited"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="soft"
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(r)}
                    >
                      {r.active ? "Hide" : "Show"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>
      </div>
    </Page>
  );
}
