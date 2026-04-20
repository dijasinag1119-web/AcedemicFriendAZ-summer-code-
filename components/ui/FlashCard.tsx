'use client';
// components/ui/FlashCard.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Check } from 'lucide-react';

interface FlashCardProps {
  front: string;
  back: string;
  remembered?: boolean;
  onRemember?: () => void;
  cardIndex?: number;
  total?: number;
}

export default function FlashCard({ front, back, remembered, onRemember, cardIndex, total }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {cardIndex !== undefined && total !== undefined && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Card {cardIndex + 1} of {total}
        </div>
      )}

      {/* Card */}
      <div
        className="flip-card"
        onClick={() => setFlipped(f => !f)}
        style={{ width: '100%', maxWidth: '480px', height: '240px', cursor: 'pointer' }}
      >
        <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div
            className="flip-card-front glass-card"
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
              QUESTION
            </div>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
              {front}
            </p>
            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)' }}>
              Click to reveal answer
            </div>
          </div>

          {/* Back */}
          <div
            className="flip-card-back glass-card"
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
              ANSWER
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text)', lineHeight: 1.6 }}>
              {back}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => setFlipped(f => !f)}
          className="btn-ghost"
          style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <RotateCw size={14} />
          Flip
        </button>

        {onRemember && (
          <button
            onClick={onRemember}
            style={{
              padding: '8px 20px', borderRadius: '10px',
              background: remembered ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${remembered ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              color: remembered ? '#10b981' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Check size={14} />
            {remembered ? 'Remembered!' : 'Mark as Remembered'}
          </button>
        )}
      </div>
    </div>
  );
}
