import { describe, expect, it } from "vitest";
import { generateSummary } from "@/lib/services/summary";
import { CaseType, PaymentStatus, SummarySource, UrgencyLevel } from "@/types/legalflow";

describe("mock case summary service", () => {
  it("returns structured, legal-operations-oriented output", () => {
    const summary = generateSummary({
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
    expect(summary.source).toBe(SummarySource.RULE_BASED);
    expect(summary.version).toMatch(/^rules-/);
  });
});
