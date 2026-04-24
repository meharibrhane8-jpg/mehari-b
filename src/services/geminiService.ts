import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
  groundingSources?: { title: string; uri: string }[];
}

export const startAIChat = (history: ChatMessage[] = [], systemInstruction?: string) => {
  const ai = getAI();
  return ai.chats.create({
    model: "models/gemini-3-flash-preview",
    config: {
      systemInstruction: systemInstruction || "Role: Act as a highly advanced Multilingual AI Assistant. Provide structured, insightful, and professional responses.\n\nLanguage Support:\n- Primary: English, Tigrinya, Amharic.\n- Secondary (Ethiopic): Ge'ez, Tigre, Oromo, Blin, Gurage, Sidamo.\n\nVisual Style Rules:\n- Formatting: Use Markdown for all text.\n- Use ### for all section headers.\n- Use **Bold** for key terms.\n- Use * for bulleted lists.\n\nStructure:\n- Begin with a one-sentence Summary.\n- Group related information into distinct sections.\n- Use double line breaks between sections for White Space.\n\nConciseness:\n- Be direct. Do not use conversational filler. Deliver the information organized by headers.\n\nSTRICT Language Matching Rules:\n1. DETECT the exact language or dialect the user is using.\n2. RESPOND 100% in that SAME language/dialect.\n3. FOR ETHIOPIC: Use appropriate Ge'ez script variants for the specific language.\n4. NEVER mix languages unless explicitly asked to translate.\n\nSource Links:\n- Format links as [Source Name](URL).",
      tools: [{ googleSearch: {} }],
      toolConfig: {
        includeServerSideToolInvocations: true
      },
      thinkingConfig: {
        includeThoughts: true
      }
    }
  });
};

export const sendMessageToAI = async (chat: any, message: string) => {
  const result = await chat.sendMessage({ message });
  return result.text;
};

export const sendMessageStreamToAI = async (chat: any, message: string) => {
  return await chat.sendMessageStream({ message });
};

export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "models/gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }
  return null;
};

/**
 * GEMINI Multimodal Live API Integration
 */
interface LiveCallbacks {
  onopen: () => void;
  onclose: () => void;
  onerror: (error: any) => void;
  onmessage: (message: LiveServerMessage) => void;
}

export const connectToLiveAPI = (callbacks: LiveCallbacks, systemInstruction?: string) => {
  const ai = getAI();
  
  return ai.live.connect({
    model: "models/gemini-3.1-flash-live-preview",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: systemInstruction || `You are an elite real-time AI companion specializing in Ethiopic languages and English.
        - Expertise: English, Tigrinya, Amharic, Ge'ez, Tigre, Oromo, Blin, Gurage, Sidamo.
        - Tone: Sophisticated, natural, and helpful. 
        - Rule 1: Match the user's language and regional nuance perfectly.
        - Rule 2: If the user speaks an Ethiopic language, prioritize cultural accuracy.
        - Rule 3: Maintain a smooth, conversational flow suitable for voice interaction.
        - Rule 4: If you're unsure of a regional variant, ask clarifying questions gently in the detected language.`,
      // Enable real-time transcription
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });
};

export const generateSuggestions = async (history: ChatMessage[], language: string): Promise<string[]> => {
  const ai = getAI();
  
  const historyText = history.slice(-5).map(m => `${m.role}: ${m.parts}`).join('\n');
  
  const prompt = `Based on the following chat history, suggest 3 short, helpful, and natural follow-up questions or prompts for the user.
The suggestions must be in ${language === 'auto' ? 'the detected language of the conversation' : language}.
Keep each suggestion under 10 words.
Format your response as a simple JSON array of strings, like this: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]

Chat History:
${historyText}`;

  try {
    const result = await ai.models.generateContent({
      model: "models/gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = result.text || "[]";
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to generate suggestions:", err);
    return [];
  }
};
