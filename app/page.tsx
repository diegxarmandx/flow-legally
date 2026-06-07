import { ArrowRight, CheckCircle2, ClipboardList, FileText, Scale, ScrollText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function HomePage() {
  const proofPoints = [
    { label: "Active matters", value: "10+", detail: "Seeded cases across intake, documents, and review" },
    { label: "Review states", value: "7", detail: "Operational statuses for real firm workflows" },
    { label: "Review handoff", value: "1 view", detail: "Intake, documents, payment, and case notes organized for attorney review" }
  ];

  const capabilities = [
    {
      title: "Intake to readiness",
      body: "Capture client context once, then generate the case, document requests, follow-ups, and attorney-facing summary.",
      icon: ClipboardList
    },
    {
      title: "Document operations",
      body: "See exactly which evidence is blocking each case and move the readiness state forward from one workspace.",
      icon: FileText
    },
    {
      title: "Attorney-ready summaries",
      body: "Structured case summaries support attorney review without adding another tool between staff and their work.",
      icon: ScrollText
    }
  ];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="hero-image relative flex min-h-[78dvh] flex-col text-paper md:min-h-[84dvh]">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link className="focus-ring flex min-h-11 items-center gap-3 rounded-md" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-paper/30 bg-paper/12">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="legal-heading block text-lg font-semibold">FlowLegally</span>
              <span className="block text-xs text-paper/68">Legal operations automation</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
            <Link className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-paper/78 hover:text-paper" href="/engineering">
              Engineering
            </Link>
            <ButtonLink href="/dashboard" tone="secondary" className="border-paper/28 bg-paper/12 text-paper hover:bg-paper hover:text-ink">
              Open dashboard
            </ButtonLink>
          </nav>
        </header>

        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pb-12 pt-8 md:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-paper/28 bg-paper/12 px-3 py-1 text-xs font-bold uppercase text-paper/84">
              Built for service-business automation
            </p>
            <h1 className="legal-heading text-5xl font-semibold leading-[1.02] text-paper md:text-7xl">
              FlowLegally
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/82 md:text-xl">
              A polished SaaS cockpit for legal intake, case readiness, document follow-up,
              payment blockers, and attorney-ready case summaries.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard" className="bg-brief text-white hover:bg-pine">
                View live demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/intake/new" tone="secondary" className="border-paper/28 bg-paper text-ink hover:bg-bone">
                Start an intake
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-ledger bg-paper px-5 py-6 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {proofPoints.map((point) => (
            <div key={point.label} className="rounded-lg border border-ledger/75 bg-vellum p-5 shadow-hairline">
              <p className="text-sm font-semibold text-docket">{point.label}</p>
              <p className="mt-2 text-3xl font-semibold text-walnut">{point.value}</p>
              <p className="mt-2 text-sm leading-6 text-docket">{point.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-texture px-5 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase text-brief">Product workflow</p>
            <h2 className="legal-heading mt-2 text-3xl font-semibold text-walnut md:text-4xl">
              Designed for the messy middle of legal operations.
            </h2>
            <p className="mt-3 text-base leading-7 text-docket">
              The demo focuses on useful staff workflows: identifying blockers, creating follow-ups,
              preserving an audit trail, and making attorney review easier to start.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {capabilities.map((capability) => (
              <article key={capability.title} className="rounded-lg border border-ledger/75 bg-vellum p-5 shadow-hairline">
                <capability.icon className="h-5 w-5 text-brief" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-walnut">{capability.title}</h3>
                <p className="mt-3 text-sm leading-6 text-docket">{capability.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-ledger/75 bg-walnut p-6 text-paper shadow-panel">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-bone">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Reviewer-friendly by default
                </div>
                <p className="mt-3 text-sm leading-6 text-paper/76">
                  Run instantly in demo mode, or connect PostgreSQL with Prisma migrations and seed data
                  when you want persistent storage.
                </p>
              </div>
              <Link className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-paper px-4 py-2 text-sm font-semibold text-walnut hover:bg-bone" href="/engineering">
                Read engineering notes
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
