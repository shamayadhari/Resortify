import { BadgeCheck, MapPin, Phone, Clock } from "lucide-react";

import { Pill, useCatalog } from "@/components/app/kit";
import { FACILITY_LABEL } from "@/lib/format";
import type { Facility } from "@/services/models";

export function FacilityCard({
  f,
  selected,
  onClick,
  children,
}: {
  f: Facility;
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const { label } = useCatalog();
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`rounded-2xl border p-4 text-left transition-colors ${selected ? "border-emerald bg-accent/40" : "border-border bg-paper"} ${onClick ? "cursor-pointer hover:bg-secondary/50" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-foreground">{f.name}</p>
        {f.verified ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
            <BadgeCheck className="size-4" /> Verified
          </span>
        ) : (
          <Pill>Not yet verified</Pill>
        )}
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {FACILITY_LABEL[f.type]}
        {f.distanceKm != null ? ` · ${f.distanceKm} km away` : ""}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        {f.address.line1}, {f.address.city} {f.address.pincode}
      </p>
      {f.hours && (
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          {f.hours}
        </p>
      )}
      {f.phone && (
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="size-4 shrink-0" />
          <a
            href={`tel:${f.phone}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {f.phone}
          </a>
        </p>
      )}
      {f.acceptedCategories.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Accepts: {f.acceptedCategories.map(label).join(", ")}
        </p>
      )}
      {f.certifications.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Certifications: {f.certifications.join(", ")}
        </p>
      )}
      {children}
    </div>
  );
}
