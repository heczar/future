/**
 * ⚠️ WARNING / ATENCIÓN — CRITICAL PRODUCTION SERVER FILE ⚠️
 * DO NOT MODIFY THIS FILE OR CHANGE ITS IMPORT PATHS / EXTENSIONS.
 * ANY CHANGES TO THIS FILE BY AI AGENTS OR AI STUDIO MUST BE PREVENTED
 * TO AVOID BREAKING THE VERCEL SERVERLESS RUNTIME (ERR_MODULE_NOT_FOUND).
 * ALL IMPORTS MUST USE THE CORRECT PATH "./api/gemini/..." AND END WITH ".js".
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";

import chatWithAdvisorHandler from "./api/gemini/chatWithAdvisor.js";
import chatAboutPhaseHandler from "./api/gemini/chatAboutPhase.js";
import generateContentStrategyHandler from "./api/gemini/generateContentStrategy.js";
import generateCreativeImageHandler from "./api/gemini/generateCreativeImage.js";
import generateSocialCopyHandler from "./api/gemini/generateSocialCopy.js";
import refineSocialCopyHandler from "./api/gemini/refineSocialCopy.js";
import devAgentHandler from "./api/admin/devAgent.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser configuration for large base64 strings (logos, images, training materials)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API ENDPOINTS ---

// Simple global memory buffer to diagnostics API errors
export const recentApiErrors: Array<{ timestamp: string; endpoint: string; error: string; stack?: string }> = [];

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    mode: process.env.NODE_ENV || "development",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
  });
});

// Diagnostics endpoint to expose runtime details for troubleshooting
app.get("/api/diagnostics", (req, res) => {
  res.json({
    recentErrors: recentApiErrors,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      PORT: PORT,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    }
  });
});

// Middleware to catch service handler errors and log them
const wrapHandler = (handler: Function) => {
  return async (req: any, res: any, next: any) => {
    try {
      await handler(req, res, next);
    } catch (err: any) {
      console.error(`[DIAGNOSTICS] Error captive in wrapHandler:`, err);
      recentApiErrors.push({
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        error: err.message || String(err),
        stack: err.stack
      });
      if (recentApiErrors.length > 20) recentApiErrors.shift();
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Internal diagnostics wrapped error" });
      }
    }
  };
};

// Mount the modular handlers directly (same signature matches Express midleware seamlessly)
app.post("/api/gemini/chatWithAdvisor", wrapHandler(chatWithAdvisorHandler));
app.post("/api/gemini/chatAboutPhase", wrapHandler(chatAboutPhaseHandler));
app.post("/api/gemini/generateContentStrategy", wrapHandler(generateContentStrategyHandler));
app.post("/api/gemini/generateCreativeImage", wrapHandler(generateCreativeImageHandler));
app.post("/api/gemini/generateSocialCopy", wrapHandler(generateSocialCopyHandler));
app.post("/api/gemini/refineSocialCopy", wrapHandler(refineSocialCopyHandler));
app.post("/api/admin/dev-agent", wrapHandler(devAgentHandler));

// --- VITE DEV OR STATIC PROD SERVER ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando Vite en Middleware Mode (Desarrollo)...");
    const { createServer: createViteServer } = await import("vite");
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
