'use client';
// components/ui/TaskCard.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Zap } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  desc?: string;
  priority: 'high' | 'medium' | 'low';
  xpReward: number;
  done: boolean;
  dueDate?: string;
}

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.2)',   text: '#f43f5e',   label: 'High' },
  medium: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  text: '#f59e0b',   label: 'Medium' },
  low:    { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  text: '#10b981',   label: 'Low' },
};

export default function TaskCard({ task, onComplete }: TaskCardProps) {
  const [checking, setChecking] = useState(false);
  const p = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  const handleCheck = async () => {
    if (task.done || checking) return;
    setChecking(true);
    onComplete(task.id);
    setTimeout(() => setChecking(false), 500);
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: task.done ? 0.55 : 1 }}
      className="glass-card"
      style={{
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.2s ease',
        borderColor: task.done ? 'var(--border)' : undefined,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheck}
        disabled={task.done}
        style={{
          width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
          border: task.done ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.2)',
          background: task.done ? '#10b981' : 'transparent',
          cursor: task.done ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {task.done && <Check size={14} color="white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px', fontWeight: 600,
          color: task.done ? 'var(--text-dim)' : 'var(--text)',
          textDecoration: task.done ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{task.title}</p>
        {task.desc && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.desc}
          </p>
        )}
      </div>

      {/* Right badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Priority badge */}
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
          background: p.bg, border: `1px solid ${p.border}`, color: p.text,
          letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          {p.label}
        </span>

        {/* XP badge */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          fontSize: '11px', fontWeight: 700,
          color: task.done ? '#10b981' : '#6366f1',
          background: task.done ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
          padding: '3px 8px', borderRadius: '20px',
        }}>
          <Zap size={10} />
          {task.xpReward}
        </span>
      </div>
    </motion.div>
  );
}
