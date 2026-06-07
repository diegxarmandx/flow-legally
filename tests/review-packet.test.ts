import { describe, expect, it } from "vitest";
import { buildReviewPacket } from "@/lib/services/review-packet";
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

const timestamp = new Date("2026-01-01T12:00:00.000Z").toISOString();

const caseRecord: CaseRecord = {
  id: "case_packet",
  firmId: "firm_test",
  clientId: "client_test",
  assignedUserId: "user_test",
  caseNumber: "LF-PACKET",
  caseType: CaseType.FAMILY_LAW,
  description: "Client needs custody modification review with completed intake context.",
  status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
  urgencyLevel: UrgencyLevel.CRITICAL,
  paymentStatus: PaymentStatus.PAID,
  intakeCompleted: true,
  priorityScore: 95,
  internalIntakeNotes: "Hearing may be scheduled soon.",
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
  assignedUser: {
    id: "user_test",
    firmId: "firm_test",
    name: "Maya Chen",
    email: "maya@example.com",
    role: "Intake Lead",
    createdAt: timestamp,
    updatedAt: timestamp
  },
  documentRequests: [
    {
      id: "doc_received",
      caseId: "case_packet",
      title: "Prior order",
      description: "Client-facing request for prior order.",
      status: DocumentStatus.RECEIVED,
      dueDate: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  followUpTasks: [
    {
      id: "task_done",
      caseId: "case_packet",
      title: "Attorney review prep",
      type: FollowUpType.ATTORNEY_REVIEW,
      dueDate: timestamp,
      status: FollowUpStatus.COMPLETED,
      priority: UrgencyLevel.CRITICAL,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  summary: {
    id: "summary_packet",
    caseId: "case_packet",
    source: SummarySource.RULE_BASED,
    version: "rules-v1",
    situationSummary: "Client has a custody matter ready for attorney review.",
    keyRisks: ["Tight hearing timeline"],
    missingInformation: [],
    recommendedNextSteps: ["Attorney reviews packet"],
    priorityLevel: UrgencyLevel.CRITICAL,
    createdAt: timestamp,
    updatedAt: timestamp
  },
  internalNotes: [
    {
      id: "note_packet",
      caseId: "case_packet",
      authorId: "user_test",
      body: "Prioritize before standard queue.",
      createdAt: timestamp,
      updatedAt: timestamp,
      author: {
        id: "user_test",
        firmId: "firm_test",
        name: "Maya Chen",
        email: "maya@example.com",
        role: "Intake Lead",
        createdAt: timestamp,
        updatedAt: timestamp
      }
    }
  ],
  activityLogs: [
    {
      id: "log_packet",
      caseId: "case_packet",
      type: ActivityType.SUMMARY_GENERATED,
      message: "Case summary generated for LF-PACKET.",
      createdAt: timestamp
    }
  ]
};

describe("review packet", () => {
  it("builds a complete attorney handoff packet from case state", () => {
    const packet = buildReviewPacket(caseRecord, timestamp);

    expect(packet.title).toBe("LF-PACKET attorney review packet");
    expect(packet.client.name).toBe("Jordan Rivera");
    expect(packet.overview.assignedUserName).toBe("Maya Chen");
    expect(packet.readiness.readinessPercent).toBe(100);
    expect(packet.summary?.situationSummary).toContain("custody matter");
    expect(packet.documents).toHaveLength(1);
    expect(packet.followUps).toHaveLength(1);
    expect(packet.notes).toHaveLength(1);
    expect(packet.activity).toHaveLength(1);
  });

  it("includes missing summary fallback data instead of failing", () => {
    const packet = buildReviewPacket({ ...caseRecord, summary: null }, timestamp);

    expect(packet.summary).toBeNull();
    expect(packet.readiness.blockers).toContain("Generate the case summary before review.");
  });
});
