import { Bot, Database, GitBranch, ListChecks, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const sections = [
  {
    title: "Why this app exists",
    icon: Workflow,
    body: "LegalFlow AI demonstrates the kind of service-business automation Glade.ai is building: not a generic chatbot, but a workflow product that moves client matters from intake to attorney readiness."
  },
  {
    title: "Product problem",
    icon: ListChecks,
    body: "Law firms lose time when intake completion, missing evidence, payment follow-up, and attorney review readiness live across email, spreadsheets, and memory. The dashboard makes blockers visible and actionable."
  },
  {
    title: "Architecture",
    icon: GitBranch,
    body: "Next.js App Router renders server-first product pages. Server Actions call a repository layer, which uses Prisma/PostgreSQL when configured and a seeded demo store when reviewers run without a database."
  },
  {
    title: "Database model",
    icon: Database,
    body: "The Prisma schema models firm-scoped users, clients, cases, document requests, follow-up tasks, AI summaries, notes, and activity logs with enums for operational state and indexes for dashboard queries."
  },
  {
    title: "AI summary design",
    icon: Bot,
    body: "The mock AI service returns structured legal intake summaries with situation, risks, missing information, recommended next steps, and priority. It is intentionally provider-ready but requires no API key."
  },
  {
    title: "Risk and quality bar",
    icon: ShieldCheck,
    body: "Business logic stays out of React components. Status calculation, follow-up automation, validation, and activity logging are isolated so they can be tested and replaced safely."
  }
];

const edgeCases = [
  "Empty client list and case list states",
  "Invalid intake input with useful validation messages",
  "Duplicate active follow-up prevention",
  "Cases with no AI summary",
  "All documents complete and payment clear",
  "Payment pending after document readiness",
  "High urgency triage",
  "Long case descriptions and responsive layouts"
];

export default function EngineeringPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="For the hiring team"
        title="Engineering and product notes"
        description="A concise walkthrough of why this demo was built, how it is structured, and how it could evolve into production-grade Glade.ai workflow automation."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} className="min-h-56">
            <section.icon className="h-5 w-5 text-brief" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold text-ink">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-docket">{section.body}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-base font-semibold text-ink">Important tradeoffs</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Tradeoff
              label="No real auth"
              value="The demo uses one seeded firm to keep focus on workflow depth. Real production would add firm membership, RBAC, and audit controls."
            />
            <Tradeoff
              label="Mock AI provider"
              value="The AI service is structured for replacement with a real provider, but deterministic output keeps the demo easy to evaluate."
            />
            <Tradeoff
              label="Stored case status"
              value="Status is stored for dashboard filtering, then recalculated after mutations to avoid stale operational state."
            />
            <Tradeoff
              label="Fallback demo store"
              value="Reviewers can run the product without PostgreSQL, while the Prisma schema and seed path demonstrate the intended persistence model."
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">Edge cases handled</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {edgeCases.map((item) => (
              <Badge key={item} tone="neutral">
                {item}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-ink text-paper">
        <h2 className="text-base font-semibold">How this could become a Glade.ai feature</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-paper/74">
          The same pattern could support insurance claims, professional-service onboarding, or legal
          follow-up operations: ingest structured intake, identify missing work, generate useful
          summaries, create follow-ups, and expose bottlenecks before staff has to hunt for them.
          Production evolution would add integrations, secure client messaging, file upload,
          provider-backed AI, firm-level permissions, analytics, and observability.
        </p>
      </Card>
    </div>
  );
}

function Tradeoff({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ledger bg-paper p-4">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-2 text-sm leading-6 text-docket">{value}</p>
    </div>
  );
}
