import type { ReactNode } from "react";

import heroImg from "@/assets/hero-sorting.jpg";
import { ApiStatusNotice } from "./ApiStatusNotice";
import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="animate-rise text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
          {subtitle && <div className="mt-3 animate-rise text-muted-foreground [animation-delay:60ms]">{subtitle}</div>}
          <ApiStatusNotice className="mt-6" />
          <div className="mt-8 animate-rise [animation-delay:120ms]">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="" width={1600} height={1104} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-forest/55" />
        <div className="absolute inset-x-10 bottom-10 max-w-md text-forest-foreground">
          <p className="font-display text-3xl leading-tight">“Waste” is mostly a lack of the right next owner.</p>
          <p className="mt-3 text-sm text-forest-foreground/75">Resortify matches every item with its best next life.</p>
        </div>
      </div>
    </div>
  );
}
