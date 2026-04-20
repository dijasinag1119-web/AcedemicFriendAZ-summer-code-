'use client';
// components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CalendarCheck, CalendarClock, BookOpen,
  ClipboardList, GraduationCap, FileText, BarChart2,
  Trophy, User, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { calculateLevel, xpInCurrentLevel } from '@/lib/xpSystem';

const NAV_ITEMS = [
  { href: '/dashboard',    icon: <LayoutDashboard  size={18} />, label: 'Dashboard' },
  { href: '/attendance',   icon: <CalendarCheck    size={18} />, label: 'Attendance' },
  { href: '/timetable',    icon: <CalendarClock    size={18} />, label: 'Timetable' },
  { href: '/subjects',     icon: <BookOpen         size={18} />, label: 'Subjects' },
  { href: '/assignments',  icon: <ClipboardList    size={18} />, label: 'Assignments' },
  { href: '/exams',        icon: <GraduationCap    size={18} />, label: 'Exams' },
  { href: '/notes',        icon: <FileText         size={18} />, label: 'Notes' },
  { href: '/analytics',   icon: <BarChart2         size={18} />, label: 'Analytics' },
  { href: '/leaderboard', icon: <Trophy            size={18} />, label: 'Leaderboard' },
  { href: '/profile',      icon: <User             size={18} />, label: 'Profile' },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const { userData } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const xp      = userData?.xp ?? 0;
  const level   = calculateLevel(xp);
  const xpInLvl = xpInCurrentLevel(xp);
  const name    = userData?.name || 'Student';
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="sidebar"
      style={{ overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 12px' }}>

        {/* Brand */}
        <div style={{ padding: '20px 4px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '16px', color: 'white',
          }}>
            E
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 800,
                  fontSize: '18px', color: 'var(--text)', whiteSpace: 'nowrap',
                }}
              >
                EduPro
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/') && href !== '/';
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? 'active' : ''}`}
                title={collapsed ? label : undefined}
              >
                <span style={{ flexShrink: 0, color: active ? 'var(--primary)' : undefined }}>{icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      style={{ whiteSpace: 'nowrap', fontSize: '14px' }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Avatar + XP */}
        <div style={{ padding: '12px 4px', borderTop: '1px solid var(--border)' }}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ marginBottom: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px', color: 'white',
                  }}>
                    {userData?.photoURL
                      ? <img src={userData.photoURL} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : initial
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="level-badge" style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', color: 'white', fontWeight: 700 }}>
                        Lv.{level}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{xp} XP</span>
                    </div>
                  </div>
                </div>

                {/* XP bar */}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpInLvl}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '10px' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="btn-ghost"
            style={{
              width: '100%', padding: '8px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
              fontSize: '12px', gap: '6px',
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <><span>Collapse</span><ChevronLeft size={16} /></>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
