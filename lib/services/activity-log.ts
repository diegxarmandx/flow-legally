import { ActivityType } from "@/types/legalflow";

export function activityMessage(type: ActivityType, subject: string) {
  const templates: Record<ActivityType, string> = {
    [ActivityType.INTAKE_CREATED]: `Intake created for ${subject}.`,
    [ActivityType.DOCUMENT_REQUESTED]: `Document requested: ${subject}.`,
    [ActivityType.DOCUMENT_RECEIVED]: `Document marked received: ${subject}.`,
    [ActivityType.FOLLOW_UP_CREATED]: `Follow-up generated: ${subject}.`,
    [ActivityType.FOLLOW_UP_COMPLETED]: `Follow-up completed: ${subject}.`,
    [ActivityType.SUMMARY_GENERATED]: `AI case summary generated for ${subject}.`,
    [ActivityType.NOTE_ADDED]: `Internal note added: ${subject}.`,
    [ActivityType.PAYMENT_UPDATED]: `Payment status updated to ${subject}.`,
    [ActivityType.STATUS_CHANGED]: `Case status changed to ${subject}.`
  };

  return templates[type];
}
