import {
  FollowUpStatus,
  FollowUpType,
  UrgencyLevel,
  type AutomationTaskDraft,
  type FollowUpAutomationInput
} from "@/types/legalflow";
import { isPaymentBlocking, missingDocuments } from "@/lib/utils/status";

function dueIn(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function hasActiveTask(input: FollowUpAutomationInput, type: FollowUpType) {
  return input.existingTasks.some(
    (task) => task.type === type && task.status === FollowUpStatus.OPEN
  );
}

export function findResolvedFollowUps(input: FollowUpAutomationInput) {
  const missing = missingDocuments(input.documentRequests);
  const resolvedTypes = new Set<FollowUpType>();

  if (input.caseRecord.intakeCompleted) {
    resolvedTypes.add(FollowUpType.QUESTIONNAIRE);
  }

  if (missing.length === 0) {
    resolvedTypes.add(FollowUpType.DOCUMENT_REMINDER);
  }

  if (!isPaymentBlocking(input.caseRecord.paymentStatus)) {
    resolvedTypes.add(FollowUpType.PAYMENT);
  }

  return input.existingTasks.filter(
    (task) => task.status === FollowUpStatus.OPEN && resolvedTypes.has(task.type)
  );
}

export function generateFollowUpTasks(input: FollowUpAutomationInput): AutomationTaskDraft[] {
  const drafts: AutomationTaskDraft[] = [];
  const missing = missingDocuments(input.documentRequests);
  const highPriority =
    input.caseRecord.urgencyLevel === UrgencyLevel.HIGH ||
    input.caseRecord.urgencyLevel === UrgencyLevel.CRITICAL;

  if (!input.caseRecord.intakeCompleted && !hasActiveTask(input, FollowUpType.QUESTIONNAIRE)) {
    drafts.push({
      title: "Send intake questionnaire completion reminder",
      type: FollowUpType.QUESTIONNAIRE,
      dueDate: dueIn(1),
      priority: highPriority ? input.caseRecord.urgencyLevel : UrgencyLevel.STANDARD
    });
  }

  if (missing.length > 0 && !hasActiveTask(input, FollowUpType.DOCUMENT_REMINDER)) {
    drafts.push({
      title: `Request ${missing.length} missing document${missing.length === 1 ? "" : "s"}`,
      type: FollowUpType.DOCUMENT_REMINDER,
      dueDate: dueIn(highPriority ? 1 : 3),
      priority: highPriority ? input.caseRecord.urgencyLevel : UrgencyLevel.STANDARD
    });
  }

  if (isPaymentBlocking(input.caseRecord.paymentStatus) && !hasActiveTask(input, FollowUpType.PAYMENT)) {
    drafts.push({
      title: "Follow up on pending payment",
      type: FollowUpType.PAYMENT,
      dueDate: dueIn(2),
      priority: input.caseRecord.urgencyLevel === UrgencyLevel.CRITICAL ? UrgencyLevel.HIGH : UrgencyLevel.STANDARD
    });
  }

  if (highPriority && !hasActiveTask(input, FollowUpType.ATTORNEY_REVIEW)) {
    drafts.push({
      title: "Flag high-urgency case for attorney triage",
      type: FollowUpType.ATTORNEY_REVIEW,
      dueDate: dueIn(1),
      priority: input.caseRecord.urgencyLevel
    });
  }

  return drafts;
}
