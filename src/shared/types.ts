export type UserRole = "resident" | "volunteer" | "admin";

export type ModerationStatus = "pending" | "approved" | "rejected" | "hidden";

export type RsvpStatus = "going" | "maybe" | "not_going";

export type IssueLifecycle =
  | "received"
  | "in_progress"
  | "resolved"
  | "beyond_panch";

export type PetitionStatus =
  | "collecting"
  | "threshold_met"
  | "sent"
  | "acknowledged"
  | "no_response";

export const SESSION_COOKIE = "ward_session";
export const SESSION_TTL_DAYS = 30;
