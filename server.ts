// FIX: Import Request and Response from express and alias them to avoid conflicts with DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse } from "express";
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
// FIX: Using aliased types from express to correctly type the request and response objects, fixing overload and property errors.
app.get("/api/health", (_req: ExpressRequest, res: ExpressResponse) => {
  res.send("API Synergie OK ✅");
});

// For any other route, fall back to serving index.html. This is crucial for the app to load correctly.
// FIX: Using aliased types from express to correctly type the request and response objects.
app.get('*', (_req: ExpressRequest, res: ExpressResponse) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
