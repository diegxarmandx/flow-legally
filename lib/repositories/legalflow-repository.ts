import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activityMessage } from "@/lib/services/activity-log";
import { generateAISummary } from "@/lib/services/ai-summary";
import { calculateCaseStatus, calculatePriorityScore } from "@/lib/services/case-status";
import { findResolvedFollowUps, generateFollowUpTasks } from "@/lib/services/follow-up-automation";
import { createDemoState, type LegalFlowState } from "@/lib/data/demo-data";
import {
  ActivityType,
  type AISummaryDraft,
  type AutomationTaskDraft,
  CaseStatus,
  DocumentStatus,
  FollowUpStatus,
  FollowUpType,
  UrgencyLevel,
  type ActivityLog,
  type AISummary,
  type CaseRecord,
  type Client,
  type ClientRecord,
  type DashboardData,
  type DocumentRequest,
  type Firm,
  type FollowUpTask,
  type IntakeInput,
  type InternalNote,
  type LegalCase,
  type RecentCaseRow,
  type User
} from "@/types/legalflow";
import { labelFor } from "@/lib/utils/format";
import { isActiveCase, isPaymentBlocking, missingDocuments, priorityLabel } from "@/lib/utils/status";

type CaseWithRelations = Prisma.CaseGetPayload<{
  include: {
    client: true;
    assignedUser: true;
    documentRequests: true;
    followUpTasks: true;
    aiSummary: true;
    internalNotes: { include: { author: true } };
    activityLogs: true;
  };
}>;

type ClientWithCases = Prisma.ClientGetPayload<{
  include: {
    cases: {
      include: {
        client: true;
        assignedUser: true;
        documentRequests: true;
        followUpTasks: true;
        aiSummary: true;
        internalNotes: { include: { author: true } };
        activityLogs: true;
      };
    };
  };
}>;

type DemoGlobal = typeof globalThis & {
  __legalFlowDemoState?: LegalFlowState;
};

type ActivityDraft = {
  type: ActivityType;
  message: string;
};

type DocumentDraft = {
  title: string;
  description: string;
  status: DocumentStatus;
};

const FIRM_ID = "firm_evergreen";
const DEFAULT_USER_ID = "user_maya";

function shouldUsePrismaStore() {
  return Boolean(process.env.DATABASE_URL && process.env.LEGALFLOW_DEMO_MODE !== "true");
}

function iso(date: Date | string) {
  return date instanceof Date ? date.toISOString() : date;
}

