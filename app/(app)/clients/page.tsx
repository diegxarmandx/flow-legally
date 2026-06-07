import { Search, Users } from "lucide-react";
import Link from "next/link";
import { getClients } from "@/lib/repositories/legalflow-repository";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/format";
import { initials } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const clients = await getClients(query);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Client operations"
        title="Clients"
        description="Search firm clients, inspect recent activity, and jump into the case workspace that needs attention."
        actions={<ButtonLink href="/intake/new">Start new intake</ButtonLink>}
      />

      <form className="flex max-w-xl items-center gap-2 rounded-lg border border-ledger bg-white px-3 py-2 shadow-hairline">
        <Search className="h-4 w-4 text-docket" aria-hidden="true" />
        <label htmlFor="q" className="sr-only">
          Search clients
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          className="focus-ring min-h-9 flex-1 rounded-md border-0 bg-transparent px-2 text-sm text-ink"
          placeholder="Search by name or email"
        />
        <button className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper" type="submit">
          Search
        </button>
      </form>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Adjust the search or start a new intake to create a client and case workspace."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-ledger bg-white/80 shadow-hairline">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-ledger/80 bg-bone/45 text-xs font-semibold uppercase text-docket">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Cases</th>
                  <th className="px-5 py-3">Last activity</th>
                  <th className="px-5 py-3">Recent status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ledger/70">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-paper">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-xs font-bold text-paper">
                          {initials(client.name)}
                        </div>
                        <div>
                          <Link
                            className="focus-ring rounded-sm font-semibold text-ink hover:text-brief"
                            href={`/clients/${client.id}`}
                          >
                            {client.name}
                          </Link>
                          {client.cases[0] ? (
                            <Link
                              className="focus-ring rounded-sm text-xs font-semibold text-brief hover:text-pine"
                              href={`/cases/${client.cases[0].id}`}
                            >
                              Open latest case
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-docket">{client.email}</td>
                    <td className="px-5 py-4 text-docket">{client.phone}</td>
                    <td className="px-5 py-4 text-docket">{client.caseCount}</td>
                    <td className="px-5 py-4 text-docket">{formatDate(client.lastActivityAt)}</td>
                    <td className="px-5 py-4">
                      {client.latestCaseStatus ? <StatusBadge value={client.latestCaseStatus} /> : "No cases"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
