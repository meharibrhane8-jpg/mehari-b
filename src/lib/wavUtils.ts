export const createWavHeader = (dataLength: number): Uint8Array => {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const sampleRate = 24000;
  const bitDepth = 16;
  const numChannels = 1;

  // RIFF chunk
  view.setUint32(0, 0x46464952, true); // "RIFF"
  view.setUint32(4, 36 + dataLength, true); // File size
  view.setUint32(8, 0x45564157, true); // "WAVE"
  
  // fmt chunk
  view.setUint32(12, 0x20746D66, true); // "fmt "
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Format (PCM)
  view.setUint16(22, numChannels, true); // Channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // Byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // Block align
  view.setUint16(34, bitDepth, true); // Bits per sample
  
  // data chunk
  view.setUint32(36, 0x61746164, true); // "data"
  view.setUint32(40, dataLength, true); // Data size

  return new Uint8Array(wavHeader);
};

export const downloadWav = (base64Data: string, filename: string) => {
  const binaryString = window.atob(base64Data);
  const data = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    data[i] = binaryString.charCodeAt(i);
  }
  
  const header = createWavHeader(data.length);
  const blob = new Blob([header, data], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
