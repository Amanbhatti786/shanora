// Sound effects helper using web audio links
export const playSound = (type = 'like') => {
  if (typeof window === 'undefined') return;

  const sounds = {
    // Facebook-style soft pop/click for Like & Relay
    like: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    
    // Messenger-style sound for incoming direct messages
    message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    
    // Bell chime for notifications / follows
    notification: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
  };

  try {
    const audioUrl = sounds[type] || sounds.like;
    const audio = new Audio(audioUrl);
    audio.volume = 0.5; // Normal sweet volume (50%)
    audio.play().catch(() => {
      // Browser autoplay policy prevent silently
    });
  } catch (err) {
    console.error('Audio play error:', err);
  }
};
