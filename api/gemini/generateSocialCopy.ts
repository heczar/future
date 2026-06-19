/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { params } = req.body || {};
  if (!params) {
    return res.status(400).json({ error: "Missing campaign params" });
  }

  const model = "gemini-2.5-flash";

  const systemInstruction = `
    Eres el REDACTOR CREATIVO DE ÉLITE (Copywriter) de FUTURA (FUTURA Marketing Consult).
    Tu especialidad es redactar copies que convierten y detienen el scroll en redes sociales.
    Sigue fielmente la filosofía de FUTURA de "Results over Aesthetics" (Resultados sobre Estética):
    - Redacción directa, persuasiva, de alto impacto y orientada a la acción. 
    - Cero palabras de relleno o formalismos corporativos aburridos.
    - Captura la atención con ganchos magnéticos desde la primera frase.
    - Utiliza saltos de línea estratégicos para facilitar la lectura visual.
    - Combina llamadas a la acción (CTAs) de conversión directa con hashtags de nicho quirúrgicos.

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

    const response = await getAiClient().models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      }
    });

    return res.status(200).json({ response: response.text || "" });
  } catch (error: any) {
    console.error("Endpoint generateSocialCopy Error:", error);
    return res.status(500).json({ error: error.message || "Error al generar copy" });
  }
}
