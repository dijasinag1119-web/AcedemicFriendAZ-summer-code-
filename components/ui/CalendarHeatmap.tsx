'use client';
// components/ui/CalendarHeatmap.tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDaysInMonth, fromDateStr, toDateStr } from '@/lib/dateUtils';

interface DayRecord {
  date: string;
  status: 'present' | 'absent' | 'holiday';
}

interface CalendarHeatmapProps {
  records: DayRecord[];  // all records across all subjects for a given period
  onDayClick?: (date: string) => void;
  getStatusForDate?: (date: string) => 'present' | 'absent' | 'holiday' | 'partial' | null;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDayColor(status: string | null): string {
  switch (status) {
    case 'present': return 'heatmap-present';
    case 'absent':  return 'heatmap-absent';
    case 'holiday': return 'heatmap-holiday';
    case 'partial': return 'heatmap-holiday';
    default:        return 'heatmap-none';
  }
}

export default function CalendarHeatmap({ records, onDayClick, getStatusForDate }: CalendarHeatmapProps) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDow = fromDateStr(days[0]).getDay(); // start offset

  // Build status map from records
  const statusMap: Record<string, string> = {};
  records.forEach(r => { statusMap[r.date] = r.status; });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const todayStr = toDateStr();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={prevMonth} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px', display: 'flex' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px', display: 'flex' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {/* Empty cells for offset */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(dateStr => {
          const status = getStatusForDate ? getStatusForDate(dateStr) : statusMap[dateStr] || null;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const day = fromDateStr(dateStr).getDate();

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick?.(dateStr)}
              title={`${dateStr}: ${status || 'No data'}`}
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: isToday ? 700 : 400,
                cursor: onDayClick ? 'pointer' : 'default',
                border: isToday ? '2px solid var(--primary)' : '2px solid transparent',
                background: isFuture ? 'rgba(255,255,255,0.02)' : undefined,
                color: isFuture ? 'var(--text-dim)' : 'var(--text)',
                transition: 'transform 0.15s',
                position: 'relative',
              }}
              className={!isFuture ? getDayColor(status) : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[
          { cls: 'heatmap-present', label: 'Present' },
          { cls: 'heatmap-absent',  label: 'Absent' },
          { cls: 'heatmap-holiday', label: 'Holiday' },
          { cls: 'heatmap-none',    label: 'No class' },
        ].map(({ cls, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className={cls} style={{ width: '12px', height: '12px', borderRadius: '4px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
