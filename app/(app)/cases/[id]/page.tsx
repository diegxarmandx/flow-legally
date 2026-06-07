import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  Plus,
  RefreshCw
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  addInternalNoteAction,
  completeFollowUpAction,
  createFollowUpAction,
  markDocumentReceivedAction,
  regenerateSummaryAction
} from "@/lib/actions/legalflow-actions";
import { getCaseById } from "@/lib/repositories/legalflow-repository";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentStatus, FollowUpStatus, FollowUpType, UrgencyLevel } from "@/types/legalflow";
import { formatDate, formatRelativeDate, labelFor } from "@/lib/utils/format";
import { missingDocuments } from "@/lib/utils/status";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);
  if (!caseRecord) notFound();

  const missing = missingDocuments(caseRecord.documentRequests);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={caseRecord.caseNumber}
        title={`${caseRecord.client.name} case workspace`}
        description="A single operational surface for intake readiness, client follow-up, attorney review, and AI-assisted case context."
        actions={
          <form action={regenerateSummaryAction}>
            <input type="hidden" name="caseId" value={caseRecord.id} />
            <Button tone="secondary" type="submit">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Generate/update AI summary
            </Button>
          </form>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
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
                <dd className="mt-1">
                  <StatusBadge value={caseRecord.paymentStatus} />
                </dd>
              </div>
              <InfoItem label="Created" value={formatDate(caseRecord.createdAt)} />
              <InfoItem label="Last updated" value={formatDate(caseRecord.updatedAt)} />
            </dl>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-brief" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-ink">AI case summary</h2>
                <p className="text-sm text-docket">Mock-generated, structured for attorney review.</p>
              </div>
            </div>
            {caseRecord.aiSummary ? (
              <div className="mt-5 space-y-5 text-sm leading-6">
                <p className="rounded-md border border-ledger bg-paper p-4 text-ink">
                  {caseRecord.aiSummary.situationSummary}
                </p>
                <SummaryList title="Key risks" items={caseRecord.aiSummary.keyRisks} />
                <SummaryList title="Missing information" items={caseRecord.aiSummary.missingInformation} />
                <SummaryList title="Recommended next steps" items={caseRecord.aiSummary.recommendedNextSteps} />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-docket">Priority level</p>
                  <StatusBadge value={caseRecord.aiSummary.priorityLevel} />
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Bot}
                title="No AI summary yet"
                description="Generate a structured mock summary to help the attorney review the intake quickly."
                className="mt-5"
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Document requests</h2>
                <p className="text-sm text-docket">{missing.length} request{missing.length === 1 ? "" : "s"} still blocking readiness.</p>
              </div>
              <FileText className="h-5 w-5 text-brief" aria-hidden="true" />
            </div>
            <div className="mt-5 divide-y divide-ledger/70">
              {caseRecord.documentRequests.map((document) => (
                <div key={document.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{document.title}</p>
                    <p className="mt-1 text-sm text-docket">{document.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
              <div>
                <h2 className="text-base font-semibold text-ink">Follow-up tasks</h2>
                <p className="text-sm text-docket">Automation-generated work and manual reminders.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-ledger/70">
              {caseRecord.followUpTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{task.title}</p>
                    <p className="mt-1 text-sm text-docket">
                      {labelFor(task.type)} due {formatRelativeDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={task.priority} />
                    <StatusBadge value={task.status} />
                    {task.status === FollowUpStatus.OPEN ? (
                      <form action={completeFollowUpAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button tone="secondary" type="submit">
                          Complete
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <form action={createFollowUpAction} className="mt-5 grid gap-3 rounded-md border border-ledger bg-paper p-4 md:grid-cols-[1fr_160px_160px_140px_auto]">
              <input type="hidden" name="caseId" value={caseRecord.id} />
              <label className="sr-only" htmlFor="title">
                Follow-up title
              </label>
              <input
                className="focus-ring min-h-10 rounded-md border border-ledger bg-white px-3 text-sm"
                id="title"
                name="title"
                placeholder="Follow-up title"
                minLength={3}
                required
              />
              <select className="focus-ring min-h-10 rounded-md border border-ledger bg-white px-3 text-sm" name="type" defaultValue={FollowUpType.GENERAL} aria-label="Follow-up type">
                {Object.values(FollowUpType).map((value) => (
                  <option key={value} value={value}>
                    {labelFor(value)}
                  </option>
                ))}
              </select>
              <input className="focus-ring min-h-10 rounded-md border border-ledger bg-white px-3 text-sm" name="dueDate" type="date" aria-label="Due date" required />
              <select className="focus-ring min-h-10 rounded-md border border-ledger bg-white px-3 text-sm" name="priority" defaultValue={UrgencyLevel.STANDARD} aria-label="Priority">
                {Object.values(UrgencyLevel).map((value) => (
                  <option key={value} value={value}>
                    {labelFor(value)}
                  </option>
                ))}
              </select>
              <Button type="submit">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add
              </Button>
            </form>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
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
                      <p className="leading-6 text-ink">{note.body}</p>
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
                <h2 className="text-base font-semibold text-ink">Activity timeline</h2>
              </div>
              <ol className="mt-5 space-y-3">
                {caseRecord.activityLogs.map((log) => (
                  <li key={log.id} className="border-l-2 border-ledger pl-4">
                    <p className="text-sm font-medium text-ink">{log.message}</p>
                    <p className="mt-1 text-xs text-docket">{formatDate(log.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
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
          <li key={item} className="rounded-md border border-ledger/80 bg-white px-3 py-2 text-ink">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
