import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Resortify home">
      <span
        aria-hidden
        className={cn(
          "grid size-9 place-items-center rounded-xl transition-transform group-hover:rotate-[-8deg]",
          tone === "light" ? "bg-emerald text-emerald-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c4.5 0 8 3.5 8 8 0 3-1.5 5.5-4 7" />
          <path d="M12 21c-4.5 0-8-3.5-8-8 0-3 1.5-5.5 4-7" />
          <path d="m15 18 1 2.5 2.5-.5" />
          <path d="m9 6-1-2.5L5.5 4" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-tight", tone === "light" ? "text-forest-foreground" : "text-foreground")}>
        Resortify
      </span>
    </Link>
  );
}
