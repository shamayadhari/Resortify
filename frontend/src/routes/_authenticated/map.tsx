import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { FacilityCard } from "@/components/app/FacilityCard";
import {
  CategorySelect,
  EmptyState,
  ErrorNote,
  Loading,
  NativeSelect,
  Page,
  PageHeader,
  Panel,
  Spinner,
} from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { FACILITY_LABEL } from "@/lib/format";
import { facilitiesApi } from "@/services/domain.service";

const FacilityMap = lazy(() => import("@/components/app/FacilityMap"));

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Recycling map — Resortify" },
      {
        name: "description",
        content: "Find recyclers, dealers, NGOs and collection points near you.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [city, setCity] = useState(user?.address?.city ?? "");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState("25");
  const [verified, setVerified] = useState(false);
  const [selected, setSelected] = useState<string>();

  const q = useQuery({
    queryKey: ["facilities", "search", coords, city, type, category, radius, verified],
    queryFn: () =>
      facilitiesApi.search(
        coords
          ? {
              lat: coords.lat,
              lng: coords.lng,
              radiusKm: radius,
              type,
              category,
              verified: verified || undefined,
            }
          : { city, type, category, verified: verified || undefined },
      ),
    placeholderData: (p) => p,
  });

  function locate() {
    setGeoError("");
    if (!navigator.geolocation)
      return setGeoError("Your browser can't share its location. Search by city instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError(
          "We couldn't get your location. Check the browser permission, or search by city.",
        );
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  return (
    <Page wide>
      <PageHeader
        eyebrow="Recycling map"
        title="Find a place near you"
        subtitle="Recyclers, dealers, NGOs and collection points. A Verified badge means the Resortify team has checked the operator."
      />
      <Panel className="mt-8">
        <div className="grid gap-3 md:grid-cols-5">
          <Button
            type="button"
            variant={coords ? "emerald" : "soft"}
            onClick={locate}
            disabled={locating}
          >
            {locating ? <Spinner /> : <LocateFixed />}{" "}
            {coords ? "Using your location" : "Use my location"}
          </Button>
          <Input
            aria-label="City"
            placeholder="Or search by city"
            value={city}
            disabled={!!coords}
            onChange={(e) => setCity(e.target.value)}
          />
          <NativeSelect aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {Object.entries(FACILITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
          <CategorySelect value={category} onChange={setCategory} includeAll="Any category" />
          {coords ? (
            <NativeSelect
              aria-label="Radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            >
              {["5", "10", "25", "50", "100"].map((r) => (
                <option key={r} value={r}>
                  Within {r} km
                </option>
              ))}
            </NativeSelect>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-emerald)]"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />{" "}
              Verified only
            </label>
          )}
        </div>
        {coords && (
          <p className="mt-3 text-sm">
            <button
              type="button"
              className="font-semibold text-primary underline"
              onClick={() => setCoords(null)}
            >
              Stop using my location
            </button>
          </p>
        )}
        {geoError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {geoError}
          </p>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1 lg:order-1" aria-live="polite">
          {q.isPending && <Loading />}
          {q.isError && <ErrorNote error={q.error} onRetry={() => void q.refetch()} />}
          {q.data && q.data.length === 0 && (
            <EmptyState title="No places found">
              {coords
                ? "Try a wider radius or fewer filters."
                : "Try another city, or use your location."}
            </EmptyState>
          )}
          {q.data?.map((f) => (
            <FacilityCard
              key={f._id}
              f={f}
              selected={f._id === selected}
              onClick={() => setSelected(f._id)}
            />
          ))}
        </div>
        <Suspense fallback={<Loading rows={1} />}>
          <FacilityMap
            facilities={q.data ?? []}
            selectedId={selected}
            onSelect={setSelected}
            center={coords ? [coords.lat, coords.lng] : undefined}
          />
        </Suspense>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Map data © OpenStreetMap contributors. Listings are provided by the operators themselves;
        call ahead to confirm hours and accepted items.
      </p>
    </Page>
  );
}
