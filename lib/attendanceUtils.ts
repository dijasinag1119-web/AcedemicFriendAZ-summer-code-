// lib/attendanceUtils.ts — Attendance calculation utilities

export interface AttendanceRecord {
  date: string;       // YYYY-MM-DD
  status: 'present' | 'absent' | 'holiday';
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  total: number;       // excludes holidays
  percent: number;
  status: 'safe' | 'warning' | 'danger';
}

export function calcAttendance(records: AttendanceRecord[]): AttendanceSummary {
  const present = records.filter(r => r.status === 'present').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const total   = present + absent; // holidays excluded
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percent < 65) status = 'danger';
  else if (percent < 75) status = 'warning';

  return { present, absent, total, percent, status };
}

/**
 * How many consecutive classes must be attended to reach ≥75%
 * Returns 0 if already at or above 75%
 */
export function classesNeededFor75(present: number, total: number): number {
  if (total === 0) return 0;
  const current = present / total;
  if (current >= 0.75) return 0;

  // Solve: (present + x) / (total + x) >= 0.75
  // present + x >= 0.75 * (total + x)
  // present + x >= 0.75*total + 0.75*x
  // 0.25*x >= 0.75*total - present
  // x >= (0.75*total - present) / 0.25
  const x = Math.ceil((0.75 * total - present) / 0.25);
  return Math.max(0, x);
}

/**
 * How many classes can be skipped while staying at or above 75%
 * Returns 0 if below 75%
 */
export function classesCanSkip(present: number, total: number): number {
  if (total === 0) return 0;
  const current = present / total;
  if (current < 0.75) return 0;

  // Solve: present / (total + x) >= 0.75
  // present >= 0.75 * (total + x)
  // present / 0.75 - total >= x
  const x = Math.floor(present / 0.75 - total);
  return Math.max(0, x);
}

export function getStatusColor(status: 'safe' | 'warning' | 'danger'): string {
  switch (status) {
    case 'safe':    return '#10b981';
    case 'warning': return '#f59e0b';
    case 'danger':  return '#f43f5e';
  }
}

export function getStatusLabel(status: 'safe' | 'warning' | 'danger'): string {
  switch (status) {
    case 'safe':    return 'Safe';
    case 'warning': return 'Warning';
    case 'danger':  return 'Danger';
  }
}
