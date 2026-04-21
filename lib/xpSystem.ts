// lib/xpSystem.ts — XP award constants and level calculation

export const XP_REWARDS = {
  COMPLETE_TASK: 10,
  COMPLETE_CHAPTER: 5,
  MARK_ATTENDANCE: 3,
  COMPLETE_POMODORO: 5,
  QUIZ_PERFECT: 20,
  QUIZ_GREAT: 10,    // 80%+
  QUIZ_PASS: 5,      // 50%+
  SUBMIT_ASSIGNMENT: 8,
  CREATE_NOTE: 2,
  ADD_MARK: 15,
  UPLOAD_MATERIAL: 20,
  REMEMBER_FLASHCARD: 1,
  STREAK_7_DAY: 50,
  COMPLETE_SUBJECT: 100,
} as const;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function xpInCurrentLevel(xp: number): number {
  return xp % 100;
}

export function xpToNextLevel(xp: number): number {
  return 100 - (xp % 100);
}

export function getQuizXP(score: number, total: number): number {
  const pct = (score / total) * 100;
  if (pct === 100) return XP_REWARDS.QUIZ_PERFECT;
  if (pct >= 80) return XP_REWARDS.QUIZ_GREAT;
  if (pct >= 50) return XP_REWARDS.QUIZ_PASS;
  return 0;
}
