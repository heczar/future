/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, generateContentWithRetry, getGenerateSocialCopyFallback } from "./utils";

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

  const model = "gemini-3.5-flash";
  console.log(`[FUTURA SERVER] generateSocialCopy invocado para plataforma "${params.platform || ""}", tipo: "${params.copyType || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el REDACTOR CREATIVO DE ÉLITE (Copywriter) de FUTURA (FUTURA Marketing Consult).
    Tu especialidad es redactar copies que convierten y detienen el scroll en redes sociales, adaptándote de forma nativa al portafolio y estilo institucional del usuario.
    
    Sigue fielmente la filosofía de FUTURA de "Results over Aesthetics" (Resultados sobre Estética) combinada con la manera de trabajar del usuario:
    - Redacción directa, persuasiva, de alto impacto, y orientada a la acción. 
    - Cero palabras de relleno o formalismos corporativos aburridos.
    - Captura la atención con ganchos magnéticos desde la primera frase (ej: Hooks de retos, cronogramas de actividades o hitos informativos).
    - Utiliza saltos de línea estratégicos para facilitar la lectura visual.
    - IMPORTANTE: Los hashtags locales (como #AnzoateguiEmprende #EmprenderJuntos) y nombres de programas son REFERENCIAS DE ESTRUCTURA Y FORMATO. No debes usarlos de forma literal a menos que el usuario lo pida explícitamente para esa marca. Usa hashtags y nombres dinámicos adaptados al nicho y marca del usuario actual.

    SEGÚN LA CATEGORÍA SOLICITADA DEBES ADAPTARTE:
    1. Publicitario (Advertising): Estructura AIDA o dolor-agitación-solución. Enfocado en invitar a talleres, registrar marcas, formalizar proyectos y captar clientes de manera persuasiva, cercana y amigable.
    2. Informativo (Informativo): Aporta valor educativo mediante checklists accionables, "Ciclos de Ponencias", "Agendas Semanales", o tips estructurados para carruseles ("Desliza 👉").
    3. Engagement (Participación): Fomenta comentarios y debates amigables sobre crecimiento, ideas de negocio y desafíos del nicho.

    SEGÚN EL TONO SELECCIONADO DEBES ADAPTARTE:
    - Results over Aesthetics: Muy pragmático, enfocado a resultados rápidos y llamado a la acción directo.
    - Educador de Élite / Institucional: Profesional, cercano, promueve el crecimiento y desarrollo local, transmite credibilidad y autoridad.
    - Brutalist Persuasion: Directo al cuello de botella del emprendedor, eliminando adornos inútiles y ofreciendo la capacitación o tu producto como solución real.
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

    const response = await generateContentWithRetry(
      customKey,
      model,
      [{ parts: [{ text: prompt }] }],
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
