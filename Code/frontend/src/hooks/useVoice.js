import { useState, useCallback } from 'react';

export const useVoice = () => {
  const [isEnabled, setIsEnabled] = useState(true);

  const toggleVoice = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const speak = useCallback((text) => {
    if (!isEnabled) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name === 'Google UK English Female') || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  return { isEnabled, toggleVoice, speak };
};
