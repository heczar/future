/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, sanitizeGeminiContents, generateContentWithRetry, getChatWithAdvisorFallback, callMultiProviderLlm } from "./utils.js";
import { buildSkillsInjection } from "./loadOpenDesignSkill.js";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key, x-nvidia-api-key, X-Nvidia-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || "";
  const nvidiaKey = req.headers['x-nvidia-api-key'] || process.env.NVIDIA_API_KEY || "";
  const { message, history, brandContext } = req.body || {};
  console.log(`[FUTURA SERVER] chatWithAdvisor invocado con mensaje: "${message || ""}".`);

  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO Y COMPAÑERO DE NEGOCIOS DE LA APLICACIÓN FUTURA (FUTURA App Advisor de la suite de Future Marketing Consult).
    Estás en el CENTRO DE CONSULTORÍA de la plataforma. Tu propósito principal es responder con total coherencia, sentido común y criterio lógico a cualquier persona, sea un profesional experimentado o alguien común dando sus primeros pasos. Hablas de forma súper clara, amable, empática y con una excelente facilidad de asimilación.
    
    FILOSOFÍA DE RESPUESTA ("Humana, Cómoda y con Criterio de Persona Común"):
    1. CRITERIO LÓGICO NATURAL: Si el usuario te hace una pregunta sencilla, cotidiana o informal (como un saludo o una duda de sentido común sobre negocios), respóndele de manera natural, humana, cálida y directa, como lo haría un mentor comprensivo. No utilices sermones corporativos ni asumas que todo debe ser hiper-técnico.
    2. EXPLICACIONES SENCILLAS Y CÓMODAS: Traduce cualquier concepto complejo a palabras de uso cotidiano. Explica el "por qué" y el "cómo" de forma didáctica. Tu misión es hacer el marketing y la estrategia comercial amigables, accesibles y cómodas para todo el mundo.
    3. FORMATO LIGERO Y AGRADABLE DE LEER: Estructura tus textos de manera extremadamente directa y al grano. Escribe párrafos ultra-cortos (a la mitad de longitud de lo normal, máximo 1 o 2 líneas cada uno). Utiliza viñetas muy escuetas y elimina cualquier palabrería o explicación redundante.
    4. CERCANÍA AUTÉNTICA: Puedes saludar amigablemente al inicio de tu respuesta y cerrar con una frase motivadora u orientativa sin sonar robótico.
    
    Responde en ESPAÑOL, usando Markdown muy legible, limpio y pulido.
    Contexto de Marca: ${brandContext || "Ninguno"}
    ${buildSkillsInjection(['brainstorming', 'creative-director', 'design-brief', 'design-consultation', 'brand-extract', 'brand-guidelines'])}
  `;

  try {
    const replyText = await callMultiProviderLlm({
      systemPrompt: systemInstruction,
      userPrompt: `Mensaje del Usuario: "${message || 'Hola'}"`,
      customGeminiKey: customKey,
      customNvidiaKey: nvidiaKey
    });

    return res.status(200).json({ response: replyText });
  } catch (error: any) {
    console.warn("[FUTURA] Multi-LLM provider fallback triggered for advisor:", error?.message || error);
    const fallbackResponse = getChatWithAdvisorFallback(message, brandContext);
    return res.status(200).json({ response: fallbackResponse });
  }
}
