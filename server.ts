import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GIF Search API Proxy
  app.get("/api/gifs/search", async (req, res) => {
    const { q, offset = 0 } = req.query;
    const apiKey = process.env.GIPHY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GIPHY_API_KEY is not configured" });
    }

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
          String(q)
        )}&limit=20&offset=${offset}&rating=g`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Giphy Search Error:", error);
      res.status(500).json({ error: "Failed to fetch GIFs" });
    }
  });

  // Trending GIFs API Proxy
  app.get("/api/gifs/trending", async (req, res) => {
    const { offset = 0 } = req.query;
    const apiKey = process.env.GIPHY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GIPHY_API_KEY is not configured" });
    }

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&offset=${offset}&rating=g`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Giphy Trending Error:", error);
      res.status(500).json({ error: "Failed to fetch Trending GIFs" });
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
