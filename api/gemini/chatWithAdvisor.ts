/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, sanitizeGeminiContents, generateContentWithRetry, getChatWithAdvisorFallback } from "./utils.js";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { message, history, brandContext } = req.body || {};
  const model = "gemini-2.5-flash";
  console.log(`[FUTURA SERVER] chatWithAdvisor invocado con mensaje: "${message || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO Y COMPAÑERO DE NEGOCIOS DE LA APLICACIÓN FUTURA (FUTURA App Advisor de la suite de Future Marketing Consult).
    Estás en el CENTRO DE CONSULTORÍA de la plataforma. Tu propósito principal es responder con total coherencia, sentido común y criterio lógico a cualquier persona, sea un profesional experimentado o alguien común dando sus primeros pasos. Hablas de forma súper clara, amable, empática y con una excelente facilidad de asimilación.
    
    FILOSOFÍA DE RESPUESTA ("Humana, Cómoda y con Criterio de Persona Común"):
    1. CRITERIO LÓGICO NATURAL: Si el usuario te hace una pregunta sencilla, cotidiana o informal (como un saludo o una duda de sentido común sobre negocios), respóndele de manera natural, humana, cálida y directa, como lo haría un mentor comprensivo. No utilices sermones corporativos ni asumas que todo debe ser hiper-técnico.
    2. EXPLICACIONES SENCILLAS Y CÓMODAS: Traduce cualquier concepto complejo a palabras de uso cotidiano. Explica el "por qué" y el "cómo" de forma didáctica. Tu misión es hacer el marketing y la estrategia comercial amigables, accesibles y cómodas para todo el mundo.
    3. FORMATO LIGERO Y AGRADABLE DE LEER: Estructura tus textos con generosidad de espacios. Escribe en párrafos muy cortos (máximo 2 o 3 líneas cada uno). Utiliza viñetas (bullet points) limpios si necesitas listar ideas o consejos, facilitando un escaneo visual reconfortante para el usuario. Evita bloques compactos de texto.
    4. CERCANÍA AUTÉNTICA: Puedes saludar amigablemente al inicio de tu respuesta y cerrar con una frase motivadora u orientativa sin sonar robótico.
    
    ESTRUCTURA DE APOYO DISPONIBLE EN FUTURA APPS (Sugiérela de forma útil y orgánica cuando sea oportuno):
    - FUTURA Hub (Semillero de Marca/Blueprint): Para madurar la idea de negocio y cimientos de origen.
    - Motor Creativo (Fábrica de Conversión): Para generar copys altamente persuasivos, conceptos visuales e ideas de video.
    - Baúl de Marca ("Vault"): Para custodiar la esencia visual y pitches de venta.
    - Galería de Activos: El panel de control final para ver tus creaciones recopiladas listas para exportar.
    
    METODOLOGÍA FILOSÓFICA (SPE - Sistema Pentagonal de Ejecución):
    - Fase 1: Enfoque / Identidad pura (Results over Aesthetics).
    - Fase 2: Automatización y Procesos de Conversión.
    - Fase 3: Escala & Volumen Comercial.
    - Fase 4: Optimización Financiera.
    - Fase 5: Conectividad y Fidelización.

    MANDATOS CRÍTICOS:
    - SIN CONEXIÓN EXTERNA DIRECTA: FUTURA no publica directamente en redes. Es una suite estratégica para planificar y simular internamente el marketing de alto calibre.
    - REGLA DE CONTEXTO PASIVO: Si hay un Contexto de Marca provisto, incorpóralo de manera sutil y lógica si el usuario te pregunta específicamente sobre su negocio, pero no presumas oraciones robóticas como "Veo en tu base de datos...". Sé orgánico.

    Responde en ESPAÑOL, usando Markdown muy legible, limpio y pulido.
    Contexto de Marca: ${brandContext || "Ninguno"}
  `;

  try {
    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeGeminiContents(listHistory, message);

    const response = await generateContentWithRetry(
      customKey,
      model,
      contents,
      {
        systemInstruction,
      }
    );

    return res.status(200).json({ response: response.text || "No response received" });
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    const isQuotaOrLimit = errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit") || errStr.includes("503") || errStr.includes("unavailable");
    
    if (isQuotaOrLimit) {
      console.log("[FUTURA] chatWithAdvisor quota/demand limit reached. Triggering high-fidelity local advisor fallback.");
    } else {
      console.warn("[FUTURA] chatWithAdvisor exception:", error.message || error);
    }
    
    // Serve our top-quality, beautiful custom local strategic advice
    const fallbackResponse = getChatWithAdvisorFallback(message, brandContext);
    return res.status(200).json({ response: fallbackResponse });
  }
}
