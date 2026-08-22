// Placeholder — real shared types (e.g. classification schema) land here in Phase 5.
export interface Placeholder {
  id: string;
}

// Backlog classification job — /web enqueues it (Step 16), /worker will
// process it starting Phase 5. Keeping the shape here so both sides agree.
export const BACKLOG_QUEUE_NAME = "backlog-classification";

export type BacklogDateRange = "7d" | "30d" | "forward";

export interface BacklogJobData {
  userId: string;
  dateRange: BacklogDateRange;
}
