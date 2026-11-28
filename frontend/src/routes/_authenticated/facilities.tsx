import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";
import { useState } from "react";

import { FacilityCard } from "@/components/app/FacilityCard";
import {
  EmptyState,
  NativeSelect,
  Page,
  PageHeader,
  Panel,
  QueryView,
  Spinner,
  VerificationBanner,
  useCatalog,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { FACILITY_LABEL } from "@/lib/format";
import { facilitiesApi, type FacilityInput } from "@/services/domain.service";
import type { Facility, FacilityType } from "@/services/models";

export const Route = createFileRoute("/_authenticated/facilities")({
  head: () => ({
    meta: [{ title: "My facilities — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Facilities,
});

const TYPES: Record<string, FacilityType[]> = {
  recycler: ["recycler", "collection_point"],
  scrap_dealer: ["scrap_dealer", "collection_point"],
  collection_partner: ["collection_point"],
  ngo: ["ngo", "collection_point"],
};

function Facilities() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["facilities", "mine"], queryFn: facilitiesApi.mine });
  const [editing, setEditing] = useState<Facility | "new" | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => facilitiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }),
  });
  return (
    <Page>
      <PageHeader
        eyebrow="Facilities"
        title="My facilities"
        subtitle="Places people can bring or send items to. New and moved places are reviewed by the Resortify team before they get a Verified badge."
        actions={
          <Button variant="hero" type="button" onClick={() => setEditing("new")}>
            Add a place
          </Button>
        }
      />
      <div className="mt-8 space-y-6">
        <VerificationBanner />
        {editing && (
          <FacilityForm
            initial={editing === "new" ? null : editing}
            onDone={() => {
              setEditing(null);
              void qc.invalidateQueries({ queryKey: ["facilities"] });
            }}
          />
        )}
        {remove.isError && <FormAlert>{remove.error.message}</FormAlert>}
        <QueryView
          query={q}
          empty={(d) =>
            d.length === 0 ? (
              <EmptyState
                title="No places yet"
                action={
                  <Button variant="hero" type="button" onClick={() => setEditing("new")}>
                    Add your first place
                  </Button>
                }
              >
                Add where you operate so people can find you on the map.
              </EmptyState>
            ) : null
          }
        >
          {(list) => (
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((f) => (
                <FacilityCard key={f._id} f={f}>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" size="sm" variant="soft" onClick={() => setEditing(f)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Remove ${f.name}?`)) remove.mutate(f._id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </FacilityCard>
              ))}
            </div>
          )}
        </QueryView>
      </div>
    </Page>
  );
}

