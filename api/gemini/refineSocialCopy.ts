/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { currentCopy, refineInstructions } = req.body || {};
  const model = "gemini-3.5-flash";
  console.log(`[FUTURA SERVER] refineSocialCopy invocado con instrucciones de refinamiento: "${refineInstructions || ""}". Usando modelo: ${model}`);
  const systemInstruction = "Eres un editor experto de copywriting. Refina el copy provisto siguiendo las instrucciones brutales del usuario, manteniendo la fuerza persuasiva, el gancho magnético, el formato cómodo para móvil y la filosofía pragmática 'Results over Aesthetics'.";

  try {
    const response = await getAiClient(customKey).models.generateContent({
      model,
      contents: [{
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
      config: { 
        systemInstruction,
      }
    });

    return res.status(200).json({ response: response.text || currentCopy });
  } catch (error: any) {
    console.error("Endpoint refineSocialCopy Error:", error);
    return res.status(500).json({ error: error.message || "Error al refinar copy" });
  }
}
