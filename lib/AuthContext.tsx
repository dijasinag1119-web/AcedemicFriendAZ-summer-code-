'use client';

// lib/AuthContext.tsx — Firebase Auth state + user data management
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toDateStr, calcStreakUpdate } from './dateUtils';
import { calculateLevel } from './xpSystem';
import {
  SEED_SUBJECTS, SEED_TIMETABLE,
  getSeedTasks, getSeedAssignments, getSeedExams,
  getSeedNotes, getSeedAttendance, getSeedActivity,
} from './seedData';
import { injectSeedData } from './firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserData {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  college: string;
  semester: string;
  branch: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  badges: string[];
  cgpa: number;
  totalStudyMinutes: number;
  createdAt: string;
  settings: { theme: 'dark' | 'light'; notifications: boolean };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  awardXP: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Default user data ─────────────────────────────────────────────────────────

function createDefaultUserData(user: User): UserData {
  return {
    uid: user.uid,
    name: user.displayName || 'Student',
    email: user.email || '',
    photoURL: user.photoURL || '',
    college: 'My University',
    semester: '4th',
    branch: 'Computer Science',
    xp: 150,
    level: 2,
    currentStreak: 3,
    longestStreak: 7,
    lastActiveDate: toDateStr(),
    badges: ['first_steps'],
    cgpa: 0,
    totalStudyMinutes: 0,
    createdAt: new Date().toISOString(),
    settings: { theme: 'dark', notifications: true },
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadOrCreateUser(firebaseUser);
      } else {
        setUserData(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const loadOrCreateUser = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // New user — create document + inject seed data
        const defaultData = createDefaultUserData(firebaseUser);
        await setDoc(userRef, defaultData);

        // Inject all seed data in background
        const subjectsData = SEED_SUBJECTS.map(s => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          color: s.color,
          credits: s.credits,
          progress: 0,
          chapters: s.chapters.map((title, idx) => ({
            id: `ch${idx + 1}`,
            title,
            status: 'not_started',
            notes: '',
          })),
        }));

        await injectSeedData(
          firebaseUser.uid,
          getSeedTasks() as Record<string, unknown>[],
          subjectsData as Record<string, unknown>[],
          getSeedAttendance() as Record<string, Record<string, unknown>>,
          SEED_TIMETABLE as unknown as Record<string, unknown>[],
          getSeedAssignments() as Record<string, unknown>[],
          getSeedExams() as Record<string, unknown>[],
          getSeedNotes() as Record<string, unknown>[],
          getSeedActivity() as Record<string, Record<string, unknown>>,
        );

        setUserData(defaultData);
      } else {
        const data = snap.data() as UserData;

        // Update streak on load
        const streakUpdate = calcStreakUpdate(data.lastActiveDate, data.currentStreak);
        if (streakUpdate.shouldUpdate) {
          const newLongest = Math.max(streakUpdate.newStreak, data.longestStreak || 0);
          await updateDoc(userRef, {
            currentStreak: streakUpdate.newStreak,
            longestStreak: newLongest,
            lastActiveDate: toDateStr(),
          });
          setUserData({ ...data, currentStreak: streakUpdate.newStreak, longestStreak: newLongest, lastActiveDate: toDateStr() });
        } else {
          setUserData(data);
        }
      }
    } catch (err) {
      console.error('Failed to load/create user:', err);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUserData(null);
  }, []);

  const updateUserData = useCallback(async (data: Partial<UserData>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), data as Record<string, unknown>);
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  }, [user]);

  const awardXP = useCallback(async (amount: number) => {
    if (!user || !userData) return;
    const newXP = (userData.xp || 0) + amount;
    const newLevel = calculateLevel(newXP);
    await updateUserData({ xp: newXP, level: newLevel });
  }, [user, userData, updateUserData]);

  return (
    <AuthContext.Provider value={{ user, userData, isLoading, signInWithGoogle, signOut, updateUserData, awardXP }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
