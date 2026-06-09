import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  FileWarning,
  Flag,
  ScrollText,
  Workflow
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/repositories/legalflow-repository";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeDate, labelFor } from "@/lib/utils/format";
import type { AutomationQueueCategory, AutomationQueueItem } from "@/types/legalflow";

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

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-brief" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-ink">Today&apos;s Automation Queue</h2>
                <p className="text-sm text-docket">
                  These actions are based on the same automation service used during intake creation.
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-docket">{data.automationQueue.sourceDescription}</p>
          </div>
          <div className="rounded-md border border-ledger bg-bone/70 px-4 py-3 lg:text-right">
            <p className="text-xs font-semibold uppercase text-docket">Estimated time saved</p>
            <p className="mt-1 text-2xl font-semibold text-walnut">
              {data.automationQueue.totalEstimatedMinutesSaved} min
            </p>
            <p className="mt-1 text-xs text-docket">approximately today</p>
          </div>
        </div>

        {data.automationQueue.items.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={ClipboardCheck}
            title="No automation actions detected today"
            description="As intake, document, payment, summary, and readiness rules run, generated work appears here."
          />
        ) : (
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {data.automationQueue.items.map((item) => (
              <AutomationQueueRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </Card>

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
              This demo treats case summaries, readiness signals, and follow-up work as operational
              automation that helps a service business move cases forward.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

const automationIcons: Record<AutomationQueueCategory, typeof Workflow> = {
  document: FileText,
  payment: CreditCard,
  readiness: ClipboardCheck,
  summary: ScrollText,
  priority: Flag
};

function AutomationQueueRow({ item }: { item: AutomationQueueItem }) {
  const Icon = automationIcons[item.category];

  return (
    <div className="rounded-md border border-ledger/80 bg-paper p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ledger bg-vellum text-brief">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
            <Badge tone={item.status === "completed" ? "success" : "neutral"}>
              {automationStatusLabel(item.status)}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-docket">{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-docket">
            <span className="rounded-md border border-ledger bg-white px-2 py-1">{item.timestampLabel}</span>
            <span className="rounded-md border border-ledger bg-white px-2 py-1">
              {item.minutesSaved} min saved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function automationStatusLabel(status: AutomationQueueItem["status"]) {
  const labels: Record<AutomationQueueItem["status"], string> = {
    completed: "Completed",
    queued: "Queued",
    monitoring: "Monitoring"
  };
  return labels[status];
}
