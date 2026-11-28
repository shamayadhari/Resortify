import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Timeline } from "@/components/app/Timeline";
import { FormAlert, FormField } from "@/components/site/FormField";
import {
  ItemThumb,
  NativeSelect,
  Page,
  PageHeader,
  Panel,
  Pill,
  QueryView,
  Spinner,
  VerificationBanner,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiAssetUrl } from "@/lib/config";
import { FREQUENCY_LABEL, PICKUP_STATUS, SLOT_LABEL, dateLabel, inr, idOf, kg } from "@/lib/format";
import { facilitiesApi, pickupsApi } from "@/services/domain.service";
import type { Pickup } from "@/services/models";

export const Route = createFileRoute("/_authenticated/pickups/$pickupId")({
  head: () => ({ meta: [{ title: "Pickup — Resortify" }, { name: "robots", content: "noindex" }] }),
  component: PickupDetail,
});

const STEPS = ["requested", "accepted", "on_the_way", "collected", "delivered"] as const;

function PickupDetail() {
  const { pickupId } = Route.useParams();
  // Live status: re-checked every 8 seconds while the page is open.
  const q = useQuery({
    queryKey: ["pickups", pickupId],
    queryFn: () => pickupsApi.get(pickupId),
    refetchInterval: 8000,
  });
  return (
    <Page>
      <QueryView query={q} rows={4}>
        {(p) => <Body p={p} />}
      </QueryView>
    </Page>
  );
}

