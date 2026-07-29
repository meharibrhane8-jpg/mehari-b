import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { initializeApp, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import webpush from "web-push";
import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
  LiveServerMessage,
} from "@google/genai";

dotenv.config();

// Ensure GEMINI_API_KEY is mapped from GeminiAPIKey if needed (e.g. in development or container env)
if (!process.env.GEMINI_API_KEY && process.env.GeminiAPIKey) {
  process.env.GEMINI_API_KEY = process.env.GeminiAPIKey;
}

interface FallbackLog {
  id: string;
  timestamp: string;
  query: string;
  geminiError: string;
  usingBraveApiKey: boolean;
  success: boolean;
  details?: string;
  source?: string; // 'generateContent' or 'chatStream'
}

let fallbackLogs: FallbackLog[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Initialize Firebase Admin
  let firebaseApp;
  try {
    firebaseApp = initializeApp({
      projectId: "jaunty-helix-tjlsj",
    });
  } catch (e) {
    console.error("Firebase Admin initialization error:", e);
    // fallback to getApp if it was already initialized
    try {
      firebaseApp = getApp();
    } catch (innerErr) {
      console.error("Firebase Admin getApp fallback also failed:", innerErr);
    }
  }
  
  let db: any = null;
  try {
    db = getFirestore(firebaseApp, "ai-studio-aigeezkeyboard-dace50ee-1fa2-46b6-adbc-f0bf24ed5201");
  } catch (dbErr) {
    console.error("Firestore initialization error with firebaseApp:", dbErr);
    try {
      db = getFirestore(undefined, "ai-studio-aigeezkeyboard-dace50ee-1fa2-46b6-adbc-f0bf24ed5201");
    } catch (dbErr2) {
      console.error("Firestore default initialization fallback also failed:", dbErr2);
    }
  }
  // If a specific databaseId is provided, we should ensure we're using it.
  // In some environments, the default instance is enough. 
  // Let's assume standard for now but be aware of the custom ID.

  // Configure Web Push
  const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || "BAJYmiDl2vzsgcRCMontlzJKoeprsC8Z8iBdFd0tOMLNEnUGJ0P90cpwmG7P5WRjc5ymGuOxA-FNTe2qgBDb_x8";
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "T3DXXpHqjDqqjaz39fuUSwEw6Y4fXzxTyp1Oy2LUkuM";
  
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:example@gmail.com";
  webpush.setVapidDetails(
    vapidSubject.startsWith("mailto:") || vapidSubject.startsWith("https:") ? vapidSubject : `mailto:${vapidSubject}`,
    publicVapidKey,
    privateVapidKey
  );

  // Reminders API
  app.post("/api/reminders/subscribe", async (req, res) => {
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
      return res.status(400).json({ error: "Subscription and userId are required" });
    }
    
    if (!db) {
      return res.status(503).json({ error: "Firestore is not available in this environment." });
    }
    
    try {
      // Store or update user's push subscription
      await db.collection("push_subscriptions").doc(userId).set({
        subscription,
        updatedAt: FieldValue.serverTimestamp()
      });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to store subscription" });
    }
  });

  // Background Task: Check for due reminders every minute
  setInterval(async () => {
    try {
      if (!db) return;
      const now = Timestamp.now();
      const remindersRef = db.collection("reminders");
      const snapshot = await remindersRef
        .where("status", "==", "pending")
        .where("dueAt", "<=", now)
        .limit(10)
        .get();

      if (snapshot.empty) return;

      for (const doc of snapshot.docs) {
        const reminder = doc.data();
        const userId = reminder.userId;
        
        // Update status to prevent duplicate sends
        await doc.ref.update({ status: "sent", sentAt: now });

        // Fetch subscription
        const subDoc = await db.collection("push_subscriptions").doc(userId).get();
        if (subDoc.exists) {
          const { subscription } = subDoc.data()!;
          try {
            await webpush.sendNotification(subscription, JSON.stringify({
              title: "🔔 Reminder",
              body: reminder.title,
              url: "/"
            }));
            console.log(`Push sent for reminder ${doc.id}`);
          } catch (err: any) {
            console.error(`Error sending push for ${doc.id}:`, err);
            if (err.statusCode === 410) {
              // Subscription expired or removed
              await subDoc.ref.delete();
            }
          }
        }
      }
    } catch (error: any) {
      if (error && error.code === 7) {
        // Permission denied (expected in AI Studio preview without service account credentials)
      } else {
        console.error("Reminder check background task error:", error);
      }
    }
  }, 60000);

  // Fallback logs API
  app.get("/api/fallback-logs", (req, res) => {
    res.json(fallbackLogs);
  });

  app.post("/api/fallback-logs/clear", (req, res) => {
    fallbackLogs = [];
    res.json({ success: true, message: "Logs cleared successfully" });
  });

  // GIPHY API Proxy Routes
  app.get("/api/gifs/search", async (req, res) => {
    const { q, offset = 0 } = req.query;
    const apiKey = process.env.GIPHY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GIPHY_API_KEY is not configured" });
    }

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
          String(q),
        )}&limit=20&offset=${offset}&rating=g`,
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Giphy Search Error:", error);
      res.status(500).json({ error: "Failed to fetch GIFs" });
    }
  });

  app.get("/api/gifs/trending", async (req, res) => {
    const { offset = 0 } = req.query;
    const apiKey = process.env.GIPHY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GIPHY_API_KEY is not configured" });
    }

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&offset=${offset}&rating=g`,
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Giphy Trending Error:", error);
      res.status(500).json({ error: "Failed to fetch Trending GIFs" });
    }
  });

  // Secure Server-Side Gemini API Proxy Routes
  function parseGeminiError(error: any) {
    let message = error.message || String(error);
    let code = 500;
    let status = "INTERNAL_SERVER_ERROR";

    try {
      if (typeof message === "string") {
        const match = message.match(/(\{.*\})/s);
        if (match) {
          const parsed = JSON.parse(match[1]);
          if (parsed.error) {
            message = parsed.error.message || message;
            code = parsed.error.code || code;
            status = parsed.error.status || status;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    const msgLower = message.toLowerCase();
    if (
      msgLower.includes("quota") ||
      msgLower.includes("429") ||
      msgLower.includes("resource_exhausted") ||
      msgLower.includes("rate limit") ||
      msgLower.includes("too many requests") ||
      msgLower.includes("too_many_requests") ||
      msgLower.includes("exhausted")
    ) {
      code = 429;
      status = "RESOURCE_EXHAUSTED";
      message =
        "You exceeded your current Gemini API quota / rate limits. Please try again in a brief moment, or use local offline tools.";
    } else if (
      msgLower.includes("unavailable") ||
      msgLower.includes("503") ||
      msgLower.includes("overload") ||
      msgLower.includes("high demand") ||
      msgLower.includes("temporary") ||
      msgLower.includes("spikes")
    ) {
      code = 503;
      status = "UNAVAILABLE";
      message =
        "The Gemini model is currently experiencing high demand. Spikes in traffic are temporary. Please wait a brief moment and retry.";
    }

    return { code, status, message };
  }

  // Helper to fallback to Brave Search or Local/Offline Assistant
  async function tryBraveSearchFallback(query: string, geminiError: string, source: string = 'unknown'): Promise<{ text: string; groundingSources?: any[] }> {
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const timestamp = new Date().toISOString();

    if (!braveApiKey) {
      fallbackLogs.unshift({
        id: logId,
        timestamp,
        query,
        geminiError,
        usingBraveApiKey: false,
        success: true,
        details: "Gemini failed. Switched to local assistant (Brave Search Key is not set in Settings).",
        source
      });
      if (fallbackLogs.length > 100) fallbackLogs.pop();

      return {
        text: `### 🌐 Fallback Assistant Mode Activated

The Gemini API is currently experiencing a temporary rate limit or quota exhaustion. To keep your experience **smooth and uninterrupted**, we have automatically switched to our secure fallback assistant.

To activate real-time web answers as an automated backup, configure your **Brave Search API Key** in your project settings:
1. Define \`BRAVE_SEARCH_API_KEY\` in your env variables.
2. The server will dynamically query Brave Search when the main API is busy!

**Here is a response based on my knowledge base:**
I'd love to help you with: **"${query}"**. Since our primary real-time model is currently resting, feel free to ask simple questions or restart a live talk session!`,
        groundingSources: []
      };
    }

    try {
      console.log(`[Brave Search Fallback] Querying Brave Search for: "${query}"...`);
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
        headers: {
          "Accept": "application/json",
          "X-Subscription-Token": braveApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Brave Search API returned HTTP ${response.status}`);
      }

      const data: any = await response.json();
      const results = data.web?.results || [];

      if (results.length === 0) {
        fallbackLogs.unshift({
          id: logId,
          timestamp,
          query,
          geminiError,
          usingBraveApiKey: true,
          success: true,
          details: "Gemini failed. Switched to Brave Search, but no results were found.",
          source
        });
        if (fallbackLogs.length > 100) fallbackLogs.pop();

        return {
          text: `### 🌐 Web Search Fallback

We searched the web using Brave Search for **"${query}"** but couldn't find any relevant real-time results. Please double-check your spelling or try another topic.`,
          groundingSources: []
        };
      }

      let md = `### 🔍 Live Web Results (Brave Search Fallback)

Gemini is currently at capacity or rate-limited. We automatically switched to the **Brave Search API** to get you real-time information:

`;
      const groundingSources: any[] = [];
      results.forEach((res: any, idx: number) => {
        const title = res.title || "Web Page";
        const url = res.url || "#";
        const desc = res.description || res.snippet || "";
        md += `${idx + 1}. **[${title}](${url})**  \n   ${desc}\n\n`;
        groundingSources.push({ title, uri: url });
      });

      fallbackLogs.unshift({
        id: logId,
        timestamp,
        query,
        geminiError,
        usingBraveApiKey: true,
        success: true,
        details: `Gemini failed. Successfully fetched ${results.length} results from Brave Search.`,
        source
      });
      if (fallbackLogs.length > 100) fallbackLogs.pop();

      return { text: md, groundingSources };
    } catch (err: any) {
      console.error("Brave Search Fallback failed:", err);
      fallbackLogs.unshift({
        id: logId,
        timestamp,
        query,
        geminiError,
        usingBraveApiKey: true,
        success: false,
        details: `Both Gemini and Brave Search failed. Brave Error: ${err.message || String(err)}`,
        source
      });
      if (fallbackLogs.length > 100) fallbackLogs.pop();

      return {
        text: `### ⚠️ Secondary Fallback Mode

Both the Gemini API and Brave Search API fallback are currently unavailable. 

**Query received:** "${query}"

Please wait a brief moment and try again. If you are developing locally, please check your network connection and API key configurations in the Settings menu.`,
        groundingSources: []
      };
    }
  }

  // Helper to stream fallback responses chunk-by-chunk to the client
  async function streamFallbackResponse(res: any, text: string, groundingSources?: any[]) {
    const chunkSize = 8;
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      const legacyChunk = {
        candidates: [{
          content: {
            parts: [{ text: chunk }]
          }
        }]
      };
      res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 15));
    }

    if (groundingSources && groundingSources.length > 0) {
      const legacyMetadata = {
        candidates: [{
          content: {
            parts: []
          },
          groundingMetadata: {
            groundingChunks: groundingSources.map((src: any) => ({
              web: { title: src.title, uri: src.uri }
            }))
          }
        }]
      };
      res.write(`data: ${JSON.stringify(legacyMetadata)}\n\n`);
    }
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function retryRequest<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    initialDelay = 1000,
    backoffFactor = 1.5
  ): Promise<T> {
    let attempt = 1;
    let currentDelay = initialDelay;
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        const rawMsg = error.message || String(error);
        const errMsg = rawMsg.toLowerCase();
        const isQuotaOrTemporary =
          error.status === "RESOURCE_EXHAUSTED" ||
          error.status === "UNAVAILABLE" ||
          error.code === 429 ||
          error.code === 503 ||
          error.statusCode === 429 ||
          errMsg.includes("quota") ||
          errMsg.includes("limit") ||
          errMsg.includes("busy") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("rate_limit") ||
          errMsg.includes("too many") ||
          errMsg.includes("too_many_requests") ||
          errMsg.includes("exhausted");

        if (!isQuotaOrTemporary || attempt >= maxAttempts) {
          throw error;
        }

        let calculatedDelay = currentDelay;
        const retryMatch = rawMsg.match(/retry in (\d+(\.\d+)?)s/i);
        if (retryMatch && retryMatch[1]) {
          const seconds = parseFloat(retryMatch[1]);
          if (!isNaN(seconds) && seconds > 0) {
            calculatedDelay = Math.min(Math.ceil(seconds * 1000) + 500, 7000);
          }
        }

        const jitter = Math.random() * 150;
        const finalDelay = calculatedDelay + jitter;

        console.warn(`[Server Retry] Attempt ${attempt}/${maxAttempts} hit temporary limit. Retrying in ${Math.round(finalDelay)}ms...`);
        await delay(finalDelay);
        attempt++;
        currentDelay *= backoffFactor;
      }
    }
  }

  app.post("/api/gemini/generateContent", async (req, res) => {
    let { model: requestedModel, contents, config, aiModelMode } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Extract query for potential fallback
      let queryText = "";
      try {
        if (typeof contents === "string") queryText = contents;
        else if (Array.isArray(contents)) {
          const lastMsg = contents[contents.length - 1];
          if (typeof lastMsg.parts === "string") queryText = lastMsg.parts;
          else if (Array.isArray(lastMsg.parts)) {
            queryText = lastMsg.parts.map((p: any) => p.text || "").join(" ");
          }
        }
      } catch (e) {}

      // Map models to standard Interactions API models
      let model = requestedModel || "gemini-2.5-flash";
      let generationConfig: any = config ? { ...config } : {};

      if (aiModelMode === "thinking") {
        model = "gemini-3.1-pro-preview";
        generationConfig.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH
        };
        delete generationConfig.maxOutputTokens;
        delete generationConfig.max_output_tokens;
      } else {
        if (model.includes("pro")) {
          model = "gemini-3.1-pro-preview";
        } else if (model.includes("lite") || model.includes("8b")) {
          model = "gemini-3.1-flash-lite";
        } else if (model.includes("2.5-flash") || model === "gemini-2.5-flash") {
          model = "gemini-2.5-flash";
        } else {
          model = "gemini-2.5-flash";
        }
      }

      // Convert standard Gemini contents to Interactions API input
      // We map the parts of the last user message to Interactions API input format
      let normalizedContents = contents;
      if (typeof contents === "string") {
        normalizedContents = [{ role: "user", parts: [{ text: contents }] }];
      } else if (contents && !Array.isArray(contents)) {
        if (contents.parts) {
          normalizedContents = [contents];
        } else if (contents.text) {
          normalizedContents = [{ role: "user", parts: [{ text: contents.text }] }];
        } else {
          normalizedContents = [{ role: "user", parts: [contents] }];
        }
      }

      if (!normalizedContents || !Array.isArray(normalizedContents) || normalizedContents.length === 0) {
        normalizedContents = [{ role: "user", parts: [{ text: "" }] }];
      }

      const lastUserContent = [...normalizedContents].reverse().find((c: any) => c.role === "user") || normalizedContents[normalizedContents.length - 1];
      
      let partsList: any[] = [];
      if (lastUserContent) {
        if (typeof lastUserContent === "string") {
          partsList = [{ text: lastUserContent }];
        } else if (Array.isArray(lastUserContent.parts)) {
          partsList = lastUserContent.parts;
        } else if (typeof lastUserContent.parts === "string") {
          partsList = [{ text: lastUserContent.parts }];
        } else if (lastUserContent.parts) {
          partsList = [lastUserContent.parts];
        } else if (lastUserContent.text) {
          partsList = [{ text: lastUserContent.text }];
        } else {
          partsList = [lastUserContent];
        }
      }

      const input = partsList.map((p: any) => {
        if (typeof p === "string") return { type: "text", text: p };
        if (p.text) return { type: "text", text: p.text };
        if (p.inlineData) {
          let mediaType = "image";
          if (p.inlineData.mimeType?.startsWith("video/")) mediaType = "video";
          if (p.inlineData.mimeType?.startsWith("audio/")) mediaType = "audio";
          let mType = p.inlineData.mimeType || "";
          if (mType.startsWith("audio/")) {
            if (mType.includes("webm")) {
              mType = "audio/ogg";
            } else if (mType.includes("mp4")) {
              mType = "audio/m4a";
            }
          }
          return { 
            type: mediaType, 
            data: p.inlineData.data, 
            mime_type: mType 
          };
        }
        if (p.fileData) return {
          type: "file",
          file_uri: p.fileData.fileUri,
          mime_type: p.fileData.mimeType
        };
        return p;
      });

      const runInteraction = async (modelName: string) => {
        // Map common camelCase config to snake_case for Interactions API
        const generation_config: any = generationConfig ? { ...generationConfig } : {};
        
        if (modelName === "gemini-3.1-pro-preview") {
          generation_config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
          delete generation_config.maxOutputTokens;
          delete generation_config.max_output_tokens;
        }

        if (generation_config.thinkingConfig) {
          const level = generation_config.thinkingConfig.thinkingLevel || generation_config.thinkingConfig.thinking_level;
          generation_config.thinking_level = level === ThinkingLevel.HIGH || level === "high" ? "high" : (level === ThinkingLevel.LOW || level === "low" ? "low" : "minimal");
          delete generation_config.thinkingConfig;
        }
        
        // Interactions API does not support response_mime_type in generation_config.
        // It uses response_format at the top level.
        let response_format: any = undefined;
        if (generation_config.responseSchema || generation_config.response_schema) {
          response_format = { 
            type: "object",
            json_schema: generation_config.responseSchema || generation_config.response_schema
          };
        } else if (generation_config.responseMimeType === "application/json" || generation_config.response_mime_type === "application/json") {
          response_format = { type: "object" };
        }
        delete generation_config.responseMimeType;
        delete generation_config.response_mime_type;
        delete generation_config.responseSchema;
        delete generation_config.response_schema;
        if (generation_config.candidateCount) {
          generation_config.candidate_count = generation_config.candidateCount;
          delete generation_config.candidateCount;
        }
        if (generation_config.maxOutputTokens) {
          generation_config.max_output_tokens = generation_config.maxOutputTokens;
          delete generation_config.maxOutputTokens;
        }
        if (generation_config.stopSequences) {
          generation_config.stop_sequences = generation_config.stopSequences;
          delete generation_config.stopSequences;
        }

        return await ai.interactions.create({
          model: modelName,
          input,
          generation_config,
          response_format,
        });
      };

      try {
        const interaction = await retryRequest(() => runInteraction(model));
        return res.json({ text: interaction.output_text });
      } catch (error: any) {
        console.log("[GenerateContent] Switching to secondary model fallback...");
        const errMsg = (error.message || "").toLowerCase();
        const isQuotaOrTemporaryErr =
          error.status === "RESOURCE_EXHAUSTED" ||
          error.status === "UNAVAILABLE" ||
          error.code === 429 ||
          error.code === 503 ||
          errMsg.includes("quota") ||
          errMsg.includes("limit") ||
          errMsg.includes("temporary") ||
          errMsg.includes("demand") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("too many") ||
          errMsg.includes("busy") ||
          errMsg.includes("exhausted");

        if (isQuotaOrTemporaryErr) {
          // Use the most efficient models when possible
          const fallbackModels = [
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash",
            "gemini-3.1-pro-preview",
          ];
          
          const failedModel = model;
          const attempts = fallbackModels.filter(m => m !== failedModel);
          
          for (const fallbackModel of attempts) {
            try {
              console.log(`[Model Recovery] Retrying with model ${fallbackModel}...`);
              const interaction = await retryRequest(() => runInteraction(fallbackModel), 1, 300);
              return res.json({ text: interaction.output_text });
            } catch (fallbackError: any) {
              console.log(`[Model Recovery] Model ${fallbackModel} was also busy/exhausted.`);
            }
          }

          // Final fallback to Brave Search if available
          if (queryText) {
            const fallback = await tryBraveSearchFallback(queryText, error.message || String(error), 'generateContent');
            return res.json(fallback);
          }
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error("Gemini GenerateContent Proxy Error:", error);
      const { code, status, message } = parseGeminiError(error);
      res.status(code).json({ error: message, status });
    }
  });

  app.post("/api/gemini/generateImages", async (req, res) => {
    const { prompt, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const interaction = await retryRequest(() => ai.interactions.create({
        model: "gemini-3.1-flash-image",
        input: prompt,
        response_modalities: ["image", "text"],
        generation_config: {
          image_config: {
            aspect_ratio: config?.aspectRatio || "1:1",
            image_size: config?.imageSize || "1K",
          },
        },
      }));

      const images: any[] = [];
      for (const step of interaction.steps) {
        if (step.type === "model_output") {
          const imageContent = step.content?.find((c) => c.type === "image");
          if (imageContent && imageContent.data) {
            images.push({
              url: `data:${imageContent.mime_type || "image/png"};base64,${imageContent.data}`,
            });
          }
        }
      }

      res.json({ images });
    } catch (error: any) {
      console.error("Gemini GenerateImages Proxy Error:", error);
      const { code, status, message } = parseGeminiError(error);
      res.status(code).json({ error: message, status });
    }
  });

  app.get("/api/images/search", async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const query = String(q);
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;

    // 1. Try Brave Search API if configured
    if (braveApiKey) {
      try {
        console.log(`[Image Search] Querying Brave Search for: "${query}"...`);
        const response = await fetch(
          `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=20`,
          {
            headers: {
              "Accept": "application/json",
              "X-Subscription-Token": braveApiKey
            }
          }
        );

        if (response.ok) {
          const data: any = await response.json();
          const results = data.results || [];
          const images = results.map((item: any) => ({
            url: item.properties?.url || item.thumbnail?.src || item.url,
            thumbnail: item.thumbnail?.src || item.properties?.placeholder || item.properties?.url,
            title: item.title || "Image",
            source: item.source || new URL(item.url || "https://example.com").hostname
          })).filter((img: any) => img.url);

          return res.json({ images });
        } else {
          console.error(`Brave Image Search returned HTTP ${response.status}. Falling back to DuckDuckGo...`);
        }
      } catch (err) {
        console.error("Brave Image Search failed. Falling back to DuckDuckGo:", err);
      }
    }

    // 2. Fallback to DuckDuckGo Image Search
    try {
      console.log(`[Image Search] Querying DuckDuckGo Image Search for: "${query}"...`);
      const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
      const ddgResponse = await fetch(ddgUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!ddgResponse.ok) {
        throw new Error(`DuckDuckGo main page fetch returned HTTP ${ddgResponse.status}`);
      }

      const html = await ddgResponse.text();
      const vqdMatch = html.match(/vqd=([^&'"]+)/);
      if (!vqdMatch) {
        throw new Error("Failed to extract vqd token from DuckDuckGo");
      }

      const vqd = vqdMatch[1];
      const imagesUrl = `https://duckduckgo.com/i.html?o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
      const imagesResponse = await fetch(imagesUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://duckduckgo.com/"
        }
      });

      if (!imagesResponse.ok) {
        throw new Error(`DuckDuckGo JSON search returned HTTP ${imagesResponse.status}`);
      }

      const data: any = await imagesResponse.json();
      const results = data.results || [];
      const images = results.map((item: any) => ({
        url: item.image,
        thumbnail: item.thumbnail,
        title: item.title,
        source: item.source || "Web"
      }));

      return res.json({ images });
    } catch (err: any) {
      console.error("DuckDuckGo Image Search failed:", err);
      return res.status(500).json({ error: "Failed to search images", details: err.message });
    }
  });

  app.post("/api/gemini/analyzeImage", async (req, res) => {
    const { imageUrl, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    try {
      console.log(`[Analyze Image] Fetching image from url: ${imageUrl}`);
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image. Status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = await response.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");

      const ai = new GoogleGenAI({ apiKey });
      const interaction = await retryRequest(() => ai.interactions.create({
        model: "gemini-3.1-pro-preview",
        input: [
          { type: "image", data: base64Data, mime_type: contentType },
          { type: "text", text: prompt || "Analyze this image and describe its key visual elements." }
        ]
      }));

      res.json({ text: interaction.output_text });
    } catch (error: any) {
      console.error("Gemini AnalyzeImage Proxy Error:", error);
      const { code, status, message } = parseGeminiError(error);
      res.status(code).json({ error: message, status });
    }
  });

  app.post("/api/gemini/analyzeVideo", async (req, res) => {
    const { videoUrl, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    if (!videoUrl) {
      return res.status(400).json({ error: "videoUrl is required" });
    }

    try {
      console.log(`[Analyze Video] Fetching video from url: ${videoUrl}`);
      // Note: In a real app, we might need a more robust way to handle video file uploads or remote URIs
      // Gemini Interactions API expects data for video if inline, or file_uri if uploaded.
      // This is a simplified proxy assuming it can handle the URL or needs to be downloaded.
      
      const ai = new GoogleGenAI({ apiKey });
      const interaction = await retryRequest(() => ai.interactions.create({
        model: "gemini-3.1-pro-preview",
        input: [
          { type: "file", file_uri: videoUrl, mime_type: "video/mp4" }, // Simplified assumption
          { type: "text", text: prompt || "Analyze this video and describe its key content." }
        ]
      }));

      res.json({ text: interaction.output_text });
    } catch (error: any) {
      console.error("Gemini AnalyzeVideo Proxy Error:", error);
      const { code, status, message } = parseGeminiError(error);
      res.status(code).json({ error: message, status });
    }
  });

  app.post("/api/gemini/tts", async (req, res) => {
    const { text, voiceName, model, systemInstruction, speed, pitch } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const selectedModel = (model && model.toLowerCase().includes("tts")) ? model : "gemini-3.1-flash-tts-preview";
      
      let targetVoice = voiceName || "Kore";
      const validVoices = ['Kore', 'Aoede', 'Charon', 'Fenrir', 'Puck', 'Zephyr', 'Orus'];

      // First check if a valid voice name is embedded anywhere in voiceName string
      const matchedVoice = validVoices.find(v => targetVoice.toLowerCase().includes(v.toLowerCase()));
      
      if (matchedVoice) {
        targetVoice = matchedVoice;
      } else {
        // Voice mappings for Tigrinya / custom labels
        const voiceMap: Record<string, string> = {
          'selam': 'Kore',
          'senait': 'Aoede',
          'robel': 'Puck',
          'aman': 'Charon',
          'kidane': 'Fenrir',
          'yohannes': 'Orus',
          'luwam': 'Aoede',
          'kibrom': 'Fenrir',
          'yordanos': 'Kore',
          'amanuel': 'Charon',
          'arus': 'Orus',
          'aigeez_female_traditional': 'Kore',
          'aigeez_female_casual': 'Aoede',
          'aigeez_male_formal': 'Charon'
        };
        const lower = targetVoice.toLowerCase();
        let mapped = 'Kore';
        for (const [key, val] of Object.entries(voiceMap)) {
          if (lower.includes(key)) {
            mapped = val;
            break;
          }
        }
        targetVoice = mapped;
      }

      const runTts = async (modelToUse: string) => {
        const payload: any = {
          model: modelToUse,
          input: systemInstruction ? `[Instruction: ${systemInstruction}]\n\nRead the following text aloud: ${text}` : text,
          response_modalities: ["audio"],
          generation_config: {
            speech_config: [
              {
                voice: targetVoice
              }
            ]
          },
        };

        return await ai.interactions.create(payload);
      };

      let interaction: any;
      const primaryModel = selectedModel || "gemini-3.1-flash-tts-preview";
      const candidateModels = Array.from(new Set([
        primaryModel, 
        "gemini-3.1-flash-tts-preview", 
        "gemini-3.1-flash-lite"
      ]));
      let lastTtsError: any = null;

      for (const modelToTry of candidateModels) {
        try {
          interaction = await retryRequest(() => runTts(modelToTry));
          if (interaction) break;
        } catch (err: any) {
          console.warn(`[TTS] Model ${modelToTry} failed (${err.message}). Trying fallback...`);
          lastTtsError = err;
        }
      }

      if (!interaction) {
        throw lastTtsError || new Error("Failed to generate TTS audio.");
      }

      let audioData = null;
      const interactionResult = interaction as any;
      if (interactionResult.steps) {
        for (const step of interactionResult.steps) {
          if (step.type === "model_output") {
            const audioContent = step.content?.find((c: any) => c.type === "audio");
            if (audioContent && audioContent.data) {
              audioData = audioContent.data;
              break;
            }
          }
        }
      }

      res.json({ audio: audioData });
    } catch (error: any) {
      console.error("Gemini TTS Error:", error);
      const { code, status, message } = parseGeminiError(error);
      res.status(code).json({ error: message, status });
    }
  });

  app.post("/api/gemini/refine", async (req, res) => {
    const { text, language = 'ti' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API Key missing" });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Refine the following ${language === 'ti' ? 'Tigrinya' : 'Amharic'} text written in Ge'ez script to optimize it for high-quality Text-to-Speech (TTS) output.
      
      Requirements:
      1. Correct any common punctuation issues (use Ge'ez punctuation: '፣' '።' '፧').
      2. Ensure the cadence is natural for a native speaker.
      3. Do NOT change the meaning, only fix the phrasing or punctuation to sound better when read aloud.
      4. Output ONLY the refined Ge'ez text.
      
      Text to refine:
      "${text}"`;

      const runRefine = async (modelName: string) => {
        return await ai.interactions.create({
          model: modelName,
          input: prompt,
          system_instruction: "You are a linguistics expert in Semitic languages (Tigrinya/Amharic) and Ge'ez script."
        });
      };

      let interaction: any;
      try {
        interaction = await retryRequest(() => runRefine("gemini-3.1-flash-lite"), 2, 300);
      } catch (refineErr) {
        interaction = await retryRequest(() => runRefine("gemini-2.5-flash"), 1, 300);
      }

      res.json({ refinedText: interaction.output_text?.trim() });
    } catch (error: any) {
      console.error("Refine Error:", error);
      res.status(500).json({ error: "Failed to refine text" });
    }
  });

  app.post("/api/gemini/scrapeUrl", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith("http")) {
        return res.status(400).json({ error: "Only HTTP/HTTPS URLs are supported" });
      }

      const fetchResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const html = await fetchResponse.text();

      // extract <title>
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

      // extract meta description
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
                        html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
      const description = descMatch ? descMatch[1].trim() : "";

      // simple HTML tag stripping to get visible text content
      let bodyText = html;
      const bodyMatch = html.match(/<body([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyText = bodyMatch[1];
      }

      // Remove script, style, code, svg, and comment tags to get clean prose
      bodyText = bodyText.replace(/<script[\s\S]*?<\/script>/gi, " ")
                         .replace(/<style[\s\S]*?<\/style>/gi, " ")
                         .replace(/<code[\s\S]*?<\/code>/gi, " ")
                         .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
                         .replace(/<!--[\s\S]*?-->/g, " ");

      let cleanText = bodyText.replace(/<[^>]+>/g, " ");
      cleanText = cleanText.replace(/\s+/g, " ").trim();

      const maxLength = 8000;
      if (cleanText.length > maxLength) {
        cleanText = cleanText.slice(0, maxLength) + " [truncated...]";
      }

      res.json({
        title,
        description,
        content: cleanText,
      });
    } catch (error: any) {
      console.error("URL Scraper failed:", error);
      res.status(500).json({ error: error.message || "Failed to parse the URL." });
    }
  });

  app.post("/api/gemini/chatStream", async (req, res) => {
    const { history, message, systemInstruction, aiModelMode } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Map multimodal message to Interactions API input format
      let input = message;
      if (Array.isArray(message)) {
        input = message.map((p: any) => {
          if (typeof p === "string") return { type: "text", text: p };
          if (p.inlineData) {
            let mediaType = "image";
            if (p.inlineData.mimeType?.startsWith("video/")) mediaType = "video";
            if (p.inlineData.mimeType?.startsWith("audio/")) mediaType = "audio";
            let mType = p.inlineData.mimeType || "";
            if (mType.startsWith("audio/")) {
              if (mType.includes("webm")) {
                mType = "audio/ogg";
              } else if (mType.includes("mp4")) {
                mType = "audio/m4a";
              }
            }
            return { 
              type: mediaType, 
              data: p.inlineData.data, 
              mime_type: mType 
            };
          }
          if (p.text) return { type: "text", text: p.text };
          return p;
        });
      }

      let hasMultimodal = false;
      if (Array.isArray(message)) {
        hasMultimodal = message.some((p: any) => p.inlineData || p.fileData || p.type === "image" || p.type === "video" || (p.inlineData && p.inlineData.mimeType?.startsWith("video/")));
      }

      // Build system instruction including conversation history if available
      let systemInstructionText = systemInstruction || "You are a helpful assistant.";
      if (Array.isArray(history) && history.length > 0) {
        let historyPrompt = "\n\n=== [CONVERSATION HISTORY] ===\n";
        for (const msg of history) {
          const roleLabel = msg.role === "user" ? "User" : "Assistant";
          let textParts = "";
          if (typeof msg.parts === "string") {
            textParts = msg.parts;
          } else if (Array.isArray(msg.parts)) {
            textParts = msg.parts.map((p: any) => p.text || String(p)).join(" ");
          } else if (msg.parts) {
            textParts = String(msg.parts);
          }
          historyPrompt += `[${roleLabel}]: ${textParts}\n`;
        }
        historyPrompt += "================================\n\n";
        systemInstructionText += historyPrompt;
      }

      let resolvedModel = "gemini-2.5-flash";
      let tools: any[] | undefined = undefined;
      let generationConfig: any = {};
      
      if (hasMultimodal) {
        resolvedModel = "gemini-3.1-pro-preview";
      } else if (aiModelMode === "lite") {
        resolvedModel = "gemini-3.1-flash-lite";
        generationConfig = {
          thinking_level: "minimal"
        };
      } else if (aiModelMode === "thinking") {
        resolvedModel = "gemini-3.1-pro-preview";
        generationConfig = {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          }
        };
        delete generationConfig.maxOutputTokens;
        delete generationConfig.max_output_tokens;
      } else if (aiModelMode === "search") {
        resolvedModel = "gemini-2.5-flash";
        tools = [{ type: "google_search" }];
      } else if (aiModelMode === "maps") {
        resolvedModel = "gemini-2.5-flash";
        tools = [{ type: "google_maps" }];
      } else {
        resolvedModel = "gemini-2.5-flash";
      }

      const runStream = async (modelName: string) => {
        const generation_config: any = generationConfig ? { ...generationConfig } : {};
        if (generation_config.thinkingConfig) {
          const level = generation_config.thinkingConfig.thinkingLevel || generation_config.thinkingConfig.thinking_level;
          generation_config.thinking_level = level === ThinkingLevel.HIGH || level === "high" ? "high" : (level === ThinkingLevel.LOW || level === "low" ? "low" : "minimal");
          delete generation_config.thinkingConfig;
        }
        let response_format: any = undefined;
        if (generation_config.responseSchema || generation_config.response_schema) {
          response_format = { 
            type: "object",
            json_schema: generation_config.responseSchema || generation_config.response_schema
          };
        } else if (generation_config.responseMimeType === "application/json" || generation_config.response_mime_type === "application/json") {
          // Fallback if JSON requested but no schema
          response_format = { type: "object" };
        }
        delete generation_config.responseMimeType;
        delete generation_config.response_mime_type;
        delete generation_config.responseSchema;
        delete generation_config.response_schema;

        // Try to establish the stream using retryRequest
        const stream = await retryRequest(() => {
          const payload: any = {
            model: modelName,
            input: input,
            system_instruction: systemInstructionText,
            generation_config: generation_config,
            stream: true,
          };
          if (tools) payload.tools = tools;
          if (response_format) payload.response_format = response_format;
          return ai.interactions.create(payload);
        });

        for await (const event of (stream as any)) {
          // Transform Interactions API event to legacy candidates format for frontend compatibility
          const sseEvent = event as any;

          if (sseEvent.event_type === "error" && sseEvent.error) {
            const errObj = sseEvent.error;
            const errorInstance = new Error(errObj.message || "Interactions Stream Error");
            (errorInstance as any).code = errObj.code;
            (errorInstance as any).status = errObj.code === "too_many_requests" ? "RESOURCE_EXHAUSTED" : (errObj.status || "INTERNAL_SERVER_ERROR");
            throw errorInstance;
          }

          if (sseEvent.event_type === "step.delta" && sseEvent.delta) {
            const delta = sseEvent.delta;
            const parts: any[] = [];
            if (delta.type === "text" && delta.text) {
              parts.push({ text: delta.text });
            } else if (delta.type === "thought" && (delta.thought || delta.text)) {
              parts.push({ thought: delta.thought || delta.text });
            }
            
            if (parts.length > 0) {
              const legacyChunk = {
                candidates: [{
                  content: {
                    parts
                  }
                }]
              };
              res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
            }
            continue;
          }

          if (sseEvent.event_type === "interaction.completed" && sseEvent.interaction) {
            const metadata = sseEvent.interaction.grounding_metadata || {};
            const groundingMetadata = {
              webSearchQueries: metadata.web_search_queries,
              searchEntryPoint: metadata.search_entry_point,
              groundingChunks: metadata.grounding_chunks?.map((c: any) => ({
                web: c.web ? { title: c.web.title, uri: c.web.uri } : undefined
              }))
            };

            const legacyChunk = {
              candidates: [{
                content: {
                  parts: []
                },
                groundingMetadata
              }]
            };
            res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
          } else {
            // Forward other events if they don't contain duplicate text blocks
            if (sseEvent.event_type !== "step.stop" && sseEvent.event_type !== "interaction.completed") {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
          }
        }
      };

      try {
        await runStream(resolvedModel);
      } catch (streamError: any) {
        const errMsg = streamError.message || String(streamError);
        const errCodeStr = streamError.code ? String(streamError.code).toLowerCase() : "";
        const isQuotaOrTemporaryErr =
          streamError.status === "RESOURCE_EXHAUSTED" ||
          streamError.status === "UNAVAILABLE" ||
          streamError.code === 429 ||
          streamError.code === 503 ||
          errCodeStr.includes("quota") ||
          errCodeStr.includes("rate limit") ||
          errCodeStr.includes("rate_limit") ||
          errCodeStr.includes("too_many") ||
          errMsg.includes("quota") ||
          errMsg.includes("Quota") ||
          errMsg.includes("limit") ||
          errMsg.includes("temporary") ||
          errMsg.includes("demand") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("rate_limit") ||
          errMsg.includes("busy") ||
          errMsg.includes("exhausted");

        if (isQuotaOrTemporaryErr) {
          const fallbackModels = [
            "gemini-3.1-flash-lite", // Extremely cost-effective
            "gemini-2.5-flash",
            "gemini-3.1-pro-preview",
          ];
          
          let succeeded = false;
          const attempts = fallbackModels.filter(m => m !== resolvedModel);
          
          for (const fallbackModel of attempts) {
            try {
              console.log(`[Model Recovery] Stream retrying with model ${fallbackModel}...`);
              await runStream(fallbackModel);
              succeeded = true;
              break;
            } catch (fbErr: any) {
              console.log(`[Model Recovery] Stream model ${fallbackModel} was also busy/exhausted.`);
            }
          }
          
          if (!succeeded) {
            // Extract query for fallback
            let queryText = "";
            try {
              if (typeof message === "string") queryText = message;
              else if (Array.isArray(message)) {
                queryText = message.map((p: any) => p.text || "").join(" ");
              } else if (message && typeof message === "object") {
                queryText = message.text || "";
              }
            } catch (e) {}

            if (queryText) {
              const fallback = await tryBraveSearchFallback(queryText, streamError.message || String(streamError), 'chatStream');
              await streamFallbackResponse(res, fallback.text, fallback.groundingSources);
            } else {
              throw streamError;
            }
          }
        } else {
          throw streamError;
        }
      }
    } catch (error: any) {
      console.error("Chat Stream Error:", error);
      const { code, status, message: errMessage } = parseGeminiError(error);
      res.write(
        `data: ${JSON.stringify({ error: errMessage, code, status })}\n\n`,
      );
    } finally {
      res.end();
    }
  });

  // Create HTTP Server & attach components for Hot module & static server & WebSockets
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket Upgrade manually on '/api/live-talk' path
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(
      request.url || "",
      `http://${request.headers.host}`,
    ).pathname;
    if (pathname === "/api/live-talk") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Multimodal Gemini Live API WebSocket Bridge
  wss.on("connection", async (clientWs: WebSocket) => {
    let sessionPromise: any = null;
    let isClosed = false;

    clientWs.on("message", async (rawData) => {
      if (isClosed) return;
      try {
        const data = JSON.parse(rawData.toString());

        // 1. Initial configuration setup
        if (data.setup) {
          const { systemInstruction, voiceName } = data.setup;
          const apiKey = process.env.GEMINI_API_KEY || process.env.GeminiAPIKey;
          if (!apiKey) {
            clientWs.send(
              JSON.stringify({
                error: "GEMINI_API_KEY is not configured on the server",
              }),
            );
            clientWs.close();
            return;
          }

          const ai = new GoogleGenAI({ 
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          console.log("Connecting to Gemini Live with model: gemini-3.1-flash-live-preview");
          try {
            sessionPromise = ai.live.connect({
              model: "gemini-3.1-flash-live-preview",
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" },
                  },
                },
                systemInstruction: (systemInstruction || "You are a helpful assistant.") + " You specializing in Ethiopic languages (Tigrinya, Amharic) and English.",
              },
              callbacks: {
                onmessage: (message: LiveServerMessage) => {
                  if (isClosed) return;
                  clientWs.send(JSON.stringify(message));

                  // Proactively handle GoAway signals from Gemini Live backend to shut down gracefully
                  if (message && (message as any).goAway) {
                    console.log("Received GoAway signal from Gemini Live. Initiating graceful shutdown.");
                    isClosed = true;
                    if (sessionPromise) {
                      sessionPromise.then((session: any) => {
                        try {
                          session.close();
                        } catch (err) {
                          console.error("Error closing session on GoAway:", err);
                        }
                      }).catch(() => {});
                    }
                    clientWs.send(JSON.stringify({
                      error: "Live Session Completed",
                      details: "Your live session completed its maximum duration limit successfully. Feel free to start a new one anytime!"
                    }));
                    setTimeout(() => {
                      try {
                        clientWs.close();
                      } catch (err) {}
                    }, 150);
                  }
                },
                onclose: (event?: any) => {
                  if (isClosed) return;
                  isClosed = true;
                  
                  let reason = "Unknown reason";
                  let closeCode = 1000;
                  if (event) {
                    closeCode = event.code || 1000;
                    reason = event.reason || `Code: ${event.code}`;
                    // Special handling for Node.js ws Symbol(kReason)
                    const symbols = Object.getOwnPropertySymbols(event);
                    const kReasonSymbol = symbols.find(s => s.toString() === 'Symbol(kReason)');
                    if (kReasonSymbol) {
                      reason = event[kReasonSymbol] || reason;
                    }
                  }

                  const reasonStr = String(reason).toLowerCase();
                  if (reasonStr.includes("quota") || reasonStr.includes("limit") || reasonStr.includes("exceeded") || reasonStr.includes("billing")) {
                    console.log("Gemini Live Session Closed softly: Quota limit reached.");
                  } else {
                    console.log("Gemini Live Session Closed by Google backend:", reason);
                  }

                  if (clientWs.readyState === WebSocket.OPEN) {
                    if (reasonStr.includes("goaway") || reasonStr.includes("session durat") || reasonStr.includes("aborted")) {
                      clientWs.send(JSON.stringify({ 
                        info: "Live Session Completed",
                        details: "Your live session has reached its maximum duration limit. You can start a new session anytime!"
                      }));
                    } else if (reasonStr.includes("quota") || reasonStr.includes("limit") || reasonStr.includes("exceeded")) {
                      clientWs.send(JSON.stringify({ 
                        error: "Service Limit Reached",
                        details: "You have exceeded your current usage quota. Please check your plan or try again later."
                      }));
                    } else if (closeCode === 1006 || reasonStr.includes("1006") || reasonStr.includes("abnormal")) {
                      clientWs.send(JSON.stringify({
                        info: "Live Talk Disconnected",
                        details: "Live session ended naturally. Feel free to reconnect anytime."
                      }));
                    }
                  }
                  try { clientWs.close(); } catch (err) {}
                },
                onerror: (err: any) => {
                  if (isClosed) return;
                  
                  let errMsg = "Internal Gemini Live error";
                  if (err) {
                    errMsg = err.message || JSON.stringify(err);
                  }

                  const errMsgLower = errMsg.toLowerCase();
                  if (errMsgLower.includes("quota") || errMsgLower.includes("limit") || errMsgLower.includes("exceeded")) {
                    console.warn("Gemini Live Bridge Inner Notice (Quota/Limit):", errMsg);
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({
                        error: "Service Limit Reached",
                        details: "Quota or rate limit reached. Please try again shortly."
                      }));
                    }
                  } else {
                    console.error("Gemini Live Bridge Inner Error (callback):", err);
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          error: "Gemini Live API error: " + errMsg,
                        }),
                      );
                    }
                  }
                },
              },
            });
            
            console.log("Gemini Live connection request initiated successfully");
          } catch (connErr) {
            console.error("Gemini Live connection CRITICAL call failure:", connErr);
            clientWs.send(JSON.stringify({ error: "Immediate connection failure: " + (connErr instanceof Error ? connErr.message : "Unknown") }));
            clientWs.close();
            return;
          }

          sessionPromise.catch((err: any) => {
            if (isClosed) return;
            const errMsg = err ? (err.message || String(err)) : "Unknown";
            const errMsgLower = errMsg.toLowerCase();
            if (errMsgLower.includes("quota") || errMsgLower.includes("limit") || errMsgLower.includes("exceeded")) {
              console.warn("Gemini Live Connection Promise Soft Notice (Quota/Limit):", errMsg);
            } else {
              console.error("Gemini Live Connection Promise Rejected (Async):", err);
            }
            clientWs.send(
              JSON.stringify({
                error: "Connection failed: " + errMsg,
              }),
            );
            setTimeout(() => {
              if (!isClosed) clientWs.close();
            }, 2500);
          });
          return;
        }

        // 2. Continuous real-time voice streaming input from microphone
        if (data.audio && sessionPromise) {
          const session = await sessionPromise;
          session.sendRealtimeInput({
            audio: { data: data.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }

        // 3. Continuous real-time keyboard/text/image multimodal input
        if (sessionPromise && (data.text || data.image)) {
          const session = await sessionPromise;
          
          if (data.image) {
            session.sendRealtimeInput({
              video: {
                data: data.image.base64,
                mimeType: data.image.mimeType || "image/jpeg"
              }
            });
          }
          
          if (data.text) {
            session.sendRealtimeInput({
              text: data.text
            });
          }
        }
      } catch (err) {
        console.error("WebSocket Bridge parsing/routing error:", err);
      }
    });

    clientWs.on("close", async () => {
      isClosed = true;
      if (sessionPromise) {
        try {
          const session = await sessionPromise;
          session.close();
        } catch (err) {
          console.error("Error closing Gemini session:", err);
        }
      }
    });
  });

  // Serve Single-Page Application via Vite (dev) or express static files (prod)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
