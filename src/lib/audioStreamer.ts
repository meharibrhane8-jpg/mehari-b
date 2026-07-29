/**
 * AudioStreamer plays base64-encoded PCM chunks from the model.
 */
export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number = 24000; // Gemini usually outputs 24kHz
  
  private totalAudioDuration: number = 0;
  private playedAudioDuration: number = 0;
  private lastUpdateTime: number = 0;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate,
      });
      this.nextStartTime = this.audioContext.currentTime;
      this.lastUpdateTime = this.audioContext.currentTime;
    }
  }

  getPlaybackProgress(): number {
    if (!this.audioContext || this.totalAudioDuration === 0) return 0;
    
    const now = this.audioContext.currentTime;
    // Calculate how much time passed since last check
    const delta = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    // Only increment played duration if we have audio playing (now < nextStartTime)
    if (now < this.nextStartTime) {
        this.playedAudioDuration += delta;
    }

    return Math.min(Math.max(this.playedAudioDuration / this.totalAudioDuration, 0), 1);
  }

  async play(base64Data: string) {
    this.initContext();
    if (!this.audioContext) return;

    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert PCM16 to Float32
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    // Schedule playback to avoid gaps
    const now = this.audioContext.currentTime;
    // Keep lastUpdateTime updated so we don't jump ahead if there was a gap
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.05; // Small buffer
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.totalAudioDuration += audioBuffer.duration;
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.nextStartTime = 0;
      this.totalAudioDuration = 0;
      this.playedAudioDuration = 0;
      this.lastUpdateTime = 0;
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
