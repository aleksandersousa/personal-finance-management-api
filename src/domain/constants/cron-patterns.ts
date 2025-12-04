export const CRON_PATTERNS = {
  // Every minute
  EVERY_MINUTE: '* * * * *',

  // Every hour
  EVERY_HOUR: '0 * * * *',
  EVERY_HOUR_AT_30: '30 * * * *',

  // Daily
  EVERY_DAY_AT_MIDNIGHT: '0 0 * * *',
  EVERY_DAY_AT_1AM: '0 1 * * *',
  EVERY_DAY_AT_2AM: '0 2 * * *',
  EVERY_DAY_AT_3AM: '0 3 * * *',
  EVERY_DAY_AT_NOON: '0 12 * * *',

  // Weekly
  EVERY_WEEK: '0 0 * * 0', // Sunday at midnight
  EVERY_MONDAY: '0 0 * * 1',
  EVERY_FRIDAY: '0 0 * * 5',

  // Monthly
  EVERY_MONTH: '0 0 1 * *', // First day of month at midnight
  EVERY_MONTH_AT_2AM: '0 2 1 * *',

  // Yearly
  EVERY_YEAR: '0 0 1 1 *', // January 1st at midnight
  EVERY_YEAR_AT_2AM: '0 2 1 1 *',

  // Custom intervals
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_10_MINUTES: '*/10 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',

  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
} as const;

export type CronPattern = (typeof CRON_PATTERNS)[keyof typeof CRON_PATTERNS];
