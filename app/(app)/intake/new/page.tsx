import { IntakeForm } from "@/components/intake/intake-form";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default function NewIntakePage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Intake automation"
        title="New client intake"
        description="Capture the legal matter once, then let the workflow generate document requests, follow-ups, activity, and an initial attorney-ready summary."
      />
      <IntakeForm />
    </div>
  );
}
