'use client';
// components/ui/StatCard.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
}

export default function StatCard({ icon, label, value, sub, color = '#6366f1', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22,1,0.36,1] }}
      className="glass-card card-hover"
      style={{ borderRadius: '16px', padding: '18px 20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '40px', height: '40px',
          background: `${color}22`,
          border: `1px solid ${color}44`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '26px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{sub}</div>
      )}
    </motion.div>
  );
}
