import { Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Gift,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  QrCode,
  Sparkles,
  Store,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

const LIVE = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export const UPCOMING = [
  { label: "Daily waste pickup", icon: Trash2, phase: 2 },
  { label: "Waste scanner", icon: Camera, phase: 3 },
  { label: "Recommendations", icon: Sparkles, phase: 3 },
  { label: "Recycling map", icon: Map, phase: 4 },
  { label: "Pickups", icon: Truck, phase: 4 },
  { label: "Marketplace", icon: Store, phase: 5 },
  { label: "Waste tracking", icon: QrCode, phase: 6 },
  { label: "Rewards", icon: Gift, phase: 7 },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo tone="light" />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Dashboard">
        <ul className="space-y-1">
          {LIVE.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <p className="px-3 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/45">Coming soon</p>
          <ul className="space-y-0.5">
            {UPCOMING.map((item) => (
              <li
                key={item.label}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/45"
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full border border-sidebar-border px-2 py-0.5 text-[0.65rem] font-semibold">P{item.phase}</span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            className="grid size-9 place-items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={async () => {
              await logout();
              navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-sidebar text-sidebar-foreground lg:block">
        <SidebarNav />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-full hover:bg-secondary"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-forest/50" onClick={() => setOpen(false)} />
          <div className={cn("absolute inset-y-0 left-0 w-72 animate-in slide-in-from-left bg-sidebar text-sidebar-foreground")}>
            <button
              type="button"
              aria-label="Close menu"
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0">{children}</main>
    </div>
  );
}
