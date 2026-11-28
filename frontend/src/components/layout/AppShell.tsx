import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Camera,
  Gift,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessagesSquare,
  Recycle,
  Scale,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Users,
  X,
  Package,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}
const N = (to: string, label: string, icon: LucideIcon): NavItem => ({ to, label, icon });
const dash = N("/dashboard", "Dashboard", LayoutDashboard);
const profile = N("/profile", "Profile", UserRound);
const map = N("/map", "Recycling map", Map);
const market = N("/marketplace", "Marketplace", Store);
const prices = N("/prices", "Fair price", Scale);
const community = N("/community", "Community", MessagesSquare);
const assistant = N("/assistant", "Assistant", Sparkles);

/** What each account type sees. Everything listed here is a working page. */
export const NAV: Record<Role, NavItem[]> = {
  citizen: [
    dash,
    N("/items/new", "Scan or report", Camera),
    N("/items", "My items", Package),
    N("/pickups", "Pickups", Truck),
    map,
    market,
    prices,
    N("/donations", "Donations", HandHeart),
    N("/rewards", "Rewards", Gift),
    N("/impact", "My impact", BarChart3),
    community,
    assistant,
    profile,
  ],
  organization: [
    dash,
    N("/drives", "Collection drives", Building2),
    N("/items/new", "Report an item", Camera),
    N("/items", "My items", Package),
    N("/pickups", "Pickups", Truck),
    map,
    market,
    N("/donations", "Donations", HandHeart),
    N("/impact", "My impact", BarChart3),
    community,
    assistant,
    profile,
  ],
  scrap_dealer: [
    dash,
    market,
    N("/prices", "My rates", Scale),
    N("/facilities", "My facilities", Building2),
    map,
    community,
    assistant,
    profile,
  ],
  recycler: [
    dash,
    N("/recycler", "Recycling desk", Recycle),
    N("/facilities", "My facilities", Building2),
    N("/drives", "Collection drives", Truck),
    market,
    N("/prices", "My rates", Scale),
    map,
    community,
    profile,
  ],
  collection_partner: [
    dash,
    N("/pickups", "Pickups", Truck),
    N("/drives", "Collection drives", Building2),
    N("/facilities", "Collection points", Building2),
    map,
    community,
    profile,
  ],
  ngo: [
    dash,
    N("/donations", "Donations & needs", HandHeart),
    N("/facilities", "My locations", Building2),
    map,
    community,
    profile,
  ],
  admin: [
    N("/dashboard", "Platform overview", BarChart3),
    N("/admin/users", "Users & partners", Users),
    N("/admin/facilities", "Facilities", ShieldCheck),
    N("/rewards", "Rewards catalogue", Gift),
    N("/admin/moderation", "Moderation & inbox", MessagesSquare),
    community,
    profile,
  ],
};

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[(user?.role ?? "citizen") as Role];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo tone="light" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Dashboard">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to as "/dashboard"}
                onClick={onNavigate}
                activeOptions={{ exact: item.to === "/dashboard" || item.to === "/items" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
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
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-forest/50"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-72 animate-in slide-in-from-left bg-sidebar text-sidebar-foreground",
            )}
          >
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
