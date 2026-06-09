import {
  ActivityType,
  CaseStatus,
  FollowUpType,
  UrgencyLevel,
  type AutomationQueueData,
  type AutomationQueueItem,
  type CaseRecord
} from "@/types/legalflow";
import { activeFollowUps, isPaymentBlocking, missingDocuments } from "@/lib/utils/status";

const MINUTES_SAVED = {
  documentReminder: 5,
  paymentFollowUp: 7,
  readinessRouting: 8,
  summary: 5,
  priorityTriage: 4
} as const;

export function buildAutomationQueue(cases: CaseRecord[], today = new Date()): AutomationQueueData {
  const openTasks = cases.flatMap((caseRecord) => activeFollowUps(caseRecord.followUpTasks));
  const documentReminderCount = openTasks.filter((task) => task.type === FollowUpType.DOCUMENT_REMINDER).length;
  const paymentFollowUpCount = openTasks.filter((task) => task.type === FollowUpType.PAYMENT).length;
  const readyForReviewCount = cases.filter(
    (caseRecord) => caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW
  ).length;
  const summaryCount = countTodayAutomationEvents(cases, ActivityType.SUMMARY_GENERATED, today);
  const highPriorityCount = cases.filter(
    (caseRecord) =>
      caseRecord.urgencyLevel === UrgencyLevel.HIGH ||
      caseRecord.urgencyLevel === UrgencyLevel.CRITICAL ||
      caseRecord.priorityScore >= 75
  ).length;

  const detectedDocumentBlockers = cases.reduce(
    (total, caseRecord) => total + missingDocuments(caseRecord.documentRequests).length,
    0
  );
  const detectedPaymentBlockers = cases.filter((caseRecord) => isPaymentBlocking(caseRecord.paymentStatus)).length;

  const items = compactQueueItems([
    {
      id: "document-reminders",
      title: `${documentReminderCount} document reminder${documentReminderCount === 1 ? "" : "s"} generated`,
      description: `${detectedDocumentBlockers} missing or requested document${detectedDocumentBlockers === 1 ? "" : "s"} detected across active cases.`,
      count: documentReminderCount,
      category: "document",
      timestampLabel: "Queued from open follow-ups",
      minutesSaved: documentReminderCount * MINUTES_SAVED.documentReminder,
      status: "queued"
    },
    {
      id: "payment-follow-ups",
      title: `${paymentFollowUpCount} payment follow-up${paymentFollowUpCount === 1 ? "" : "s"} scheduled`,
      description: `${detectedPaymentBlockers} case${detectedPaymentBlockers === 1 ? "" : "s"} currently block attorney time because payment is not clear.`,
      count: paymentFollowUpCount,
      category: "payment",
      timestampLabel: "Scheduled by payment rules",
      minutesSaved: paymentFollowUpCount * MINUTES_SAVED.paymentFollowUp,
      status: "queued"
    },
    {
      id: "ready-for-review",
      title: `${readyForReviewCount} intake${readyForReviewCount === 1 ? "" : "s"} marked ready for attorney review`,
      description: "Readiness rules checked intake, documents, payment, summary, and follow-up ownership.",
      count: readyForReviewCount,
      category: "readiness",
      timestampLabel: "Ready queue updated",
      minutesSaved: readyForReviewCount * MINUTES_SAVED.readinessRouting,
      status: "completed"
    },
    {
      id: "summaries-generated",
      title: `${summaryCount} AI summar${summaryCount === 1 ? "y" : "ies"} generated today`,
      description: "Structured handoff summaries reduce attorney review prep time without adding a chatbot workflow.",
      count: summaryCount,
      category: "summary",
      timestampLabel: "Generated today",
      minutesSaved: summaryCount * MINUTES_SAVED.summary,
      status: "completed"
    },
    {
      id: "priority-triage",
      title: `${highPriorityCount} high-priority matter${highPriorityCount === 1 ? "" : "s"} triaged`,
      description: "Urgency and priority scoring keep critical cases from getting buried in routine intake work.",
      count: highPriorityCount,
      category: "priority",
      timestampLabel: "Monitored continuously",
      minutesSaved: highPriorityCount * MINUTES_SAVED.priorityTriage,
      status: "monitoring"
    }
  ]);

  return {
    items,
    totalEstimatedMinutesSaved: items.reduce((total, item) => total + item.minutesSaved, 0),
    sourceDescription:
      "Generated from case readiness, missing documents, payment status, summaries, and follow-up rules."
  };
}

function compactQueueItems(items: AutomationQueueItem[]) {
  return items.filter((item) => item.count > 0);
}

function countTodayAutomationEvents(cases: CaseRecord[], type: ActivityType, today: Date) {
  return cases.reduce(
    (total, caseRecord) =>
      total +
      caseRecord.activityLogs.filter((log) => log.type === type && isSameUtcDay(log.createdAt, today)).length,
    0
  );
}

function isSameUtcDay(value: string, date: Date) {
  const candidate = new Date(value);
  return (
    candidate.getUTCFullYear() === date.getUTCFullYear() &&
    candidate.getUTCMonth() === date.getUTCMonth() &&
    candidate.getUTCDate() === date.getUTCDate()
  );
}
