/**
 * Shared Audio Service to manage a single AudioContext across the application.
 */

let sharedAudioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  
  // Ensure the context is resumed (browsers often suspend until first user interaction)
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(err => console.error("Could not resume AudioContext:", err));
  }
  
  return sharedAudioContext;
};

export const resumeAudioContext = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

export const playBase64Audio = async (base64: string, sampleRate: number = 24000): Promise<void> => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const int16Array = new Int16Array(bytes.buffer);
  
  const ctx = getAudioContext();
  const audioBuffer = ctx.createBuffer(1, int16Array.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start(0);
  
  return new Promise((resolve) => {
    source.onended = () => resolve();
  });
};
