// FIX: Changed import to remove explicit Request and Response types, preventing potential type conflicts.
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import "dotenv/config";

// --- Clé API (Cloud Run: Variables & secrets -> API_KEY) ---
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("FATAL: API_KEY is missing. Set it in Cloud Run -> Variables & secrets.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

const app = express();
app.use(express.json());

// ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// --- Static files (front) ---
app.use(express.static(projectRoot));               // index.html, index.css
app.use("/dist", express.static(path.join(projectRoot, "dist"))); // dist/index.js

// Health
// FIX: Removed explicit Request and Response types to rely on TypeScript's type inference.
app.get("/api/health", (_req, res) => res.send("ok"));

// Helper timeout
function withTimeout<T>(p: Promise<T>, ms: number, label = "AI call"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

// IA endpoint
// FIX: Removed explicit Request and Response types to rely on TypeScript's type inference.
app.post("/api/ask", async (req, res) => {
  const { query, profile } = req.body || {};
  if (!query || !profile) {
    return res.status(400).json({ error: "query and profile are required" });
  }

  try {
    const systemInstruction = `Tu es un expert en mobilité internationale et carrière pour le profil "${profile}".
Réponds en français, de manière structurée en Markdown (titres, listes, gras).`;

    const result: GenerateContentResponse = await withTimeout(
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: String(query),
        config: { systemInstruction }
      }),
      15000,
      "Gemini generateContent"
    );

    const aiText = result.text;

    if (!aiText || !aiText.trim()) throw new Error("Réponse IA vide");

    return res.json({ answer: aiText });
  } catch (err: any) {
    console.error("Error /api/ask:", err?.message || err);
    return res.status(502).json({ error: err?.message || "AI error" });
  }
});

// SPA fallback
// FIX: Removed explicit Request and Response types to rely on TypeScript's type inference.
app.get("*", (_req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
