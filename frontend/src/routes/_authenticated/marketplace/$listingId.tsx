import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { FormAlert, FormField } from "@/components/site/FormField";
import {
  ItemThumb,
  Page,
  PageHeader,
  Panel,
  Pill,
  QueryView,
  Spinner,
  VerificationBanner,
  useCatalog,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiAssetUrl } from "@/lib/config";
import {
  CONDITION_LABEL,
  dateLabel,
  idOf,
  inr,
  inrRange,
  kg,
  nameOf,
  type Tone,
} from "@/lib/format";
import { marketApi } from "@/services/domain.service";
import type { Listing, Offer } from "@/services/models";

export const Route = createFileRoute("/_authenticated/marketplace/$listingId")({
  head: () => ({
    meta: [{ title: "Listing — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: ListingPage,
});

const FAIR: Record<Offer["fairness"], { label: string; tone: Tone }> = {
  below: { label: "Below the fair range", tone: "warning" },
  fair: { label: "Within the fair range", tone: "success" },
  above: { label: "Above the fair range", tone: "info" },
  unknown: { label: "No reference", tone: "neutral" },
};

function ListingPage() {
  const { listingId } = Route.useParams();
  const q = useQuery({
    queryKey: ["market", "one", listingId],
    queryFn: () => marketApi.get(listingId),
    refetchInterval: 20_000,
  });
  return (
    <Page>
      <QueryView query={q} rows={4}>
        {({ listing, myOffer }) => <Body l={listing} myOffer={myOffer} />}
      </QueryView>
    </Page>
  );
}

function Body({ l, myOffer }: { l: Listing; myOffer: Offer | null }) {
  const { user } = useAuth();
  const { label } = useCatalog();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isSeller = idOf(l.seller as never) === user?._id;
  const refresh = () => void qc.invalidateQueries({ queryKey: ["market"] });
  const withdraw = useMutation({
    mutationFn: () => marketApi.withdraw(l._id),
    onSuccess: () => {
      refresh();
      void qc.invalidateQueries({ queryKey: ["items"] });
      void navigate({ to: "/marketplace" });
    },
  });
  const complete = useMutation({
    mutationFn: () => marketApi.complete(l._id),
    onSuccess: () => {
      refresh();
      void qc.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={label(l.category)}
        title={l.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <strong className="text-2xl text-primary">{inr(l.price)}</strong>
            {l.status !== "active" && <Pill tone="warning">{l.status}</Pill>}
            <span>
              {CONDITION_LABEL[l.condition]} · {kg(l.weightKg)}
              {l.city ? ` · ${l.city}` : ""}
            </span>
          </span>
        }
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {l.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {l.images.map((im) => (
                <ItemThumb
                  key={im.url}
                  url={resolveApiAssetUrl(im.url)}
                  alt={l.title}
                  className="size-32"
                />
              ))}
            </div>
          )}
          {l.description && <p>{l.description}</p>}
          <Panel title="Seller">
            <p className="text-sm">
              {nameOf(l.seller as never)} · listed {dateLabel(l.createdAt)}
            </p>
            {l.reference && (
              <p className="mt-2 text-sm text-muted-foreground">
                Fair range when listed:{" "}
                <strong className="text-foreground">{inrRange(l.reference)}</strong> (indicative).
              </p>
            )}
          </Panel>
          {isSeller ? <SellerOffers l={l} onChange={refresh} /> : null}
        </div>
        <div className="space-y-6">
          {isSeller ? (
            <Panel title="Manage listing">
              {(withdraw.isError || complete.isError) && (
                <FormAlert>{(withdraw.error ?? complete.error)?.message}</FormAlert>
              )}
              <div className="flex flex-wrap gap-2">
                {l.status === "reserved" && (
                  <Button
                    type="button"
                    variant="emerald"
                    disabled={complete.isPending}
                    onClick={() => complete.mutate()}
                  >
                    Mark as sold
                  </Button>
                )}
                {l.status !== "sold" && l.status !== "withdrawn" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={withdraw.isPending}
                    onClick={() => {
                      if (window.confirm("Withdraw this listing? Pending offers will be declined."))
                        withdraw.mutate();
                    }}
                  >
                    Withdraw listing
                  </Button>
                )}
              </div>
            </Panel>
          ) : (
            <>
              <VerificationBanner />
              <OfferBox l={l} mine={myOffer} onChange={refresh} />
            </>
          )}
          <Button asChild variant="soft">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

function OfferBox({ l, mine, onChange }: { l: Listing; mine: Offer | null; onChange: () => void }) {
  const [price, setPrice] = useState(mine?.status === "pending" ? String(mine.price) : "");
  const [message, setMessage] = useState(mine?.message ?? "");
  const send = useMutation({
    mutationFn: () => marketApi.offer(l._id, { price: Number(price), message }),
    onSuccess: onChange,
  });
  const unwind = useMutation({
    mutationFn: () => marketApi.withdrawOffer(mine!._id),
    onSuccess: onChange,
  });
  const { user } = useAuth();
  if (user?.role === "admin") return null;
  return (
    <Panel
      title="Make an offer"
      description={
        l.status === "active"
          ? "The seller sees how your offer compares with the fair range."
          : "This listing isn't taking offers."
      }
    >
      {mine && (
        <p className="mb-4 text-sm">
          Your offer: <strong>{inr(mine.price)}</strong>{" "}
          <Pill
            tone={
              mine.status === "accepted"
                ? "success"
                : mine.status === "rejected"
                  ? "danger"
                  : "info"
            }
          >
            {mine.status}
          </Pill>
        </p>
      )}
      {l.status === "active" && (
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(price) >= 0 && price !== "") send.mutate();
          }}
        >
          {send.isError && <FormAlert>{send.error.message}</FormAlert>}
          <FormField id="offer" label="Your price (₹)">
            <Input
              id="offer"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </FormField>
          <FormField id="msg" label="Message (optional)">
            <Input
              id="msg"
              maxLength={300}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </FormField>
          <div className="flex gap-2">
            <Button type="submit" variant="hero" disabled={send.isPending || price === ""}>
              {send.isPending && <Spinner />}{" "}
              {mine?.status === "pending" ? "Update offer" : "Send offer"}
            </Button>
            {mine?.status === "pending" && (
              <Button
                type="button"
                variant="outline"
                disabled={unwind.isPending}
                onClick={() => unwind.mutate()}
              >
                Withdraw
              </Button>
            )}
          </div>
        </form>
      )}
    </Panel>
  );
}

function SellerOffers({ l, onChange }: { l: Listing; onChange: () => void }) {
  const q = useQuery({
    queryKey: ["market", "offers", l._id],
    queryFn: () => marketApi.offers(l._id),
    refetchInterval: 20_000,
  });
  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => marketApi.respond(id, accept),
    onSuccess: () => {
      onChange();
      void q.refetch();
    },
  });
  return (
    <Panel title="Offers received">
      {respond.isError && <FormAlert>{respond.error.message}</FormAlert>}
      <QueryView
        query={q}
        empty={(d) =>
          d.length === 0 ? <p className="text-sm text-muted-foreground">No offers yet.</p> : null
        }
      >
        {(offers) => (
          <ul className="divide-y divide-border">
            {offers.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">
                    {inr(o.price)}{" "}
                    <span className="font-normal text-muted-foreground">
                      from {nameOf(o.bidder as never)}
                    </span>
                  </p>
                  {o.message && <p className="text-sm text-muted-foreground">“{o.message}”</p>}
                  <p className="mt-1">
                    <Pill tone={FAIR[o.fairness].tone}>{FAIR[o.fairness].label}</Pill>{" "}
                    {o.status !== "pending" && (
                      <Pill tone={o.status === "accepted" ? "success" : "neutral"}>{o.status}</Pill>
                    )}
                  </p>
                </div>
                {o.status === "pending" && l.status === "active" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="emerald"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: o._id, accept: true })}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: o._id, accept: false })}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </Panel>
  );
}
