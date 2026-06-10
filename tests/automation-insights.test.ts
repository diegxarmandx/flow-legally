import { describe, expect, it } from "vitest";
import { buildAutomationQueue } from "@/lib/services/automation-insights";
import {
  ActivityType,
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

const today = new Date("2026-06-09T12:00:00.000Z");
const todayIso = "2026-06-09T09:00:00.000Z";
const oldIso = "2026-06-08T09:00:00.000Z";

function caseFixture(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    id: "case_test",
    firmId: "firm_test",
    clientId: "client_test",
    assignedUserId: null,
    caseNumber: "LF-TEST",
    caseType: CaseType.CONTRACT_REVIEW,
    description: "Client needs a vendor contract reviewed before signing.",
    status: CaseStatus.WAITING_ON_DOCUMENTS,
    urgencyLevel: UrgencyLevel.HIGH,
    paymentStatus: PaymentStatus.PENDING,
    intakeCompleted: true,
    priorityScore: 85,
    internalIntakeNotes: null,
    createdAt: oldIso,
    updatedAt: todayIso,
    client: {
      id: "client_test",
      firmId: "firm_test",
      name: "Jordan Rivera",
      email: "jordan@example.com",
      phone: "555-0100",
      createdAt: oldIso,
      updatedAt: todayIso
    },
    assignedUser: null,
    documentRequests: [
      {
        id: "doc_test",
        caseId: "case_test",
        title: "Contract draft",
        description: null,
        status: DocumentStatus.REQUESTED,
        dueDate: null,
        createdAt: oldIso,
        updatedAt: oldIso
      }
    ],
    followUpTasks: [
      {
        id: "task_doc",
        caseId: "case_test",
        title: "Request contract draft",
        type: FollowUpType.DOCUMENT_REMINDER,
        dueDate: todayIso,
        status: FollowUpStatus.OPEN,
        priority: UrgencyLevel.HIGH,
        createdAt: todayIso,
        updatedAt: todayIso
      },
      {
        id: "task_payment",
        caseId: "case_test",
        title: "Confirm payment",
        type: FollowUpType.PAYMENT,
        dueDate: todayIso,
        status: FollowUpStatus.OPEN,
        priority: UrgencyLevel.STANDARD,
        createdAt: todayIso,
        updatedAt: todayIso
      }
    ],
    summary: {
      id: "summary_test",
      caseId: "case_test",
      source: SummarySource.RULE_BASED,
      version: "rules-v1",
      situationSummary: "Contract review summary.",
      keyRisks: [],
      missingInformation: [],
      recommendedNextSteps: [],
      priorityLevel: UrgencyLevel.HIGH,
      createdAt: todayIso,
      updatedAt: todayIso
    },
    internalNotes: [],
    activityLogs: [
      {
        id: "log_doc_followup",
        caseId: "case_test",
        type: ActivityType.FOLLOW_UP_CREATED,
        message: "Automation generated follow-up: Request contract draft.",
        createdAt: todayIso
      },
      {
        id: "log_payment_followup",
        caseId: "case_test",
        type: ActivityType.FOLLOW_UP_CREATED,
        message: "Automation generated follow-up: Confirm payment.",
        createdAt: todayIso
      },
      {
        id: "log_summary",
        caseId: "case_test",
        type: ActivityType.SUMMARY_GENERATED,
        message: "Case summary generated for LF-TEST.",
        createdAt: todayIso
      }
    ],
    ...overrides
  };
}

describe("automation insights", () => {
  it("returns an empty queue when no automation signals exist", () => {
    const queue = buildAutomationQueue([], today);

    expect(queue.items).toEqual([]);
    expect(queue.totalActionCount).toBe(0);
  });

  it("builds queue items from document, payment, readiness, summary, and priority signals", () => {
    const readyCase = caseFixture({
      status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
      documentRequests: [],
      paymentStatus: PaymentStatus.PAID
    });
    readyCase.activityLogs.push(
      {
        id: "log_ready",
        caseId: "case_test",
        type: ActivityType.STATUS_CHANGED,
        message: "Automation marked case ready for attorney review after readiness checks passed.",
        createdAt: todayIso
      },
      {
        id: "log_priority",
        caseId: "case_test",
        type: ActivityType.STATUS_CHANGED,
        message: "Automation marked case high priority based on critical urgency.",
        createdAt: todayIso
      }
    );

    const queue = buildAutomationQueue([readyCase], today);

    expect(queue.items.map((item) => item.id)).toEqual([
      "document-reminders",
      "payment-follow-ups",
      "ready-for-review",
      "summaries-generated",
      "priority-triage"
    ]);
    expect(queue.totalActionCount).toBe(5);
  });

  it("counts only summaries generated on the requested day", () => {
    const queue = buildAutomationQueue(
      [
        caseFixture({
          activityLogs: [
            {
              id: "log_old_summary",
              caseId: "case_test",
              type: ActivityType.SUMMARY_GENERATED,
              message: "Case summary generated yesterday.",
              createdAt: oldIso
            }
          ]
        })
      ],
      today
    );

    expect(queue.items.some((item) => item.id === "summaries-generated")).toBe(false);
  });

  it("excludes closed cases from current automation queue counts", () => {
    const queue = buildAutomationQueue(
      [
        caseFixture({
          status: CaseStatus.CLOSED,
          urgencyLevel: UrgencyLevel.CRITICAL,
          priorityScore: 100
        })
      ],
      today
    );

    expect(queue.items).toEqual([]);
    expect(queue.totalActionCount).toBe(0);
  });
});
