import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { PARTNER_ROLES } from "@/lib/roles";
import { TONE_CLASS, type Tone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { itemsApi } from "@/services/domain.service";
import type { Paged } from "@/services/models";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("mx-auto px-5 py-8 md:px-10 md:py-12", wide ? "max-w-7xl" : "max-w-6xl")}>
      {children}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-3xl border border-border bg-paper p-5 shadow-soft md:p-7", className)}
    >
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-paper p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/60 px-6 py-10 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      {children && (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ rows = 3 }: { rows?: number | undefined }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {error instanceof Error ? error.message : "Something went wrong."}
      {onRetry && (
        <button type="button" className="ml-2 font-semibold underline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Renders loading / error / empty / data for a react-query result so every page handles all four states. */
export function QueryView<T>({
  query,
  empty,
  children,
  rows,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    data: T | undefined;
    refetch: () => unknown;
  };
  empty?: (data: T) => ReactNode | null;
  children: (data: T) => ReactNode;
  rows?: number | undefined;
}) {
  if (query.isPending) return <Loading rows={rows} />;
  if (query.isError) return <ErrorNote error={query.error} onRetry={() => void query.refetch()} />;
  const data = query.data as T;
  return <>{empty?.(data) ?? children(data)}</>;
}

export function Pager({
  data,
  onPage,
}: {
  data: Pick<Paged<unknown>, "page" | "pages" | "total">;
  onPage: (p: number) => void;
}) {
  if (data.pages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
      <span>{data.total} results</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="soft"
          disabled={data.page <= 1}
          onClick={() => onPage(data.page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {data.page} of {data.pages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="soft"
          disabled={data.page >= data.pages}
          onClick={() => onPage(data.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export const fieldClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function NativeSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

/** Shown to partner accounts until an administrator verifies them. */
export function VerificationBanner() {
  const { user } = useAuth();
  if (!user || !PARTNER_ROLES.includes(user.role) || user.partnerVerified) return null;
  return (
    <div
      role="status"
      className="mb-6 rounded-2xl border border-warning/50 bg-warning/20 px-5 py-4 text-sm text-warning-foreground"
    >
      <p className="font-semibold">Your account is waiting for verification.</p>
      <p className="mt-1">
        You can look around and set up your profile and facilities. Taking actions (accepting
        pickups, receiving items, making offers) opens once the Resortify team verifies you.
      </p>
    </div>
  );
}

export function useCatalog() {
  const q = useQuery({
    queryKey: ["catalog"],
    queryFn: itemsApi.catalog,
    staleTime: 60 * 60 * 1000,
  });
  const label = (key: string) =>
    q.data?.categories.find((c) => c.key === key)?.label ?? key.replace(/_/g, " ");
  return { ...q, categories: q.data?.categories ?? [], label };
}

export function CategorySelect({
  value,
  onChange,
  includeAll,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  includeAll?: string;
  id?: string;
}) {
  const { categories } = useCatalog();
  return (
    <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll && <option value="">{includeAll}</option>}
      {categories.map((c) => (
        <option key={c.key} value={c.key}>
          {c.label}
        </option>
      ))}
    </NativeSelect>
  );
}

export function ItemThumb({
  url,
  alt,
  className,
}: {
  url?: string | undefined;
  alt: string;
  className?: string | undefined;
}) {
  return url ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn("rounded-xl border border-border object-cover", className)}
    />
  ) : (
    <div
      aria-hidden
      className={cn(
        "grid place-items-center rounded-xl border border-border bg-secondary text-xs text-muted-foreground",
        className,
      )}
    >
      No photo
    </div>
  );
}
