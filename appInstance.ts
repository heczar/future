/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import dotenv from "dotenv";

import chatWithAdvisorHandler from "./api/gemini/chatWithAdvisor.js";
import chatAboutPhaseHandler from "./api/gemini/chatAboutPhase.js";
import generateContentStrategyHandler from "./api/gemini/generateContentStrategy.js";
import generateCreativeImageHandler from "./api/gemini/generateCreativeImage.js";
import generateSocialCopyHandler from "./api/gemini/generateSocialCopy.js";
import refineSocialCopyHandler from "./api/gemini/refineSocialCopy.js";

dotenv.config();

const app = express();

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

// Mount the modular handlers
app.post("/api/gemini/chatWithAdvisor", wrapHandler(chatWithAdvisorHandler));
app.post("/api/gemini/chatAboutPhase", wrapHandler(chatAboutPhaseHandler));
app.post("/api/gemini/generateContentStrategy", wrapHandler(generateContentStrategyHandler));
app.post("/api/gemini/generateCreativeImage", wrapHandler(generateCreativeImageHandler));
app.post("/api/gemini/generateSocialCopy", wrapHandler(generateSocialCopyHandler));
app.post("/api/gemini/refineSocialCopy", wrapHandler(refineSocialCopyHandler));

export default app;
