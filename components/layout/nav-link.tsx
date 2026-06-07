"use client";

import { BarChart3, ClipboardCheck, ClipboardList, GitBranch, Home, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type NavIconName = "home" | "dashboard" | "clients" | "review" | "intake" | "engineering";

const icons: Record<NavIconName, LucideIcon> = {
  home: Home,
  dashboard: BarChart3,
  clients: Users,
  review: ClipboardCheck,
  intake: ClipboardList,
  engineering: GitBranch
};

export function NavLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: NavIconName;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[icon];

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-paper/76 transition hover:bg-paper/12 hover:text-paper lg:w-full",
        active && "bg-paper/14 text-paper shadow-hairline"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
