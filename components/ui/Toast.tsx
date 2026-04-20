'use client';
// components/ui/Toast.tsx
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <XCircle size={16} />,
  info:    <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '#10b981' },
  error:   { bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.3)',  icon: '#f43f5e' },
  info:    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', icon: '#6366f1' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '#f59e0b' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useAppContext();

  return (
    <div className="toast-container" style={{ pointerEvents: 'none' }}>
      <AnimatePresence>
        {toasts.map(toast => {
          const color = COLORS[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                pointerEvents: 'all',
                background: color.bg,
                border: `1px solid ${color.border}`,
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                maxWidth: '360px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ color: color.icon, flexShrink: 0, marginTop: '1px' }}>
                {ICONS[toast.type]}
              </span>
              <p style={{ color: 'var(--text)', fontSize: '13px', lineHeight: '1.5', flex: 1 }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ color: 'var(--text-dim)', flexShrink: 0, cursor: 'pointer', background: 'none', border: 'none', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
