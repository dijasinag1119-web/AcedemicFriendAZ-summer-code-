// lib/dateUtils.ts — Date and streak utilities

/**
 * Returns time-aware greeting based on current hour
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format date as "Monday, April 20"
 */
export function formatDateLong(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Format date as YYYY-MM-DD
 */
export function toDateStr(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse YYYY-MM-DD to Date (local midnight)
 */
export function fromDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get day of week index (0=Sun, 1=Mon, ..., 6=Sat) for a YYYY-MM-DD string
 */
export function getDayIndex(dateStr: string): number {
  return fromDateStr(dateStr).getDay();
}

/**
 * Get array of YYYY-MM-DD strings for the current week (Mon–Sun)
 */
export function getCurrentWeekDays(): string[] {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const mon   = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toDateStr(d);
  });
}

/**
 * Countdown in days + label (e.g., "12 days left", "Today!", "Overdue")
 */
export function formatCountdown(dateStr: string): { days: number; label: string; urgent: boolean } {
  const target = fromDateStr(dateStr);
  const now    = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0)  return { days: diff, label: 'Overdue', urgent: true };
  if (diff === 0) return { days: 0, label: 'Today!', urgent: true };
  if (diff === 1) return { days: 1, label: 'Tomorrow', urgent: true };
  return { days: diff, label: `${diff} days left`, urgent: diff <= 7 };
}

/**
 * Calculate streak from lastActiveDate string (YYYY-MM-DD)
 * Returns number of days to increment (0 or 1) and whether to reset
 */
export function calcStreakUpdate(
  lastActiveDate: string | null,
  currentStreak: number
): { newStreak: number; shouldUpdate: boolean } {
  const todayStr = toDateStr();
  if (!lastActiveDate) return { newStreak: 1, shouldUpdate: true };
  if (lastActiveDate === todayStr) return { newStreak: currentStreak, shouldUpdate: false }; // already active today

  const last  = fromDateStr(lastActiveDate);
  const today = fromDateStr(todayStr);
  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return { newStreak: currentStreak + 1, shouldUpdate: true }; // consecutive
  return { newStreak: 1, shouldUpdate: true }; // gap — reset
}

/**
 * Get all days in a given month as YYYY-MM-DD strings
 */
export function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * Format minutes as "Xh Ym" or "Ym"
 */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Time difference in minutes between two "HH:MM" strings
 */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/**
 * Format "HH:MM" to "8:00 AM" style
 */
export function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Get minutes until a given "HH:MM" time today (negative if past)
 */
export function minutesUntil(time: string): number {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}
