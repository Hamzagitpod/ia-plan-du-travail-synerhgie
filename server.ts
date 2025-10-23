import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';

// Charger les variables d'environnement du fichier .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors()); // Autoriser les requêtes cross-origin (pour le développement local)
app.use(express.json()); // Parser les corps de requête JSON

// Vérification de la clé API au démarrage
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("Erreur : La variable d'environnement API_KEY n'est pas définie.");
    // Fix: Cast 'process' to 'any' to resolve a TypeScript error on 'exit', which can occur with misconfigured Node.js type definitions.
    (process as any).exit(1);
}

// Initialisation du client Google GenAI
const ai = new GoogleGenAI({ apiKey });

// Endpoint de l'API pour la recherche
app.post('/api/search', async (req: Request, res: Response) => {
    const { query, profile } = req.body;

    // Validation simple de l'entrée
    if (!query || !profile) {
        return res.status(400).json({ error: "La question ('query') et le profil ('profile') sont requis." });
    }

    try {
        console.log(`Requête reçue - Profil: ${profile}, Question: ${query}`);

        // Prompt Engineering : On guide l'IA pour obtenir de meilleurs résultats
        const systemInstruction = `
            Vous êtes un expert de classe mondiale en droit du travail international et en mobilité professionnelle.
            Votre rôle est de fournir des réponses précises, structurées et directement exploitables basées sur la question et le profil de l'utilisateur.
            Mettez en évidence les points clés, les démarches administratives et les conseils pratiques.
            La réponse doit être formulée en français.
        `;

        const userPrompt = `
            En tant que "${profile}", je me pose la question suivante concernant le travail en Guinée : "${query}".

            Fournissez une synthèse structurée qui aborde les points suivants si pertinents :
            1.  **Visa et Permis de Travail :** Procédures, documents requis, délais estimés.
            2.  **Marché du Travail :** Opportunités pour un profil de ${profile}, salaires moyens, secteurs porteurs.
            3.  **Contrat de Travail :** Spécificités locales, points de vigilance.
            4.  **Fiscalité :** Taux d'imposition sur le revenu, taxes locales.
            5.  **Qualité de Vie :** Coût de la vie, logement, sécurité.
            
            Votre réponse doit être claire et facile à comprendre.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        const aiResponseText = response.text;
        console.log("Réponse de Gemini reçue.");

        res.json({ result: aiResponseText });

    } catch (error) {
        console.error("Erreur lors de l'appel à l'API Gemini:", error);
        res.status(500).json({ error: "Une erreur est survenue lors de la communication avec le service d'IA." });
    }
});

app.listen(PORT, () => {
    console.log(`Le serveur backend est démarré et écoute sur le port ${PORT}`);
});
