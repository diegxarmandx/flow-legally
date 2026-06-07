import { CaseType } from "@/types/legalflow";

export const documentChecklistByCaseType: Record<CaseType, string[]> = {
  [CaseType.IMMIGRATION]: [
    "Government ID",
    "Passport biographic page",
    "Prior immigration notices",
    "Proof of current address"
  ],
  [CaseType.BANKRUPTCY]: [
    "Recent pay stubs",
    "Tax returns",
    "Creditor list",
    "Bank statements"
  ],
  [CaseType.PERSONAL_INJURY]: [
    "Incident report",
    "Medical records",
    "Insurance correspondence",
    "Photos or evidence"
  ],
  [CaseType.FAMILY_LAW]: [
    "Marriage or custody order",
    "Financial disclosure",
    "Prior court filings",
    "Communication history"
  ],
  [CaseType.ESTATE_PLANNING]: [
    "Asset list",
    "Beneficiary information",
    "Existing estate documents",
    "Healthcare directive preferences"
  ],
  [CaseType.CONTRACT_REVIEW]: [
    "Contract draft",
    "Statement of business goals",
    "Negotiation history",
    "Related exhibits"
  ]
};
