import { describe, expect, it } from "vitest";
import { buildAutomationTimeline } from "@/lib/services/automation-timeline";
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

const timestamp = "2026-06-09T12:00:00.000Z";

const baseCase: CaseRecord = {
  id: "case_timeline",
  firmId: "firm_test",
  clientId: "client_test",
  assignedUserId: null,
  caseNumber: "LF-TIMELINE",
  caseType: CaseType.FAMILY_LAW,
  description: "Client needs custody modification advice.",
  status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
  urgencyLevel: UrgencyLevel.CRITICAL,
  paymentStatus: PaymentStatus.PAID,
  intakeCompleted: true,
  priorityScore: 95,
  internalIntakeNotes: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  client: {
    id: "client_test",
    firmId: "firm_test",
    name: "Marcus King",
    email: "marcus@example.com",
    phone: "555-0100",
    createdAt: timestamp,
    updatedAt: timestamp
  },
  assignedUser: null,
  documentRequests: [
    {
      id: "doc_test",
      caseId: "case_timeline",
      title: "Court filing",
      description: null,
      status: DocumentStatus.RECEIVED,
      dueDate: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  followUpTasks: [
    {
      id: "task_doc",
      caseId: "case_timeline",
      title: "Request prior court filings",
      type: FollowUpType.DOCUMENT_REMINDER,
      dueDate: timestamp,
      status: FollowUpStatus.OPEN,
      priority: UrgencyLevel.CRITICAL,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "task_payment",
      caseId: "case_timeline",
      title: "Confirm retainer payment",
      type: FollowUpType.PAYMENT,
      dueDate: timestamp,
      status: FollowUpStatus.OPEN,
      priority: UrgencyLevel.HIGH,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  summary: {
    id: "summary_test",
    caseId: "case_timeline",
    source: SummarySource.RULE_BASED,
    version: "rules-v1",
    situationSummary: "Custody matter ready for attorney review.",
    keyRisks: [],
    missingInformation: [],
    recommendedNextSteps: [],
    priorityLevel: UrgencyLevel.CRITICAL,
    createdAt: timestamp,
    updatedAt: timestamp
  },
  internalNotes: [
    {
      id: "note_attorney",
      caseId: "case_timeline",
      authorId: "user_omar",
      body: "Potential urgent hearing issue. Review before standard queue.",
      createdAt: timestamp,
      updatedAt: timestamp,
      author: {
        id: "user_omar",
        firmId: "firm_test",
        name: "Omar Patel",
        email: "omar@example.com",
        role: "Managing Attorney",
        createdAt: timestamp,
        updatedAt: timestamp
      }
    }
  ],
  activityLogs: []
};

describe("automation timeline", () => {
  it("labels automation-generated summary and follow-up events", () => {
    const timeline = buildAutomationTimeline({
      ...baseCase,
      activityLogs: [
        {
          id: "log_summary",
          caseId: "case_timeline",
          type: ActivityType.SUMMARY_GENERATED,
          message: "Case summary generated for LF-TIMELINE.",
          createdAt: timestamp
        },
        {
          id: "log_followup",
          caseId: "case_timeline",
          type: ActivityType.FOLLOW_UP_CREATED,
          message: "Automation generated follow-up: Request prior court filings.",
          createdAt: timestamp
        }
      ]
    });

    expect(timeline[0]).toMatchObject({
      actor: "Automation",
      title: "AI generated intake summary"
    });
    expect(timeline[1]).toMatchObject({
      actor: "Automation",
      title: "Automation created document reminder"
    });
  });

  it("labels ready and high-priority status events as automation decisions", () => {
    const timeline = buildAutomationTimeline({
      ...baseCase,
      activityLogs: [
        {
          id: "log_ready",
          caseId: "case_timeline",
          type: ActivityType.STATUS_CHANGED,
          message: "Automation marked case ready for attorney review after readiness checks passed.",
          createdAt: timestamp
        },
        {
          id: "log_priority",
          caseId: "case_timeline",
          type: ActivityType.STATUS_CHANGED,
          message: "Automation marked case high priority based on critical urgency.",
          createdAt: timestamp
        }
      ]
    });

    expect(timeline.map((entry) => entry.title)).toEqual([
      "Automation marked case ready for attorney review",
      "Automation marked case high priority"
    ]);
  });

  it("labels generic status changes as system recalculations", () => {
    const timeline = buildAutomationTimeline({
      ...baseCase,
      activityLogs: [
        {
          id: "log_status",
          caseId: "case_timeline",
          type: ActivityType.STATUS_CHANGED,
          message: "Case status changed to Payment Pending.",
          createdAt: timestamp
        }
      ]
    });

    expect(timeline[0]).toMatchObject({
      actor: "System",
      tone: "system",
      title: "System recalculated case status"
    });
  });

  it("labels attorney notes separately from automation events", () => {
    const timeline = buildAutomationTimeline({
      ...baseCase,
      activityLogs: [
        {
          id: "log_note",
          caseId: "case_timeline",
          type: ActivityType.NOTE_ADDED,
          message: "Internal note added: Potential urgent hearing issue. Review before standard queue.",
          createdAt: timestamp
        }
      ]
    });

    expect(timeline[0]).toMatchObject({
      actor: "Attorney",
      tone: "attorney",
      title: "Attorney added internal note"
    });
  });
});
