import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  CategorySelect,
  EmptyState,
  NativeSelect,
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel, kg, nameOf, type Tone } from "@/lib/format";
import { itemsApi, ngoApi } from "@/services/domain.service";
import type { Donation } from "@/services/models";

export const Route = createFileRoute("/_authenticated/donations")({
  validateSearch: (s: Record<string, unknown>): { itemId?: string | undefined } => ({
    itemId: typeof s["itemId"] === "string" ? s["itemId"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Donations — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Donations,
});

const STATUS: Record<Donation["status"], { label: string; tone: Tone }> = {
  pledged: { label: "Waiting for the NGO", tone: "warning" },
  accepted: { label: "Accepted. Hand it over", tone: "info" },
  rejected: { label: "Declined", tone: "danger" },
  received: { label: "Received", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function Donations() {
  const { user } = useAuth();
  const isNgo = user?.role === "ngo";
  return (
    <Page>
      <PageHeader
        eyebrow="Donations"
        title={isNgo ? "Donations & needs" : "Donate a device"}
        subtitle={
          isNgo
            ? "Post what you need and respond to offers."
            : "Working or repairable devices can go to a verified NGO. Items that no longer work should go to a recycler."
        }
      />
      <div className="mt-8 space-y-6">
        {isNgo ? (
          <>
            <VerificationBanner />
            <NeedsEditor />
          </>
        ) : (
          <DonateForm />
        )}
        <DonationList />
      </div>
    </Page>
  );
}

function DonateForm() {
  const { user } = useAuth();
  const { itemId } = Route.useSearch();
  const { label } = useCatalog();
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["items", "donatable"],
    queryFn: () => itemsApi.list({ status: "reported", limit: 50 }),
  });
  const [city, setCity] = useState(user?.address?.city ?? "");
  const ngos = useQuery({ queryKey: ["ngos", city], queryFn: () => ngoApi.ngos(city) });
  const needs = useQuery({ queryKey: ["needs", city], queryFn: () => ngoApi.needs({ city }) });
  const [sel, setSel] = useState(itemId ?? "");
  const [ngoId, setNgoId] = useState("");
  const [message, setMessage] = useState("");
  const donate = useMutation({
    mutationFn: () => ngoApi.donate({ itemId: sel, ngoId, message }),
    onSuccess: () => {
      setSel("");
      setMessage("");
      void qc.invalidateQueries({ queryKey: ["donations"] });
      void qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
  const eligible = items.data?.items.filter((i) => i.condition !== "not_working") ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Offer an item">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (sel && ngoId) donate.mutate();
          }}
        >
          {donate.isError && <FormAlert>{donate.error.message}</FormAlert>}
          {donate.isSuccess && (
            <FormAlert tone="success">Offer sent. The NGO will respond here.</FormAlert>
          )}
          <FormField
            id="item"
            label="Item"
            hint={
              eligible.length === 0 && !items.isPending
                ? "You have no working or repairable items waiting. Report one first."
                : undefined
            }
          >
            <NativeSelect id="item" value={sel} onChange={(e) => setSel(e.target.value)}>
              <option value="">Choose an item</option>
              {eligible.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.title} · {kg(i.weightKg)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="city" label="NGOs in city">
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Leave empty for all"
            />
          </FormField>
          <FormField
            id="ngo"
            label="NGO"
            hint={ngos.data?.length === 0 ? "No verified NGO in that city yet." : undefined}
          >
            <NativeSelect id="ngo" value={ngoId} onChange={(e) => setNgoId(e.target.value)}>
              <option value="">Choose an NGO</option>
              {ngos.data?.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.name}
                  {n.address?.city ? ` · ${n.address.city}` : ""}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="msg" label="Message (optional)">
            <Textarea
              id="msg"
              rows={2}
              maxLength={300}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="hero" disabled={donate.isPending || !sel || !ngoId}>
            {donate.isPending && <Spinner />} Offer donation
          </Button>
        </form>
      </Panel>
      <Panel title="What NGOs need">
        <QueryView
          query={needs}
          empty={(d) =>
            d.items.length === 0 ? (
              <EmptyState title="No open requests">NGOs post their needs here.</EmptyState>
            ) : null
          }
        >
          {(d) => (
            <ul className="space-y-3">
              {d.items.map((n) => (
                <li key={n._id} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {nameOf(n.ngo as never)} · {n.city || "Anywhere"} · {n.quantity} wanted
                  </p>
                  {n.description && <p className="mt-1 text-sm">{n.description}</p>}
                  {n.categories.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.categories.map(label).join(", ")}
                    </p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="soft"
                    className="mt-2"
                    onClick={() => setNgoId(typeof n.ngo === "string" ? n.ngo : n.ngo._id)}
                  >
                    Donate to this NGO
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </Panel>
    </div>
  );
}

function NeedsEditor() {
  const qc = useQueryClient();
  const needs = useQuery({
    queryKey: ["needs", "mine"],
    queryFn: () => ngoApi.needs({ mine: true }),
  });
  const [f, setF] = useState({ title: "", description: "", quantity: "1", category: "" });
  const create = useMutation({
    mutationFn: () =>
      ngoApi.createNeed({
        title: f.title.trim(),
        description: f.description.trim(),
        quantity: Number(f.quantity) || 1,
        categories: f.category ? [f.category] : [],
      }),
    onSuccess: () => {
      setF({ title: "", description: "", quantity: "1", category: "" });
      void qc.invalidateQueries({ queryKey: ["needs"] });
    },
  });
  const close = useMutation({
    mutationFn: (id: string) => ngoApi.closeNeed(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["needs"] }),
  });
  return (
    <Panel
      title="Your open needs"
      description="Verified NGOs' needs are shown to citizens when they donate."
    >
      <form
        noValidate
        className="grid gap-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (f.title.trim().length >= 3) create.mutate();
        }}
      >
        {create.isError && (
          <div className="sm:col-span-4">
            <FormAlert>{create.error.message}</FormAlert>
          </div>
        )}
        <div className="sm:col-span-2">
          <FormField id="nt" label="What do you need?">
            <Input
              id="nt"
              value={f.title}
              maxLength={100}
              onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))}
              placeholder="Laptops for a computer lab"
            />
          </FormField>
        </div>
        <FormField id="nc" label="Category">
          <CategorySelect
            id="nc"
            value={f.category}
            onChange={(v) => setF((s) => ({ ...s, category: v }))}
            includeAll="Any"
          />
        </FormField>
        <FormField id="nq" label="Quantity">
          <Input
            id="nq"
            type="number"
            min="1"
            value={f.quantity}
            onChange={(e) => setF((s) => ({ ...s, quantity: e.target.value }))}
          />
        </FormField>
        <div className="sm:col-span-4">
          <FormField id="nd" label="Details (optional)">
            <Input
              id="nd"
              maxLength={600}
              value={f.description}
              onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="sm:col-span-4">
          <Button
            type="submit"
            variant="hero"
            disabled={create.isPending || f.title.trim().length < 3}
          >
            {create.isPending && <Spinner />} Post need
          </Button>
        </div>
      </form>
      <div className="mt-6">
        <QueryView
          query={needs}
          empty={(d) =>
            d.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No needs posted yet.</p>
            ) : null
          }
        >
          {(d) => (
            <ul className="divide-y divide-border">
              {d.items.map((n) => (
                <li key={n._id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.quantity} wanted</p>
                  </div>
                  {n.status === "open" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={close.isPending}
                      onClick={() => close.mutate(n._id)}
                    >
                      Close
                    </Button>
                  ) : (
                    <Pill>Closed</Pill>
                  )}
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </div>
    </Panel>
  );
}

function DonationList() {
  const { user } = useAuth();
  const isNgo = user?.role === "ngo";
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["donations", page],
    queryFn: () => ngoApi.donations({ page }),
    refetchInterval: 20_000,
    placeholderData: (p) => p,
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["donations"] });
    void qc.invalidateQueries({ queryKey: ["items"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const act = useMutation({
    mutationFn: ({
      id,
      kind,
    }: {
      id: string;
      kind: "accept" | "decline" | "receive" | "cancel";
    }) =>
      kind === "receive"
        ? ngoApi.receive(id)
        : kind === "cancel"
          ? ngoApi.cancel(id)
          : ngoApi.respond(id, kind === "accept"),
    onSuccess: refresh,
  });
  return (
    <Panel title={isNgo ? "Offers from citizens" : "Your donations"}>
      {act.isError && <FormAlert>{act.error.message}</FormAlert>}
      <QueryView
        query={q}
        empty={(d) => (d.items.length === 0 ? <EmptyState title="No donations yet" /> : null)}
      >
        {(d) => (
          <>
            <ul className="divide-y divide-border">
              {d.items.map((x) => (
                <li key={x._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {x.item.title}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {kg(x.item.weightKg)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isNgo
                        ? `From ${x.donor.name}${x.status === "accepted" && x.donor.phone ? ` · ${x.donor.phone}` : ""}`
                        : `To ${x.ngo.name}`}{" "}
                      · {dateLabel(x.createdAt)}
                    </p>
                    {x.message && <p className="text-sm">“{x.message}”</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={STATUS[x.status].tone}>{STATUS[x.status].label}</Pill>
                    {isNgo && x.status === "pledged" && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="emerald"
                          disabled={act.isPending}
                          onClick={() => act.mutate({ id: x._id, kind: "accept" })}
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={act.isPending}
                          onClick={() => act.mutate({ id: x._id, kind: "decline" })}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {isNgo && x.status === "accepted" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="emerald"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ id: x._id, kind: "receive" })}
                      >
                        Mark received
                      </Button>
                    )}
                    {!isNgo && ["pledged", "accepted"].includes(x.status) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ id: x._id, kind: "cancel" })}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Pager data={d} onPage={setPage} />
          </>
        )}
      </QueryView>
    </Panel>
  );
}
