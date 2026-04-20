'use client';
// components/layout/TopBar.tsx
import { Bell, Menu, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { calculateLevel, xpInCurrentLevel } from '@/lib/xpSystem';
import { getGreeting } from '@/lib/dateUtils';
import Link from 'next/link';

interface TopBarProps {
  breadcrumb?: string;
  onMenuClick?: () => void;
}

export default function TopBar({ breadcrumb, onMenuClick }: TopBarProps) {
  const { userData } = useAuth();

  const xp      = userData?.xp ?? 0;
  const level   = calculateLevel(xp);
  const xpInLvl = xpInCurrentLevel(xp);
  const streak  = userData?.currentStreak ?? 0;
  const name    = userData?.name || 'Student';
  const initial = name.charAt(0).toUpperCase();

  return (
    <header style={{
      height: '64px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '16px',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="btn-ghost"
        style={{ padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {getGreeting()},
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userData?.name?.split(' ')[0] || 'Student'} 👋
        </span>
        {breadcrumb && (
          <>
            <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>/</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{breadcrumb}</span>
          </>
        )}
      </div>

      {/* Right side badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* XP badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
          padding: '5px 10px', borderRadius: '20px',
        }}>
          <span className="level-badge" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', color: 'white', fontWeight: 700 }}>
            Lv.{level}
          </span>
          <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${xpInLvl}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '10px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{xp}</span>
          <Zap size={11} color="#6366f1" />
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            padding: '5px 10px', borderRadius: '20px',
          }}>
            <Flame size={13} color="#f59e0b" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{streak}</span>
          </div>
        )}

        {/* Notification bell */}
        <button className="btn-ghost" style={{ padding: '7px', borderRadius: '10px', display: 'flex', position: 'relative' }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#f43f5e', border: '1.5px solid var(--bg)',
          }} />
        </button>

        {/* Avatar */}
        <Link href="/profile">
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '13px', color: 'white', cursor: 'pointer',
            overflow: 'hidden',
          }}>
            {userData?.photoURL
              ? <img src={userData.photoURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initial
            }
          </div>
        </Link>
      </div>
    </header>
  );
}
