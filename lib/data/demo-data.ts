import {
  ActivityType,
  CaseStatus,
  CaseType,
  DocumentStatus,
  FollowUpStatus,
  FollowUpType,
  PaymentStatus,
  UrgencyLevel,
  type ActivityLog,
  type Summary,
  type Client,
  type DocumentRequest,
  type Firm,
  type FollowUpTask,
  type InternalNote,
  type LegalCase,
  type User
} from "@/types/legalflow";
import { calculatePriorityScore } from "@/lib/services/case-status";
import { generateSummary } from "@/lib/services/summary";

export type LegalFlowState = {
  firm: Firm;
  users: User[];
  clients: Client[];
  cases: LegalCase[];
  documentRequests: DocumentRequest[];
  followUpTasks: FollowUpTask[];
  summaries: Summary[];
  internalNotes: InternalNote[];
  activityLogs: ActivityLog[];
};

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

function makeCase(input: Omit<LegalCase, "priorityScore" | "createdAt" | "updatedAt"> & { ageDays: number }) {
  const createdAt = daysAgo(input.ageDays);
  const updatedAt = daysAgo(Math.max(0, input.ageDays - 2));

  return {
    ...input,
    priorityScore: calculatePriorityScore({
      urgencyLevel: input.urgencyLevel,
      paymentStatus: input.paymentStatus,
      intakeCompleted: input.intakeCompleted,
      missingDocumentCount: input.status === CaseStatus.WAITING_ON_DOCUMENTS ? 2 : 0
    }),
    createdAt,
    updatedAt
  };
}

function doc(id: string, caseId: string, title: string, status: DocumentStatus, dueDays: number): DocumentRequest {
  return {
    id,
    caseId,
    title,
    description: `Client-facing request for ${title.toLowerCase()}.`,
    status,
    dueDate: daysFromNow(dueDays),
    createdAt: daysAgo(7),
    updatedAt: status === DocumentStatus.RECEIVED ? daysAgo(1) : daysAgo(3)
  };
}

function task(
  id: string,
  caseId: string,
  title: string,
  type: FollowUpType,
  dueDays: number,
  status: FollowUpStatus,
  priority: UrgencyLevel
): FollowUpTask {
  return {
    id,
    caseId,
    title,
    type,
    dueDate: daysFromNow(dueDays),
    status,
    priority,
    createdAt: daysAgo(4),
    updatedAt: status === FollowUpStatus.COMPLETED ? daysAgo(1) : daysAgo(4)
  };
}

function summary(id: string, caseRecord: LegalCase, missingDocuments: string[]): Summary {
  const draft = generateSummary({
    caseType: caseRecord.caseType,
    caseDescription: caseRecord.description,
    urgencyLevel: caseRecord.urgencyLevel,
    paymentStatus: caseRecord.paymentStatus,
    missingDocuments,
    intakeNotes: caseRecord.internalIntakeNotes
  });

  return {
    id,
    caseId: caseRecord.id,
    ...draft,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1)
  };
}

function activity(id: string, caseId: string, type: ActivityType, message: string, ageDays: number): ActivityLog {
  return {
    id,
    caseId,
    type,
    message,
    createdAt: daysAgo(ageDays)
  };
}

