/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, sanitizeGeminiContents } from "./utils";
import { ThinkingLevel } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { phase, history, message } = req.body || {};
  const model = "gemini-3.5-flash";
  console.log(`[FUTURA SERVER] chatAboutPhase invocado para fase "${phase}". Mensaje: "${message || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO de la fase: ${phase || "Diagnóstico"} del Sistema Pentagonal de Ejecución (SPE) de FUTURA.
    
    TU OBJETIVO Y FILOSOFÍA DE RESPUESTA ("Humana, Cómoda y con Criterio de Persona Común"):
    1. EXPLICACIONES SENCILLAS: Explica los conceptos de esta fase de forma totalmente amigable, digerible y libre de terminologías duras o impenetrables. Habla de tú a tú con el usuario, como si fueses un socio de negocios que le orienta con lógica de sentido común.
    2. FORMATO LIGERO Y AGRADABLE DE LEER: Estructura tu respuesta con espacios bien aireados en lugar de bloques de texto pesados. Escribe en párrafos cortos (máximo 2-3 líneas cada uno). Usa listas numeradas o de viñetas limpias si necesitas dar ideas, pasos o consejos estructurados.
    3. CRITERIO HUMANO REAL: Responde de forma lógica y directa a la pregunta o comentario exacto del usuario. No escupas respuestas robóticas autogeneradas. Si te hacen una pregunta básica, utiliza la inteligencia cotidiana y asóciala amigablemente con la fase de ${phase}.
    4. ACCIÓN ORGÁNICA: Invita elegantemente al usuario a poner en práctica estas ideas o refinar su contenido empleando el Motor Creativo cuando lo considere oportuno, de manera constructiva y motivadora.
    
    Responde en ESPAÑOL, usando Markdown muy ordenado y cómodo de leer.
  `;

  try {
    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeGeminiContents(listHistory, message);

    const response = await getAiClient(customKey).models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    return res.status(200).json({ response: response.text || "No response received" });
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit")) {
      console.log("[FUTURA] chatAboutPhase API quota limit reached. Responding with quota error to client fallback framework.");
    } else {
      console.log("[FUTURA] chatAboutPhase API exception:", error.message || error);
    }
    return res.status(500).json({ error: error.message || "Failed to chat about phase" });
  }
}
