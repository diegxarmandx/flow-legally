import { describe, expect, it } from "vitest";
import { findResolvedFollowUps, generateFollowUpTasks } from "@/lib/services/follow-up-automation";
import {
  CaseStatus,
  CaseType,
  DocumentStatus,
  FollowUpStatus,
  FollowUpType,
  PaymentStatus,
  UrgencyLevel,
  type DocumentRequest,
  type FollowUpTask,
  type LegalCase
} from "@/types/legalflow";

const caseRecord: LegalCase = {
  id: "case_test",
  firmId: "firm_test",
  clientId: "client_test",
  assignedUserId: null,
  caseNumber: "LF-TEST",
  caseType: CaseType.FAMILY_LAW,
  description: "Client needs urgent custody review.",
  status: CaseStatus.WAITING_ON_DOCUMENTS,
  urgencyLevel: UrgencyLevel.HIGH,
  paymentStatus: PaymentStatus.PENDING,
  intakeCompleted: false,
  priorityScore: 80,
  internalIntakeNotes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const missingDocument: DocumentRequest = {
  id: "doc_test",
  caseId: caseRecord.id,
  title: "Prior court filings",
  description: null,
  status: DocumentStatus.MISSING,
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function activeTask(type: FollowUpType): FollowUpTask {
  return {
    id: `task_${type}`,
    caseId: caseRecord.id,
    title: "Existing active task",
    type,
    dueDate: new Date().toISOString(),
    status: FollowUpStatus.OPEN,
    priority: UrgencyLevel.STANDARD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe("follow-up automation", () => {
  it("creates practical follow-ups for intake, documents, payment, and high urgency", () => {
    const tasks = generateFollowUpTasks({
      caseRecord,
      documentRequests: [missingDocument],
      existingTasks: []
    });

    expect(tasks.map((task) => task.type)).toEqual([
      FollowUpType.QUESTIONNAIRE,
      FollowUpType.DOCUMENT_REMINDER,
      FollowUpType.PAYMENT,
      FollowUpType.ATTORNEY_REVIEW
    ]);
  });

  it("does not create duplicate active follow-ups for the same issue", () => {
    const tasks = generateFollowUpTasks({
      caseRecord,
      documentRequests: [missingDocument],
      existingTasks: [activeTask(FollowUpType.DOCUMENT_REMINDER), activeTask(FollowUpType.PAYMENT)]
    });

    expect(tasks.map((task) => task.type)).not.toContain(FollowUpType.DOCUMENT_REMINDER);
    expect(tasks.map((task) => task.type)).not.toContain(FollowUpType.PAYMENT);
  });

  it("identifies active blocker follow-ups that should close after the issue resolves", () => {
    const resolved = findResolvedFollowUps({
      caseRecord: {
        ...caseRecord,
        intakeCompleted: true,
        paymentStatus: PaymentStatus.PAID
      },
      documentRequests: [{ ...missingDocument, status: DocumentStatus.RECEIVED }],
      existingTasks: [
        activeTask(FollowUpType.QUESTIONNAIRE),
        activeTask(FollowUpType.DOCUMENT_REMINDER),
        activeTask(FollowUpType.PAYMENT),
        activeTask(FollowUpType.ATTORNEY_REVIEW)
      ]
    });

    expect(resolved.map((task) => task.type)).toEqual([
      FollowUpType.QUESTIONNAIRE,
      FollowUpType.DOCUMENT_REMINDER,
      FollowUpType.PAYMENT
    ]);
  });
});
