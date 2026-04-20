'use client';
// components/layout/PageWrapper.tsx — Shared page layout with sidebar + topbar
import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

interface PageWrapperProps {
  children: ReactNode;
  breadcrumb?: string;
}

export default function PageWrapper({ children, breadcrumb }: PageWrapperProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--primary)', animation: 'spinRing 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-with-sidebar">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '240px', height: '100%' }}
          >
            <Sidebar />
          </motion.div>
        </div>
      )}

      {/* Main content area */}
      <div className="main-content">
        <TopBar breadcrumb={breadcrumb} onMenuClick={() => setMobileMenuOpen(o => !o)} />

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: '24px 24px 100px',
            maxWidth: '1320px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </motion.main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </div>
  );
}
