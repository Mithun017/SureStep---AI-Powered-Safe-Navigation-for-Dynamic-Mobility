import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const SOSButton = ({ onTrigger }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const startHold = () => {
    setHolding(true);
    setProgress(0);
    
    timerRef.current = setTimeout(() => {
      onTrigger();
      setHolding(false);
      setProgress(0);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }, 2000);

    intervalRef.current = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / 20), 100));
    }, 100);
  };

  const endHold = () => {
    setHolding(false);
    setProgress(0);
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
  };

  return (
    <div className="sos-button-wrapper">
      <motion.button
        className="sos-button"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        whileTap={{ scale: 0.9 }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--color-danger)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: `0 0 20px var(--color-danger)66`,
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <Shield size={36} />
        
        {/* Progress Ring */}
        <svg style={{ position: 'absolute', top: -5, left: -5, width: '90px', height: '90px', transform: 'rotate(-90deg)' }}>
          <circle
            cx="45"
            cy="45"
            r="42"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 42}
            strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
            style={{ opacity: holding ? 1 : 0 }}
          />
        </svg>
      </motion.button>
      <style>{`
        .sos-button-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default SOSButton;
