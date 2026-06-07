import { Badge } from "@/components/ui/badge";
import { labelFor } from "@/lib/utils/format";
import {
  CaseStatus,
  DocumentStatus,
  FollowUpStatus,
  PaymentStatus,
  UrgencyLevel
} from "@/types/legalflow";

type StatusValue = CaseStatus | DocumentStatus | FollowUpStatus | PaymentStatus | UrgencyLevel;

export function StatusBadge({ value }: { value: StatusValue }) {
  const danger = new Set<string>([
    CaseStatus.INTAKE_INCOMPLETE,
    CaseStatus.WAITING_ON_DOCUMENTS,
    PaymentStatus.OVERDUE,
    DocumentStatus.MISSING,
    UrgencyLevel.CRITICAL
  ]).has(value);
  const warning = new Set<string>([
    CaseStatus.PAYMENT_PENDING,
    PaymentStatus.PENDING,
    PaymentStatus.PARTIAL,
    DocumentStatus.REQUESTED,
    UrgencyLevel.HIGH
  ]).has(value);
  const success = new Set<string>([
    CaseStatus.READY_FOR_ATTORNEY_REVIEW,
    CaseStatus.CLOSED,
    PaymentStatus.PAID,
    PaymentStatus.NOT_REQUIRED,
    DocumentStatus.RECEIVED,
    DocumentStatus.WAIVED,
    FollowUpStatus.COMPLETED
  ]).has(value);
  const info = new Set<string>([CaseStatus.IN_REVIEW, CaseStatus.NEW_INTAKE, FollowUpStatus.OPEN]).has(value);

  return (
    <Badge tone={danger ? "danger" : warning ? "warning" : success ? "success" : info ? "info" : "neutral"}>
      {labelFor(value)}
    </Badge>
  );
}
