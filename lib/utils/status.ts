import {
  CaseStatus,
  DocumentStatus,
  FollowUpStatus,
  PaymentStatus,
  UrgencyLevel,
  type DocumentRequest,
  type FollowUpTask,
  type LegalCase
} from "@/types/legalflow";

export function isActiveCase(status: CaseStatus) {
  return status !== CaseStatus.CLOSED;
}

export function missingDocuments(documents: DocumentRequest[]) {
  const blockingStatuses = new Set<string>([DocumentStatus.MISSING, DocumentStatus.REQUESTED]);
  return documents.filter((document) =>
    blockingStatuses.has(document.status)
  );
}

export function activeFollowUps(tasks: FollowUpTask[]) {
  return tasks.filter((task) => task.status === FollowUpStatus.OPEN);
}

export function isPaymentBlocking(status: PaymentStatus) {
  return new Set<string>([PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE]).has(status);
}

export function priorityLabel(caseRecord: Pick<LegalCase, "urgencyLevel" | "priorityScore">) {
  if (caseRecord.urgencyLevel === UrgencyLevel.CRITICAL || caseRecord.priorityScore >= 90) {
    return "Critical review";
  }

  if (caseRecord.urgencyLevel === UrgencyLevel.HIGH || caseRecord.priorityScore >= 75) {
    return "High priority";
  }

  if (caseRecord.priorityScore >= 55) {
    return "Operational risk";
  }

  return "Normal";
}
