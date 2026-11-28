import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  EmptyState,
  NativeSelect,
  Page,
  PageHeader,
  Pager,
  Panel,
  Pill,
  QueryView,
  Spinner,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { FREQUENCY_LABEL, PICKUP_STATUS, SLOT_LABEL, dateLabel, kg, today } from "@/lib/format";
import { itemsApi, pickupsApi } from "@/services/domain.service";
import type { Pickup } from "@/services/models";

export const Route = createFileRoute("/_authenticated/pickups/")({
  validateSearch: (s: Record<string, unknown>): { itemId?: string | undefined } => ({
    itemId: typeof s["itemId"] === "string" ? s["itemId"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Pickups — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Pickups,
});

function Pickups() {
  const { user } = useAuth();
  const role = user?.role;
  const canRequest = role === "citizen" || role === "organization";
  return (
    <Page>
      <PageHeader
        eyebrow="Pickups"
        title={role === "collection_partner" ? "Pickup jobs" : "Pickups"}
        subtitle={canRequest ? "Request doorstep collection and follow every step." : undefined}
      />
      <div className="mt-8 space-y-6">
        {canRequest && <RequestForm />}
        {role === "collection_partner" ? <CollectorLists /> : <PickupList />}
      </div>
    </Page>
  );
}

function RequestForm() {
  const { user } = useAuth();
  const { itemId } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["items", "reported"],
    queryFn: () => itemsApi.list({ status: "reported", limit: 50 }),
  });
  const [open, setOpen] = useState(!!itemId);
  const [selected, setSelected] = useState<string[]>(itemId ? [itemId] : []);
  const a = user?.address;
  const [f, setF] = useState({
    line1: a?.line1 ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    pincode: a?.pincode ?? "",
    preferredDate: today(),
    slot: "morning",
    frequency: "once",
    description: "",
    notes: "",
    estimatedWeightKg: "",
  });
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const recurring = f.frequency !== "once";

  const create = useMutation({
    mutationFn: () =>
      pickupsApi.create({
        items: selected,
        description: f.description,
        preferredDate: new Date(`${f.preferredDate}T09:00:00`).toISOString(),
        slot: f.slot,
        frequency: f.frequency,
        estimatedWeightKg: f.estimatedWeightKg ? Number(f.estimatedWeightKg) : undefined,
        notes: f.notes,
        address: {
          line1: f.line1.trim(),
          city: f.city.trim(),
          state: f.state.trim(),
          pincode: f.pincode.trim(),
        },
      }),
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ["pickups"] });
      void qc.invalidateQueries({ queryKey: ["items"] });
      void navigate({ to: "/pickups/$pickupId", params: { pickupId: p._id } });
    },
  });

  const err = {
    line1: touched && f.line1.trim().length < 3 ? "Enter your address" : undefined,
    city: touched && f.city.trim().length < 2 ? "Enter your city" : undefined,
    pincode:
      touched && !/^[1-9][0-9]{5}$/.test(f.pincode.trim()) ? "Enter a 6-digit PIN code" : undefined,
    what:
      touched && !selected.length && !(recurring && f.description.trim())
        ? "Choose at least one item, or describe a recurring collection"
        : undefined,
  };
  const valid =
    !Object.values(err).some(Boolean) &&
    f.line1.trim().length >= 3 &&
    f.city.trim().length >= 2 &&
    /^[1-9][0-9]{5}$/.test(f.pincode.trim()) &&
    (selected.length > 0 || (recurring && f.description.trim().length > 0));

  if (!open)
    return (
      <div>
        <Button type="button" variant="hero" onClick={() => setOpen(true)}>
          Request a pickup
        </Button>
      </div>
    );

  return (
    <Panel
      title="Request a pickup"
      description="A verified collector in your city will accept it. You'll see their name and live status here."
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) create.mutate();
        }}
      >
        {create.isError && <FormAlert>{create.error.message}</FormAlert>}
        <fieldset>
          <legend className="text-sm font-semibold">Items to collect</legend>
          {items.isPending ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading your items…</p>
          ) : items.data && items.data.items.length > 0 ? (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {items.data.items.map((i) => (
                <li key={i._id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm has-[:checked]:border-emerald has-[:checked]:bg-accent/40">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--color-emerald)]"
                      checked={selected.includes(i._id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked ? [...s, i._id] : s.filter((x) => x !== i._id),
                        )
                      }
                    />
                    <span className="min-w-0 flex-1 truncate">{i.title}</span>
                    <span className="text-muted-foreground">{kg(i.weightKg)}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              You have no unscheduled items.{" "}
              <Link to="/items/new" className="font-semibold text-primary underline">
                Report one
              </Link>{" "}
              first, or describe a recurring collection below.
            </p>
          )}
          {err.what && <p className="mt-1 text-xs font-medium text-destructive">{err.what}</p>}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField id="preferredDate" label="Date">
            <Input
              id="preferredDate"
              type="date"
              min={today()}
              value={f.preferredDate}
              onChange={set("preferredDate")}
            />
          </FormField>
          <FormField id="slot" label="Time slot">
            <NativeSelect id="slot" value={f.slot} onChange={set("slot")}>
              {Object.entries(SLOT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="frequency" label="Repeat">
            <NativeSelect id="frequency" value={f.frequency} onChange={set("frequency")}>
              {Object.entries(FREQUENCY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        {recurring && (
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="description"
              label="What do we collect each time?"
              hint="Required if you haven't chosen items"
            >
              <Input
                id="description"
                value={f.description}
                onChange={set("description")}
                maxLength={500}
              />
            </FormField>
            <FormField id="est" label="Typical weight (kg)">
              <Input
                id="est"
                type="number"
                min="0"
                step="0.1"
                value={f.estimatedWeightKg}
                onChange={set("estimatedWeightKg")}
              />
            </FormField>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="line1" label="Address" error={err.line1}>
            <Input
              id="line1"
              autoComplete="address-line1"
              value={f.line1}
              onChange={set("line1")}
            />
          </FormField>
          <FormField id="city" label="City" error={err.city}>
            <Input id="city" autoComplete="address-level2" value={f.city} onChange={set("city")} />
          </FormField>
          <FormField id="state" label="State">
            <Input
              id="state"
              autoComplete="address-level1"
              value={f.state}
              onChange={set("state")}
            />
          </FormField>
          <FormField id="pincode" label="PIN code" error={err.pincode}>
            <Input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              value={f.pincode}
              onChange={set("pincode")}
            />
          </FormField>
        </div>
        <FormField id="notes" label="Notes for the collector (optional)">
          <Textarea id="notes" rows={2} maxLength={500} value={f.notes} onChange={set("notes")} />
        </FormField>
        <div className="flex gap-3">
          <Button type="submit" variant="hero" disabled={create.isPending}>
            {create.isPending && <Spinner />} Request pickup
          </Button>
          <Button type="button" variant="soft" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function PickupRow({ p, showRequester }: { p: Pickup; showRequester?: boolean }) {
  const who = typeof p.requester === "string" ? "" : p.requester.name;
  return (
    <li>
      <Link
        to="/pickups/$pickupId"
        params={{ pickupId: p._id }}
        className="flex flex-wrap items-center justify-between gap-3 py-4 hover:opacity-90"
      >
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {dateLabel(p.preferredDate)} · {SLOT_LABEL[p.slot]}
            {p.frequency !== "once" ? ` · ${FREQUENCY_LABEL[p.frequency].toLowerCase()}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {showRequester && who ? `${who} · ` : ""}
            {p.address.line1}, {p.address.city} {p.address.pincode} ·{" "}
            {p.items.length ? `${p.items.length} item(s)` : p.description || "Recurring"} · ~
            {kg(p.verifiedWeightKg ?? p.estimatedWeightKg)}
          </p>
        </div>
        <Pill tone={PICKUP_STATUS[p.status].tone}>{PICKUP_STATUS[p.status].label}</Pill>
      </Link>
    </li>
  );
}

function PickupList({ scope, empty }: { scope?: string; empty?: string }) {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["pickups", "list", scope, page],
    queryFn: () => pickupsApi.list({ scope, page }),
    refetchInterval: 15_000,
    placeholderData: (p) => p,
  });
  return (
    <Panel
      title={
        scope === "open"
          ? "Open near you"
          : user?.role === "collection_partner"
            ? "My jobs"
            : "Your pickups"
      }
    >
      <QueryView
        query={q}
        empty={(d) =>
          d.items.length === 0 ? (
            <EmptyState title="Nothing here yet">
              {empty ?? "Pickups you request will appear here with live status."}
            </EmptyState>
          ) : null
        }
      >
        {(d) => (
          <>
            <ul className="divide-y divide-border">
              {d.items.map((p) => (
                <PickupRow key={p._id} p={p} showRequester={user?.role !== "citizen"} />
              ))}
            </ul>
            <Pager data={d} onPage={setPage} />
          </>
        )}
      </QueryView>
    </Panel>
  );
}

function CollectorLists() {
  const { user } = useAuth();
  return (
    <>
      {!user?.address?.city && (
        <FormAlert>Add your city in your profile so we show pickups near you.</FormAlert>
      )}
      <PickupList
        scope="open"
        empty={
          user?.partnerVerified
            ? "No open requests in your city right now. This list refreshes automatically."
            : "Open requests appear here once your account is verified."
        }
      />
      <PickupList scope="mine" empty="Pickups you accept will appear here." />
    </>
  );
}
