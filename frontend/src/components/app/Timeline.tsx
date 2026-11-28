import { CheckCircle2 } from "lucide-react";

import { dateTimeLabel } from "@/lib/format";

export function Timeline({
  events,
}: {
  events: {
    label: string;
    note?: string | undefined;
    at: string;
    actorRole?: string | undefined;
  }[];
}) {
  if (!events.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <CheckCircle2
            aria-hidden
            className="absolute -left-[2.15rem] top-0 size-5 rounded-full bg-paper text-emerald"
          />
          <p className="font-semibold text-foreground">{e.label}</p>
          {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
          <p className="text-xs text-muted-foreground">{dateTimeLabel(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}
