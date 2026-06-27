/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, generateContentWithRetry, getRefineSocialCopyFallback } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { currentCopy, refineInstructions } = req.body || {};
  const model = "gemini-2.5-flash";
  console.log(`[FUTURA SERVER] refineSocialCopy invocado con instrucciones de refinamiento: "${refineInstructions || ""}". Usando modelo: ${model}`);
  const systemInstruction = "Eres un editor experto de copywriting. Refina el copy provisto siguiendo las instrucciones brutales del usuario, manteniendo la fuerza persuasiva, el gancho magnético, el formato cómodo para móvil y la filosofía pragmática 'Results over Aesthetics'.";

  try {
    const response = await generateContentWithRetry(
      customKey,
      model,
      [{
        parts: [{
          text: `
            COPY ACTUAL:
            """
            ${currentCopy}
            """

            INSTRUCCIONES DE REFINAMIENTO:
            "${refineInstructions}"

            Genera el copy refinado final directamente en un impecable formato Markdown.
          `
        }]
      }],
      { 
        systemInstruction,
      }
    );

    return res.status(200).json({ response: response.text || currentCopy });
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    const isQuotaOrLimit = errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit") || errStr.includes("503") || errStr.includes("unavailable");
    
    if (isQuotaOrLimit) {
      console.log("[FUTURA] refineSocialCopy quota/demand limit reached. Triggering high-fidelity local refinement fallback.");
    } else {
      console.warn("[FUTURA] refineSocialCopy exception:", error.message || error);
    }
    
    // Serve our custom local copywriting refinement fallback
    const fallbackResponse = getRefineSocialCopyFallback(currentCopy, refineInstructions);
    return res.status(200).json(fallbackResponse);
  }
}
