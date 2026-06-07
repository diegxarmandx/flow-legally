export const CaseStatus = {
  NEW_INTAKE: "NEW_INTAKE",
  INTAKE_INCOMPLETE: "INTAKE_INCOMPLETE",
  WAITING_ON_DOCUMENTS: "WAITING_ON_DOCUMENTS",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  READY_FOR_ATTORNEY_REVIEW: "READY_FOR_ATTORNEY_REVIEW",
  IN_REVIEW: "IN_REVIEW",
  CLOSED: "CLOSED"
} as const;
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export const CaseType = {
  IMMIGRATION: "IMMIGRATION",
  BANKRUPTCY: "BANKRUPTCY",
  PERSONAL_INJURY: "PERSONAL_INJURY",
  FAMILY_LAW: "FAMILY_LAW",
  ESTATE_PLANNING: "ESTATE_PLANNING",
  CONTRACT_REVIEW: "CONTRACT_REVIEW"
} as const;
export type CaseType = (typeof CaseType)[keyof typeof CaseType];

export const DocumentStatus = {
  REQUESTED: "REQUESTED",
  RECEIVED: "RECEIVED",
  MISSING: "MISSING",
  WAIVED: "WAIVED"
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const FollowUpStatus = {
  OPEN: "OPEN",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED"
} as const;
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus];

export const FollowUpType = {
  QUESTIONNAIRE: "QUESTIONNAIRE",
  DOCUMENT_REMINDER: "DOCUMENT_REMINDER",
  PAYMENT: "PAYMENT",
  ATTORNEY_REVIEW: "ATTORNEY_REVIEW",
  GENERAL: "GENERAL"
} as const;
export type FollowUpType = (typeof FollowUpType)[keyof typeof FollowUpType];

export const PaymentStatus = {
  NOT_REQUIRED: "NOT_REQUIRED",
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  OVERDUE: "OVERDUE"
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const UrgencyLevel = {
  LOW: "LOW",
  STANDARD: "STANDARD",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;
export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const ActivityType = {
  INTAKE_CREATED: "INTAKE_CREATED",
  DOCUMENT_REQUESTED: "DOCUMENT_REQUESTED",
  DOCUMENT_RECEIVED: "DOCUMENT_RECEIVED",
  FOLLOW_UP_CREATED: "FOLLOW_UP_CREATED",
  FOLLOW_UP_COMPLETED: "FOLLOW_UP_COMPLETED",
  SUMMARY_GENERATED: "SUMMARY_GENERATED",
  NOTE_ADDED: "NOTE_ADDED",
  PAYMENT_UPDATED: "PAYMENT_UPDATED",
  STATUS_CHANGED: "STATUS_CHANGED"
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export type ISODate = string;

export type Firm = {
  id: string;
  name: string;
  practiceFocus: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type User = {
  id: string;
  firmId: string;
  name: string;
  email: string;
  role: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type Client = {
  id: string;
  firmId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type LegalCase = {
  id: string;
  firmId: string;
  clientId: string;
  assignedUserId?: string | null;
  caseNumber: string;
  caseType: CaseType;
  description: string;
  status: CaseStatus;
  urgencyLevel: UrgencyLevel;
  paymentStatus: PaymentStatus;
  intakeCompleted: boolean;
  priorityScore: number;
  internalIntakeNotes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type DocumentRequest = {
  id: string;
  caseId: string;
  title: string;
  description?: string | null;
  status: DocumentStatus;
  dueDate?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type FollowUpTask = {
  id: string;
  caseId: string;
  title: string;
  type: FollowUpType;
  dueDate: ISODate;
  status: FollowUpStatus;
  priority: UrgencyLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type AISummary = {
  id: string;
  caseId: string;
  situationSummary: string;
  keyRisks: string[];
  missingInformation: string[];
  recommendedNextSteps: string[];
  priorityLevel: UrgencyLevel;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type InternalNote = {
  id: string;
  caseId: string;
  authorId: string;
  body: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ActivityLog = {
  id: string;
  caseId: string;
  type: ActivityType;
  message: string;
  createdAt: ISODate;
};

export type CaseRecord = LegalCase & {
  client: Client;
  assignedUser?: User | null;
  documentRequests: DocumentRequest[];
  followUpTasks: FollowUpTask[];
  aiSummary?: AISummary | null;
  internalNotes: (InternalNote & { author?: User | null })[];
  activityLogs: ActivityLog[];
};

export type ClientRecord = Client & {
  cases: CaseRecord[];
  caseCount: number;
  lastActivityAt?: ISODate | null;
  latestCaseStatus?: CaseStatus | null;
};

export type DashboardMetrics = {
  totalActiveCases: number;
  intakeIncomplete: number;
  missingDocuments: number;
  paymentPending: number;
  readyForAttorneyReview: number;
};

export type RecentCaseRow = {
  id: string;
  clientName: string;
  caseType: CaseType;
  status: CaseStatus;
  urgency: UrgencyLevel;
  missingDocumentCount: number;
  paymentStatus: PaymentStatus;
  lastFollowUpDate?: ISODate | null;
  priority: string;
};

export type DashboardData = {
  firm: Firm;
  metrics: DashboardMetrics;
  recentCases: RecentCaseRow[];
  insights: string[];
  mode: "postgres" | "demo";
};

export type IntakeInput = {
  clientName: string;
  email: string;
  phone: string;
  caseType: CaseType;
  description: string;
  urgencyLevel: UrgencyLevel;
  requiredDocuments: string[];
  paymentStatus: PaymentStatus;
  internalIntakeNotes?: string;
};

export type FollowUpAutomationInput = {
  caseRecord: LegalCase;
  documentRequests: DocumentRequest[];
  existingTasks: FollowUpTask[];
};

export type AutomationTaskDraft = {
  title: string;
  type: FollowUpType;
  dueDate: ISODate;
  priority: UrgencyLevel;
};

export type AISummaryInput = {
  caseType: CaseType;
  caseDescription: string;
  urgencyLevel: UrgencyLevel;
  missingDocuments: string[];
  paymentStatus: PaymentStatus;
  intakeNotes?: string | null;
};

export type AISummaryDraft = Omit<AISummary, "id" | "caseId" | "createdAt" | "updatedAt">;
