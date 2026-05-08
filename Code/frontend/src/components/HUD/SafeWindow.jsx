import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SafeWindow = ({ detections }) => {
  const getBoxColor = (label) => {
    const dangerLabels = ['vehicle', 'motorcycle', 'bus', 'truck'];
    const cautionLabels = ['bicycle', 'construction_zone', 'obstacle'];
    
    if (dangerLabels.includes(label.toLowerCase())) return 'var(--color-danger)';
    if (cautionLabels.includes(label.toLowerCase())) return 'var(--color-caution)';
    return 'var(--color-safe)';
  };

  return (
    <div className="safe-window-overlay" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      <AnimatePresence>
        {detections.map((det, index) => {
          // NIM bounding_box is [ymin, xmin, ymax, xmax] normalized 0-1
          const [ymin, xmin, ymax, xmax] = det.bounding_box || [0, 0, 0, 0];
          
          return (
            <motion.div
              key={`${index}-${det.label}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: `${ymin * 100}%`,
                left: `${xmin * 100}%`,
                width: `${(xmax - xmin) * 100}%`,
                height: `${(ymax - ymin) * 100}%`,
                border: `2px solid ${getBoxColor(det.label)}`,
                borderRadius: '4px',
                boxShadow: `0 0 10px ${getBoxColor(det.label)}44`
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-24px',
                left: 0,
                background: getBoxColor(det.label),
                color: 'black',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '2px',
                whiteSpace: 'nowrap'
              }}>
                {det.label.toUpperCase()} ({Math.round(det.confidence * 100)}%) - {det.distance_estimate}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SafeWindow;
