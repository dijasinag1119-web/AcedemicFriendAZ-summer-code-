'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { BRANCH_META } from '@/lib/academicData';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/subjects',  label: 'Subjects',  icon: '📚' },
];

export default function Header() {
  const { studentName, xp, level, recentXpGain, selectedBranch, selectedSemester, setSemester } = useApp();
  const pathname  = usePathname();
  const router    = useRouter();
  const xpInLevel = xp % 100;
  const meta      = BRANCH_META[selectedBranch];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/5 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-md">
            🎓
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">StudyArc</span>
        </Link>

        {/* Branch + Semester pill */}
        {selectedBranch && (
          <div className="hidden md:flex items-center gap-2 glass-card border border-white/5 rounded-lg px-3 py-1.5">
            <span className="text-base">{meta?.icon ?? '🎓'}</span>
            <span className="text-xs text-slate-300 font-medium">{meta?.shortName ?? selectedBranch}</span>
            <span className="text-white/20">|</span>
            {/* Semester quick-switch */}
            <select
              id="header-sem-select"
              value={selectedSemester}
              onChange={e => setSemester(Number(e.target.value))}
              className="bg-transparent text-xs text-indigo-300 font-semibold cursor-pointer outline-none border-none"
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map(s => (
                <option key={s} value={s} className="bg-[#1e1e2e] text-white">
                  Sem {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span className="hidden sm:block">{link.label}</span>
            </Link>
          ))}

          {/* Change setup button */}
          {selectedBranch && (
            <button
              id="change-setup-btn"
              onClick={() => router.push('/setup')}
              title="Change branch / semester"
              className="text-slate-500 hover:text-indigo-400 px-2 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 text-sm"
            >
              ⚙️
            </button>
          )}
        </nav>

        {/* XP + Level */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* XP Float Notification */}
          {recentXpGain !== null && (
            <div className="absolute -top-8 right-0 animate-xp-float text-yellow-400 font-bold text-sm whitespace-nowrap pointer-events-none z-50">
              +{recentXpGain} XP ✨
            </div>
          )}

          {/* Level badge */}
          <div className="flex items-center gap-1.5 level-badge text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-md">
            <span>⚡</span>
            <span>Lvl {level}</span>
          </div>

          {/* XP bar */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="xp-badge text-white text-xs font-semibold px-2 py-0.5 rounded-md">{xp} XP</div>
            <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full progress-bar-fill"
                style={{ width: `${xpInLevel}%` }}
              />
            </div>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {studentName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
