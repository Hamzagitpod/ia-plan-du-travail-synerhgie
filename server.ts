import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// Accepte API_KEY (Cloud Run) ou GEMINI_API_KEY (local)
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("FATAL: API_KEY is missing. Set it in Cloud Run -> Variables & secrets (or GEMINI_API_KEY locally).");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

const app = express();
app.use(express.json());

// ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Static front
app.use(express.static(projectRoot)); // index.html, index.css
app.use("/dist", express.static(path.join(projectRoot, "dist"))); // dist/index.js

// Health
app.get("/api/health", (_req, res) => res.send("ok"));

// Timeout helper
function withTimeout<T>(p: Promise<T>, ms: number, label = "AI call"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

// IA endpoint
app.post("/api/ask", async (req, res) => {
  const { query, profile } = req.body || {};
  if (!query || !profile) {
    return res.status(400).json({ error: "query and profile are required" });
  }

  try {
    const systemInstruction = `Tu es un expert en mobilité internationale et carrière pour le profil "${profile}".
Réponds en français, structuré en Markdown (titres, listes, gras).`;

    const result: any = await withTimeout(
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: String(query),
        config: { systemInstruction }
      }),
      15000,
      "Gemini generateContent"
    );

    // Extraction robuste selon versions du SDK
    let aiText = "";
    try {
      if (typeof result?.text === "function") aiText = await result.text();
      else if (typeof result?.response?.text === "function") aiText = await result.response.text();
      else if (typeof result?.text === "string") aiText = result.text;
    } catch { /* ignore */ }

    if (!aiText || !aiText.trim()) throw new Error("Réponse IA vide");

    return res.json({ answer: aiText });
  } catch (err: any) {
    console.error("Error /api/ask:", err?.message || err);
    return res.status(502).json({ error: err?.message || "AI error" });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

