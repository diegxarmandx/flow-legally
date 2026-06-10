import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  Flag,
  MessageSquareText,
  Plus,
  RefreshCw,
  Scale,
  Send,
  ScrollText,
  Workflow
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  addInternalNoteAction,
  completeFollowUpAction,
  createFollowUpAction,
  markCaseReadyForReviewAction,
  markDocumentReceivedAction,
  markIntakeCompleteAction,
  regenerateSummaryAction,
  startAttorneyReviewAction,
  updatePaymentStatusAction
} from "@/lib/actions/legalflow-actions";
import { getCaseById } from "@/lib/repositories/legalflow-repository";
import { buildAttorneyReviewStart } from "@/lib/services/attorney-review";
import { buildAutomationTimeline, type TimelineIconName, type TimelineTone } from "@/lib/services/automation-timeline";
import { buildReviewReadiness, canSetReadyForAttorneyReview } from "@/lib/services/review-readiness";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CaseStatus, DocumentStatus, FollowUpStatus, FollowUpType, PaymentStatus, UrgencyLevel } from "@/types/legalflow";
import { formatDate, formatRelativeDate, labelFor } from "@/lib/utils/format";
import { missingDocuments } from "@/lib/utils/status";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);
  if (!caseRecord) notFound();

  const missing = missingDocuments(caseRecord.documentRequests);
  const reviewReadiness = buildReviewReadiness(caseRecord);
  const canMarkReady = canSetReadyForAttorneyReview(caseRecord, reviewReadiness);
  const reviewStart = buildAttorneyReviewStart(caseRecord);
  const automationTimeline = buildAutomationTimeline(caseRecord);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={caseRecord.caseNumber}
        title={`${caseRecord.client.name} case workspace`}
        description="A single operational surface for intake readiness, client follow-up, attorney review, and case context."
        actions={
          <div className="flex min-w-0 flex-wrap gap-2">
            <ButtonLink href={`/cases/${caseRecord.id}/packet`} tone="secondary">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Preview packet
            </ButtonLink>
            <form action={regenerateSummaryAction}>
              <input type="hidden" name="caseId" value={caseRecord.id} />
              <Button tone="secondary" type="submit">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Generate/update case summary
              </Button>
            </form>
          </div>
        }
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card>
            <h2 className="text-base font-semibold text-ink">Client information</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-docket">Name</dt>
                <dd className="font-semibold text-ink">{caseRecord.client.name}</dd>
              </div>
              <div>
                <dt className="text-docket">Email</dt>
                <dd className="text-ink">{caseRecord.client.email}</dd>
              </div>
              <div>
                <dt className="text-docket">Phone</dt>
                <dd className="text-ink">{caseRecord.client.phone}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-ink">Case overview</h2>
            <dl className="mt-5 grid grid-cols-1 gap-4 text-sm">
              <InfoItem label="Case type" value={labelFor(caseRecord.caseType)} />
              <div>
                <dt className="text-docket">Status</dt>
                <dd className="mt-1">
                  <StatusBadge value={caseRecord.status} />
                </dd>
              </div>
              <div>
                <dt className="text-docket">Urgency</dt>
                <dd className="mt-1">
                  <StatusBadge value={caseRecord.urgencyLevel} />
                </dd>
              </div>
              <div>
                <dt className="text-docket">Payment</dt>
                <dd className="mt-1 space-y-3">
                  <StatusBadge value={caseRecord.paymentStatus} />
                  <form action={updatePaymentStatusAction} className="grid gap-2">
                    <input type="hidden" name="caseId" value={caseRecord.id} />
                    <label className="sr-only" htmlFor="paymentStatus">
                      Update payment status
                    </label>
                    <select
                      className="focus-ring min-h-10 rounded-md border border-ledger bg-white px-3 text-sm text-ink"
                      id="paymentStatus"
                      name="paymentStatus"
                      defaultValue={caseRecord.paymentStatus}
                    >
                      {Object.values(PaymentStatus).map((value) => (
                        <option key={value} value={value}>
                          {labelFor(value)}
                        </option>
                      ))}
                    </select>
                    <Button tone="secondary" type="submit">
                      Update payment
                    </Button>
                  </form>
                </dd>
              </div>
              <InfoItem label="Created" value={formatDate(caseRecord.createdAt)} />
              <InfoItem label="Last updated" value={formatDate(caseRecord.updatedAt)} />
            </dl>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">Review readiness</h2>
                <p className="mt-1 text-sm leading-6 text-docket">{reviewReadiness.handoffSummary}</p>
              </div>
              <div className="rounded-md border border-ledger bg-bone/70 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase text-docket">Handoff</p>
                <p className="text-xl font-semibold text-walnut">{reviewReadiness.readinessPercent}%</p>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {reviewReadiness.checklist.map((item) => (
                <li key={item.label} className="flex gap-3 text-sm">
                  <span
                    className={
                      item.complete
                        ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brief text-white"
                        : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-900"
                    }
                    aria-hidden="true"
                  >
                    {item.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : "!"}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{item.label}</span>
                    <span className="block leading-5 text-docket">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-md border border-ledger/80 bg-paper p-3">
              <p className="text-xs font-semibold uppercase text-docket">Next action</p>
              <p className="mt-1 text-sm font-medium leading-6 text-ink">{reviewReadiness.nextAction}</p>
            </div>

            {!caseRecord.intakeCompleted ? (
              <form action={markIntakeCompleteAction} className="mt-4">
                <input type="hidden" name="caseId" value={caseRecord.id} />
                <Button type="submit">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Mark intake complete
                </Button>
              </form>
            ) : canMarkReady ? (
              <form action={markCaseReadyForReviewAction} className="mt-4">
                <input type="hidden" name="caseId" value={caseRecord.id} />
                <Button type="submit">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Set status ready
                </Button>
              </form>
            ) : reviewStart.allowed ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/cases/${caseRecord.id}/packet`} tone="secondary">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Preview packet
                </ButtonLink>
                <form action={startAttorneyReviewAction}>
                  <input type="hidden" name="caseId" value={caseRecord.id} />
                  <Button type="submit">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Start attorney review
                  </Button>
                </form>
              </div>
            ) : caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW ? (
              <p className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
                Status is synced with review readiness.
              </p>
            ) : null}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <ScrollText className="h-5 w-5 text-brief" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">Case summary</h2>
                <p className="text-sm text-docket">Structured for attorney review.</p>
              </div>
            </div>
            {caseRecord.summary ? (
              <div className="mt-5 space-y-5 text-sm leading-6">
                <p className="break-words rounded-md border border-ledger bg-paper p-4 text-ink">
                  {caseRecord.summary.situationSummary}
                </p>
                <SummaryList title="Key risks" items={caseRecord.summary.keyRisks} />
                <SummaryList title="Missing information" items={caseRecord.summary.missingInformation} />
                <SummaryList title="Recommended next steps" items={caseRecord.summary.recommendedNextSteps} />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-docket">Priority level</p>
                  <StatusBadge value={caseRecord.summary.priorityLevel} />
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ScrollText}
                title="No case summary yet"
                description="Generate a structured summary to help the attorney review the intake quickly."
                className="mt-5"
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">Document requests</h2>
                <p className="text-sm text-docket">{missing.length} request{missing.length === 1 ? "" : "s"} still blocking readiness.</p>
              </div>
              <FileText className="h-5 w-5 text-brief" aria-hidden="true" />
            </div>
            <div className="mt-5 divide-y divide-ledger/70">
              {caseRecord.documentRequests.map((document) => (
                <div key={document.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-ink">{document.title}</p>
                    <p className="mt-1 text-sm text-docket">{document.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <StatusBadge value={document.status} />
                    {document.status !== DocumentStatus.RECEIVED ? (
                      <form action={markDocumentReceivedAction}>
                        <input type="hidden" name="documentId" value={document.id} />
                        <Button tone="secondary" type="submit">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Mark received
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-brief" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">Follow-up tasks</h2>
                <p className="text-sm text-docket">Automation-generated work and manual reminders.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-ledger/70">
              {caseRecord.followUpTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-ink">{task.title}</p>
                    <p className="mt-1 text-sm text-docket">
                      {labelFor(task.type)} due {formatRelativeDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <StatusBadge value={task.priority} />
                    <StatusBadge value={task.status} />
                    {task.status === FollowUpStatus.OPEN ? (
                      <form action={completeFollowUpAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button tone="secondary" type="submit">
                          {task.type === FollowUpType.QUESTIONNAIRE && !caseRecord.intakeCompleted
                            ? "Mark intake complete"
                            : "Complete"}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <form action={createFollowUpAction} className="mt-5 grid min-w-0 gap-3 rounded-md border border-ledger bg-paper p-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_160px_160px_140px_auto]">
              <input type="hidden" name="caseId" value={caseRecord.id} />
              <label className="sr-only" htmlFor="title">
                Follow-up title
              </label>
              <input
                className="focus-ring min-h-10 min-w-0 rounded-md border border-ledger bg-white px-3 text-sm"
                id="title"
                name="title"
                placeholder="Follow-up title"
                minLength={3}
                required
              />
              <select className="focus-ring min-h-10 min-w-0 rounded-md border border-ledger bg-white px-3 text-sm" name="type" defaultValue={FollowUpType.GENERAL} aria-label="Follow-up type">
                {Object.values(FollowUpType).map((value) => (
                  <option key={value} value={value}>
                    {labelFor(value)}
                  </option>
                ))}
              </select>
              <input className="focus-ring min-h-10 min-w-0 rounded-md border border-ledger bg-white px-3 text-sm" name="dueDate" type="date" aria-label="Due date" required />
              <select className="focus-ring min-h-10 min-w-0 rounded-md border border-ledger bg-white px-3 text-sm" name="priority" defaultValue={UrgencyLevel.STANDARD} aria-label="Priority">
                {Object.values(UrgencyLevel).map((value) => (
                  <option key={value} value={value}>
                    {labelFor(value)}
                  </option>
                ))}
              </select>
              <Button className="lg:col-span-2 2xl:col-span-1" type="submit">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add
              </Button>
            </form>
          </Card>

          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <Card>
              <div className="flex items-center gap-3">
                <MessageSquareText className="h-5 w-5 text-brief" aria-hidden="true" />
                <h2 className="text-base font-semibold text-ink">Internal notes</h2>
              </div>
              <div className="mt-5 space-y-3">
                {caseRecord.internalNotes.length === 0 ? (
                  <p className="text-sm text-docket">No internal notes yet.</p>
                ) : (
                  caseRecord.internalNotes.map((note) => (
                    <div key={note.id} className="rounded-md border border-ledger bg-paper p-3 text-sm">
                      <p className="break-words leading-6 text-ink">{note.body}</p>
                      <p className="mt-2 text-xs text-docket">
                        {note.author?.name ?? "Team member"} on {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <form action={addInternalNoteAction} className="mt-5 space-y-3">
                <input type="hidden" name="caseId" value={caseRecord.id} />
                <label className="text-sm font-semibold text-ink" htmlFor="body">
                  Add note
                </label>
                <textarea
                  className="focus-ring min-h-28 w-full rounded-md border border-ledger bg-white px-3 py-2 text-sm"
                  id="body"
                  name="body"
                  minLength={3}
                  required
                />
                <Button tone="secondary" type="submit">
                  Save note
                </Button>
              </form>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-brief" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-ink">Automation timeline</h2>
                  <p className="text-sm text-docket">Background rules and team actions in one audit trail.</p>
                </div>
              </div>
              {automationTimeline.length === 0 ? (
                <EmptyState
                  className="mt-5"
                  icon={Workflow}
                  title="No timeline activity yet"
                  description="Automation and team events will appear here as the case moves through intake and review."
                />
              ) : (
                <ol className="mt-5 space-y-3" aria-label="Case automation and activity timeline">
                  {automationTimeline.map((entry) => (
                    <li key={entry.id} className="relative pl-12">
                      <TimelineIcon icon={entry.icon} tone={entry.tone} />
                      <div className="rounded-md border border-ledger bg-paper p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={entry.tone === "automation" ? "info" : entry.tone === "attorney" ? "success" : "neutral"}>
                            {entry.actor}
                          </Badge>
                          <p className="break-words text-sm font-semibold text-ink">{entry.title}</p>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-docket">{entry.description}</p>
                        <p className="mt-2 text-xs text-docket">{formatDate(entry.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const timelineIcons: Record<TimelineIconName, typeof Workflow> = {
  workflow: Workflow,
  scroll: ScrollText,
  file: FileText,
  "credit-card": CreditCard,
  check: CheckCircle2,
  note: MessageSquareText,
  scale: Scale,
  flag: Flag
};

function TimelineIcon({ icon, tone }: { icon: TimelineIconName; tone: TimelineTone }) {
  const Icon = timelineIcons[icon];

  return (
    <span
      className={
        tone === "automation"
          ? "absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-brief"
          : tone === "attorney"
            ? "absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800"
            : "absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-ledger bg-white text-docket"
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-docket">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-docket">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="break-words rounded-md border border-ledger/80 bg-white px-3 py-2 text-ink">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
