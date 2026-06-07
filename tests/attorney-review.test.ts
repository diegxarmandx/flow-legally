import { describe, expect, it } from "vitest";
import { buildAttorneyReviewStart } from "@/lib/services/attorney-review";
import {
  CaseStatus,
  CaseType,
  DocumentStatus,
  FollowUpStatus,
  FollowUpType,
  PaymentStatus,
  SummarySource,
  UrgencyLevel,
  type CaseRecord
} from "@/types/legalflow";

const timestamp = new Date("2026-01-01T12:00:00.000Z").toISOString();

const readyCase: CaseRecord = {
  id: "case_ready",
  firmId: "firm_test",
  clientId: "client_test",
  assignedUserId: null,
  caseNumber: "LF-READY",
  caseType: CaseType.CONTRACT_REVIEW,
  description: "Client needs vendor agreement reviewed before signature.",
  status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
  urgencyLevel: UrgencyLevel.HIGH,
  paymentStatus: PaymentStatus.PAID,
  intakeCompleted: true,
  priorityScore: 90,
  internalIntakeNotes: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  client: {
    id: "client_test",
    firmId: "firm_test",
    name: "Jordan Rivera",
    email: "jordan@example.com",
    phone: "555-0100",
    createdAt: timestamp,
    updatedAt: timestamp
  },
  assignedUser: null,
  documentRequests: [
    {
      id: "doc_test",
      caseId: "case_ready",
      title: "Contract draft",
      description: null,
      status: DocumentStatus.RECEIVED,
      dueDate: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  followUpTasks: [
    {
      id: "task_review",
      caseId: "case_ready",
      title: "Attorney review prep",
      type: FollowUpType.ATTORNEY_REVIEW,
      dueDate: timestamp,
      status: FollowUpStatus.OPEN,
      priority: UrgencyLevel.HIGH,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  summary: {
    id: "summary_test",
    caseId: "case_ready",
    source: SummarySource.RULE_BASED,
    version: "rules-v1",
    situationSummary: "Client has a contract review matter ready for attorney review.",
    keyRisks: [],
    missingInformation: [],
    recommendedNextSteps: [],
    priorityLevel: UrgencyLevel.HIGH,
    createdAt: timestamp,
    updatedAt: timestamp
  },
  internalNotes: [],
  activityLogs: []
};

describe("attorney review start", () => {
  it("moves a ready case into attorney review and closes attorney review prep", () => {
    const transition = buildAttorneyReviewStart(readyCase);

    expect(transition).toEqual({
      allowed: true,
      nextStatus: CaseStatus.IN_REVIEW,
      completedFollowUpTaskIds: ["task_review"]
    });
  });

  it("rejects cases that still have readiness blockers", () => {
    const transition = buildAttorneyReviewStart({
      ...readyCase,
      documentRequests: [{ ...readyCase.documentRequests[0], status: DocumentStatus.REQUESTED }]
    });

    expect(transition.allowed).toBe(false);
    if (!transition.allowed) {
      expect(transition.blockers).toContain("1 document request still blocks review.");
    }
  });

  it("rejects cases that are complete but not marked ready", () => {
    const transition = buildAttorneyReviewStart({
      ...readyCase,
      status: CaseStatus.WAITING_ON_DOCUMENTS
    });

    expect(transition.allowed).toBe(false);
    if (!transition.allowed) {
      expect(transition.reason).toBe("Only cases marked ready for attorney review can enter review.");
    }
  });
});
