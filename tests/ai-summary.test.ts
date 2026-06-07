import { describe, expect, it } from "vitest";
import { generateAISummary } from "@/lib/services/ai-summary";
import { CaseType, PaymentStatus, UrgencyLevel } from "@/types/legalflow";

describe("mock AI summary service", () => {
  it("returns structured, legal-operations-oriented output", () => {
    const summary = generateAISummary({
      caseType: CaseType.CONTRACT_REVIEW,
      caseDescription: "Client needs a vendor agreement reviewed before a board meeting.",
      urgencyLevel: UrgencyLevel.HIGH,
      missingDocuments: ["Contract draft"],
      paymentStatus: PaymentStatus.PENDING,
      intakeNotes: "Board meeting is Friday."
    });

    expect(summary.situationSummary).toContain("Contract Review");
    expect(summary.keyRisks.length).toBeGreaterThanOrEqual(3);
    expect(summary.missingInformation).toContain("Contract draft");
    expect(summary.recommendedNextSteps.join(" ")).toContain("follow-up queue");
    expect(summary.priorityLevel).toBe(UrgencyLevel.HIGH);
  });
});
