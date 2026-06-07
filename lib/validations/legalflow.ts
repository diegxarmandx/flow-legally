import { z } from "zod";
import {
  CaseStatus,
  CaseType,
  DocumentStatus,
  FollowUpStatus,
  FollowUpType,
  PaymentStatus,
  UrgencyLevel
} from "@/types/legalflow";

const requiredText = (message: string, max: number) => z.string().trim().min(1, message).max(max);

const phoneSchema = z
  .string()
  .trim()
  .max(24, "Phone number is too long.")
  .refine((value) => value.replace(/\D/g, "").length >= 7, {
    message: "Enter a phone number with at least 7 digits."
  });

const dateStringSchema = z
  .string()
  .trim()
  .min(1, "Choose a due date.")
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Choose a valid due date."
  })
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, {
    message: "Choose a valid due date."
  });

const documentListSchema = z
  .array(z.string().trim().min(2))
  .transform((documents) => Array.from(new Set(documents)))
  .refine((documents) => documents.length > 0, {
    message: "Select at least one required document."
  });

export const clientSchema = z.object({
  name: requiredText("Client name is required.", 120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: phoneSchema
});

export const intakeSchema = z.object({
  clientName: requiredText("Client name is required.", 120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: phoneSchema,
  caseType: z.nativeEnum(CaseType),
  description: z.string().trim().min(24, "Add at least a short description of the legal matter.").max(3000),
  urgencyLevel: z.nativeEnum(UrgencyLevel),
  requiredDocuments: documentListSchema,
  paymentStatus: z.nativeEnum(PaymentStatus),
  internalIntakeNotes: z.string().trim().max(1500).optional()
});

export const caseUpdateSchema = z.object({
  status: z.nativeEnum(CaseStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  urgencyLevel: z.nativeEnum(UrgencyLevel).optional(),
  intakeCompleted: z.boolean().optional()
});

export const documentUpdateSchema = z.object({
  documentId: z.string().min(1),
  status: z.nativeEnum(DocumentStatus)
});

export const followUpTaskSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().trim().min(3, "Add a task title.").max(160),
  type: z.nativeEnum(FollowUpType),
  dueDate: dateStringSchema,
  status: z.nativeEnum(FollowUpStatus).default(FollowUpStatus.OPEN),
  priority: z.nativeEnum(UrgencyLevel)
});

export const internalNoteSchema = z.object({
  caseId: z.string().min(1),
  body: z.string().trim().min(3, "Add a note before saving.").max(2000)
});

export type IntakeFormValues = z.infer<typeof intakeSchema>;
