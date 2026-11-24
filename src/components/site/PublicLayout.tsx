import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="bg-hero border-b border-border/60">
      <div className="container-page py-16 md:py-24">
        <p className="eyebrow animate-rise">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl animate-rise text-4xl font-semibold leading-[1.05] text-foreground md:text-6xl [animation-delay:80ms]">
          {title}
        </h1>
        {children && (
          <div className="mt-6 max-w-2xl animate-rise text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
