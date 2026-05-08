import { useRef, useEffect, useState } from 'react';
import { captureFrameFromVideo } from '../utils/frameCapture';

export const useCamera = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          console.warn("Environment camera failed, falling back to default:", e);
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        setStream(mediaStream);
      } catch (err) {
        console.error("Camera error:", err);
        setError(err.name);
      }
    };


    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Separate effect to handle assigning the stream to the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [stream]);

  const captureFrame = () => {
    return captureFrameFromVideo(videoRef.current);
  };

  const retry = () => {
    setError(null);
    startCamera();
  };

  return { videoRef, error, captureFrame, retry };
};


