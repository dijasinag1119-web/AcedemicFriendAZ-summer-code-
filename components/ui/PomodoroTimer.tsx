'use client';
// components/ui/PomodoroTimer.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

interface PomodoroTimerProps {
  onComplete?: () => void;
}

const WORK_MINS = 25;
const BREAK_MINS = 5;

export default function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const [mode, setMode]       = useState<'work' | 'break'>('work');
  const [seconds, setSeconds] = useState(WORK_MINS * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = mode === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60;
  const percent = ((totalSeconds - seconds) / totalSeconds) * 100;

  const size = 180;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(mode === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (mode === 'work') {
              setSessions(prev => prev + 1);
              onComplete?.();
            }
            setMode(m => m === 'work' ? 'break' : 'work');
            return mode === 'work' ? BREAK_MINS * 60 : WORK_MINS * 60;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, onComplete]);

  const switchMode = (m: 'work' | 'break') => {
    setRunning(false);
    setMode(m);
    setSeconds(m === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60);
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  const ringColor = mode === 'work' ? '#6366f1' : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Mode toggle */}
      <div style={{
        display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)',
        borderRadius: '10px', padding: '4px',
      }}>
        {(['work', 'break'] as const).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: mode === m ? ringColor : 'transparent',
              color: mode === m ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {m === 'work' ? 'Focus 25m' : 'Break 5m'}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={ringColor} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 800,
            fontSize: '36px', color: 'var(--text)', letterSpacing: '-1px',
          }}>
            {mins}:{secs}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {mode === 'work' ? 'Focus' : 'Break'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={reset}
          className="btn-ghost"
          style={{ padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}
        >
          <RotateCcw size={18} />
        </button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setRunning(r => !r)}
          className="btn-primary"
          style={{
            padding: '12px 28px', borderRadius: '50px',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '15px', border: 'none',
          }}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? 'Pause' : 'Start'}
        </motion.button>
      </div>

      {/* Sessions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <Timer size={14} />
        <span>{sessions} session{sessions !== 1 ? 's' : ''} today</span>
        {sessions > 0 && (
          <span style={{ color: '#6366f1', fontWeight: 600, marginLeft: '4px' }}>+{sessions * 5} XP</span>
        )}
      </div>
    </div>
  );
}