function Body({ p }: { p: Pickup }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["pickups"] });
    void qc.invalidateQueries({ queryKey: ["items"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const isRequester = idOf(p.requester as never) === user?._id;
  const isPartner = user?.role === "collection_partner";
  const mine = isPartner && p.partner && idOf(p.partner as never) === user?._id;
  const cancel = useMutation({ mutationFn: () => pickupsApi.cancel(p._id), onSuccess: refresh });
  const accept = useMutation({ mutationFn: () => pickupsApi.accept(p._id), onSuccess: refresh });
  const stepIndex = STEPS.indexOf(p.status as (typeof STEPS)[number]);
  const requester = typeof p.requester === "string" ? null : p.requester;

  return (
    <>
      <PageHeader
        eyebrow="Pickup"
        title={`${dateLabel(p.preferredDate)} · ${SLOT_LABEL[p.slot]}`}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Pill tone={PICKUP_STATUS[p.status].tone}>{PICKUP_STATUS[p.status].label}</Pill>
            {p.frequency !== "once" && <span>{FREQUENCY_LABEL[p.frequency]}</span>}
          </span>
        }
        actions={
          <Button asChild variant="soft">
            <Link to="/pickups">All pickups</Link>
          </Button>
        }
      />
      {isPartner && (
        <div className="mt-6">
          <VerificationBanner />
        </div>
      )}

      {p.status !== "cancelled" && (
        <ol className="mt-8 grid grid-cols-5 gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div
                className={`mx-auto h-2 rounded-full ${i <= stepIndex ? "bg-emerald" : "bg-secondary"}`}
              />
              <p
                className={`mt-2 text-xs ${i <= stepIndex ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {PICKUP_STATUS[s].label}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            {p.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {p.description || "Recurring collection"}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {p.items.map((i) => (
                  <li key={i._id} className="flex items-center gap-3 py-3">
                    <ItemThumb
                      url={resolveApiAssetUrl(i.images[0]?.url)}
                      alt=""
                      className="size-12"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{i.title}</span>
                    <span className="text-sm text-muted-foreground">{kg(i.weightKg)}</span>
                    {isRequester && (
                      <Link
                        to="/items/$itemId"
                        params={{ itemId: i._id }}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Estimated weight</dt>
                <dd className="font-semibold">{kg(p.estimatedWeightKg)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Weight measured at pickup</dt>
                <dd className="font-semibold">{kg(p.verifiedWeightKg)}</dd>
              </div>
              {p.payoutInr != null && (
                <div>
                  <dt className="text-muted-foreground">Paid to you</dt>
                  <dd className="font-semibold">{inr(p.payoutInr)}</dd>
                </div>
              )}
              {p.facility && (
                <div>
                  <dt className="text-muted-foreground">Delivered to</dt>
                  <dd className="font-semibold">{p.facility.name}</dd>
                </div>
              )}
            </dl>
          </Panel>

          {mine && <PartnerActions p={p} onDone={refresh} />}
          {isPartner && !p.partner && p.status === "requested" && (
            <Panel title="Accept this pickup">
              {accept.isError && <FormAlert>{accept.error.message}</FormAlert>}
              <Button
                type="button"
                variant="hero"
                disabled={accept.isPending}
                onClick={() => accept.mutate()}
              >
                {accept.isPending && <Spinner />} Accept pickup
              </Button>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Where">
            <p className="text-sm">
              {p.address.line1}
              <br />
              {p.address.city}
              {p.address.state ? `, ${p.address.state}` : ""} {p.address.pincode}
            </p>
            {p.notes && <p className="mt-3 text-sm text-muted-foreground">Note: {p.notes}</p>}
          </Panel>
          <Panel title="People">
            <dl className="space-y-2 text-sm">
              {requester && !isRequester && (
                <div>
                  <dt className="text-muted-foreground">Requested by</dt>
                  <dd className="font-semibold">
                    {requester.name}
                    {p.partner && mine && requester.phone ? ` · ${requester.phone}` : ""}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Collector</dt>
                <dd className="font-semibold">
                  {p.partner
                    ? `${p.partner.name}${isRequester && p.partner.phone ? ` · ${p.partner.phone}` : ""}`
                    : "Not assigned yet"}
                </dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Activity">
            <Timeline
              events={p.history.map((h) => ({
                label: PICKUP_STATUS[h.status as keyof typeof PICKUP_STATUS]?.label ?? h.status,
                note: h.note,
                at: h.at,
              }))}
            />
          </Panel>
          {isRequester && ["requested", "accepted"].includes(p.status) && (
            <Panel title="Change of plan?">
              {cancel.isError && <FormAlert>{cancel.error.message}</FormAlert>}
              <Button
                type="button"
                variant="outline"
                disabled={cancel.isPending}
                onClick={() => {
                  if (window.confirm("Cancel this pickup?")) cancel.mutate();
                }}
              >
                Cancel pickup
              </Button>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function PartnerActions({ p, onDone }: { p: Pickup; onDone: () => void }) {
  const [weight, setWeight] = useState("");
  const [payout, setPayout] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [note, setNote] = useState("");
  const facilities = useQuery({
    queryKey: ["facilities", "targets", p.address.city],
    queryFn: () => facilitiesApi.search({ city: p.address.city, type: "recycler" }),
    enabled: p.status === "collected",
  });
  const m = useMutation({
    mutationFn: (b: Parameters<typeof pickupsApi.setStatus>[1]) => pickupsApi.setStatus(p._id, b),
    onSuccess: () => {
      setNote("");
      onDone();
    },
  });

  if (["delivered", "cancelled"].includes(p.status)) return null;
  return (
    <Panel title="Update status" description="Each step is shown to the citizen straight away.">
      <div className="space-y-4">
        {m.isError && <FormAlert>{m.error.message}</FormAlert>}
        {p.status === "accepted" && (
          <Button
            type="button"
            variant="hero"
            disabled={m.isPending}
            onClick={() => m.mutate({ status: "on_the_way", note })}
          >
            I'm on the way
          </Button>
        )}
        {["accepted", "on_the_way"].includes(p.status) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="w" label="Weight you measured (kg)" hint="Weigh the items at the door">
              <Input
                id="w"
                type="number"
                step="0.01"
                min="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </FormField>
            <FormField id="pay" label="Amount paid (₹, optional)">
              <Input
                id="pay"
                type="number"
                min="0"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
              />
            </FormField>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="emerald"
                disabled={m.isPending || !(Number(weight) > 0)}
                onClick={() =>
                  m.mutate({
                    status: "collected",
                    verifiedWeightKg: Number(weight),
                    payoutInr: payout ? Number(payout) : undefined,
                    note,
                  })
                }
              >
                Mark as collected
              </Button>
            </div>
          </div>
        )}
        {p.status === "collected" && (
          <div className="space-y-3">
            <FormField
              id="fac"
              label="Delivered to"
              hint={
                facilities.data?.length === 0
                  ? "No recycler is listed in this city yet."
                  : "Recyclers in the pickup's city"
              }
            >
              <NativeSelect
                id="fac"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
              >
                <option value="">Choose a facility</option>
                {facilities.data?.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                    {f.verified ? " ✓" : ""}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <Button
              type="button"
              variant="emerald"
              disabled={m.isPending || !facilityId}
              onClick={() => m.mutate({ status: "delivered", facilityId, note })}
            >
              Mark as delivered
            </Button>
          </div>
        )}
        <FormField id="note" label="Note (optional)">
          <Input id="note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </FormField>
        {["accepted", "on_the_way"].includes(p.status) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={m.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Cancel this pickup? The citizen will see it as cancelled and can request a new one.",
                )
              )
                m.mutate({ status: "cancelled", note });
            }}
          >
            Can't do this pickup
          </Button>
        )}
      </div>
    </Panel>
  );
}
