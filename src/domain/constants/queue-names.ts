export const QUEUE_NAMES = {
  EMAIL: 'email',
  TOKEN_CLEANUP: 'token-cleanup',
  NOTIFICATION: 'notification',
  RECURRING_ENTRIES: 'recurring-entries',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
