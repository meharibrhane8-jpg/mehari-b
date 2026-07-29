/**
 * Secure Server-Proxy backed Gemini Integration Service
 * Completely decoupled from browser-side GoogleGenAI to ensure security and prevent crashes.
 */

export enum Modality {
  AUDIO = "AUDIO",
  TEXT = "TEXT"
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
  thought?: string;
  groundingSources?: { title: string; uri: string }[];
  attachedFiles?: any[];
}

interface LiveCallbacks {
  onopen: () => void;
  onclose: () => void;
  onerror: (error: any) => void;
  onmessage: (message: any) => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const triggerQuotaEvent = (attempt: number, delayMs: number, error: any) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gemini-api-quota", {
      detail: { attempt, delayMs, error: error?.message || String(error) }
    }));
  }
};

const triggerQuotaSuccessEvent = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gemini-api-quota-success"));
  }
};

/**
 * Proxy call to standard Gemini Generate Content API
 */
export const callGeminiAPI = async (model: string, contents: any, config?: any) => {
  const fetchFn = async () => {
    const aiModelMode = config?.aiModelMode;
    const cleanConfig = config ? { ...config } : {};
    if (cleanConfig && 'aiModelMode' in cleanConfig) {
      delete cleanConfig.aiModelMode;
    }
    const response = await fetch("/api/gemini/generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ model, contents, config: cleanConfig, aiModelMode }),
    });

    if (!response.ok) {
      let errMsg = "Failed to communicate with Gemini server.";
      try {
        const text = await response.text();
        try {
          const errData = JSON.parse(text);
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = text || `HTTP error! status: ${response.status}`;
        }
      } catch (e) {
        errMsg = `HTTP error! status: ${response.status}`;
      }
      const err: any = new Error(errMsg);
      err.status = response.status;
      throw err;
    }

    const rawText = await response.text();
    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch (err) {
      console.error("Failed to parse JSON response. Raw text:", rawText.slice(0, 500));
      throw new Error("Invalid response format received from server.");
    }
  };

  let attempt = 1;
  let currentDelay = 2000;
  const maxAttempts = 6;
  const backoffFactor = 2.5;

  while (true) {
    try {
      const result = await fetchFn();
      if (attempt > 1) {
        triggerQuotaSuccessEvent();
      }
      return result;
    } catch (error: any) {
      const errMsg = error.message || String(error);
      const isQuotaOrTemporary =
        error.status === 429 ||
        error.status === 503 ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("limit") ||
        errMsg.toLowerCase().includes("busy") ||
        errMsg.toLowerCase().includes("overloaded") ||
        errMsg.toLowerCase().includes("rate limit") ||
        errMsg.toLowerCase().includes("rate_limit") ||
        errMsg.toLowerCase().includes("exhausted") ||
        errMsg.toLowerCase().includes("temporary");

      if (!isQuotaOrTemporary || attempt >= maxAttempts) {
        throw error;
      }

      triggerQuotaEvent(attempt, currentDelay, error);
      await delay(currentDelay);
      attempt++;
      currentDelay *= backoffFactor;
    }
  }
};

/**
 * Proxy call to Gemini Image Generation API (Imagen)
 */
export const callGeminiImageAPI = async (model: string, prompt: string, config?: any) => {
  const response = await fetch("/api/gemini/generateImages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ model, prompt, config }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || "Failed to generate image.");
  }

  return await response.json();
};

/**
 * Mock chat container for backwards compatibility with the UI.
 * Holds temporary system instruction state and history.
 */
export const startAIChat = (history: ChatMessage[] = [], systemInstruction?: string) => {
  return {
    history,
    systemInstruction,
    model: "gemini-flash-latest"
  };
};

/**
 * Sends a message and receives the text reply
 */
export const sendMessageToAI = async (chat: any, message: any) => {
  const result = await callGeminiAPI(chat.model, message, {
    systemInstruction: chat.systemInstruction
  });
  return result.text;
};

/**
 * Sends a chat message and returns an Asynchronous Generator that streams
 * GenerateContentResponses using Server-Sent Events (SSE).
 */
