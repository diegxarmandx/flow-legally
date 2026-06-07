import {
  CaseStatus,
  CaseType,
  DocumentStatus,
  FollowUpStatus,
  FollowUpType,
  PaymentStatus,
  UrgencyLevel,
  type ISODate
} from "@/types/legalflow";

const labels: Record<string, string> = {
  [CaseStatus.NEW_INTAKE]: "New Intake",
  [CaseStatus.INTAKE_INCOMPLETE]: "Intake Incomplete",
  [CaseStatus.WAITING_ON_DOCUMENTS]: "Waiting on Documents",
  [CaseStatus.PAYMENT_PENDING]: "Payment Pending",
  [CaseStatus.READY_FOR_ATTORNEY_REVIEW]: "Ready for Attorney Review",
  [CaseStatus.IN_REVIEW]: "In Review",
  [CaseStatus.CLOSED]: "Closed",
  [CaseType.IMMIGRATION]: "Immigration",
  [CaseType.BANKRUPTCY]: "Bankruptcy",
  [CaseType.PERSONAL_INJURY]: "Personal Injury",
  [CaseType.FAMILY_LAW]: "Family Law",
  [CaseType.ESTATE_PLANNING]: "Estate Planning",
  [CaseType.CONTRACT_REVIEW]: "Contract Review",
  [DocumentStatus.REQUESTED]: "Requested",
  [DocumentStatus.RECEIVED]: "Received",
  [DocumentStatus.MISSING]: "Missing",
  [DocumentStatus.WAIVED]: "Waived",
  [FollowUpStatus.OPEN]: "Open",
  [FollowUpStatus.COMPLETED]: "Completed",
  [FollowUpStatus.CANCELED]: "Canceled",
  [FollowUpType.QUESTIONNAIRE]: "Questionnaire",
  [FollowUpType.DOCUMENT_REMINDER]: "Document Reminder",
  [FollowUpType.PAYMENT]: "Payment Follow-Up",
  [FollowUpType.ATTORNEY_REVIEW]: "Attorney Review",
  [FollowUpType.GENERAL]: "General",
  [PaymentStatus.NOT_REQUIRED]: "Not Required",
  [PaymentStatus.PENDING]: "Pending",
  [PaymentStatus.PARTIAL]: "Partial",
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.OVERDUE]: "Overdue",
  [UrgencyLevel.LOW]: "Low",
  [UrgencyLevel.STANDARD]: "Standard",
  [UrgencyLevel.HIGH]: "High",
  [UrgencyLevel.CRITICAL]: "Critical"
};

export function labelFor(value: string) {
  return labels[value] ?? value;
}

export function formatDate(value?: ISODate | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatRelativeDate(value?: ISODate | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(value);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function compactPhone(phone: string) {
  return phone.replace(/\D/g, "");
}
