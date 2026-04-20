'use client';
// components/ui/DeadlineCard.tsx
import { formatCountdown, fromDateStr } from '@/lib/dateUtils';
import { Calendar, Clock } from 'lucide-react';

interface DeadlineCardProps {
  title: string;
  subject: string;
  subjectColor: string;
  dueDate: string;
  type?: string;
}

export default function DeadlineCard({ title, subject, subjectColor, dueDate, type }: DeadlineCardProps) {
  const { days, label, urgent } = formatCountdown(dueDate);
  
  const urgencyClass = days < 0 ? 'urgency-high' : days <= 2 ? 'urgency-high' : days <= 7 ? 'urgency-medium' : 'urgency-low';
  const dateFormatted = fromDateStr(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: '14px', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderLeft: `3px solid ${subjectColor}`,
      }}
    >
      {/* Subject color dot */}
      <div style={{
        width: '10px', height: '10px', borderRadius: '50%',
        background: subjectColor, flexShrink: 0,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
          <span style={{ fontSize: '11px', color: subjectColor, fontWeight: 600 }}>{subject}</span>
          {type && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>• {type}</span>}
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={10} />
            {dateFormatted}
          </span>
        </div>
      </div>

      {/* Countdown badge */}
      <span className={urgencyClass} style={{
        fontSize: '11px', fontWeight: 700, padding: '4px 10px',
        borderRadius: '20px', flexShrink: 0,
        whiteSpace: 'nowrap', border: '1px solid currentColor',
      }}>
        {label}
      </span>
    </div>
  );
}
