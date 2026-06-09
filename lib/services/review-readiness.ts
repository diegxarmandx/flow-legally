import {
  CaseStatus,
  FollowUpStatus,
  type CaseRecord
} from "@/types/legalflow";
import { labelFor } from "@/lib/utils/format";
import { isPaymentBlocking, missingDocuments } from "@/lib/utils/status";

export type ReviewReadinessItem = {
  label: string;
  complete: boolean;
  detail: string;
};

export type ReviewReadiness = {
  readyForReview: boolean;
  readinessPercent: number;
  blockers: string[];
  checklist: ReviewReadinessItem[];
  nextAction: string;
  handoffSummary: string;
};

const reviewableStatuses = new Set<string>([
  CaseStatus.READY_FOR_ATTORNEY_REVIEW,
  CaseStatus.IN_REVIEW,
  CaseStatus.CLOSED
]);

export function buildReviewReadiness(caseRecord: CaseRecord): ReviewReadiness {
  const missing = missingDocuments(caseRecord.documentRequests);
  const openFollowUps = caseRecord.followUpTasks.filter((task) => task.status === FollowUpStatus.OPEN);
  const paymentClear = !isPaymentBlocking(caseRecord.paymentStatus);
  const summaryReady = Boolean(caseRecord.summary);

  const checklist: ReviewReadinessItem[] = [
    {
      label: "Intake complete",
      complete: caseRecord.intakeCompleted,
      detail: caseRecord.intakeCompleted ? "Client intake has enough core facts." : "Client intake still needs completion."
    },
    {
      label: "Documents complete",
      complete: missing.length === 0,
      detail:
        missing.length === 0
          ? "No blocking document requests remain."
          : `${missing.length} document request${missing.length === 1 ? " still blocks" : "s still block"} review.`
    },
    {
      label: "Payment clear",
      complete: paymentClear,
      detail: paymentClear
        ? "Payment is not blocking attorney time."
        : `${labelFor(caseRecord.paymentStatus)} payment status needs follow-up.`
    },
    {
      label: "Case summary ready",
      complete: summaryReady,
      detail: summaryReady ? "Attorney handoff summary is available." : "Generate the case summary before review."
    },
    {
      label: "Follow-ups controlled",
      complete: openFollowUps.length === 0 || reviewableStatuses.has(caseRecord.status),
      detail:
        openFollowUps.length === 0
          ? "No open follow-ups remain."
          : reviewableStatuses.has(caseRecord.status)
            ? `${openFollowUps.length} open follow-up${openFollowUps.length === 1 ? " is" : "s are"} owned inside the attorney review workflow.`
          : `${openFollowUps.length} open follow-up${openFollowUps.length === 1 ? "" : "s"} need ownership.`
    }
  ];

  const completedCount = checklist.filter((item) => item.complete).length;
  const blockers = checklist.filter((item) => !item.complete).map((item) => item.detail);

  return {
    readyForReview: reviewableStatuses.has(caseRecord.status) && blockers.length === 0,
    readinessPercent: Math.round((completedCount / checklist.length) * 100),
    blockers,
    checklist,
    nextAction: nextBestAction(caseRecord, missing.length, paymentClear, summaryReady),
    handoffSummary: `${caseRecord.client.name} has a ${labelFor(caseRecord.caseType).toLowerCase()} matter at ${labelFor(caseRecord.status).toLowerCase()} status with ${missing.length} blocking document request${missing.length === 1 ? "" : "s"}.`
  };
}

export function canSetReadyForAttorneyReview(caseRecord: CaseRecord, readiness = buildReviewReadiness(caseRecord)) {
  return (
    caseRecord.status !== CaseStatus.READY_FOR_ATTORNEY_REVIEW &&
    caseRecord.status !== CaseStatus.CLOSED &&
    readiness.blockers.length === 0
  );
}

function nextBestAction(
  caseRecord: CaseRecord,
  missingDocumentCount: number,
  paymentClear: boolean,
  summaryReady: boolean
) {
  if (!caseRecord.intakeCompleted) return "Complete the intake questionnaire before attorney review.";
  if (missingDocumentCount > 0) return "Collect or waive the remaining document requests.";
  if (!paymentClear) return "Resolve payment status before scheduling attorney time.";
  if (!summaryReady) return "Generate the case summary for attorney handoff.";
  if (caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW) return "Assign the case for attorney review.";
  return "Keep the case moving through the active attorney workflow.";
}
