import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export function periodStart(period: 'day' | 'week' | 'month', now = new Date()): Date {
  if (period === 'day') return startOfDay(now);
  if (period === 'week') return startOfWeek(now, { weekStartsOn: 1 });
  return startOfMonth(now);
}

export function isInPeriod(date: Date, period: 'day' | 'week' | 'month', now = new Date()): boolean {
  return date >= periodStart(period, now);
}
