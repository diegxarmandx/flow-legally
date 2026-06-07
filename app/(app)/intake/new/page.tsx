import { IntakeForm } from "@/components/intake/intake-form";
import { PageHeader } from "@/components/ui/page-header";
import { getClientById } from "@/lib/repositories/legalflow-repository";

export const dynamic = "force-dynamic";

export default async function NewIntakePage({
  searchParams
}: {
  searchParams?: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const client = params?.clientId ? await getClientById(params.clientId) : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Intake automation"
        title={client ? `New case for ${client.name}` : "New client intake"}
        description={
          client
            ? "Create another matter under this client while keeping the intake workflow consistent."
            : "Capture the legal matter once, then let the workflow generate document requests, follow-ups, activity, and an initial attorney-ready summary."
        }
      />
      <IntakeForm
        prefill={
          client
            ? {
                clientId: client.id,
                clientName: client.name,
                email: client.email,
                phone: client.phone
              }
            : undefined
        }
      />
    </div>
  );
}
