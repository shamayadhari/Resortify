import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="bg-forest-gradient text-forest-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm space-y-4">
          <Logo tone="light" />
          <p className="text-sm leading-relaxed text-forest-foreground/75">
            Finding the best next life for every discarded item: repair, reuse, resale, donation,
            recycling or responsible disposal.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald">Platform</p>
          <ul className="space-y-2 text-sm text-forest-foreground/80">
            <li><Link to="/how-it-works" className="hover:text-forest-foreground">How it works</Link></li>
            <li><Link to="/features" className="hover:text-forest-foreground">Features &amp; roadmap</Link></li>
            <li><Link to="/register" className="hover:text-forest-foreground">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald">Company</p>
          <ul className="space-y-2 text-sm text-forest-foreground/80">
            <li><Link to="/about" className="hover:text-forest-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-forest-foreground">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-forest-foreground/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-forest-foreground/60 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Resortify (working name)</span>
          <span>Built for a circular India.</span>
        </div>
      </div>
    </footer>
  );
}
