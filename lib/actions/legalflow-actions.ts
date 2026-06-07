"use server";

import { redirect } from "next/navigation";
import {
  addInternalNote,
  completeFollowUpTask,
  createFollowUpTask,
  createIntake,
  markDocumentReceived,
  regenerateSummary
} from "@/lib/repositories/legalflow-repository";
import {
  documentUpdateSchema,
  followUpTaskSchema,
  intakeSchema,
  internalNoteSchema
} from "@/lib/validations/legalflow";
import { DocumentStatus, FollowUpStatus } from "@/types/legalflow";

export type IntakeActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createIntakeAction(
  _previousState: IntakeActionState,
  formData: FormData
): Promise<IntakeActionState> {
  const raw = {
    clientName: String(formData.get("clientName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    caseType: String(formData.get("caseType") ?? ""),
    description: String(formData.get("description") ?? ""),
    urgencyLevel: String(formData.get("urgencyLevel") ?? ""),
    requiredDocuments: formData.getAll("requiredDocuments").map(String),
    paymentStatus: String(formData.get("paymentStatus") ?? ""),
    internalIntakeNotes: String(formData.get("internalIntakeNotes") ?? "")
  };

  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields before creating the intake.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const caseId = await createIntake(parsed.data);
  redirect(`/cases/${caseId}`);
}

export async function markDocumentReceivedAction(formData: FormData) {
  const parsed = documentUpdateSchema.safeParse({
    documentId: String(formData.get("documentId") ?? ""),
    status: DocumentStatus.RECEIVED
  });

  if (parsed.success) {
    await markDocumentReceived(parsed.data.documentId);
  }
}

export async function completeFollowUpAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  if (taskId) {
    await completeFollowUpTask(taskId);
  }
}

export async function createFollowUpAction(formData: FormData) {
  const parsed = followUpTaskSchema.safeParse({
    caseId: String(formData.get("caseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    status: FollowUpStatus.OPEN,
    priority: String(formData.get("priority") ?? "")
  });

  if (parsed.success) {
    await createFollowUpTask(parsed.data);
  }
}

export async function addInternalNoteAction(formData: FormData) {
  const parsed = internalNoteSchema.safeParse({
    caseId: String(formData.get("caseId") ?? ""),
    body: String(formData.get("body") ?? "")
  });

  if (parsed.success) {
    await addInternalNote(parsed.data);
  }
}

export async function regenerateSummaryAction(formData: FormData) {
  const caseId = String(formData.get("caseId") ?? "");
  if (caseId) {
    await regenerateSummary(caseId);
  }
}
