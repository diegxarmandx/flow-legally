import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PrintButton } from "@/components/case/print-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCaseById } from "@/lib/repositories/legalflow-repository";
import { buildReviewPacket } from "@/lib/services/review-packet";
import { formatDate, formatRelativeDate, labelFor } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function ReviewPacketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);
  if (!caseRecord) notFound();

  const packet = buildReviewPacket(caseRecord);

  return (
    <div className="space-y-6 print:bg-white">
      <div className="no-print flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <ButtonLink href={`/cases/${caseRecord.id}`} tone="ghost">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to case
        </ButtonLink>
        <PrintButton />
      </div>

      <section className="rounded-lg border border-ledger bg-white p-6 shadow-hairline print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-ledger pb-5">
          <p className="text-xs font-semibold uppercase text-docket">Attorney review packet</p>
          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="legal-heading text-3xl font-semibold text-ink">{packet.caseNumber}</h1>
              <p className="mt-2 text-base text-docket">{packet.client.name}</p>
            </div>
            <div className="text-sm text-docket md:text-right">
              <p>Generated {formatDate(packet.generatedAt)}</p>
              <p>Last case update {formatDate(packet.overview.updatedAt)}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-5 print:grid-cols-2 lg:grid-cols-[320px_1fr]">
          <div className="space-y-5">
            <PacketSection title="Client">
              <dl className="space-y-3 text-sm">
                <PacketItem label="Name" value={packet.client.name} />
                <PacketItem label="Email" value={packet.client.email} />
                <PacketItem label="Phone" value={packet.client.phone} />
              </dl>
            </PacketSection>

            <PacketSection title="Matter">
              <dl className="space-y-3 text-sm">
                <PacketItem label="Case type" value={labelFor(packet.overview.caseType)} />
                <div>
                  <dt className="text-docket">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge value={packet.overview.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-docket">Urgency</dt>
                  <dd className="mt-1">
                    <StatusBadge value={packet.overview.urgencyLevel} />
                  </dd>
                </div>
                <div>
                  <dt className="text-docket">Payment</dt>
                  <dd className="mt-1">
                    <StatusBadge value={packet.overview.paymentStatus} />
                  </dd>
                </div>
                <PacketItem label="Assigned owner" value={packet.overview.assignedUserName ?? "Unassigned"} />
              </dl>
            </PacketSection>

            <PacketSection title="Readiness">
              <div className="rounded-md border border-ledger bg-paper p-3">
                <p className="text-xs font-semibold uppercase text-docket">Packet readiness</p>
                <p className="mt-1 text-3xl font-semibold text-walnut">{packet.readiness.readinessPercent}%</p>
              </div>
              <ul className="mt-4 space-y-3">
                {packet.readiness.checklist.map((item) => (
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
            </PacketSection>
          </div>

          <div className="space-y-5">
            <PacketSection title="Case narrative">
              <p className="text-sm leading-6 text-ink">{packet.overview.description}</p>
              {packet.overview.internalIntakeNotes ? (
                <div className="mt-4 rounded-md border border-ledger bg-paper p-3">
                  <p className="text-xs font-semibold uppercase text-docket">Internal intake notes</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{packet.overview.internalIntakeNotes}</p>
                </div>
              ) : null}
            </PacketSection>

            <PacketSection title="Case summary">
              {packet.summary ? (
                <div className="space-y-4 text-sm leading-6">
                  <p className="rounded-md border border-ledger bg-paper p-4 text-ink">
                    {packet.summary.situationSummary}
                  </p>
                  <PacketList title="Key risks" items={packet.summary.keyRisks} />
                  <PacketList title="Missing information" items={packet.summary.missingInformation} />
                  <PacketList title="Recommended next steps" items={packet.summary.recommendedNextSteps} />
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No summary yet"
                  description="Generate a case summary before sending this packet for review."
                />
              )}
            </PacketSection>

            <PacketSection title="Documents">
              <div className="divide-y divide-ledger/70">
                {packet.documents.map((document) => (
                  <div key={document.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-ink">{document.title}</p>
                      <p className="mt-1 text-docket">{document.description}</p>
                    </div>
                    <StatusBadge value={document.status} />
                  </div>
                ))}
              </div>
            </PacketSection>

            <PacketSection title="Follow-ups">
              {packet.followUps.length === 0 ? (
                <p className="text-sm text-docket">No follow-ups are attached to this case.</p>
              ) : (
                <div className="divide-y divide-ledger/70">
                  {packet.followUps.map((task) => (
                    <div key={task.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-ink">{task.title}</p>
                        <p className="mt-1 text-docket">
                          {labelFor(task.type)} due {formatRelativeDate(task.dueDate)}
                        </p>
                      </div>
                      <StatusBadge value={task.status} />
                    </div>
                  ))}
                </div>
              )}
            </PacketSection>

            <PacketSection title="Internal notes">
              {packet.notes.length === 0 ? (
                <p className="text-sm text-docket">No internal notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {packet.notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-ledger bg-paper p-3 text-sm">
                      <p className="leading-6 text-ink">{note.body}</p>
                      <p className="mt-2 text-xs text-docket">
                        {note.author?.name ?? "Team member"} on {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </PacketSection>

            <PacketSection title="Activity">
              <ol className="space-y-3">
                {packet.activity.slice(0, 8).map((log) => (
                  <li key={log.id} className="border-l-2 border-ledger pl-4">
                    <p className="text-sm font-medium text-ink">{log.message}</p>
                    <p className="mt-1 text-xs text-docket">{formatDate(log.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </PacketSection>
          </div>
        </div>
      </section>
    </div>
  );
}

function PacketSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="break-inside-avoid print:border print:border-ledger print:bg-white print:shadow-none">
      <h2 className="mb-4 text-base font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

function PacketItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-docket">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function PacketList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
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
