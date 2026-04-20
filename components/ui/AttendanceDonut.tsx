'use client';
// components/ui/AttendanceDonut.tsx
import ProgressRing from './ProgressRing';

interface AttendanceDonutProps {
  percent: number;
  present: number;
  total: number;
  size?: number;
}

const STATUS_COLORS = {
  safe:    '#10b981',
  warning: '#f59e0b',
  danger:  '#f43f5e',
};

function getStatus(pct: number): 'safe' | 'warning' | 'danger' {
  if (pct >= 75) return 'safe';
  if (pct >= 65) return 'warning';
  return 'danger';
}

const STATUS_LABELS = { safe: 'Safe ✓', warning: 'Warning ⚠', danger: 'Danger ✗' };

export default function AttendanceDonut({ percent, present, total, size = 140 }: AttendanceDonutProps) {
  const status = getStatus(percent);
  const color  = STATUS_COLORS[status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <ProgressRing percent={percent} size={size} stroke={10} color={color} trackColor="rgba(255,255,255,0.05)">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: size > 100 ? '28px' : '18px', color }}>
            {percent}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{present}/{total}</div>
        </div>
      </ProgressRing>
      <span style={{
        fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
        background: `${color}20`, color, border: `1px solid ${color}40`,
      }}>
        {STATUS_LABELS[status]}
      </span>
    </div>
  );
}
