import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { getAudioContext } from "./audioService";

export class LiveAssistant {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private nextStreamTime = 0;
  private isConnected = false;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private videoInterval: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(onMessage: (text: string) => void, onInterrupted: () => void, onError: (err: any) => void, options: { voiceName?: string, systemInstruction?: string } = {}) {
    if (this.isConnected) return;
    this.onErrorCallback = onError;
    
    const { voiceName = "Zephyr", systemInstruction = "You are a helpful Tigrinya, Amharic and English assistant. Respond in the language the user speaks to you." } = options;

    try {
      this.audioContext = getAudioContext();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.nextStreamTime = this.audioContext.currentTime;

      this.session = await this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview", 
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            // Re-verify connection intention after async connect returns
            if (this.session === null) {
              console.log("Session opened but was already discarded");
              return;
            }
            console.log("Live Assistant Connected");
            this.isConnected = true;
            this.startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts;
              for (const part of parts) {
                if (part.inlineData) {
                  this.playAudio(part.inlineData.data);
                }
                if (part.text) {
                  onMessage(part.text);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              this.nextStreamTime = this.audioContext?.currentTime || 0;
              onInterrupted();
            }
          },
          onclose: () => {
            console.log("Live Assistant Closed");
            this.disconnect();
          },
          onerror: (err) => {
            console.error("Live API Session Error:", err);
            this.onErrorCallback?.(err);
            this.disconnect();
          },
        },
      });
    } catch (err) {
      console.error("Live Connection Failed:", err);
      onError(err);
      this.disconnect();
    }
  }

  async startVision(videoElement: HTMLVideoElement) {
    if (!this.isConnected || !this.session) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    this.videoInterval = setInterval(() => {
      if (!this.isConnected || !this.session) return;
      
      // Resize for efficiency
      canvas.width = 300;
      canvas.height = 300 * (videoElement.videoHeight / videoElement.videoWidth);
      
      ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      const base64Data = dataUrl.split(',')[1];
      
      try {
        this.session.sendRealtimeInput({
          video: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        });
      } catch (err) {
        console.error("Failed to send video frame:", err);
      }
    }, 1000); // Send 1 frame per second
  }

  stopVision() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
  }

  private async startMic() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Safety check: verify we are still connected and have a context (user might have disconnected while waiting for mic)
      if (!this.isConnected || !this.audioContext) {
        this.stream.getTracks().forEach(t => t.stop());
        return;
      }

      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.session) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        // Safer base64 conversion for binary data
        const uint8 = new Uint8Array(pcmData.buffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Data = btoa(binary);
        
        try {
          this.session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        } catch (err) {
          console.error("Failed to send audio input:", err);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext!.destination);
    } catch (err) {
      console.error("Mic access denied:", err);
      this.onErrorCallback?.(err);
      this.disconnect();
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.audioContext) return;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert 16-bit PCM (AI response) to Float32 for Web Audio
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, 16000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    const startTime = Math.max(this.audioContext.currentTime, this.nextStreamTime);
    source.start(startTime);
    this.nextStreamTime = startTime + buffer.duration;
  }

  disconnect() {
    this.stopVision();
    this.isConnected = false;
    this.session?.close();
    this.stream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.session = null;
    this.audioContext = null;
  }
}
