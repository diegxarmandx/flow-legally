import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl pt-16">
      <EmptyState
        icon={FileQuestion}
        title="Case not found"
        description="The case may not exist in the current demo store or database. Return to the dashboard to continue reviewing active matters."
      />
      <div className="mt-5 flex justify-center">
        <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
      </div>
    </div>
  );
}
