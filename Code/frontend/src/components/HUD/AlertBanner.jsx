import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

const AlertBanner = ({ level, hazard }) => {
  if (level === 'safe') return null;

  const isDanger = level === 'danger';

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 20, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="glass alert-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '16px 24px',
        width: '90%',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 100,
        borderLeft: `6px solid ${isDanger ? 'var(--color-danger)' : 'var(--color-caution)'}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`
      }}
    >
      <div style={{ color: isDanger ? 'var(--color-danger)' : 'var(--color-caution)' }}>
        {isDanger ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
      </div>
      <div>
        <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>
          {level} ALERT
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800 }}>
          {hazard || 'Obstacle Detected'}
        </div>
      </div>
      
      {isDanger && (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--color-danger)',
            opacity: 0.1,
            borderRadius: '16px',
            pointerEvents: 'none'
          }}
        />
      )}
    </motion.div>
  );
};

export default AlertBanner;
