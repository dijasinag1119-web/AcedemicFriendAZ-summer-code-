'use client';
// components/ui/XPPopup.tsx
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function XPPopupLayer() {
  const { xpEvents } = useAppContext();

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '24px',
      zIndex: 200,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      <AnimatePresence>
        {xpEvents.map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -50, scale: 1.1 }}
            exit={{ opacity: 0, y: -90, scale: 0.8 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: '15px',
              padding: '8px 16px',
              borderRadius: '50px',
              boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            +{event.amount} XP ✨
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
