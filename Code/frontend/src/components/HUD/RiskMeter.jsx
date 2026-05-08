import React from 'react';
import { motion } from 'framer-motion';

const RiskMeter = ({ score, level }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  const getColor = () => {
    if (score < 3) return 'var(--color-safe)';
    if (score < 6) return 'var(--color-caution)';
    return 'var(--color-danger)';
  };

  return (
    <div className="risk-meter-container" style={{ textAlign: 'center' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
        >
          {score.toFixed(1)}
        </text>
      </svg>
      <div className="alert-label" style={{ 
        color: getColor(), 
        textTransform: 'uppercase', 
        fontSize: '12px', 
        fontWeight: 800,
        marginTop: '-10px',
        letterSpacing: '1px'
      }}>
        {level}
      </div>
      <style>{`
        .risk-meter-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default RiskMeter;