export const sendMessageStreamToAI = async function*(chatOrHistory: any, message: any, systemInstructionParam?: string) {
  let history: ChatMessage[] = [];
  let systemInstruction = systemInstructionParam;
  let aiModelMode = "general";

  if (Array.isArray(chatOrHistory)) {
    history = chatOrHistory;
  } else if (chatOrHistory && typeof chatOrHistory === "object") {
    history = chatOrHistory.history || [];
    systemInstruction = systemInstruction || chatOrHistory.systemInstruction;
    aiModelMode = chatOrHistory.aiModelMode || "general";
  }

  const connectAndStream = async () => {
    const response = await fetch("/api/gemini/chatStream", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ history, message, systemInstruction, aiModelMode }),
    });

    if (!response.ok) {
      let errMsg = "Failed to connect to chat stream";
      try {
        const text = await response.text();
        try {
          const errData = JSON.parse(text);
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = text || errMsg;
        }
      } catch {}
      const err: any = new Error(errMsg);
      err.status = response.status;
      throw err;
    }

    return response;
  };

  let response: Response;
  let attempt = 1;
  let currentDelay = 2000;
  const maxAttempts = 6;
  const backoffFactor = 2.5;

  while (true) {
    try {
      response = await connectAndStream();
      if (attempt > 1) {
        triggerQuotaSuccessEvent();
      }
      break;
    } catch (error: any) {
      const errMsg = error.message || String(error);
      const isQuotaOrTemporary =
        error.status === 429 ||
        error.status === 503 ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("limit") ||
        errMsg.toLowerCase().includes("busy") ||
        errMsg.toLowerCase().includes("overloaded") ||
        errMsg.toLowerCase().includes("rate limit") ||
        errMsg.toLowerCase().includes("rate_limit") ||
        errMsg.toLowerCase().includes("exhausted") ||
        errMsg.toLowerCase().includes("temporary");

      if (!isQuotaOrTemporary || attempt >= maxAttempts) {
        throw error;
      }

      triggerQuotaEvent(attempt, currentDelay, error);
      await delay(currentDelay);
      attempt++;
      currentDelay *= backoffFactor;
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith("data: ")) continue;

      let data: any;
      try {
        const jsonStr = cleanLine.substring(6);
        data = JSON.parse(jsonStr);
      } catch (e) {
        console.warn("Error parsing stream block:", e);
        continue;
      }

      if (data && data.error) {
        const errorMsg = typeof data.error === "object"
          ? (data.error.message || JSON.stringify(data.error))
          : String(data.error);
        throw new Error(errorMsg);
      }
      yield data;
    }
  }
};

/**
 * Text-to-Speech Generation Proxy
 */
export const generateTTS = async (text: string, voiceName: string = 'Kore', model?: string, systemInstruction?: string, speed?: number, pitch?: number): Promise<string | null> => {
  try {
    const response = await fetch("/api/gemini/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ text, voiceName, model, systemInstruction, speed, pitch }),
    });

    if (response.status === 429) {
      throw new Error("QUOTA_EXCEEDED");
    }

    if (!response.ok) {
      throw new Error("TTS proxy request failed");
    }

    const data = await response.json();
    return data.audio;
  } catch (err: any) {
    console.error("Client TTS failed:", err);
    if (err.message === "QUOTA_EXCEEDED") {
      throw err; // Propagate specific error
    }
    return null;
  }
};

/**
 * Tigrinya-specific text refinement for TTS
 */
export const refineTigrinya = async (text: string, language: 'ti' | 'am' = 'ti'): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      throw new Error("Refine request failed");
    }

    const data = await response.json();
    return data.refinedText || text;
  } catch (err) {
    console.error("Refine failed:", err);
    return text;
  }
};

/**
 * Highly Advanced Gemini Live WebSocket Tunnel client
 */
export const connectToLiveAPI = (callbacks: LiveCallbacks, systemInstruction?: string, voiceName: string = "Zephyr", tools: any[] = [{ googleSearch: {} }]) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/api/live-talk`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    if (socket.readyState === WebSocket.OPEN) {
      // Send setup parameters immediately to server-side connection
      socket.send(JSON.stringify({
        setup: {
          systemInstruction,
          voiceName,
          tools
        }
      }));
    }
    callbacks.onopen();
  };

  socket.onclose = () => {
    callbacks.onclose();
  };

  socket.onerror = (err) => {
    callbacks.onerror(err);
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (callbacks.onmessage) {
        callbacks.onmessage(message);
      } else if (message.error) {
        callbacks.onerror(message.error + (message.details ? ": " + message.details : ""));
      }
    } catch (e) {
      console.error("WS client onmessage error processing JSON:", e);
    }
  };

  return {
    sendRealtimeInput: (input: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        if (input.audio?.data) {
          socket.send(JSON.stringify({ audio: input.audio.data }));
        }
      }
    },
    sendText: (text: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ text }));
      }
    },
    sendImage: (base64: string, mimeType: string = "image/jpeg") => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ image: { base64, mimeType } }));
      }
    },
    sendRaw: (data: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    },
    close: () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }
  };
};

/**
 * Contextual suggestion predictions
 */
export const generateSuggestions = async (history: ChatMessage[], language: string, currentInput: string = "", tone: string = "Friendly"): Promise<string[]> => {
  const historyText = history.slice(-10).map(m => `${m.role}: ${m.parts}`).join('\n');
  
  const prompt = `You are an expert conversational AI assistant. Analyze the user's current input and the provided recent chat history context to generate 3 highly contextually relevant, natural, and helpful suggestions.