function FacilityForm({ initial, onDone }: { initial: Facility | null; onDone: () => void }) {
  const { user } = useAuth();
  const { categories } = useCatalog();
  const types =
    TYPES[user?.role ?? ""] ??
    (["recycler", "scrap_dealer", "ngo", "collection_point"] as FacilityType[]);
  const [f, setF] = useState({
    name: initial?.name ?? "",
    type: initial?.type ?? types[0]!,
    description: initial?.description ?? "",
    hours: initial?.hours ?? "",
    phone: initial?.phone ?? user?.phone ?? "",
    line1: initial?.address.line1 ?? user?.address?.line1 ?? "",
    city: initial?.address.city ?? user?.address?.city ?? "",
    state: initial?.address.state ?? user?.address?.state ?? "",
    pincode: initial?.address.pincode ?? user?.address?.pincode ?? "",
    lat: initial ? String(initial.location.coordinates[1]) : "",
    lng: initial ? String(initial.location.coordinates[0]) : "",
    certifications: initial?.certifications.join(", ") ?? "",
  });
  const [cats, setCats] = useState<string[]>(initial?.acceptedCategories ?? []);
  const [geoMsg, setGeoMsg] = useState("");
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: () => {
      const body: FacilityInput = {
        name: f.name.trim(),
        type: f.type,
        description: f.description.trim(),
        hours: f.hours.trim(),
        phone: f.phone.trim(),
        lat: Number(f.lat),
        lng: Number(f.lng),
        address: {
          line1: f.line1.trim(),
          city: f.city.trim(),
          state: f.state.trim(),
          pincode: f.pincode.trim(),
        },
        acceptedCategories: cats,
        certifications: f.certifications
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      };
      return initial ? facilitiesApi.update(initial._id, body) : facilitiesApi.create(body);
    },
    onSuccess: onDone,
  });

  const latOk = f.lat !== "" && Math.abs(Number(f.lat)) <= 90;
  const lngOk = f.lng !== "" && Math.abs(Number(f.lng)) <= 180;
  const err = {
    name: touched && f.name.trim().length < 2 ? "Enter a name" : undefined,
    line1: touched && f.line1.trim().length < 3 ? "Enter an address" : undefined,
    city: touched && f.city.trim().length < 2 ? "Enter a city" : undefined,
    pincode:
      touched && !/^[1-9][0-9]{5}$/.test(f.pincode.trim()) ? "Enter a 6-digit PIN code" : undefined,
    lat: touched && !latOk ? "Between -90 and 90" : undefined,
    lng: touched && !lngOk ? "Between -180 and 180" : undefined,
  };
  const valid =
    f.name.trim().length >= 2 &&
    f.line1.trim().length >= 3 &&
    f.city.trim().length >= 2 &&
    /^[1-9][0-9]{5}$/.test(f.pincode.trim()) &&
    latOk &&
    lngOk;

  function here() {
    setGeoMsg("");
    if (!navigator.geolocation) {
      setGeoMsg("Your browser can't share its location. Enter the coordinates by hand.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setF((s) => ({
          ...s,
          lat: p.coords.latitude.toFixed(5),
          lng: p.coords.longitude.toFixed(5),
        })),
      () =>
        setGeoMsg(
          "Couldn't read your location. Enter the coordinates by hand (right-click the spot in any map app).",
        ),
    );
  }

  return (
    <Panel title={initial ? `Edit ${initial.name}` : "Add a place"}>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) save.mutate();
        }}
      >
        {save.isError && <FormAlert>{save.error.message}</FormAlert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="fname" label="Name" error={err.name}>
            <Input id="fname" value={f.name} onChange={set("name")} />
          </FormField>
          <FormField id="ftype" label="Type">
            <NativeSelect id="ftype" value={f.type} onChange={set("type")}>
              {types.map((t) => (
                <option key={t} value={t}>
                  {FACILITY_LABEL[t]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="fline1" label="Address" error={err.line1}>
            <Input id="fline1" value={f.line1} onChange={set("line1")} />
          </FormField>
          <FormField id="fcity" label="City" error={err.city}>
            <Input id="fcity" value={f.city} onChange={set("city")} />
          </FormField>
          <FormField id="fstate" label="State">
            <Input id="fstate" value={f.state} onChange={set("state")} />
          </FormField>
          <FormField id="fpin" label="PIN code" error={err.pincode}>
            <Input
              id="fpin"
              inputMode="numeric"
              maxLength={6}
              value={f.pincode}
              onChange={set("pincode")}
            />
          </FormField>
          <FormField id="flat" label="Latitude" error={err.lat}>
            <Input id="flat" inputMode="decimal" value={f.lat} onChange={set("lat")} />
          </FormField>
          <FormField id="flng" label="Longitude" error={err.lng}>
            <Input id="flng" inputMode="decimal" value={f.lng} onChange={set("lng")} />
          </FormField>
        </div>
        <div>
          <Button type="button" variant="soft" size="sm" onClick={here}>
            <LocateFixed /> Use my current location
          </Button>
          {geoMsg && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {geoMsg}
            </p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="fphone" label="Phone">
            <Input id="fphone" inputMode="tel" value={f.phone} onChange={set("phone")} />
          </FormField>
          <FormField id="fhours" label="Opening hours">
            <Input
              id="fhours"
              placeholder="Mon–Sat 9am–6pm"
              value={f.hours}
              onChange={set("hours")}
            />
          </FormField>
          <FormField
            id="fcert"
            label="Certifications"
            hint="Comma separated, for example: State PCB authorisation"
          >
            <Input id="fcert" value={f.certifications} onChange={set("certifications")} />
          </FormField>
          <FormField id="fdesc" label="About (optional)">
            <Input id="fdesc" maxLength={500} value={f.description} onChange={set("description")} />
          </FormField>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Accepted categories</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs has-[:checked]:border-emerald has-[:checked]:bg-accent/40"
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-[var(--color-emerald)]"
                  checked={cats.includes(c.key)}
                  onChange={(e) =>
                    setCats((s) =>
                      e.target.checked ? [...s, c.key] : s.filter((x) => x !== c.key),
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" variant="hero" disabled={save.isPending}>
            {save.isPending && <Spinner />} Save
          </Button>
          <Button type="button" variant="soft" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
