import { useState, useEffect } from 'react';

export const useGPS = () => {
  const [position, setPosition] = useState({
    lat: 0,
    lon: 0,
    speed: 0,
    accuracy: 0,
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          speed: pos.coords.speed || 0, // speed in m/s
          accuracy: pos.coords.accuracy,
          error: null
        });
      },
      (err) => {
        setPosition(prev => ({ ...prev, error: err.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return position;
};
