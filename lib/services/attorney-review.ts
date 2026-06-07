import { buildReviewReadiness } from "@/lib/services/review-readiness";
import { CaseStatus, FollowUpStatus, FollowUpType, type CaseRecord } from "@/types/legalflow";

export type AttorneyReviewStartResult =
  | {
      allowed: true;
      nextStatus: typeof CaseStatus.IN_REVIEW;
      completedFollowUpTaskIds: string[];
    }
  | {
      allowed: false;
      reason: string;
      blockers: string[];
    };

export function buildAttorneyReviewStart(caseRecord: CaseRecord): AttorneyReviewStartResult {
  const readiness = buildReviewReadiness(caseRecord);

  if (caseRecord.status !== CaseStatus.READY_FOR_ATTORNEY_REVIEW) {
    return {
      allowed: false,
      reason: "Only cases marked ready for attorney review can enter review.",
      blockers: readiness.blockers
    };
  }

  if (!readiness.readyForReview) {
    return {
      allowed: false,
      reason: readiness.nextAction,
      blockers: readiness.blockers
    };
  }

  return {
    allowed: true,
    nextStatus: CaseStatus.IN_REVIEW,
    completedFollowUpTaskIds: caseRecord.followUpTasks
      .filter((task) => task.status === FollowUpStatus.OPEN && task.type === FollowUpType.ATTORNEY_REVIEW)
      .map((task) => task.id)
  };
}