function demoState() {
  const globalStore = globalThis as DemoGlobal;
  globalStore.__legalFlowDemoState ??= createDemoState();
  return globalStore.__legalFlowDemoState;
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nextCaseNumber(existing: LegalCase[]) {
  return nextCaseNumberFromCount(existing.length);
}

function nextCaseNumberFromCount(existingCount: number) {
  const year = new Date().getFullYear();
  const next = existingCount + 1;
  return `LF-${year}-${String(next).padStart(3, "0")}`;
}

function dueDateFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function buildDocumentDrafts(requiredDocuments: string[]): DocumentDraft[] {
  return requiredDocuments.map((title) => ({
    title,
    description: `Client-facing request for ${title.toLowerCase()}.`,
    status: DocumentStatus.REQUESTED
  }));
}

function activityDraft(type: ActivityType, subject: string): ActivityDraft {
  return {
    type,
    message: activityMessage(type, subject)
  };
}

function buildCaseReadiness(caseRecord: LegalCase, documentRequests: DocumentRequest[]) {
  return {
    status: calculateCaseStatus({ caseRecord, documentRequests }),
    priorityScore: calculatePriorityScore({
      urgencyLevel: caseRecord.urgencyLevel,
      paymentStatus: caseRecord.paymentStatus,
      intakeCompleted: caseRecord.intakeCompleted,
      missingDocumentCount: missingDocuments(documentRequests).length
    })
  };
}

function buildIntakeSummary(input: IntakeInput, documentRequests: Pick<DocumentRequest, "title">[]): AISummaryDraft {
  return generateAISummary({
    caseType: input.caseType,
    caseDescription: input.description,
    urgencyLevel: input.urgencyLevel,
    paymentStatus: input.paymentStatus,
    missingDocuments: documentRequests.map((document) => document.title),
    intakeNotes: input.internalIntakeNotes
  });
}

function buildIntakeTaskDrafts(caseRecord: LegalCase, documentRequests: DocumentRequest[]) {
  return generateFollowUpTasks({
    caseRecord,
    documentRequests,
    existingTasks: []
  });
}

function withOpenStatus(taskDraft: AutomationTaskDraft) {
  return {
    ...taskDraft,
    status: FollowUpStatus.OPEN
  };
}

function buildIntakeActivityDrafts(input: {
  clientName: string;
  caseNumber: string;
  documentRequests: Pick<DocumentRequest, "title">[];
  taskDrafts: Pick<AutomationTaskDraft, "title">[];
  status: CaseStatus;
}) {
  return [
    activityDraft(ActivityType.INTAKE_CREATED, input.clientName),
    ...input.documentRequests.map((document) => activityDraft(ActivityType.DOCUMENT_REQUESTED, document.title)),
    ...input.taskDrafts.map((taskDraft) => activityDraft(ActivityType.FOLLOW_UP_CREATED, taskDraft.title)),
    activityDraft(ActivityType.SUMMARY_GENERATED, input.caseNumber),
    activityDraft(ActivityType.STATUS_CHANGED, labelFor(input.status))
  ];
}

function demoActivityLog(caseId: string, draft: ActivityDraft, timestamp: string): ActivityLog {
  return {
    id: id("log"),
    caseId,
    ...draft,
    createdAt: timestamp
  };
}

function mapFirm(firm: Prisma.FirmGetPayload<object>): Firm {
  return {
    id: firm.id,
    name: firm.name,
    practiceFocus: firm.practiceFocus,
    createdAt: iso(firm.createdAt),
    updatedAt: iso(firm.updatedAt)
  };
}

function mapUser(user: Prisma.UserGetPayload<object>): User {
  return {
    id: user.id,
    firmId: user.firmId,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt)
  };
}

function mapClient(client: Prisma.ClientGetPayload<object>): Client {
  return {
    id: client.id,
    firmId: client.firmId,
    name: client.name,
    email: client.email,
    phone: client.phone,
    createdAt: iso(client.createdAt),
    updatedAt: iso(client.updatedAt)
  };
}

function mapCase(caseRecord: Prisma.CaseGetPayload<object>): LegalCase {
  return {
    id: caseRecord.id,
    firmId: caseRecord.firmId,
    clientId: caseRecord.clientId,
    assignedUserId: caseRecord.assignedUserId,
    caseNumber: caseRecord.caseNumber,
    caseType: caseRecord.caseType,
    description: caseRecord.description,
    status: caseRecord.status,
    urgencyLevel: caseRecord.urgencyLevel,
    paymentStatus: caseRecord.paymentStatus,
    intakeCompleted: caseRecord.intakeCompleted,
    priorityScore: caseRecord.priorityScore,
    internalIntakeNotes: caseRecord.internalIntakeNotes,
    createdAt: iso(caseRecord.createdAt),
    updatedAt: iso(caseRecord.updatedAt)
  };
}

function mapDocument(document: Prisma.DocumentRequestGetPayload<object>): DocumentRequest {
  return {
    id: document.id,
    caseId: document.caseId,
    title: document.title,
    description: document.description,
    status: document.status,
    dueDate: document.dueDate ? iso(document.dueDate) : null,
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt)
  };
}

