import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export function buttonClasses(tone: ButtonTone = "primary") {
  return cn(
    "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
    tone === "primary" && "bg-brief text-white shadow-lift hover:bg-pine",
    tone === "secondary" && "border border-ledger bg-vellum text-ink shadow-hairline hover:border-walnut/55 hover:bg-white",
    tone === "ghost" && "text-docket hover:bg-bone/70 hover:text-walnut",
    tone === "danger" && "bg-seal text-white hover:bg-seal/90"
  );
}

export function Button({
  className,
  tone = "primary",
  ...props
}: ComponentPropsWithoutRef<"button"> & { tone?: ButtonTone }) {
  return <button className={cn(buttonClasses(tone), className)} {...props} />;
}

export function ButtonLink({
  className,
  tone = "primary",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { tone?: ButtonTone; children: ReactNode }) {
  return (
    <Link className={cn(buttonClasses(tone), className)} {...props}>
      {children}
    </Link>
  );
}
