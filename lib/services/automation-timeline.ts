import {
  ActivityType,
  CaseStatus,
  FollowUpType,
  type ActivityLog,
  type CaseRecord,
  type FollowUpTask,
  type InternalNote,
  type User
} from "@/types/legalflow";
import { labelFor } from "@/lib/utils/format";

export type TimelineActor = "Automation" | "Team" | "Attorney";
export type TimelineTone = "automation" | "human" | "attorney";
export type TimelineIconName =
  | "workflow"
  | "scroll"
  | "file"
  | "credit-card"
  | "check"
  | "note"
  | "scale"
  | "flag";

export type AutomationTimelineEntry = {
  id: string;
  actor: TimelineActor;
  tone: TimelineTone;
  icon: TimelineIconName;
  title: string;
  description: string;
  createdAt: string;
};

export function buildAutomationTimeline(caseRecord: CaseRecord): AutomationTimelineEntry[] {
  return caseRecord.activityLogs.map((log) => mapActivityLog(caseRecord, log));
}

function mapActivityLog(caseRecord: CaseRecord, log: ActivityLog): AutomationTimelineEntry {
  if (log.type === ActivityType.SUMMARY_GENERATED) {
    return automationEntry(log, {
      icon: "scroll",
      title: "AI generated intake summary",
      description:
        "The summary service structured the case facts, risks, missing information, and recommended next steps for attorney review."
    });
  }

  if (log.type === ActivityType.FOLLOW_UP_CREATED) {
    const task = findFollowUpForLog(caseRecord.followUpTasks, log.message);
    return automationEntry(log, followUpCopy(task));
  }

  if (log.type === ActivityType.DOCUMENT_REQUESTED) {
    return automationEntry(log, {
      icon: "file",
      title: "Automation requested client document",
      description: log.message
    });
  }

  if (log.type === ActivityType.STATUS_CHANGED) {
    const readyLabel = labelFor(CaseStatus.READY_FOR_ATTORNEY_REVIEW).toLowerCase();
    const isReadyStatus = log.message.toLowerCase().includes(readyLabel);
    const isHighPriority = log.message.toLowerCase().includes("high priority");
    return automationEntry(log, {
      icon: isReadyStatus ? "check" : isHighPriority ? "flag" : "workflow",
      title: isReadyStatus
        ? "Automation marked case ready for attorney review"
        : isHighPriority
          ? "Automation marked case high priority"
          : "Automation updated case status",
      description: isReadyStatus
        ? "Readiness rules found no blocking intake, document, payment, summary, or follow-up issues."
        : isHighPriority
          ? log.message
          : log.message
    });
  }

  if (log.type === ActivityType.PAYMENT_UPDATED) {
    return humanEntry(log, {
      icon: "credit-card",
      title: "Team updated payment status",
      description: log.message
    });
  }

  if (log.type === ActivityType.DOCUMENT_RECEIVED) {
    return humanEntry(log, {
      icon: "file",
      title: "Team marked document received",
      description: log.message
    });
  }

  if (log.type === ActivityType.FOLLOW_UP_COMPLETED) {
    return humanEntry(log, {
      icon: "check",
      title: "Team completed follow-up",
      description: log.message
    });
  }

  if (log.type === ActivityType.NOTE_ADDED) {
    const note = findNoteForLog(caseRecord.internalNotes, log.message);
    const author = note?.author ?? null;
    const isAttorney = author?.role.toLowerCase().includes("attorney") ?? false;
    return {
      id: log.id,
      actor: isAttorney ? "Attorney" : "Team",
      tone: isAttorney ? "attorney" : "human",
      icon: "note",
      title: isAttorney ? "Attorney added internal note" : "Team added internal note",
      description: log.message,
      createdAt: log.createdAt
    };
  }

  if (log.type === ActivityType.ATTORNEY_REVIEW_STARTED) {
    return {
      id: log.id,
      actor: "Attorney",
      tone: "attorney",
      icon: "scale",
      title: "Attorney review started",
      description: log.message,
      createdAt: log.createdAt
    };
  }

  return humanEntry(log, {
    icon: "workflow",
    title: "Activity recorded",
    description: log.message
  });
}

function automationEntry(
  log: ActivityLog,
  copy: Pick<AutomationTimelineEntry, "icon" | "title" | "description">
): AutomationTimelineEntry {
  return {
    id: log.id,
    actor: "Automation",
    tone: "automation",
    ...copy,
    createdAt: log.createdAt
  };
}

function humanEntry(
  log: ActivityLog,
  copy: Pick<AutomationTimelineEntry, "icon" | "title" | "description">
): AutomationTimelineEntry {
  return {
    id: log.id,
    actor: "Team",
    tone: "human",
    ...copy,
    createdAt: log.createdAt
  };
}

function followUpCopy(task: FollowUpTask | null): Pick<AutomationTimelineEntry, "icon" | "title" | "description"> {
  if (task?.type === FollowUpType.DOCUMENT_REMINDER) {
    return {
      icon: "file",
      title: "Automation created document reminder",
      description: `A document reminder was created so staff can collect missing evidence before attorney review. ${task.title}`
    };
  }

  if (task?.type === FollowUpType.PAYMENT) {
    return {
      icon: "credit-card",
      title: "Automation created payment follow-up",
      description: `A payment follow-up was created because payment status can block attorney time. ${task.title}`
    };
  }

  if (task?.type === FollowUpType.QUESTIONNAIRE) {
    return {
      icon: "workflow",
      title: "Automation created intake follow-up",
      description: `A questionnaire follow-up was created to complete the intake record. ${task.title}`
    };
  }

  if (task?.type === FollowUpType.ATTORNEY_REVIEW) {
    return {
      icon: "flag",
      title: "Automation routed case for attorney review",
      description: `A review-prep task was created from urgency and readiness signals. ${task.title}`
    };
  }

  return {
    icon: "workflow",
    title: "Automation created follow-up",
    description: "A follow-up task was generated from the case automation rules."
  };
}

function findFollowUpForLog(tasks: FollowUpTask[], message: string) {
  return tasks.find((task) => message.includes(task.title)) ?? null;
}

function findNoteForLog(notes: (InternalNote & { author?: User | null })[], message: string) {
  const subject = message.replace(/^Internal note added:\s*/, "").replace(/\.$/, "");
  return notes.find((note) => note.body.startsWith(subject)) ?? null;
}
