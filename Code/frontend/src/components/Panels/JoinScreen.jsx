import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';

const JoinScreen = ({ onJoin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a14 100%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
          border: '1px solid var(--color-primary)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Shield size={80} color="var(--color-primary)" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: 'absolute',
              inset: -10,
              border: '2px solid var(--color-primary)',
              borderRadius: '50%',
              opacity: 0.3
            }}
          />
        </div>
        
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px' }}>SureStep</h1>
          <p style={{ opacity: 0.7, fontSize: '14px' }}>AI-Powered Safe Navigation Network</p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              autoFocus
              placeholder="Enter your name to join..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '15px 20px',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                fontSize: '16px',
                textAlign: 'center'
              }}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            style={{
              width: '100%',
              background: 'var(--color-primary)',
              color: '#000',
              padding: '15px',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            JOIN NETWORK <ArrowRight size={20} />
          </motion.button>
        </form>

        <div style={{ fontSize: '12px', opacity: 0.5 }}>
          By joining, you share your anonymized safety data with the network.
        </div>
      </motion.div>
    </div>
  );
};

export default JoinScreen;
