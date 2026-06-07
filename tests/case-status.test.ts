import { describe, expect, it } from "vitest";
import { calculateCaseStatus, calculatePriorityScore } from "@/lib/services/case-status";
import {
  CaseStatus,
  CaseType,
  DocumentStatus,
  PaymentStatus,
  UrgencyLevel,
  type DocumentRequest,
  type LegalCase
} from "@/types/legalflow";

const baseCase: LegalCase = {
  id: "case_test",
  firmId: "firm_test",
  clientId: "client_test",
  assignedUserId: null,
  caseNumber: "LF-TEST",
  caseType: CaseType.IMMIGRATION,
  description: "Client needs filing support for a time-sensitive immigration matter.",
  status: CaseStatus.NEW_INTAKE,
  urgencyLevel: UrgencyLevel.STANDARD,
  paymentStatus: PaymentStatus.PAID,
  intakeCompleted: true,
  priorityScore: 30,
  internalIntakeNotes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function document(status: DocumentStatus): DocumentRequest {
  return {
    id: `doc_${status}`,
    caseId: baseCase.id,
    title: "Government ID",
    description: null,
    status,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe("case status service", () => {
  it("marks incomplete intake before other blockers", () => {
    expect(
      calculateCaseStatus({
        caseRecord: { ...baseCase, intakeCompleted: false, paymentStatus: PaymentStatus.PENDING },
        documentRequests: [document(DocumentStatus.MISSING)]
      })
    ).toBe(CaseStatus.INTAKE_INCOMPLETE);
  });

  it("marks complete cases with missing documents as waiting on documents", () => {
    expect(
      calculateCaseStatus({
        caseRecord: baseCase,
        documentRequests: [document(DocumentStatus.MISSING)]
      })
    ).toBe(CaseStatus.WAITING_ON_DOCUMENTS);
  });

  it("marks all-documents-complete cases with paid payment as ready for attorney review", () => {
    expect(
      calculateCaseStatus({
        caseRecord: baseCase,
        documentRequests: [document(DocumentStatus.RECEIVED)]
      })
    ).toBe(CaseStatus.READY_FOR_ATTORNEY_REVIEW);
  });

  it("raises priority for high urgency and payment blockers", () => {
    expect(
      calculatePriorityScore({
        urgencyLevel: UrgencyLevel.CRITICAL,
        missingDocumentCount: 2,
        paymentStatus: PaymentStatus.OVERDUE,
        intakeCompleted: true
      })
    ).toBeGreaterThanOrEqual(90);
  });
});
