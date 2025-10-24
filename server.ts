// FIX: Changed import to use the default export of express to avoid type conflicts.
// The Request and Response types will now be accessed via `express.Request` and `express.Response`.
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

// --- Configuration et Validation ---
// Valide la présence de la clé API au démarrage.
// Si la variable n'est pas définie dans l'environnement GCP, le serveur échouera immédiatement
// avec un message clair, empêchant l'application de tourner dans un état invalide.
// FIX: Per @google/genai coding guidelines, the API key must be read from process.env.API_KEY.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("FATAL ERROR: API_KEY environment variable is not set.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const app = express();
app.use(express.json());

// ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// 1) Sert les fichiers statiques (index.html, index.css, dist/index.js)
app.use(express.static(projectRoot));
app.use('/dist', express.static(path.join(projectRoot, 'dist')));


// 2) Healthcheck
// FIX: Using explicit express.Request and express.Response types to resolve type errors.
app.get("/api/health", (_req: express.Request, res: express.Response) => {
  res.send("API Synerhgie OK ✅");
});

// 3) Endpoint IA qui appelle Gemini
// FIX: Using explicit express.Request and express.Response types to resolve type errors.
app.post("/api/ask", async (req: express.Request, res: express.Response) => {
  const { query, profile } = req.body;
  if (!query || !profile) {
    return res.status(400).json({ error: "query and profile are required" });
  }

  try {
    const systemInstruction = `Tu es un expert en mobilité internationale et carrière avec le profil spécifique d'un "${profile}". 
    Ta mission est de fournir des réponses précises, structurées et utiles. 
    Adopte un ton professionnel et encourageant. 
    Structure tes réponses en Markdown pour une lisibilité optimale (titres, listes à puces, gras).
    Réponds exclusivement en français.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // FIX: Simplified the `contents` parameter for a single-turn text prompt per @google/genai guidelines.
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    
    res.json({ answer: response.text });

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Impossible d'obtenir une réponse de l'IA. Détails: " + error.message });
  }
});

// 4) Fallback pour Single Page Application (SPA)
// FIX: Using explicit express.Request and express.Response types to resolve type errors.
app.get("*", (_req: express.Request, res: express.Response) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
