/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, sanitizeGeminiContents } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { phase, history, message } = req.body || {};
  const model = "gemini-2.5-flash";
  console.log(`[FUTURA SERVER] chatAboutPhase invocado para fase "${phase}". Mensaje: "${message || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO de FUTURA.
    ESTÁS ASESORANDO EN LA FASE: ${phase || "Diagnóstico"} del Sistema Pentagonal de Ejecución (SPE).
    
    TU OBJETIVO: Actuar como el experto de la marca que guía al usuario para profesionalizar su contenido de forma directa y ultra concisa.
    - RESPUESTAS DE UN SOLO PÁRRAFO O MÁXIMO DOS PÁRRAFOS: Tu respuesta completa DEBE ser de un solo párrafo corto de 3 a 4 líneas. Si es algo muy complejo, puedes anexar un segundo párrafo de máximo 2 líneas. ¡No más de dos párrafos ni explicaciones largas!
    - TOTALMENTE RESUMIDO Y DIRECTO: Elimina introducciones retóricas. Responde directamente.
    - Invítalos siempre a pasar a la acción en el Motor Creativo de la app.
    
    Responde en ESPAÑOL.
  `;

  try {
    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeGeminiContents(listHistory, message);

    const response = await getAiClient(customKey).models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      }
    });

    return res.status(200).json({ response: response.text || "No response received" });
  } catch (error: any) {
    console.error("Endpoint chatAboutPhase Error:", error);
    return res.status(500).json({ error: error.message || "Failed to chat about phase" });
  }
}
