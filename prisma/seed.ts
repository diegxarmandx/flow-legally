import { PrismaClient } from "@prisma/client";
import { createDemoState } from "../lib/data/demo-data";

const prisma = new PrismaClient();

async function main() {
  const state = createDemoState();

  await prisma.activityLog.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.aISummary.deleteMany();
  await prisma.followUpTask.deleteMany();
  await prisma.documentRequest.deleteMany();
  await prisma.case.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.firm.deleteMany();

  await prisma.firm.create({
    data: {
      id: state.firm.id,
      name: state.firm.name,
      practiceFocus: state.firm.practiceFocus,
      createdAt: new Date(state.firm.createdAt),
      updatedAt: new Date(state.firm.updatedAt)
    }
  });

  await prisma.user.createMany({
    data: state.users.map((user) => ({
      id: user.id,
      firmId: user.firmId,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }))
  });

  await prisma.client.createMany({
    data: state.clients.map((client) => ({
      id: client.id,
      firmId: client.firmId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt)
    }))
  });

  await prisma.case.createMany({
    data: state.cases.map((caseRecord) => ({
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
      createdAt: new Date(caseRecord.createdAt),
      updatedAt: new Date(caseRecord.updatedAt)
    }))
  });

  await prisma.documentRequest.createMany({
    data: state.documentRequests.map((document) => ({
      id: document.id,
      caseId: document.caseId,
      title: document.title,
      description: document.description,
      status: document.status,
      dueDate: document.dueDate ? new Date(document.dueDate) : null,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt)
    }))
  });

  await prisma.followUpTask.createMany({
    data: state.followUpTasks.map((task) => ({
      id: task.id,
      caseId: task.caseId,
      title: task.title,
      type: task.type,
      dueDate: new Date(task.dueDate),
      status: task.status,
      priority: task.priority,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    }))
  });

  await prisma.aISummary.createMany({
    data: state.aiSummaries.map((summary) => ({
      id: summary.id,
      caseId: summary.caseId,
      situationSummary: summary.situationSummary,
      keyRisks: summary.keyRisks,
      missingInformation: summary.missingInformation,
      recommendedNextSteps: summary.recommendedNextSteps,
      priorityLevel: summary.priorityLevel,
      createdAt: new Date(summary.createdAt),
      updatedAt: new Date(summary.updatedAt)
    }))
  });

  await prisma.internalNote.createMany({
    data: state.internalNotes.map((note) => ({
      id: note.id,
      caseId: note.caseId,
      authorId: note.authorId,
      body: note.body,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt)
    }))
  });

  await prisma.activityLog.createMany({
    data: state.activityLogs.map((log) => ({
      id: log.id,
      caseId: log.caseId,
      type: log.type,
      message: log.message,
      createdAt: new Date(log.createdAt)
    }))
  });

  console.log("Seeded LegalFlow AI demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
