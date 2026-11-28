import { useEffect, useRef } from "react";

import type { Facility } from "@/services/models";

const COLORS: Record<string, string> = {
  recycler: "#0f7a4d",
  scrap_dealer: "#b7791f",
  ngo: "#2b6cb0",
  collection_point: "#6b46c1",
};

/** Leaflet map with one marker per facility. Leaflet is loaded in the browser only. */
export default function FacilityMap({
  facilities,
  selectedId,
  onSelect,
  center,
}: {
  facilities: Facility[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
  center?: [number, number] | undefined;
}) {
  const el = useRef<HTMLDivElement>(null);
  const state = useRef<{
    L: typeof import("leaflet");
    map: import("leaflet").Map;
    layer: import("leaflet").LayerGroup;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !el.current || state.current) return;
      const map = L.map(el.current, { scrollWheelZoom: false }).setView(
        center ?? [22.5, 79],
        center ? 11 : 5,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      state.current = { L, map, layer: L.layerGroup().addTo(map) };
      draw();
    })();
    return () => {
      cancelled = true;
      state.current?.map.remove();
      state.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const s = state.current;
    if (!s) return;
    s.layer.clearLayers();
    const pts: [number, number][] = [];
    for (const f of facilities) {
      const [lng, lat] = f.location.coordinates;
      pts.push([lat, lng]);
      const active = f._id === selectedId;
      const icon = s.L.divIcon({
        className: "",
        html: `<span style="display:block;width:${active ? 26 : 18}px;height:${active ? 26 : 18}px;border-radius:50%;background:${COLORS[f.type] ?? "#444"};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></span>`,
        iconSize: [active ? 26 : 18, active ? 26 : 18],
        iconAnchor: [active ? 13 : 9, active ? 13 : 9],
      });
      const marker = s.L.marker([lat, lng], { icon, title: f.name, keyboard: true }).addTo(s.layer);
      marker.on("click", () => onSelect(f._id));
    }
    if (pts.length) s.map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    else if (center) s.map.setView(center, 11);
    setTimeout(() => s.map.invalidateSize(), 0);
  }

  // Refit only when the set of results changes, so picking a marker doesn't jump the map.
  const key = facilities.map((f) => f._id).join(",");
  useEffect(draw, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const s = state.current;
    const f = facilities.find((x) => x._id === selectedId);
    if (s && f) s.map.panTo([f.location.coordinates[1], f.location.coordinates[0]]);
  }, [selectedId, facilities]);
  useEffect(draw, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={el}
      className="h-[420px] w-full overflow-hidden rounded-2xl border border-border lg:h-[560px]"
      role="region"
      aria-label="Map of recycling facilities"
    />
  );
}