- If the current input is essentially complete, suggest meaningful follow-up questions or common next actions.
- If the current input is partial, suggest natural completions to finish the sentence or phrase in a contextually appropriate way.

Guidelines:
- Tone: "${tone}"
- Target Language: "${language === 'auto' ? 'detected' : language}"
- Current Input: "${currentInput}"
- Use the recent conversation history to provide suggestions that flow naturally from the existing context.

Constraints:
- Suggestions must be natural, concise, and natively correct in the target language.
- Keep each suggestion under 5 words.
- Response Format: A simple JSON array of strings, like this: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]

Chat History (Recent Context):
${historyText}`;

  try {
    const result = await callGeminiAPI("gemini-3.1-pro-preview", [{ role: 'user', parts: [{ text: prompt }] }], {
      responseMimeType: "application/json",
      aiModelMode: "thinking"
    });

    let text = result.text || "[]";
    text = text.replace(/```json\s*|```/g, "").trim();
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
        text = text.substring(startIndex, endIndex + 1);
    }
    
    return JSON.parse(text);
  } catch (err: any) {
    console.error("Failed to generate suggestions:", err);
    return [];
  }
};

/**
 * Image Analysis helper
 */
export const analyzeImage = async (imageUrl: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/analyzeImage", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ imageUrl, prompt }),
    });

    if (!response.ok) {
      throw new Error("Image analysis failed");
    }

    const data = await response.json();
    return data.text || "";
  } catch (err) {
    console.error("Image analysis failed:", err);
    throw err;
  }
};

/**
 * Video Analysis helper
 */
export const analyzeVideo = async (videoUrl: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/analyzeVideo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ videoUrl, prompt }),
    });

    if (!response.ok) {
      throw new Error("Video analysis failed");
    }

    const data = await response.json();
    return data.text || "";
  } catch (err) {
    console.error("Video analysis failed:", err);
    throw err;
  }
};
export const refineText = async (text: string, instruction: string): Promise<string> => {
  try {
    const result = await callGeminiAPI("gemini-2.5-flash", [{ role: 'user', parts: [{ text: `${instruction}\n\nText: "${text}"` }] }]);
    return result.text || text;
  } catch (err) {
    console.error("Text refinement failed:", err);
    throw err;
  }
};

/**
 * Text translation helper
 */
export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const result = await callGeminiAPI("gemini-2.5-flash", [{ role: 'user', parts: [{ text: `Translate the following text to ${targetLang}. Return the translation only.\n\nText: "${text}"` }] }]);
    return result.text || text;
  } catch (err) {
    console.error("Translation failed:", err);
    throw err;
  }
};

export const geminiTranscribe = async (base64Audio: string, mimeType: string, lang: string = 'ti'): Promise<string> => {
  const prompt = `Transcribe the following audio accurately. The language is ${lang === 'en' ? 'English' : (lang === 'am' ? 'Amharic' : 'Tigrinya')}. Only return the transcribed text, nothing else.`;
  
  // Normalize unsupported webm audio MIME type to ogg, and mp4 to m4a for full compatibility with Gemini API
  let normalizedMimeType = mimeType;
  if (mimeType && mimeType.startsWith("audio/")) {
    if (mimeType.includes("webm")) {
      normalizedMimeType = "audio/ogg";
    } else if (mimeType.includes("mp4")) {
      normalizedMimeType = "audio/m4a";
    }
  }

  const result = await callGeminiAPI("gemini-2.5-flash", [
    { role: 'user', parts: [
      { text: prompt },
      { inlineData: { mimeType: normalizedMimeType, data: base64Audio } }
    ] }
  ]);
  
  return result.text?.trim() || "";
};
