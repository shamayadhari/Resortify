import { AlertTriangle, PlugZap } from "lucide-react";

import { useApiStatus } from "@/hooks/useApiStatus";
import { cn } from "@/lib/utils";

/** Plainly tells the visitor when the Resortify server can't be used, instead of pretending. */
export function ApiStatusNotice({ className }: { className?: string }) {
  const status = useApiStatus();
  if (status === "online" || status === "checking") return null;

  const notConfigured = status === "not_configured";
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/15 px-4 py-3 text-sm text-warning-foreground",
        className,
      )}
    >
      {notConfigured ? <PlugZap className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
      <p>
        {notConfigured
          ? "Resortify's server isn't connected yet. Sign-up, sign-in and forms won't work until it is."
          : "We can't reach Resortify's server right now. Please try again in a moment."}
      </p>
    </div>
  );
}