function mapTask(task: Prisma.FollowUpTaskGetPayload<object>): FollowUpTask {
  return {
    id: task.id,
    caseId: task.caseId,
    title: task.title,
    type: task.type,
    dueDate: iso(task.dueDate),
    status: task.status,
    priority: task.priority,
    createdAt: iso(task.createdAt),
    updatedAt: iso(task.updatedAt)
  };
}

function mapSummary(summary: Prisma.AISummaryGetPayload<object> | null): AISummary | null {
  if (!summary) return null;
  return {
    id: summary.id,
    caseId: summary.caseId,
    situationSummary: summary.situationSummary,
    keyRisks: summary.keyRisks,
    missingInformation: summary.missingInformation,
    recommendedNextSteps: summary.recommendedNextSteps,
    priorityLevel: summary.priorityLevel,
    createdAt: iso(summary.createdAt),
    updatedAt: iso(summary.updatedAt)
  };
}

function mapNote(note: Prisma.InternalNoteGetPayload<{ include: { author: true } }>): InternalNote & { author?: User | null } {
  return {
    id: note.id,
    caseId: note.caseId,
    authorId: note.authorId,
    body: note.body,
    createdAt: iso(note.createdAt),
    updatedAt: iso(note.updatedAt),
    author: mapUser(note.author)
  };
}

function mapActivity(log: Prisma.ActivityLogGetPayload<object>): ActivityLog {
  return {
    id: log.id,
    caseId: log.caseId,
    type: log.type,
    message: log.message,
    createdAt: iso(log.createdAt)
  };
}

function composePrismaCase(caseRecord: CaseWithRelations): CaseRecord {
  return {
    ...mapCase(caseRecord),
    client: mapClient(caseRecord.client),
    assignedUser: caseRecord.assignedUser ? mapUser(caseRecord.assignedUser) : null,
    documentRequests: caseRecord.documentRequests.map(mapDocument),
    followUpTasks: caseRecord.followUpTasks.map(mapTask),
    aiSummary: mapSummary(caseRecord.aiSummary),
    internalNotes: caseRecord.internalNotes.map(mapNote).sort(sortNewestFirst),
    activityLogs: caseRecord.activityLogs.map(mapActivity).sort(sortNewestFirst)
  };
}

function sortNewestFirst(a: { createdAt: string }, b: { createdAt: string }) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function isHighUrgency(urgency: UrgencyLevel) {
  return urgency === UrgencyLevel.HIGH || urgency === UrgencyLevel.CRITICAL;
}

function composeDemoCase(state: LegalFlowState, caseRecord: LegalCase): CaseRecord {
  const client = state.clients.find((item) => item.id === caseRecord.clientId);
  if (!client) throw new Error(`Client not found for case ${caseRecord.id}`);

  return {
    ...caseRecord,
    client,
    assignedUser: state.users.find((item) => item.id === caseRecord.assignedUserId) ?? null,
    documentRequests: state.documentRequests.filter((item) => item.caseId === caseRecord.id),
    followUpTasks: state.followUpTasks.filter((item) => item.caseId === caseRecord.id),
    aiSummary: state.aiSummaries.find((item) => item.caseId === caseRecord.id) ?? null,
    internalNotes: state.internalNotes
      .filter((item) => item.caseId === caseRecord.id)
      .map((note) => ({
        ...note,
        author: state.users.find((user) => user.id === note.authorId) ?? null
      }))
      .sort(sortNewestFirst),
    activityLogs: state.activityLogs.filter((item) => item.caseId === caseRecord.id).sort(sortNewestFirst)
  };
}

function recentRow(caseRecord: CaseRecord): RecentCaseRow {
  const lastFollowUp = [...caseRecord.followUpTasks].sort(sortNewestFirst)[0];

  return {
    id: caseRecord.id,
    clientName: caseRecord.client.name,
    caseType: caseRecord.caseType,
    status: caseRecord.status,
    urgency: caseRecord.urgencyLevel,
    missingDocumentCount: missingDocuments(caseRecord.documentRequests).length,
    paymentStatus: caseRecord.paymentStatus,
    lastFollowUpDate: lastFollowUp?.createdAt ?? null,
    priority: priorityLabel(caseRecord)
  };
}

