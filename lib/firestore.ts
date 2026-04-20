// lib/firestore.ts — Typed Firestore CRUD helpers

import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, getDocs, query, orderBy, limit, where,
  onSnapshot, serverTimestamp, writeBatch, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── User ──────────────────────────────────────────────────────────────────────

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function setUser(uid: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function updateUser(uid: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid), data);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'tasks'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addTask(uid: string, task: Record<string, unknown>) {
  return addDoc(collection(db, 'users', uid, 'tasks'), { ...task, createdAt: serverTimestamp() });
}

export async function updateTask(uid: string, taskId: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), data);
}

export async function deleteTask(uid: string, taskId: string) {
  await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
}

// ── Subjects ──────────────────────────────────────────────────────────────────

export async function getSubjects(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'subjects'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setSubject(uid: string, subjectId: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid, 'subjects', subjectId), data, { merge: true });
}

export async function updateSubject(uid: string, subjectId: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid, 'subjects', subjectId), data);
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendance(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'attendance'));
  return snap.docs.map(d => ({ subjectId: d.id, ...d.data() }));
}

export async function setAttendance(uid: string, subjectId: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid, 'attendance', subjectId), data, { merge: true });
}

// ── Timetable ─────────────────────────────────────────────────────────────────

export async function getTimetable(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'timetable'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addTimetableSlot(uid: string, slotId: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid, 'timetable', slotId), data);
}

export async function deleteTimetableSlot(uid: string, slotId: string) {
  await deleteDoc(doc(db, 'users', uid, 'timetable', slotId));
}

// ── Assignments ──────────────────────────────────────────────────────────────

export async function getAssignments(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'assignments'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAssignment(uid: string, data: Record<string, unknown>) {
  return addDoc(collection(db, 'users', uid, 'assignments'), { ...data, createdAt: serverTimestamp() });
}

export async function updateAssignment(uid: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid, 'assignments', id), data);
}

export async function deleteAssignment(uid: string, id: string) {
  await deleteDoc(doc(db, 'users', uid, 'assignments', id));
}

// ── Exams ─────────────────────────────────────────────────────────────────────

export async function getExams(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'exams'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addExam(uid: string, data: Record<string, unknown>) {
  return addDoc(collection(db, 'users', uid, 'exams'), { ...data, createdAt: serverTimestamp() });
}

export async function updateExam(uid: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid, 'exams', id), data);
}

export async function deleteExam(uid: string, id: string) {
  await deleteDoc(doc(db, 'users', uid, 'exams', id));
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getNotes(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'notes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setNote(uid: string, noteId: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid, 'notes', noteId), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteNote(uid: string, noteId: string) {
  await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
}

// ── Activity ──────────────────────────────────────────────────────────────────

export async function getActivity(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'activity'));
  return snap.docs.map(d => ({ date: d.id, ...d.data() }));
}

export async function updateActivity(uid: string, dateStr: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid, 'activity', dateStr), data, { merge: true });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard(limitCount = 15) {
  const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d, idx) => ({ rank: idx + 1, uid: d.id, ...d.data() }));
}

// ── Batch seed data injection ─────────────────────────────────────────────────

export async function injectSeedData(
  uid: string,
  tasks: Record<string, unknown>[],
  subjects: Record<string, unknown>[],
  attendance: Record<string, Record<string, unknown>>,
  timetable: Record<string, unknown>[],
  assignments: Record<string, unknown>[],
  exams: Record<string, unknown>[],
  notes: Record<string, unknown>[],
  activity: Record<string, Record<string, unknown>>
) {
  const batch = writeBatch(db);

  tasks.forEach(t => {
    const ref = doc(collection(db, 'users', uid, 'tasks'));
    batch.set(ref, t);
  });

  subjects.forEach(s => {
    const { id, ...rest } = s as { id: string } & Record<string, unknown>;
    batch.set(doc(db, 'users', uid, 'subjects', id), rest);
  });

  Object.entries(attendance).forEach(([subId, data]) => {
    batch.set(doc(db, 'users', uid, 'attendance', subId), data);
  });

  timetable.forEach(slot => {
    const { id, ...rest } = slot as { id: string } & Record<string, unknown>;
    batch.set(doc(db, 'users', uid, 'timetable', id), rest);
  });

  assignments.forEach(a => {
    const ref = doc(collection(db, 'users', uid, 'assignments'));
    batch.set(ref, a);
  });

  exams.forEach(e => {
    const ref = doc(collection(db, 'users', uid, 'exams'));
    batch.set(ref, e);
  });

  notes.forEach(n => {
    const { id, ...rest } = n as { id: string } & Record<string, unknown>;
    batch.set(doc(db, 'users', uid, 'notes', id), rest);
  });

  Object.entries(activity).forEach(([dateStr, data]) => {
    batch.set(doc(db, 'users', uid, 'activity', dateStr), data);
  });

  await batch.commit();
}
