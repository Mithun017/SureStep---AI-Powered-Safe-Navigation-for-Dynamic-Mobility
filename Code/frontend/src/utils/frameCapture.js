export const captureFrameFromVideo = (videoElement) => {
  if (!videoElement) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  // quality 0.7 to save bandwidth
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
};
