import { AlertTriangle, ClipboardCheck, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { startAttorneyReviewAction } from "@/lib/actions/legalflow-actions";
import { getReviewQueueData } from "@/lib/repositories/legalflow-repository";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, labelFor } from "@/lib/utils/format";
import type { ReviewQueueRow } from "@/types/legalflow";

export const dynamic = "force-dynamic";

type QueueTab = "ready" | "inReview" | "blocked";

const tabLabels: Record<QueueTab, string> = {
  ready: "Ready",
  inReview: "In Review",
  blocked: "Needs Attention"
};

export default async function ReviewQueuePage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const selectedTab = isQueueTab(params?.tab) ? params.tab : "ready";
  const queue = await getReviewQueueData();
  const rows = queue[selectedTab];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Attorney handoff"
        title="Review queue"
        description="Move ready matters into attorney review, preview the handoff packet, and see what is still blocking review."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <QueueMetric href="/review?tab=ready" label="Ready" value={queue.ready.length} active={selectedTab === "ready"} />
        <QueueMetric
          href="/review?tab=inReview"
          label="In review"
          value={queue.inReview.length}
          active={selectedTab === "inReview"}
        />
        <QueueMetric
          href="/review?tab=blocked"
          label="Needs attention"
          value={queue.blocked.length}
          active={selectedTab === "blocked"}
        />
      </div>

      <Card>
        <div className="flex items-center gap-3">
          {selectedTab === "blocked" ? (
            <AlertTriangle className="h-5 w-5 text-seal" aria-hidden="true" />
          ) : (
            <ClipboardCheck className="h-5 w-5 text-brief" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-base font-semibold text-ink">{tabLabels[selectedTab]} cases</h2>
            <p className="text-sm text-docket">
              {selectedTab === "ready"
                ? "These matters can move into attorney review now."
                : selectedTab === "inReview"
                  ? "These matters are already with an attorney."
                  : "These matters need operational work before handoff."}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={ClipboardCheck}
            title={`No ${tabLabels[selectedTab].toLowerCase()} cases`}
            description="As case status changes, matters will appear here automatically."
          />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-ledger/80 text-xs font-semibold uppercase text-docket">
                <tr>
                  <th className="py-3 pr-4">Matter</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Readiness</th>
                  <th className="px-4 py-3">Blockers / next action</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger/70">
                {rows.map((row) => (
                  <ReviewRow key={row.id} row={row} selectedTab={selectedTab} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReviewRow({ row, selectedTab }: { row: ReviewQueueRow; selectedTab: QueueTab }) {
  return (
    <tr className="hover:bg-paper">
      <td className="py-4 pr-4 align-top">
        <Link className="focus-ring rounded-sm font-semibold text-ink hover:text-brief" href={`/cases/${row.id}`}>
          {row.caseNumber}
        </Link>
        <p className="mt-1 text-sm text-docket">{row.clientName}</p>
        <p className="mt-1 text-xs text-docket">
          {labelFor(row.caseType)} - {row.priority}
        </p>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="space-y-2">
          <StatusBadge value={row.status} />
          <StatusBadge value={row.urgency} />
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="w-36">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-docket">
            <span>Packet</span>
            <span>{row.readinessPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-bone">
            <div className="h-2 rounded-full bg-brief" style={{ width: `${row.readinessPercent}%` }} />
          </div>
        </div>
      </td>
      <td className="max-w-md px-4 py-4 align-top text-docket">
        {row.blockers.length > 0 ? (
          <ul className="space-y-1">
            {row.blockers.slice(0, 3).map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        ) : (
          row.nextAction
        )}
      </td>
      <td className="px-4 py-4 align-top text-docket">{formatDate(row.updatedAt)}</td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap justify-end gap-2">
          <ButtonLink href={`/cases/${row.id}/packet`} tone="secondary">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Preview packet
          </ButtonLink>
          <ButtonLink href={`/cases/${row.id}`} tone="ghost">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open
          </ButtonLink>
          {selectedTab === "ready" ? (
            <form action={startAttorneyReviewAction}>
              <input type="hidden" name="caseId" value={row.id} />
              <Button type="submit">Start review</Button>
            </form>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function QueueMetric({
  href,
  label,
  value,
  active
}: {
  href: string;
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <Link
      className={
        active
          ? "focus-ring rounded-lg border border-walnut bg-white p-4 shadow-lift"
          : "focus-ring rounded-lg border border-ledger bg-white/75 p-4 shadow-hairline hover:border-walnut/55"
      }
      href={href}
    >
      <p className="text-xs font-semibold uppercase text-docket">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-walnut">{value}</p>
    </Link>
  );
}

function isQueueTab(value: string | undefined): value is QueueTab {
  return value === "ready" || value === "inReview" || value === "blocked";
}
