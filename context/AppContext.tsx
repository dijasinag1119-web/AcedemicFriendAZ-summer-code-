'use client';

// context/AppContext.tsx — Global XP popup state, theme, and toast management
import {
  createContext, useContext, useState, useCallback,
  useReducer, ReactNode, useEffect,
} from 'react';

// ── XP Popup ──────────────────────────────────────────────────────────────────

interface XPEvent {
  id: number;
  amount: number;
}

// ── Toast ──────────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ── Context Type ──────────────────────────────────────────────────────────────

interface AppContextType {
  // XP Popups
  xpEvents: XPEvent[];
  triggerXPPopup: (amount: number) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: number) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

let _toastId = 0;
let _xpId    = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [toasts, setToasts]     = useState<ToastMessage[]>([]);
  const [theme, setThemeState]  = useState<'dark' | 'light'>('dark');

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const triggerXPPopup = useCallback((amount: number) => {
    const id = ++_xpId;
    setXpEvents(prev => [...prev, { id, amount }]);
    setTimeout(() => setXpEvents(prev => prev.filter(e => e.id !== id)), 2500);
  }, []);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
  }, []);

  return (
    <AppContext.Provider value={{ xpEvents, triggerXPPopup, toasts, addToast, removeToast, theme, toggleTheme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
