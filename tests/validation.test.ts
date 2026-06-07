import { describe, expect, it } from "vitest";
import { followUpTaskSchema, intakeSchema } from "@/lib/validations/legalflow";
import { CaseType, FollowUpStatus, FollowUpType, PaymentStatus, UrgencyLevel } from "@/types/legalflow";

describe("intake validation", () => {
  it("rejects invalid form input with useful field errors", () => {
    const result = intakeSchema.safeParse({
      clientName: "",
      email: "not-an-email",
      phone: "12",
      caseType: CaseType.IMMIGRATION,
      description: "Too short",
      urgencyLevel: UrgencyLevel.STANDARD,
      requiredDocuments: [],
      paymentStatus: PaymentStatus.PENDING
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.clientName).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.requiredDocuments).toBeDefined();
    }
  });

  it("rejects phone values that do not contain enough digits", () => {
    const result = intakeSchema.safeParse({
      clientName: "Avery Stone",
      email: "avery@example.com",
      phone: "not-a-phone",
      caseType: CaseType.ESTATE_PLANNING,
      description: "Client needs estate documents updated after moving and adding a new beneficiary.",
      urgencyLevel: UrgencyLevel.STANDARD,
      requiredDocuments: ["Asset list"],
      paymentStatus: PaymentStatus.PAID
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone).toBeDefined();
    }
  });

  it("accepts a complete legal intake", () => {
    const result = intakeSchema.safeParse({
      clientName: "Avery Stone",
      email: "avery@example.com",
      phone: "(312) 555-0199",
      caseType: CaseType.ESTATE_PLANNING,
      description: "Client needs estate documents updated after moving and adding a new beneficiary.",
      urgencyLevel: UrgencyLevel.STANDARD,
      requiredDocuments: ["Asset list"],
      paymentStatus: PaymentStatus.PAID,
      internalIntakeNotes: "Prefers morning calls."
    });

    expect(result.success).toBe(true);
  });

  it("normalizes duplicate document selections", () => {
    const result = intakeSchema.safeParse({
      clientName: "Avery Stone",
      email: "AVERY@EXAMPLE.COM ",
      phone: "(312) 555-0199",
      caseType: CaseType.ESTATE_PLANNING,
      description: "Client needs estate documents updated after moving and adding a new beneficiary.",
      urgencyLevel: UrgencyLevel.STANDARD,
      requiredDocuments: ["Asset list", "Asset list"],
      paymentStatus: PaymentStatus.PAID,
      internalIntakeNotes: "Prefers morning calls."
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("avery@example.com");
      expect(result.data.requiredDocuments).toEqual(["Asset list"]);
    }
  });

  it("rejects invalid follow-up due dates before repository mutation", () => {
    const result = followUpTaskSchema.safeParse({
      caseId: "case_test",
      title: "Call client",
      type: FollowUpType.GENERAL,
      dueDate: "2026-02-31",
      status: FollowUpStatus.OPEN,
      priority: UrgencyLevel.STANDARD
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.dueDate).toBeDefined();
    }
  });
});
