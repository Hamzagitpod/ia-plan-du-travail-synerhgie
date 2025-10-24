// FIX: Changed express import to correctly handle types for request handlers.
import express, { Request, Response } from "express";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The 'dist' folder contains the compiled server.js, so we go up one level to the project root for static files.
const projectRoot = path.join(__dirname, '..');

// Serve static files (HTML, CSS, client-side TSX) from the project root
app.use(express.static(projectRoot));

// API health check route
// FIX: Using imported Request and Response types to fix overload and property errors.
app.get("/api/health", (_req: Request, res: Response) => {
  res.send("API Synerhgie OK ✅");
});

// For any other route, fall back to serving index.html. This is crucial for the app to load correctly.
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
