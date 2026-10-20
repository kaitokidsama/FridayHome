export interface ReminderRequest {
  title: string;
  body: string;
  at: Date;
}

/** Port for scheduling local reminders. Adapters wrap the platform notification API. */
export interface ReminderScheduler {
  /** Returns the scheduled reminder id, or null when it could not be scheduled. */
  schedule(request: ReminderRequest): Promise<string | null>;
  cancel(reminderId: string): Promise<void>;
}
