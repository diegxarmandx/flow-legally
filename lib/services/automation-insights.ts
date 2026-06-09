import {
  ActivityType,
  FollowUpType,
  type AutomationQueueData,
  type AutomationQueueItem,
  type ActivityLog,
  type CaseRecord
} from "@/types/legalflow";
import { isActiveCase, isPaymentBlocking, missingDocuments } from "@/lib/utils/status";

const MINUTES_SAVED = {
  documentReminder: 5,
  paymentFollowUp: 7,
  readinessRouting: 8,
  summary: 5,
  priorityTriage: 4
} as const;

export function buildAutomationQueue(cases: CaseRecord[], today = new Date()): AutomationQueueData {
  const activeCases = cases.filter((caseRecord) => isActiveCase(caseRecord.status));
  const todayLogs = activeCases.flatMap((caseRecord) =>
    caseRecord.activityLogs.filter((log) => isSameUtcDay(log.createdAt, today))
  );
  const documentReminderCount = countTodayFollowUps(activeCases, todayLogs, FollowUpType.DOCUMENT_REMINDER);
  const paymentFollowUpCount = countTodayFollowUps(activeCases, todayLogs, FollowUpType.PAYMENT);
  const readyForReviewCount = todayLogs.filter(
    (log) =>
      log.type === ActivityType.STATUS_CHANGED &&
      log.message.toLowerCase().includes("ready for attorney review")
  ).length;
  const summaryCount = todayLogs.filter((log) => log.type === ActivityType.SUMMARY_GENERATED).length;
  const highPriorityCount = todayLogs.filter(
    (log) => log.type === ActivityType.STATUS_CHANGED && log.message.toLowerCase().includes("high priority")
  ).length;

  const detectedDocumentBlockers = activeCases.reduce(
    (total, caseRecord) => total + missingDocuments(caseRecord.documentRequests).length,
    0
  );
  const detectedPaymentBlockers = activeCases.filter((caseRecord) => isPaymentBlocking(caseRecord.paymentStatus)).length;

  const items = compactQueueItems([
    {
      id: "document-reminders",
      title: `${documentReminderCount} document reminder${documentReminderCount === 1 ? "" : "s"} generated`,
      description: `${detectedDocumentBlockers} missing or requested document${detectedDocumentBlockers === 1 ? "" : "s"} detected across active cases.`,
      count: documentReminderCount,
      category: "document",
      timestampLabel: "Generated from today's activity logs",
      minutesSaved: documentReminderCount * MINUTES_SAVED.documentReminder,
      status: "queued"
    },
    {
      id: "payment-follow-ups",
      title: `${paymentFollowUpCount} payment follow-up${paymentFollowUpCount === 1 ? "" : "s"} scheduled`,
      description: `${detectedPaymentBlockers} case${detectedPaymentBlockers === 1 ? "" : "s"} currently block attorney time because payment is not clear.`,
      count: paymentFollowUpCount,
      category: "payment",
      timestampLabel: "Scheduled from today's activity logs",
      minutesSaved: paymentFollowUpCount * MINUTES_SAVED.paymentFollowUp,
      status: "queued"
    },
    {
      id: "ready-for-review",
      title: `${readyForReviewCount} intake${readyForReviewCount === 1 ? "" : "s"} marked ready for attorney review`,
      description: "Readiness rules checked intake, documents, payment, summary, and follow-up ownership.",
      count: readyForReviewCount,
      category: "readiness",
      timestampLabel: "Updated today",
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
      timestampLabel: "Triaged today",
      minutesSaved: highPriorityCount * MINUTES_SAVED.priorityTriage,
      status: "completed"
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

function countTodayFollowUps(cases: CaseRecord[], todayLogs: ActivityLog[], type: FollowUpType) {
  return todayLogs.filter((log) => {
    if (log.type !== ActivityType.FOLLOW_UP_CREATED) return false;
    return cases.some((caseRecord) =>
      caseRecord.followUpTasks.some(
        (task) => task.type === type && log.caseId === task.caseId && log.message.includes(task.title)
      )
    );
  }).length;
}

function isSameUtcDay(value: string, date: Date) {
  const candidate = new Date(value);
  return (
    candidate.getUTCFullYear() === date.getUTCFullYear() &&
    candidate.getUTCMonth() === date.getUTCMonth() &&
    candidate.getUTCDate() === date.getUTCDate()
  );
}
