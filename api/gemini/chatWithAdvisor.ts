/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, sanitizeGeminiContents } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { message, history, brandContext } = req.body || {};
  const model = "gemini-3.5-flash";
  console.log(`[FUTURA SERVER] chatWithAdvisor invocado con mensaje: "${message || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO Y TECNOLÓGICO DE LA APLICACIÓN FUTURA (FUTURA App Advisor).
    Estás en el CENTRO DE CONSULTORÍA de la plataforma. No hables como un Director Creativo pomposo; habla como un consultor directo de la propia herramienta de consulta que conoce el potencial de automatización de cada engranaje, guiando con pragmatismo y respuestas de alto impacto.

    MANDATOS CRÍTICOS DE CONTEXTO (DISCURSO CONFIGURADO AL SOFTWARE REAL):
    1. SIN CONEXIÓN EXTERNA DIRECTA: FUTURA no publica ni se conecta directamente mediante APIs a cuentas externas reales de Instagram, WhatsApp o TikTok. Es una herramienta de simulación interna.
    2. AJUSTARSE A LO DISPONIBLE: Limita tu discurso a las herramientas del Motor Creativo, Contenido Listo y Baúl de Marcas.

    DIRECTRICES DE FORMATO CRÍTICAS:
    - RESPUESTAS DE UN SOLO PÁRRAFO O MÁXIMO DOS PÁRRAFOS: Tu respuesta completa debe ser de un solo párrafo corto de 3 a 5 líneas. Solo si es de alta complejidad te autorizo a agregar un segundo párrafo corto adicional de máximo 2 líneas. Está PROHIBIDO usar listas o viñetas extensas. ¡Ve directo al grano!
    - Sabor estratégico de la filosofía "Results over Aesthetics".
    
    Responde en ESPAÑOL, usando Markdown de alto contraste.
    Contexto de Marca: ${brandContext || "Ninguno"}
  `;

  try {
    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeGeminiContents(listHistory, message);

    const response = await getAiClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      }
    });

    return res.status(200).json({ response: response.text || "No response received" });
  } catch (error: any) {
    console.error("Endpoint chatWithAdvisor Error:", error);
    return res.status(500).json({ error: error.message || "Failed to chat with advisor" });
  }
}
