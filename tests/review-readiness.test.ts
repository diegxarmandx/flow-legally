import { describe, expect, it } from "vitest";
import { buildReviewReadiness, canSetReadyForAttorneyReview } from "@/lib/services/review-readiness";
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

const baseCase: CaseRecord = {
  id: "case_test",
  firmId: "firm_test",
  clientId: "client_test",
  assignedUserId: null,
  caseNumber: "LF-TEST",
  caseType: CaseType.FAMILY_LAW,
  description: "Client needs help preparing for a custody modification hearing.",
  status: CaseStatus.WAITING_ON_DOCUMENTS,
  urgencyLevel: UrgencyLevel.HIGH,
  paymentStatus: PaymentStatus.PENDING,
  intakeCompleted: true,
  priorityScore: 80,
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
      caseId: "case_test",
      title: "Prior court order",
      description: null,
      status: DocumentStatus.REQUESTED,
      dueDate: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  followUpTasks: [
    {
      id: "task_test",
      caseId: "case_test",
      title: "Collect prior order",
      type: FollowUpType.DOCUMENT_REMINDER,
      dueDate: timestamp,
      status: FollowUpStatus.OPEN,
      priority: UrgencyLevel.HIGH,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  summary: null,
  internalNotes: [],
  activityLogs: []
};

describe("review readiness", () => {
  it("surfaces blockers and the next best action for incomplete handoffs", () => {
    const readiness = buildReviewReadiness(baseCase);

    expect(readiness.readyForReview).toBe(false);
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "1 document request still blocks review.",
        "Pending payment status needs follow-up.",
        "Generate the case summary before review."
      ])
    );
    expect(readiness.nextAction).toBe("Collect or waive the remaining document requests.");
  });

  it("marks complete review packets ready for attorney review", () => {
    const readiness = buildReviewReadiness({
      ...baseCase,
      status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
      paymentStatus: PaymentStatus.PAID,
      documentRequests: [
        {
          ...baseCase.documentRequests[0],
          status: DocumentStatus.RECEIVED
        }
      ],
      followUpTasks: [],
      summary: {
        id: "summary_test",
        caseId: "case_test",
        source: SummarySource.RULE_BASED,
        version: "rules-v1",
        situationSummary: "Client has a family law matter ready for attorney review.",
        keyRisks: [],
        missingInformation: [],
        recommendedNextSteps: [],
        priorityLevel: UrgencyLevel.HIGH,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    });

    expect(readiness.readyForReview).toBe(true);
    expect(readiness.readinessPercent).toBe(100);
    expect(readiness.nextAction).toBe("Assign the case for attorney review.");
  });

  it("allows synced ready status when a complete packet is still marked in review", () => {
    const completeInReviewCase: CaseRecord = {
      ...baseCase,
      status: CaseStatus.IN_REVIEW,
      paymentStatus: PaymentStatus.PAID,
      documentRequests: [{ ...baseCase.documentRequests[0], status: DocumentStatus.RECEIVED }],
      followUpTasks: [],
      summary: {
        id: "summary_test",
        caseId: "case_test",
        source: SummarySource.RULE_BASED,
        version: "rules-v1",
        situationSummary: "Client has a family law matter ready for attorney review.",
        keyRisks: [],
        missingInformation: [],
        recommendedNextSteps: [],
        priorityLevel: UrgencyLevel.HIGH,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    expect(canSetReadyForAttorneyReview(completeInReviewCase)).toBe(true);
    expect(canSetReadyForAttorneyReview({ ...completeInReviewCase, status: CaseStatus.CLOSED })).toBe(false);
  });
});