function dashboardFromCases(firm: Firm, cases: CaseRecord[], mode: DashboardData["mode"]): DashboardData {
  const activeCases = cases.filter((caseRecord) => isActiveCase(caseRecord.status));
  const metrics = {
    totalActiveCases: activeCases.length,
    intakeIncomplete: activeCases.filter((caseRecord) => !caseRecord.intakeCompleted).length,
    missingDocuments: activeCases.filter((caseRecord) => missingDocuments(caseRecord.documentRequests).length > 0).length,
    paymentPending: activeCases.filter((caseRecord) => isPaymentBlocking(caseRecord.paymentStatus)).length,
    readyForAttorneyReview: activeCases.filter(
      (caseRecord) => caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW
    ).length
  };

  const insights = [
    `${metrics.missingDocuments} cases are blocked by missing documents`,
    `${activeCases.filter((caseRecord) => isHighUrgency(caseRecord.urgencyLevel) && caseRecord.status === CaseStatus.READY_FOR_ATTORNEY_REVIEW).length} high-priority cases need attorney review`,
    `${metrics.paymentPending} clients have pending payment follow-ups`
  ];

  return {
    firm,
    metrics,
    insights,
    recentCases: cases.sort(sortNewestFirst).slice(0, 8).map(recentRow),
    mode
  };
}

async function ensurePrismaFirm() {
  const firm = await prisma.firm.upsert({
    where: { id: FIRM_ID },
    update: {},
    create: {
      id: FIRM_ID,
      name: "Evergreen Legal Group",
      practiceFocus: "Consumer, family, immigration, and small-business matters",
    }
  });

  await prisma.user.upsert({
    where: { firmId_email: { firmId: firm.id, email: "maya@evergreenlegal.example" } },
    update: { firmId: firm.id, name: "Maya Chen", role: "Intake Lead" },
    create: {
      id: DEFAULT_USER_ID,
      firmId: firm.id,
      name: "Maya Chen",
      email: "maya@evergreenlegal.example",
      role: "Intake Lead"
    }
  });

  await prisma.user.upsert({
    where: { firmId_email: { firmId: firm.id, email: "omar@evergreenlegal.example" } },
    update: { firmId: firm.id, name: "Omar Patel", role: "Managing Attorney" },
    create: {
      id: "user_omar",
      firmId: firm.id,
      name: "Omar Patel",
      email: "omar@evergreenlegal.example",
      role: "Managing Attorney"
    }
  });

  return firm;
}

export async function getDashboardData(): Promise<DashboardData> {
  if (shouldUsePrismaStore()) {
    const firm = await ensurePrismaFirm();
    const cases = await prisma.case.findMany({
      where: { firmId: firm.id },
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        assignedUser: true,
        documentRequests: true,
        followUpTasks: true,
        aiSummary: true,
        internalNotes: { include: { author: true } },
        activityLogs: true
      }
    });

    return dashboardFromCases(mapFirm(firm), cases.map(composePrismaCase), "postgres");
  }

  const state = demoState();
  return dashboardFromCases(
    state.firm,
    state.cases.map((caseRecord) => composeDemoCase(state, caseRecord)),
    "demo"
  );
}