export function createDemoState(): LegalFlowState {
  const firm: Firm = {
    id: "firm_evergreen",
    name: "Evergreen Legal Group",
    practiceFocus: "Consumer, family, immigration, and small-business matters",
    createdAt: daysAgo(180),
    updatedAt: daysAgo(1)
  };

  const users: User[] = [
    {
      id: "user_maya",
      firmId: firm.id,
      name: "Maya Chen",
      email: "maya@evergreenlegal.example",
      role: "Intake Lead",
      createdAt: daysAgo(120),
      updatedAt: daysAgo(2)
    },
    {
      id: "user_omar",
      firmId: firm.id,
      name: "Omar Patel",
      email: "omar@evergreenlegal.example",
      role: "Managing Attorney",
      createdAt: daysAgo(120),
      updatedAt: daysAgo(1)
    }
  ];

  const clients: Client[] = [
    ["client_sofia", "Sofia Ramirez", "sofia.ramirez@example.com", "(312) 555-0148"],
    ["client_daniel", "Daniel Brooks", "daniel.brooks@example.com", "(773) 555-0192"],
    ["client_nadia", "Nadia Ellis", "nadia.ellis@example.com", "(708) 555-0126"],
    ["client_marcus", "Marcus King", "marcus.king@example.com", "(312) 555-0187"],
    ["client_elena", "Elena Torres", "elena.torres@example.com", "(847) 555-0173"],
    ["client_jon", "Jonathan Price", "jon.price@example.com", "(224) 555-0138"],
    ["client_amara", "Amara Wilson", "amara.wilson@example.com", "(630) 555-0156"],
    ["client_luis", "Luis Herrera", "luis.herrera@example.com", "(312) 555-0164"]
  ].map(([id, name, email, phone], index) => ({
    id,
    firmId: firm.id,
    name,
    email,
    phone,
    createdAt: daysAgo(45 - index * 3),
    updatedAt: daysAgo(index % 5)
  }));

  const cases: LegalCase[] = [
    makeCase({
      id: "case_001",
      firmId: firm.id,
      clientId: "client_sofia",
      assignedUserId: "user_maya",
      caseNumber: "LF-2026-001",
      caseType: CaseType.IMMIGRATION,
      description: "Client received a request for evidence and needs help preparing updated employment and address documentation.",
      status: CaseStatus.WAITING_ON_DOCUMENTS,
      urgencyLevel: UrgencyLevel.HIGH,
      paymentStatus: PaymentStatus.PARTIAL,
      intakeCompleted: true,
      internalIntakeNotes: "Deadline is approaching; client is responsive by text.",
      ageDays: 14
    }),
    makeCase({
      id: "case_002",
      firmId: firm.id,
      clientId: "client_daniel",
      assignedUserId: "user_omar",
      caseNumber: "LF-2026-002",
      caseType: CaseType.BANKRUPTCY,
      description: "Client is evaluating Chapter 7 eligibility after job loss and mounting credit card debt.",
      status: CaseStatus.PAYMENT_PENDING,
      urgencyLevel: UrgencyLevel.STANDARD,
      paymentStatus: PaymentStatus.PENDING,
      intakeCompleted: true,
      internalIntakeNotes: "Needs payment plan discussion before attorney consult.",
      ageDays: 11
    }),
    makeCase({
      id: "case_003",
      firmId: firm.id,
      clientId: "client_nadia",
      assignedUserId: "user_maya",
      caseNumber: "LF-2026-003",
      caseType: CaseType.PERSONAL_INJURY,
      description: "Client slipped at a grocery store and has ongoing physical therapy with incomplete insurance correspondence.",
      status: CaseStatus.WAITING_ON_DOCUMENTS,
      urgencyLevel: UrgencyLevel.HIGH,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      intakeCompleted: true,
      internalIntakeNotes: "Photos exist but have not been uploaded.",
      ageDays: 9
    }),
    makeCase({
      id: "case_004",
      firmId: firm.id,
      clientId: "client_marcus",
      assignedUserId: "user_omar",
      caseNumber: "LF-2026-004",
      caseType: CaseType.FAMILY_LAW,
      description: "Client needs custody modification advice after a sudden school schedule change.",
      status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
      urgencyLevel: UrgencyLevel.CRITICAL,
      paymentStatus: PaymentStatus.PAID,
      intakeCompleted: true,
      internalIntakeNotes: "Attorney review requested within 24 hours.",
      ageDays: 5
    }),
    makeCase({
      id: "case_005",
      firmId: firm.id,
      clientId: "client_elena",
      assignedUserId: "user_maya",
      caseNumber: "LF-2026-005",
      caseType: CaseType.ESTATE_PLANNING,
      description: "Client wants a will, healthcare directive, and guardianship plan after a recent move.",
      status: CaseStatus.INTAKE_INCOMPLETE,
      urgencyLevel: UrgencyLevel.LOW,
      paymentStatus: PaymentStatus.PAID,
      intakeCompleted: false,
      internalIntakeNotes: "Waiting on beneficiary details.",
      ageDays: 7
    }),
    makeCase({
      id: "case_006",
      firmId: firm.id,
      clientId: "client_jon",
      assignedUserId: "user_omar",
      caseNumber: "LF-2026-006",
      caseType: CaseType.CONTRACT_REVIEW,
      description: "Small business owner needs a vendor services agreement reviewed before signing next week.",
      status: CaseStatus.READY_FOR_ATTORNEY_REVIEW,
      urgencyLevel: UrgencyLevel.HIGH,
      paymentStatus: PaymentStatus.PAID,
      intakeCompleted: true,
      internalIntakeNotes: "Client prefers email summary after review.",
      ageDays: 4
    }),
    makeCase({
      id: "case_007",
      firmId: firm.id,
      clientId: "client_amara",
      assignedUserId: "user_maya",
      caseNumber: "LF-2026-007",
      caseType: CaseType.IMMIGRATION,
      description: "Client is preparing naturalization filing and needs document readiness review.",
      status: CaseStatus.NEW_INTAKE,
      urgencyLevel: UrgencyLevel.STANDARD,
      paymentStatus: PaymentStatus.PENDING,
      intakeCompleted: false,
      internalIntakeNotes: "Initial call completed; questionnaire still open.",
      ageDays: 2
    }),
    makeCase({
      id: "case_008",
      firmId: firm.id,
      clientId: "client_luis",
      assignedUserId: "user_omar",
      caseNumber: "LF-2026-008",
      caseType: CaseType.BANKRUPTCY,
      description: "Client needs emergency consultation about wage garnishment and creditor calls.",
      status: CaseStatus.IN_REVIEW,
      urgencyLevel: UrgencyLevel.CRITICAL,
      paymentStatus: PaymentStatus.PAID,
      intakeCompleted: true,
      internalIntakeNotes: "Attorney already reviewing.",
      ageDays: 3
    }),
    makeCase({
      id: "case_009",
      firmId: firm.id,
      clientId: "client_sofia",
      assignedUserId: "user_maya",
      caseNumber: "LF-2026-009",
      caseType: CaseType.CONTRACT_REVIEW,
      description: "Client needs review of a residential lease addendum before renewal.",
      status: CaseStatus.CLOSED,
      urgencyLevel: UrgencyLevel.LOW,
      paymentStatus: PaymentStatus.PAID,
      intakeCompleted: true,
      internalIntakeNotes: "Closed after written summary delivered.",
      ageDays: 24
    }),
    makeCase({
      id: "case_010",
      firmId: firm.id,
      clientId: "client_nadia",
      assignedUserId: "user_omar",
      caseNumber: "LF-2026-010",
      caseType: CaseType.ESTATE_PLANNING,
      description: "Client wants trust planning advice for a blended family and out-of-state property.",
      status: CaseStatus.PAYMENT_PENDING,
      urgencyLevel: UrgencyLevel.STANDARD,
      paymentStatus: PaymentStatus.OVERDUE,
      intakeCompleted: true,
      internalIntakeNotes: "Payment follow-up needed before planning session.",
      ageDays: 16
    })
  ];

  const documentRequests: DocumentRequest[] = [
    doc("doc_001", "case_001", "Prior immigration notices", DocumentStatus.MISSING, 2),
    doc("doc_002", "case_001", "Proof of current address", DocumentStatus.REQUESTED, 2),
    doc("doc_003", "case_001", "Passport biographic page", DocumentStatus.RECEIVED, -1),
    doc("doc_004", "case_002", "Tax returns", DocumentStatus.RECEIVED, -2),
    doc("doc_005", "case_002", "Creditor list", DocumentStatus.RECEIVED, -2),
    doc("doc_006", "case_003", "Medical records", DocumentStatus.MISSING, 3),
    doc("doc_007", "case_003", "Photos or evidence", DocumentStatus.REQUESTED, 3),
    doc("doc_008", "case_004", "Prior court filings", DocumentStatus.RECEIVED, -1),
    doc("doc_009", "case_004", "Financial disclosure", DocumentStatus.RECEIVED, -1),
    doc("doc_010", "case_005", "Beneficiary information", DocumentStatus.REQUESTED, 5),
    doc("doc_011", "case_006", "Contract draft", DocumentStatus.RECEIVED, -1),
    doc("doc_012", "case_006", "Statement of business goals", DocumentStatus.RECEIVED, -1),
    doc("doc_013", "case_007", "Government ID", DocumentStatus.REQUESTED, 5),
    doc("doc_014", "case_008", "Bank statements", DocumentStatus.RECEIVED, -1),
    doc("doc_015", "case_010", "Asset list", DocumentStatus.RECEIVED, -3)
  ];

  const followUpTasks: FollowUpTask[] = [
    task("task_001", "case_001", "Remind Sofia about RFE documents", FollowUpType.DOCUMENT_REMINDER, 1, FollowUpStatus.OPEN, UrgencyLevel.HIGH),
    task("task_002", "case_001", "Confirm partial payment plan", FollowUpType.PAYMENT, 2, FollowUpStatus.OPEN, UrgencyLevel.STANDARD),
    task("task_003", "case_003", "Request medical records and evidence photos", FollowUpType.DOCUMENT_REMINDER, 1, FollowUpStatus.OPEN, UrgencyLevel.HIGH),
    task("task_004", "case_004", "Send custody packet to attorney queue", FollowUpType.ATTORNEY_REVIEW, 0, FollowUpStatus.OPEN, UrgencyLevel.CRITICAL),
    task("task_005", "case_005", "Complete beneficiary questionnaire", FollowUpType.QUESTIONNAIRE, 4, FollowUpStatus.OPEN, UrgencyLevel.LOW),
    task("task_006", "case_006", "Attorney review prep", FollowUpType.ATTORNEY_REVIEW, 1, FollowUpStatus.COMPLETED, UrgencyLevel.HIGH),
    task("task_007", "case_007", "Send intake questionnaire reminder", FollowUpType.QUESTIONNAIRE, 1, FollowUpStatus.OPEN, UrgencyLevel.STANDARD),
    task("task_008", "case_010", "Follow up on overdue planning fee", FollowUpType.PAYMENT, 1, FollowUpStatus.OPEN, UrgencyLevel.STANDARD),
    task("task_009", "case_007", "Remind Amara to send government ID", FollowUpType.DOCUMENT_REMINDER, 2, FollowUpStatus.OPEN, UrgencyLevel.STANDARD)
  ];

  const summaries = cases
    .filter((caseRecord) => caseRecord.id !== "case_007")
    .map((caseRecord, index) =>
      summary(
        `summary_${String(index + 1).padStart(3, "0")}`,
        caseRecord,
        documentRequests
          .filter((request) => request.caseId === caseRecord.id && request.status !== DocumentStatus.RECEIVED)
          .map((request) => request.title)
      )
    );

  const internalNotes: InternalNote[] = [
    {
      id: "note_001",
      caseId: "case_001",
      authorId: "user_maya",
      body: "Client asked for Spanish-language follow-up. Prioritize plain-language instructions.",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3)
    },
    {
      id: "note_002",
      caseId: "case_004",
      authorId: "user_omar",
      body: "Potential urgent hearing issue. Review before standard queue.",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1)
    },
    {
      id: "note_003",
      caseId: "case_010",
      authorId: "user_maya",
      body: "Client wants to proceed but needs payment link resent.",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5)
    }
  ];

  const activityLogs = [
    ...cases.flatMap((caseRecord, index) => [
      activity(
        `log_${index + 1}_a`,
        caseRecord.id,
        ActivityType.INTAKE_CREATED,
        `Intake created for ${caseRecord.caseNumber}.`,
        caseRecord.createdAt === caseRecord.updatedAt ? 3 : 8
      ),
      ...(caseRecord.id !== "case_007"
        ? [
            activity(
              `log_${index + 1}_b`,
              caseRecord.id,
              ActivityType.SUMMARY_GENERATED,
              `Case summary generated for ${caseRecord.caseNumber}.`,
              index < 4 ? 0 : 2
            )
          ]
        : []),
      activity(
        `log_${index + 1}_c`,
        caseRecord.id,
        ActivityType.STATUS_CHANGED,
        caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW
          ? "Automation marked case ready for attorney review after readiness checks passed."
          : `Case status changed to ${caseRecord.status.replaceAll("_", " ").toLowerCase()}.`,
        caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW ? 0 : 1
      )
    ]),
    ...followUpTasks.map((followUpTask, index) =>
      activity(
        `log_followup_${index + 1}`,
        followUpTask.caseId,
        ActivityType.FOLLOW_UP_CREATED,
        `Automation generated follow-up: ${followUpTask.title}.`,
        followUpTask.type === FollowUpType.DOCUMENT_REMINDER || followUpTask.type === FollowUpType.PAYMENT
          ? 0
          : index < 5
            ? 0
            : 2
      )
    ),
    activity(
      "log_priority_case_004",
      "case_004",
      ActivityType.STATUS_CHANGED,
      "Automation marked case high priority based on critical urgency and attorney review readiness.",
      0
    ),
    activity(
      "log_priority_case_008",
      "case_008",
      ActivityType.STATUS_CHANGED,
      "Automation marked case high priority based on emergency consultation details.",
      0
    ),
    ...internalNotes.map((note, index) =>
      activity(
        `log_note_${index + 1}`,
        note.caseId,
        ActivityType.NOTE_ADDED,
        `Internal note added: ${note.body.slice(0, 80)}.`,
        index === 1 ? 0 : 3
      )
    )
  ];

  return {
    firm,
    users,
    clients,
    cases,
    documentRequests,
    followUpTasks,
    summaries,
    internalNotes,
    activityLogs
  };
}
