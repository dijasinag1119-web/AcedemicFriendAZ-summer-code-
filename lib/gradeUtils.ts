// lib/gradeUtils.ts — Grade and CGPA calculation utilities

export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';

export interface GradeEntry {
  subjectName: string;
  credits: number;
  grade: GradeLetter;
  marksObtained?: number;
  totalMarks?: number;
}

// Grade point values (10-point scale)
export const GRADE_POINTS: Record<GradeLetter, number> = {
  'O':  10,
  'A+': 9,
  'A':  8,
  'B+': 7,
  'B':  6,
  'C':  5,
  'F':  0,
};

/**
 * Get letter grade from percentage
 */
export function getGradeFromPercent(percent: number): GradeLetter {
  if (percent >= 90) return 'O';
  if (percent >= 80) return 'A+';
  if (percent >= 70) return 'A';
  if (percent >= 60) return 'B+';
  if (percent >= 50) return 'B';
  if (percent >= 40) return 'C';
  return 'F';
}

/**
 * Calculate SGPA from a list of grade entries
 */
export function calcSGPA(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0;
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = grades.reduce((sum, g) => sum + g.credits * GRADE_POINTS[g.grade], 0);
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

/**
 * Calculate CGPA from multiple semesters' grade entries
 */
export function calcCGPA(allSemesterGrades: GradeEntry[][]): number {
  if (allSemesterGrades.length === 0) return 0;
  const sgpas = allSemesterGrades.map(calcSGPA).filter(s => s > 0);
  if (sgpas.length === 0) return 0;
  return Math.round((sgpas.reduce((a, b) => a + b, 0) / sgpas.length) * 100) / 100;
}

/**
 * What grade do I need in remaining subjects to reach target CGPA?
 */
export function gradeNeededForTarget(
  currentGrades: GradeEntry[],
  targetCGPA: number,
  remainingCredits: number
): number {
  const currentCredits = currentGrades.reduce((sum, g) => sum + g.credits, 0);
  const currentPoints  = currentGrades.reduce((sum, g) => sum + g.credits * GRADE_POINTS[g.grade], 0);
  const totalFutureCredits = currentCredits + remainingCredits;
  if (totalFutureCredits === 0) return 0;
  const needed = (targetCGPA * totalFutureCredits - currentPoints) / remainingCredits;
  return Math.round(needed * 100) / 100;
}

export const GRADE_COLORS: Record<GradeLetter, string> = {
  'O':  '#10b981',
  'A+': '#6366f1',
  'A':  '#8b5cf6',
  'B+': '#06b6d4',
  'B':  '#f59e0b',
  'C':  '#f97316',
  'F':  '#f43f5e',
};
