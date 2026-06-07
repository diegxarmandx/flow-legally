import { AlertTriangle, CheckCircle2, ClipboardList, CreditCard, Database, FileWarning } from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/repositories/legalflow-repository";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeDate, labelFor } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const summary = [
    {
      label: "Total active cases",
      value: data.metrics.totalActiveCases,
      icon: ClipboardList,
      detail: "Open operational load"
    },
    {
      label: "Intake incomplete",
      value: data.metrics.intakeIncomplete,
      icon: AlertTriangle,
      detail: "Questionnaires still blocking"
    },
    {
      label: "Missing documents",
      value: data.metrics.missingDocuments,
      icon: FileWarning,
      detail: "Cases needing client evidence"
    },
    {
      label: "Payment pending",
      value: data.metrics.paymentPending,
      icon: CreditCard,
      detail: "Fee issues before review"
    },
    {
      label: "Ready for review",
      value: data.metrics.readyForAttorneyReview,
      icon: CheckCircle2,
      detail: "Attorney queue candidates"
    }
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={data.mode === "demo" ? "Demo data mode" : "PostgreSQL mode"}
        title="Legal operations dashboard"
        description="A working cockpit for intake completion, document readiness, payment follow-up, and attorney review prioritization."
        actions={<ButtonLink href="/intake/new">Start new intake</ButtonLink>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map((item) => (
          <Card key={item.label} className="min-h-36">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-docket">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-ink">{item.value}</p>
              </div>
              <div className="rounded-md border border-ledger bg-bone/60 p-2 text-brief">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-5 text-xs leading-5 text-docket">{item.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-ledger/80 px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Recent cases</h2>
            <p className="mt-1 text-sm text-docket">Prioritized by latest operational activity.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-ledger/80 bg-bone/45 text-xs font-semibold uppercase text-docket">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Case type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Urgency</th>
                  <th className="px-5 py-3">Missing docs</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Last follow-up</th>
                  <th className="px-5 py-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger/70">
                {data.recentCases.map((caseRow) => (
                  <tr key={caseRow.id} className="bg-white/55 hover:bg-white">
                    <td className="px-5 py-4 font-semibold text-ink">
                      <Link className="focus-ring rounded-sm hover:text-brief" href={`/cases/${caseRow.id}`}>
                        {caseRow.clientName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-docket">{labelFor(caseRow.caseType)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={caseRow.status} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={caseRow.urgency} />
                    </td>
                    <td className="px-5 py-4 text-docket">{caseRow.missingDocumentCount}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={caseRow.paymentStatus} />
                    </td>
                    <td className="px-5 py-4 text-docket">{formatRelativeDate(caseRow.lastFollowUpDate)}</td>
                    <td className="px-5 py-4 text-docket">{caseRow.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-brief" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-ink">Operational insights</h2>
                <p className="text-sm text-docket">Useful blockers, not vanity metrics.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {data.insights.map((insight) => (
                <li key={insight} className="rounded-md border border-ledger/70 bg-paper px-3 py-3 text-sm text-ink">
                  {insight}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-ink text-paper">
            <p className="text-sm font-semibold">Glade.ai fit</p>
            <p className="mt-3 text-sm leading-6 text-paper/72">
              This demo treats AI as workflow automation: summaries, readiness signals, and follow-up
              work that helps a service business move cases forward.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
