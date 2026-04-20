'use client';
// components/layout/MobileNav.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, BookOpen, ClipboardList, User } from 'lucide-react';

const MOBILE_NAV = [
  { href: '/dashboard',   icon: <LayoutDashboard size={20} />, label: 'Home' },
  { href: '/attendance',  icon: <CalendarCheck   size={20} />, label: 'Attend' },
  { href: '/subjects',    icon: <BookOpen        size={20} />, label: 'Subjects' },
  { href: '/assignments', icon: <ClipboardList   size={20} />, label: 'Tasks' },
  { href: '/profile',     icon: <User            size={20} />, label: 'Profile' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav lg:hidden">
      {MOBILE_NAV.map(({ href, icon, label }) => {
        const active = pathname === href || (pathname.startsWith(href + '/') && href !== '/');
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '4px', padding: '10px 4px',
              color: active ? 'var(--primary)' : 'var(--text-dim)',
              textDecoration: 'none', fontSize: '10px', fontWeight: 600,
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '25%', right: '25%',
                height: '2px', background: 'var(--primary)', borderRadius: '0 0 4px 4px',
              }} />
            )}
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
