import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw } from 'lucide-react';
import SafeWindow from './SafeWindow';

const LocalVision = forwardRef(({ detections }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const constraintOptions = [
      { video: { facingMode: { exact: "environment" } } },
      { video: { facingMode: "environment" } },
      { video: true }
    ];

    let success = false;
    for (const constraints of constraintOptions) {
      try {
        console.log("Attempting camera with constraints:", constraints);
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        success = true;
        break; 
      } catch (e) {
        console.warn("Camera constraint failed:", constraints, e);
      }
    }

    if (!success) {
      setError("Could not access camera. Please check permissions.");
    }
    setIsInitializing(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Expose capture method to parent
  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (!videoRef.current || !videoRef.current.videoWidth) return null;
      
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    },
    retry: () => startCamera()
  }));

  return (
    <motion.div 
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      className="glass"
      style={{
        position: 'absolute',
        bottom: '100px',
        right: '20px',
        width: '320px',
        height: '240px',
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        cursor: 'grab',
        background: '#000',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {isInitializing && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 5 }}>
          <RefreshCw className="pulse" size={32} color="var(--color-primary)" />
        </div>
      )}

      {error ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', gap: '10px', zIndex: 6 }}>
          <Camera size={40} color="var(--color-danger)" />
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{error}</div>
          <button 
            onClick={startCamera}
            style={{ background: 'var(--color-primary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            RETRY
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      <SafeWindow detections={detections} />
      
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        fontSize: '10px', 
        fontWeight: 'bold', 
        background: 'rgba(0,243,255,0.2)', 
        padding: '4px 8px', 
        borderRadius: '4px',
        backdropFilter: 'blur(4px)',
        border: '1px solid var(--color-primary)',
        color: 'var(--color-primary)'
      }}>
        LOCAL AI VISION
      </div>
    </motion.div>
  );
});

export default LocalVision;