export async function getClients(query = ""): Promise<ClientRecord[]> {
  const normalized = query.trim().toLowerCase();

  if (shouldUsePrismaStore()) {
    const firm = await ensurePrismaFirm();
    const clients = await prisma.client.findMany({
      where: {
        firmId: firm.id,
        OR: normalized
          ? [
              { name: { contains: normalized, mode: "insensitive" } },
              { email: { contains: normalized, mode: "insensitive" } }
            ]
          : undefined
      },
      include: {
        cases: {
          include: {
            client: true,
            assignedUser: true,
            documentRequests: true,
            followUpTasks: true,
            aiSummary: true,
            internalNotes: { include: { author: true } },
            activityLogs: true
          },
          orderBy: { updatedAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return clients.map(composeClientRecord);
  }

  const state = demoState();
  return state.clients
    .filter(
      (client) =>
        !normalized ||
        client.name.toLowerCase().includes(normalized) ||
        client.email.toLowerCase().includes(normalized)
    )
    .map((client) => {
      const cases = state.cases
        .filter((caseRecord) => caseRecord.clientId === client.id)
        .map((caseRecord) => composeDemoCase(state, caseRecord))
        .sort(sortNewestFirst);
      return {
        ...client,
        cases,
        caseCount: cases.length,
        lastActivityAt: cases[0]?.updatedAt ?? client.updatedAt,
        latestCaseStatus: cases[0]?.status ?? null
      };
    })
    .sort(sortNewestFirst);
}

function composeClientRecord(client: ClientWithCases): ClientRecord {
  const cases = client.cases.map(composePrismaCase).sort(sortNewestFirst);
  return {
    ...mapClient(client),
    cases,
    caseCount: cases.length,
    lastActivityAt: cases[0]?.updatedAt ?? iso(client.updatedAt),
    latestCaseStatus: cases[0]?.status ?? null
  };
}

export async function getCaseById(caseId: string): Promise<CaseRecord | null> {
  if (shouldUsePrismaStore()) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        assignedUser: true,
        documentRequests: true,
        followUpTasks: true,
        aiSummary: true,
        internalNotes: { include: { author: true } },
        activityLogs: true
      }
    });

    return caseRecord ? composePrismaCase(caseRecord) : null;
  }

  const state = demoState();
  const caseRecord = state.cases.find((item) => item.id === caseId);
  return caseRecord ? composeDemoCase(state, caseRecord) : null;
}

export async function createIntake(input: IntakeInput): Promise<string> {
  const documentDrafts = buildDocumentDrafts(input.requiredDocuments);

  if (shouldUsePrismaStore()) {
    const firm = await ensurePrismaFirm();
    const created = await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: { firmId_email: { firmId: firm.id, email: input.email.toLowerCase() } },
        update: {
          name: input.clientName,
          phone: input.phone
        },
        create: {
          firmId: firm.id,
          name: input.clientName,
          email: input.email.toLowerCase(),
          phone: input.phone
        }
      });

      const count = await tx.case.count({ where: { firmId: firm.id } });
      const caseNumber = nextCaseNumberFromCount(count);
      const priorityScore = calculatePriorityScore({
        urgencyLevel: input.urgencyLevel,
        paymentStatus: input.paymentStatus,
        intakeCompleted: true,
        missingDocumentCount: documentDrafts.length
      });

      const caseRecord = await tx.case.create({
        data: {
          firmId: firm.id,
          clientId: client.id,
          assignedUserId: DEFAULT_USER_ID,
          caseNumber,
          caseType: input.caseType,
          description: input.description,
          status: CaseStatus.NEW_INTAKE,
          urgencyLevel: input.urgencyLevel,
          paymentStatus: input.paymentStatus,
          intakeCompleted: true,
          priorityScore,
          internalIntakeNotes: input.internalIntakeNotes,
          documentRequests: { create: documentDrafts },
          activityLogs: {
            create: activityDraft(ActivityType.INTAKE_CREATED, input.clientName)
          }
        },
        include: { documentRequests: true, followUpTasks: true }
      });

      const mappedCase = mapCase(caseRecord);
      const mappedDocuments = caseRecord.documentRequests.map(mapDocument);
      const readiness = buildCaseReadiness(mappedCase, mappedDocuments);
      const taskDrafts = buildIntakeTaskDrafts({ ...mappedCase, ...readiness }, mappedDocuments);
      const summary = buildIntakeSummary(input, mappedDocuments);

      await tx.case.update({
        where: { id: caseRecord.id },
        data: {
          ...readiness,
          followUpTasks: { create: taskDrafts.map(withOpenStatus) },
          aiSummary: { create: summary },
          activityLogs: {
            create: buildIntakeActivityDrafts({
              clientName: input.clientName,
              caseNumber: caseRecord.caseNumber,
              documentRequests: mappedDocuments,
              taskDrafts,
              status: readiness.status
            })
          }
        }
      });

      return caseRecord;
    });

    revalidateCorePaths(created.id);
    return created.id;
  }

  const state = demoState();
  const timestamp = now();
  let client = state.clients.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

  if (!client) {
    client = {
      id: id("client"),
      firmId: state.firm.id,
      name: input.clientName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    state.clients.push(client);
  } else {
    client.name = input.clientName;
    client.phone = input.phone;
    client.updatedAt = timestamp;
  }

  const caseRecord: LegalCase = {
    id: id("case"),
    firmId: state.firm.id,
    clientId: client.id,
    assignedUserId: DEFAULT_USER_ID,
    caseNumber: nextCaseNumber(state.cases),
    caseType: input.caseType,
    description: input.description,
    status: CaseStatus.NEW_INTAKE,
    urgencyLevel: input.urgencyLevel,
    paymentStatus: input.paymentStatus,
    intakeCompleted: true,
    priorityScore: 30,
    internalIntakeNotes: input.internalIntakeNotes,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  state.cases.push(caseRecord);

  const documents = documentDrafts.map((documentDraft) => ({
    id: id("doc"),
    caseId: caseRecord.id,
    ...documentDraft,
    dueDate: null,
    createdAt: timestamp,
    updatedAt: timestamp
  }));
  state.documentRequests.push(...documents);

  Object.assign(caseRecord, buildCaseReadiness(caseRecord, documents));

  const taskDrafts = buildIntakeTaskDrafts(caseRecord, documents);
  const tasks = taskDrafts.map((taskDraft) => ({
    id: id("task"),
    caseId: caseRecord.id,
    ...withOpenStatus(taskDraft),
    createdAt: timestamp,
    updatedAt: timestamp
  }));
  state.followUpTasks.push(...tasks);

  const summary = buildIntakeSummary(input, documents);
  state.aiSummaries.push({
    id: id("summary"),
    caseId: caseRecord.id,
    ...summary,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  state.activityLogs.push(
    ...buildIntakeActivityDrafts({
      clientName: input.clientName,
      caseNumber: caseRecord.caseNumber,
      documentRequests: documents,
      taskDrafts,
      status: caseRecord.status
    }).map((draft) => demoActivityLog(caseRecord.id, draft, timestamp))
  );

  revalidateCorePaths(caseRecord.id);
  return caseRecord.id;
}

export async function markDocumentReceived(documentId: string) {
  if (shouldUsePrismaStore()) {
    const updated = await prisma.documentRequest.update({
      where: { id: documentId },
      data: { status: DocumentStatus.RECEIVED },
      include: { case: { include: { documentRequests: true, followUpTasks: true } } }
    });

    const caseRecord = mapCase(updated.case);
    const documents = updated.case.documentRequests.map(mapDocument);
    const tasks = updated.case.followUpTasks.map(mapTask);
    const previousStatus = caseRecord.status;
    const readiness = buildCaseReadiness(caseRecord, documents);
    const resolvedFollowUps = findResolvedFollowUps({
      caseRecord: { ...caseRecord, status: readiness.status },
      documentRequests: documents,
      existingTasks: tasks
    });

    await prisma.$transaction(async (tx) => {
      if (resolvedFollowUps.length > 0) {
        await tx.followUpTask.updateMany({
          where: { id: { in: resolvedFollowUps.map((task) => task.id) } },
          data: { status: FollowUpStatus.COMPLETED }
        });
      }

      await tx.case.update({
        where: { id: updated.caseId },
        data: {
          ...readiness,
          activityLogs: {
            create: [
              activityDraft(ActivityType.DOCUMENT_RECEIVED, updated.title),
              ...resolvedFollowUps.map((task) => activityDraft(ActivityType.FOLLOW_UP_COMPLETED, task.title)),
              ...(previousStatus !== readiness.status
                ? [activityDraft(ActivityType.STATUS_CHANGED, labelFor(readiness.status))]
                : [])
            ]
          }
        }
      });
    });

    revalidateCorePaths(updated.caseId);
    return;
  }

  const state = demoState();
  const document = state.documentRequests.find((item) => item.id === documentId);
  if (!document) return;
  const timestamp = now();
  document.status = DocumentStatus.RECEIVED;
  document.updatedAt = timestamp;
  const statusChange = recalculateDemoCase(state, document.caseId);
  const caseRecord = state.cases.find((item) => item.id === document.caseId);
  const documents = state.documentRequests.filter((item) => item.caseId === document.caseId);
  const tasks = state.followUpTasks.filter((item) => item.caseId === document.caseId);
  const resolvedFollowUps = caseRecord
    ? findResolvedFollowUps({ caseRecord, documentRequests: documents, existingTasks: tasks })
    : [];
  for (const task of resolvedFollowUps) {
    task.status = FollowUpStatus.COMPLETED;
    task.updatedAt = timestamp;
  }
  state.activityLogs.push(
    demoActivityLog(document.caseId, activityDraft(ActivityType.DOCUMENT_RECEIVED, document.title), timestamp)
  );
  state.activityLogs.push(
    ...resolvedFollowUps.map((task) =>
      demoActivityLog(document.caseId, activityDraft(ActivityType.FOLLOW_UP_COMPLETED, task.title), timestamp)
    )
  );
  if (statusChange && statusChange.previousStatus !== statusChange.nextStatus) {
    state.activityLogs.push(
      demoActivityLog(
        document.caseId,
        activityDraft(ActivityType.STATUS_CHANGED, labelFor(statusChange.nextStatus)),
        timestamp
      )
    );
  }
  revalidateCorePaths(document.caseId);
}

export async function completeFollowUpTask(taskId: string) {
  if (shouldUsePrismaStore()) {
    const updated = await prisma.$transaction(async (tx) => {
      const task = await tx.followUpTask.update({
        where: { id: taskId },
        data: { status: FollowUpStatus.COMPLETED }
      });

      await tx.activityLog.create({
        data: {
          caseId: task.caseId,
          ...activityDraft(ActivityType.FOLLOW_UP_COMPLETED, task.title)
        }
      });

      return task;
    });

    revalidateCorePaths(updated.caseId);
    return;
  }

  const state = demoState();
  const taskItem = state.followUpTasks.find((item) => item.id === taskId);
  if (!taskItem) return;
  const timestamp = now();
  taskItem.status = FollowUpStatus.COMPLETED;
  taskItem.updatedAt = timestamp;
  state.activityLogs.push(
    demoActivityLog(taskItem.caseId, activityDraft(ActivityType.FOLLOW_UP_COMPLETED, taskItem.title), timestamp)
  );
  revalidateCorePaths(taskItem.caseId);
}

export async function createFollowUpTask(input: {
  caseId: string;
  title: string;
  type: FollowUpType;
  dueDate: string;
  priority: UrgencyLevel;
}) {
  const dueDate = dueDateFromInput(input.dueDate);

  if (shouldUsePrismaStore()) {
    await prisma.$transaction(async (tx) => {
      const created = await tx.followUpTask.create({
        data: {
          caseId: input.caseId,
          title: input.title,
          type: input.type,
          dueDate,
          status: FollowUpStatus.OPEN,
          priority: input.priority
        }
      });

      await tx.activityLog.create({
        data: {
          caseId: input.caseId,
          ...activityDraft(ActivityType.FOLLOW_UP_CREATED, created.title)
        }
      });
    });

    revalidateCorePaths(input.caseId);
    return;
  }

  const state = demoState();
  const timestamp = now();
  state.followUpTasks.push({
    id: id("task"),
    caseId: input.caseId,
    title: input.title,
    type: input.type,
    dueDate: dueDate.toISOString(),
    status: FollowUpStatus.OPEN,
    priority: input.priority,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  state.activityLogs.push(
    demoActivityLog(input.caseId, activityDraft(ActivityType.FOLLOW_UP_CREATED, input.title), timestamp)
  );
  revalidateCorePaths(input.caseId);
}

export async function addInternalNote(input: { caseId: string; body: string }) {
  if (shouldUsePrismaStore()) {
    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.internalNote.create({
        data: {
          caseId: input.caseId,
          authorId: DEFAULT_USER_ID,
          body: input.body
        }
      });

      await tx.activityLog.create({
        data: {
          caseId: input.caseId,
          ...activityDraft(ActivityType.NOTE_ADDED, input.body.slice(0, 80))
        }
      });

      return created;
    });

    revalidateCorePaths(note.caseId);
    return;
  }

  const state = demoState();
  const timestamp = now();
  state.internalNotes.push({
    id: id("note"),
    caseId: input.caseId,
    authorId: DEFAULT_USER_ID,
    body: input.body,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  state.activityLogs.push(
    demoActivityLog(input.caseId, activityDraft(ActivityType.NOTE_ADDED, input.body.slice(0, 80)), timestamp)
  );
  revalidateCorePaths(input.caseId);
}

export async function regenerateSummary(caseId: string) {
  const caseRecord = await getCaseById(caseId);
  if (!caseRecord) return;

  const missing = missingDocuments(caseRecord.documentRequests).map((document) => document.title);
  const draft = generateAISummary({
    caseType: caseRecord.caseType,
    caseDescription: caseRecord.description,
    urgencyLevel: caseRecord.urgencyLevel,
    paymentStatus: caseRecord.paymentStatus,
    missingDocuments: missing,
    intakeNotes: caseRecord.internalIntakeNotes
  });

  if (shouldUsePrismaStore()) {
    await prisma.$transaction(async (tx) => {
      await tx.aISummary.upsert({
        where: { caseId },
        update: draft,
        create: { caseId, ...draft }
      });

      await tx.activityLog.create({
        data: {
          caseId,
          ...activityDraft(ActivityType.SUMMARY_GENERATED, caseRecord.caseNumber)
        }
      });
    });

    revalidateCorePaths(caseId);
    return;
  }

  const state = demoState();
  const existing = state.aiSummaries.find((summary) => summary.caseId === caseId);
  const timestamp = now();
  if (existing) {
    Object.assign(existing, draft, { updatedAt: timestamp });
  } else {
    state.aiSummaries.push({
      id: id("summary"),
      caseId,
      ...draft,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
  state.activityLogs.push(
    demoActivityLog(caseId, activityDraft(ActivityType.SUMMARY_GENERATED, caseRecord.caseNumber), timestamp)
  );
  revalidateCorePaths(caseId);
}

function recalculateDemoCase(state: LegalFlowState, caseId: string) {
  const caseRecord = state.cases.find((item) => item.id === caseId);
  if (!caseRecord) return null;
  const previousStatus = caseRecord.status;
  const documents = state.documentRequests.filter((item) => item.caseId === caseId);
  Object.assign(caseRecord, buildCaseReadiness(caseRecord, documents));
  caseRecord.updatedAt = now();
  return { previousStatus, nextStatus: caseRecord.status };
}

function revalidateCorePaths(caseId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  if (caseId) revalidatePath(`/cases/${caseId}`);
}
