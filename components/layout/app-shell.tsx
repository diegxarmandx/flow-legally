import {
  BriefcaseBusiness,
  FileText,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { NavLink, type NavIconName } from "@/components/layout/nav-link";

const navItems: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/review", label: "Review", icon: "review" },
  { href: "/intake/new", label: "New Intake", icon: "intake" },
  { href: "/engineering", label: "Engineering", icon: "engineering" }
];

function isDemoMode() {
  return !process.env.DATABASE_URL || process.env.LEGALFLOW_DEMO_MODE === "true";
}

export function AppShell({ children }: { children: ReactNode }) {
  const demoMode = isDemoMode();

  return (
    <div className="app-texture min-h-screen lg:grid lg:grid-cols-[268px_1fr]">
      <aside className="border-b border-walnut/25 bg-walnut text-paper lg:min-h-screen lg:border-b-0 lg:border-r lg:border-black/15">
        <div className="px-5 py-5 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-paper/25 bg-paper/12 text-bone">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <Link className="focus-ring rounded-sm legal-heading text-lg font-semibold" href="/">
                FlowLegally
              </Link>
              <p className="text-xs text-paper/68">Operations cockpit</p>
            </div>
          </div>

          {demoMode ? (
            <div
              className="mt-4 rounded-md border border-amber-200/35 bg-amber-200/12 px-3 py-2"
              title="DATABASE_URL is not configured, so FlowLegally is using seeded fallback data."
            >
              <p className="text-xs font-bold uppercase text-amber-100">Demo Mode</p>
              <p className="mt-1 text-xs leading-5 text-paper/64">
                Running from seeded fallback data.
              </p>
            </div>
          ) : null}
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible lg:px-4">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="hidden px-6 pt-8 text-xs leading-5 text-paper/58 lg:block">
          <FileText className="mb-3 h-4 w-4" aria-hidden="true" />
          Built to show service-business automation judgment: intake, readiness, follow-up, and review.
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 md:px-8 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
