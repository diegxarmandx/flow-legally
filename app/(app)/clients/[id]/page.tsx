import { BriefcaseBusiness, Plus, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientById } from "@/lib/repositories/legalflow-repository";
import { formatDate, labelFor } from "@/lib/utils/format";
import { missingDocuments } from "@/lib/utils/status";
import { CaseStatus } from "@/types/legalflow";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const activeCases = client.cases.filter((caseRecord) => caseRecord.status !== CaseStatus.CLOSED);
  const readyCases = client.cases.filter((caseRecord) => caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW);
  const inReviewCases = client.cases.filter((caseRecord) => caseRecord.status === CaseStatus.IN_REVIEW);
  const closedCases = client.cases.filter((caseRecord) => caseRecord.status === CaseStatus.CLOSED);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Client profile"
        title={client.name}
        description="View every matter for this client, open the right workspace, or start another case without creating a duplicate client."
        actions={
          <ButtonLink href={`/intake/new?clientId=${client.id}`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New case for this client
          </ButtonLink>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-sm font-bold text-paper">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">Client information</h2>
                <p className="text-sm text-docket">{client.caseCount} total case{client.caseCount === 1 ? "" : "s"}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <InfoItem label="Email" value={client.email} />
              <InfoItem label="Phone" value={client.phone} />
              <InfoItem label="Last activity" value={formatDate(client.lastActivityAt)} />
              <InfoItem label="Client since" value={formatDate(client.createdAt)} />
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-ink">Matter mix</h2>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Active" value={activeCases.length} />
              <Metric label="Ready" value={readyCases.length} />
              <Metric label="In review" value={inReviewCases.length} />
              <Metric label="Closed" value={closedCases.length} />
            </dl>
          </Card>
        </div>

        <Card>
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="h-5 w-5 text-brief" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-ink">Cases</h2>
              <p className="text-sm text-docket">All matters tied to this client record.</p>
            </div>
          </div>

          {client.cases.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={BriefcaseBusiness}
              title="No cases yet"
              description="Start the first intake for this client."
            />
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-ledger/80 text-xs font-semibold uppercase text-docket">
                  <tr>
                    <th className="py-3 pr-4">Case</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Blocking docs</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ledger/70">
                  {client.cases.map((caseRecord) => (
                    <tr key={caseRecord.id} className="hover:bg-paper">
                      <td className="py-4 pr-4">
                        <Link
                          className="focus-ring rounded-sm font-semibold text-ink hover:text-brief"
                          href={`/cases/${caseRecord.id}`}
                        >
                          {caseRecord.caseNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-docket">{labelFor(caseRecord.caseType)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge value={caseRecord.status} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={caseRecord.paymentStatus} />
                      </td>
                      <td className="px-4 py-4 text-docket">{missingDocuments(caseRecord.documentRequests).length}</td>
                      <td className="px-4 py-4 text-docket">{formatDate(caseRecord.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-ledger bg-paper p-3">
      <dt className="text-xs font-semibold uppercase text-docket">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-walnut">{value}</dd>
    </div>
  );
}
