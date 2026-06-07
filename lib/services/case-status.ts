import {
  CaseStatus,
  PaymentStatus,
  UrgencyLevel,
  type DocumentRequest,
  type LegalCase
} from "@/types/legalflow";
import { isPaymentBlocking, missingDocuments } from "@/lib/utils/status";

export function calculatePriorityScore(input: {
  urgencyLevel: UrgencyLevel;
  missingDocumentCount: number;
  paymentStatus: PaymentStatus;
  intakeCompleted: boolean;
}) {
  let score = 30;

  if (!input.intakeCompleted) score += 18;
  if (input.missingDocumentCount > 0) score += Math.min(28, input.missingDocumentCount * 7);
  if (isPaymentBlocking(input.paymentStatus)) score += 16;
  if (input.urgencyLevel === UrgencyLevel.HIGH) score += 22;
  if (input.urgencyLevel === UrgencyLevel.CRITICAL) score += 34;

  return Math.min(score, 100);
}

export function calculateCaseStatus({
  caseRecord,
  documentRequests
}: {
  caseRecord: Pick<LegalCase, "status" | "intakeCompleted" | "paymentStatus">;
  documentRequests: DocumentRequest[];
}) {
  if (new Set<string>([CaseStatus.CLOSED, CaseStatus.IN_REVIEW]).has(caseRecord.status)) {
    return caseRecord.status;
  }

  if (!caseRecord.intakeCompleted) {
    return CaseStatus.INTAKE_INCOMPLETE;
  }

  if (missingDocuments(documentRequests).length > 0) {
    return CaseStatus.WAITING_ON_DOCUMENTS;
  }

  if (isPaymentBlocking(caseRecord.paymentStatus)) {
    return CaseStatus.PAYMENT_PENDING;
  }

  return CaseStatus.READY_FOR_ATTORNEY_REVIEW;
}

export function isReadyForAttorneyReview(caseRecord: LegalCase, documentRequests: DocumentRequest[]) {
  return (
    calculateCaseStatus({ caseRecord, documentRequests }) === CaseStatus.READY_FOR_ATTORNEY_REVIEW
  );
}
