'use client';
// components/ui/BadgeCard.tsx
import { motion } from 'framer-motion';

interface BadgeCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  delay?: number;
}

export default function BadgeCard({ id, name, description, icon, color, unlocked, delay = 0 }: BadgeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.34,1.56,0.64,1] }}
      className={`glass-card ${unlocked ? 'card-hover' : 'badge-locked'}`}
      style={{
        borderRadius: '16px', padding: '16px',
        textAlign: 'center',
        border: unlocked ? `1px solid ${color}40` : '1px solid var(--border)',
        background: unlocked ? `${color}0d` : undefined,
      }}
      title={description}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: unlocked ? `${color}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${unlocked ? `${color}40` : 'transparent'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', margin: '0 auto 10px',
        filter: unlocked ? 'none' : 'grayscale(1)',
      }}>
        {icon}
      </div>
      <p style={{
        fontSize: '12px', fontWeight: 700,
        color: unlocked ? 'var(--text)' : 'var(--text-dim)',
        lineHeight: 1.3,
      }}>
        {name}
      </p>
      {unlocked && (
        <div style={{
          marginTop: '6px', fontSize: '10px', color: color,
          fontWeight: 600, letterSpacing: '0.5px',
        }}>
          ✓ Earned
        </div>
      )}
    </motion.div>
  );
}
