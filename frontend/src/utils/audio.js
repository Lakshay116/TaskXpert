export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Create a pleasant, modern double-chime (Major 3rd)
    osc1.type = 'sine';
    osc2.type = 'sine';
    
    // First tone (E6)
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);
    // Second tone (G#6)
    osc2.frequency.setValueAtTime(1661.22, ctx.currentTime);
    
    // Volume envelope (quick attack, smooth decay)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.error('Failed to play notification sound', error);
  }
};
