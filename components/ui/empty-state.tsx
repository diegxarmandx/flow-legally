import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-ledger bg-white/65 px-6 py-10 text-center",
        className
      )}
    >
      <Icon className="mx-auto h-8 w-8 text-docket" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-docket">{description}</p>
    </div>
  );
}
