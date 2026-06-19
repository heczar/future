/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import chatWithAdvisorHandler from "./api/gemini/chatWithAdvisor";
import chatAboutPhaseHandler from "./api/gemini/chatAboutPhase";
import generateContentStrategyHandler from "./api/gemini/generateContentStrategy";
import generateCreativeImageHandler from "./api/gemini/generateCreativeImage";
import generateSocialCopyHandler from "./api/gemini/generateSocialCopy";
import refineSocialCopyHandler from "./api/gemini/refineSocialCopy";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser configuration for large base64 strings (logos, images, training materials)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API ENDPOINTS ---

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Mount the modular handlers directly (same signature matches Express midleware seamlessly)
app.post("/api/gemini/chatWithAdvisor", chatWithAdvisorHandler);
app.post("/api/gemini/chatAboutPhase", chatAboutPhaseHandler);
app.post("/api/gemini/generateContentStrategy", generateContentStrategyHandler);
app.post("/api/gemini/generateCreativeImage", generateCreativeImageHandler);
app.post("/api/gemini/generateSocialCopy", generateSocialCopyHandler);
app.post("/api/gemini/refineSocialCopy", refineSocialCopyHandler);

// --- VITE DEV OR STATIC PROD SERVER ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando Vite en Middleware Mode (Desarrollo)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Servidor en Producción: static serving del bundle... " + process.cwd());
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FUTURA Server ejecutándose en: http://localhost:${PORT}`);
  });
}

// Only start the listening port when run directly (not under Vercel Serverless Functions)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
