import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

const VoiceToggle = ({ isEnabled, onToggle }) => {
  return (
    <motion.button
      className="glass"
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: isEnabled ? `3px solid var(--color-primary)` : `1px solid var(--glass-border)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isEnabled ? 'var(--color-primary)' : 'white',
        boxShadow: isEnabled ? `0 0 25px var(--color-primary)88` : 'none',
        cursor: 'pointer'
      }}
    >
      {isEnabled ? <Mic size={24} /> : <MicOff size={24} />}
    </motion.button>
  );
};

export default VoiceToggle;
