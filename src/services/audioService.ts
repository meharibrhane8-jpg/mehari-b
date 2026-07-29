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

let activeSources: AudioBufferSourceNode[] = [];

export const stopAllAudio = () => {
  activeSources.forEach(source => {
    try {
      source.stop();
    } catch (e) {
      // already stopped or not started
    }
  });
  activeSources = [];
};

export const playBase64Audio = async (
  base64: string, 
  sampleRate: number = 24000, 
  loop: boolean = false, 
  playbackRate: number = 1.0
): Promise<void> => {
  if (!base64) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(err => console.error("Could not resume AudioContext:", err));
  }

  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Check if bytes form a WAV file header ("RIFF")
  const isWav = len >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  let source: AudioBufferSourceNode;

  if (isWav) {
    try {
      const decodedBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
    } catch (e) {
      console.warn("decodeAudioData failed on WAV, falling back to raw PCM:", e);
      const samples = Math.floor(len / 2);
      const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, samples);
      const audioBuffer = ctx.createBuffer(1, samples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < samples; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }
      source = ctx.createBufferSource();
      source.buffer = audioBuffer;
    }
  } else {
    // Raw PCM 16-bit LE
    const samples = Math.floor(len / 2);
    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, samples);
    const audioBuffer = ctx.createBuffer(1, samples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < samples; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }
    
    source = ctx.createBufferSource();
    source.buffer = audioBuffer;
  }

  source.loop = loop;
  if (playbackRate && playbackRate > 0) {
    source.playbackRate.value = playbackRate;
  }

  source.connect(ctx.destination);
  activeSources.push(source);
  source.start(0);

  return new Promise((resolve) => {
    source.onended = () => {
      activeSources = activeSources.filter(s => s !== source);
      resolve();
    };
  });
};

export const setAudioPlaybackRate = (rate: number) => {
  activeSources.forEach(source => {
    try {
      source.playbackRate.value = rate;
    } catch (e) {
      // already ended or invalid
    }
  });
};

export const setAudioLoopState = (loop: boolean) => {
  activeSources.forEach(source => {
    try {
      source.loop = loop;
    } catch (e) {
      // already ended or invalid
    }
  });
};

export const playConfirmationTone = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Nice modern "blip" tone
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12); // Fall to A4
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
};

export const speakWithWebSpeech = (text: string, lang: string = 'ti'): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'am' ? 'am-ET' : (lang === 'ti' ? 'ti-ET' : 'en-US');
    utterance.rate = 0.95;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
};
