import {
  CaseType,
  PaymentStatus,
  SummarySource,
  UrgencyLevel,
  type SummaryDraft,
  type SummaryInput
} from "@/types/legalflow";
import { labelFor } from "@/lib/utils/format";

export const SUMMARY_RULESET_VERSION = "rules-v1";

const caseSpecificRisk: Record<CaseType, string> = {
  [CaseType.IMMIGRATION]: "Immigration timelines and documentation gaps may affect filing readiness.",
  [CaseType.BANKRUPTCY]: "Incomplete creditor or income information may delay petition preparation.",
  [CaseType.PERSONAL_INJURY]: "Medical records and incident documentation are needed to preserve claim value.",
  [CaseType.FAMILY_LAW]: "Time-sensitive family court issues require careful communication and documentation.",
  [CaseType.ESTATE_PLANNING]: "Asset and beneficiary details must be complete before attorney drafting.",
  [CaseType.CONTRACT_REVIEW]: "Business deadlines and unclear contract terms may require fast attorney review."
};

export function generateSummary(input: SummaryInput): SummaryDraft {
  const missingInformation =
    input.missingDocuments.length > 0
      ? input.missingDocuments
      : ["No blocking documents identified from the current intake packet."];

  const paymentRisk =
    input.paymentStatus === PaymentStatus.PAID || input.paymentStatus === PaymentStatus.NOT_REQUIRED
      ? "Payment is not currently blocking review."
      : `Payment is ${labelFor(input.paymentStatus).toLowerCase()} and should be resolved before attorney time is scheduled.`;

  const urgencyRisk =
    input.urgencyLevel === UrgencyLevel.CRITICAL || input.urgencyLevel === UrgencyLevel.HIGH
      ? `${labelFor(input.urgencyLevel)} urgency indicates the matter should be triaged ahead of routine intakes.`
      : "No emergency timing issue is apparent from the intake.";

  return {
    source: SummarySource.RULE_BASED,
    version: SUMMARY_RULESET_VERSION,
    situationSummary: `${labelFor(input.caseType)} intake describing ${input.caseDescription.trim()} The matter is currently tagged ${labelFor(input.urgencyLevel).toLowerCase()} priority with ${labelFor(input.paymentStatus).toLowerCase()} payment status.`,
    keyRisks: [caseSpecificRisk[input.caseType], paymentRisk, urgencyRisk],
    missingInformation,
    recommendedNextSteps: [
      "Confirm the client's factual timeline and preferred communication channel.",
      "Resolve all missing document requests before attorney review.",
      "Use the follow-up queue to keep the client moving without manual tracking.",
      input.intakeNotes
        ? `Review intake note before attorney assignment: ${input.intakeNotes}`
        : "Add an internal note if the intake team learns new facts before review."
    ],
    priorityLevel:
      input.urgencyLevel === UrgencyLevel.CRITICAL
        ? UrgencyLevel.CRITICAL
        : input.urgencyLevel === UrgencyLevel.HIGH || input.paymentStatus === PaymentStatus.OVERDUE
          ? UrgencyLevel.HIGH
          : UrgencyLevel.STANDARD
  };
}
