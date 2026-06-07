import { buildReviewReadiness, type ReviewReadiness } from "@/lib/services/review-readiness";
import { activeFollowUps, missingDocuments } from "@/lib/utils/status";
import type { ActivityLog, CaseRecord, DocumentRequest, FollowUpTask, InternalNote, Summary, User } from "@/types/legalflow";

export type ReviewPacket = {
  caseId: string;
  caseNumber: string;
  title: string;
  generatedAt: string;
  client: CaseRecord["client"];
  overview: {
    caseType: CaseRecord["caseType"];
    status: CaseRecord["status"];
    urgencyLevel: CaseRecord["urgencyLevel"];
    paymentStatus: CaseRecord["paymentStatus"];
    description: string;
    internalIntakeNotes?: string | null;
    assignedUserName?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  readiness: ReviewReadiness;
  missingDocuments: DocumentRequest[];
  documents: DocumentRequest[];
  openFollowUps: FollowUpTask[];
  followUps: FollowUpTask[];
  summary: Summary | null;
  notes: (InternalNote & { author?: User | null })[];
  activity: ActivityLog[];
};

export function buildReviewPacket(caseRecord: CaseRecord, generatedAt = new Date().toISOString()): ReviewPacket {
  return {
    caseId: caseRecord.id,
    caseNumber: caseRecord.caseNumber,
    title: `${caseRecord.caseNumber} attorney review packet`,
    generatedAt,
    client: caseRecord.client,
    overview: {
      caseType: caseRecord.caseType,
      status: caseRecord.status,
      urgencyLevel: caseRecord.urgencyLevel,
      paymentStatus: caseRecord.paymentStatus,
      description: caseRecord.description,
      internalIntakeNotes: caseRecord.internalIntakeNotes,
      assignedUserName: caseRecord.assignedUser?.name ?? null,
      createdAt: caseRecord.createdAt,
      updatedAt: caseRecord.updatedAt
    },
    readiness: buildReviewReadiness(caseRecord),
    missingDocuments: missingDocuments(caseRecord.documentRequests),
    documents: [...caseRecord.documentRequests],
    openFollowUps: activeFollowUps(caseRecord.followUpTasks),
    followUps: [...caseRecord.followUpTasks],
    summary: caseRecord.summary ?? null,
    notes: [...caseRecord.internalNotes],
    activity: [...caseRecord.activityLogs]
  };
}
