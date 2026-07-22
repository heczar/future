/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, generateContentWithRetry, getGenerateSocialCopyFallback } from "./utils.js";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { params } = req.body || {};
  if (!params) {
    return res.status(400).json({ error: "Missing campaign params" });
  }

  const model = "gemini-2.5-flash";
  console.log(`[FUTURA SERVER] generateSocialCopy invocado para plataforma "${params.platform || ""}", tipo: "${params.copyType || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el REDACTOR CREATIVO DE ÉLITE (Copywriter) de FUTURA (FUTURA Marketing Consult).
    Tu especialidad es redactar copies que convierten y detienen el scroll en redes sociales.
    Sigue fielmente la filosofía de FUTURA de "Results over Aesthetics" (Resultados sobre Estética):
    - Redacción directa, persuasiva, de alto impacto y orientada a la acción. 
    - Cero palabras de relleno o formalismos corporativos aburridos.
    - Captura la atención con ganchos magnéticos desde la primera frase.
    - Utiliza saltos de línea estratégicos para facilitar la lectura visual.
    - Combina llamadas a la acción (CTAs) de conversión directa con hashtags de nicho quirúrgicos.
    - MANDATO CRÍTICO: Genera ÚNICAMENTE el texto final del copy publicitario. NO agregues introducciones, preámbulos, saludos, comentarios ni despedidas (como "¡Absolutamente! Aquí tienes...", "Aquí tienes el copy...", "Claro, con gusto..."). Empieza directamente con el gancho o título.
    
    SEGÚN LA CATEGORÍA SOLICITADA DEBES ADAPTARTE:
    1. Publicitario (Advertising): Estructura AIDA (Atención, Interés, Deseo, Acción) o dolor-agitación-solución. Enfocado en conversiones rápidas, beneficios comerciales irresistibles, destacar ofertas audaces, y urgencia sutil.
    2. Informativo (Informativo): Aporta valor educativo masivo, resúmenes organizados, checklists accionables, o desgloses paso a paso para el usuario final.
    3. Engagement (Participación): Fomenta comentarios, inicia debates, realiza preguntas provocadoras de alta retención o ganchos para carruseles de interacción masiva.

    SEGÚN EL TONO SELECCIONADO DEBES ADAPTARTE:
    - Results over Aesthetics: Muy pragmático, agresivo centrado en conversiones rápidas, directo al grano, sin mentiras ni rellenos pomposos.
    - Educador de Élite: Sofisticado, de alta gama, elegante, ultra-profesional, transmite autoridad técnica indisputable.
    - Brutalist Persuasion: Crudo, directo al dolor del cliente, brutalmente audaz, destaca el cuello de botella real de los negocios y ofrece la cura con FUTURA.
  `;

  try {
    const prompt = `
      Genera un copy excepcional para redes sociales con la siguiente configuración:
      - Red Social: ${(params.platform || "").toUpperCase()}
      - Categoría: ${(params.copyType || "").toUpperCase()} (TIPO: ${params.copyType === 'advertising' ? 'PUBLICITARIO / DE CONVERSIÓN' : params.copyType === 'informative' ? 'INFORMATIVO / EDUCATIVO' : 'ENGAGEMENT / INTERACCIÓN'})
      - Tono/Estilo: ${params.tone || "Results over Aesthetics"}
      - Idioma: ${params.language === 'en' ? 'Inglés' : 'Español'}

      INDICACIONES DETALLADAS, OBJETIVOS, DETALLES DE CORRESPONDENCIA DE MARCA Y AUDIENCIA (Escritas directamente por el usuario):
      ${params.extraContext || 'Posicionamiento estratégico y generación de demanda calificada'}

      Genera una respuesta perfecta con formato Markdown pulido. Incluye:
      1. Título llamativo (Gancho de scroll / Hook impactante)
      2. Cuerpo estructurado y persuasivo listo para leerse cómodamente
      3. Llamada a la Acción (CTA) clara, irresistible y directa
      4. Conjunto de hashtags de nicho estratégicos y relevantes (máximo 5-6 hashtags efectivos)
    `;

    const partsArray: any[] = [{ text: prompt }];

    if (params.imageUrl) {
      const partsArr = params.imageUrl.split(';base64,');
      if (partsArr.length === 2) {
        partsArray.push({ text: "[FOTOGRAFÍA DE APOYO ADJUNTA POR EL USUARIO] Analiza detalladamente esta fotografía e inspira/adapta el copy a sus elementos visuales:" });
        partsArray.push({
          inlineData: {
            mimeType: partsArr[0].split(':')[1],
            data: partsArr[1]
          }
        });
      }
    }

    const response = await generateContentWithRetry(
      customKey,
      model,
      [{ parts: partsArray }],
      {
        systemInstruction,
      }
    );

    return res.status(200).json({ response: response.text || "" });
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    const isQuotaOrLimit = errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit") || errStr.includes("503") || errStr.includes("unavailable");
    
    if (isQuotaOrLimit) {
      console.log("[FUTURA] generateSocialCopy quota/demand limit reached. Triggering high-fidelity local content copy fallback.");
    } else {
      console.warn("[FUTURA] generateSocialCopy exception:", error.message || error);
    }
    
    // Serve our top-quality, beautiful custom local structured social copy fallback
    const fallbackResponse = getGenerateSocialCopyFallback(params);
    return res.status(200).json(fallbackResponse);
  }
}
