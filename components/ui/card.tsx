import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-lg border border-ledger/75 bg-vellum/88 p-5 shadow-hairline", className)}
      {...props}
    />
  );
}

export function Section({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("space-y-4", className)} {...props} />;
}
