import { useState, useEffect } from 'react';

export const useAccelerometer = () => {
  const [data, setData] = useState({
    x: 0,
    y: 0,
    z: 0,
    magnitude: 0
  });

  useEffect(() => {
    const handleMotion = (event) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) return;

      const x = accel.x || 0;
      const y = accel.y || 0;
      const z = accel.z || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      setData({ x, y, z, magnitude });
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  return data;
};
