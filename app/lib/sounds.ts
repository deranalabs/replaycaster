export type SoundType = "next" | "prev" | "start" | "impact";

export const playSound = (audioContext: AudioContext | null, type: SoundType) => {
  if (!audioContext) return;
  const ctx = audioContext;
  if (ctx.state === "suspended") ctx.resume();
  
  // Create nodes
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  filter.type = "lowpass";
  filter.frequency.value = 2000;
  
  const now = ctx.currentTime;
  
  switch (type) {
    case "next":
      // Whoosh forward - rising pitch with shimmer
      osc.type = "sine";
      osc2.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      osc2.frequency.setValueAtTime(600, now);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.25);
      osc2.stop(now + 0.2);
      break;
      
    case "prev":
      // Whoosh backward - falling pitch
      osc.type = "sine";
      osc2.type = "triangle";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      osc2.frequency.setValueAtTime(900, now);
      osc2.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.22);
      osc2.stop(now + 0.18);
      break;
      
    case "start":
      // Magical start sound - chord-like
      osc.type = "sine";
      osc2.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(554, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      filter.frequency.setValueAtTime(3000, now);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.6);
      osc2.stop(now + 0.6);
      break;
      
    case "impact":
      // Impact sound for big stat reveals
      osc.type = "square";
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      filter.frequency.value = 500;
      osc.start(now);
      osc.stop(now + 0.2);
      break;
  }
};
