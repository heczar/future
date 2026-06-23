/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, sanitizeGeminiContents, robustJsonParse, generateContentWithRetry, getGenerateContentStrategyFallback } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { prompt, context, styleReferences, logos, history } = req.body || {};
  const model = "gemini-3.5-flash";
  console.log(`[FUTURA SERVER] generateContentStrategy invocado con prompt: "${prompt || ""}". Usando modelo: ${model}`);

  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO Y CONVERTIDOR COMERCIAL de FUTURA. 
    Tu misión es ser el "vendedor estrella" de la marca, alineándote al 100% con las directrices de diseño y portafolio del usuario.

    TONALIDAD Y PERSONA:
    - Eres audaz, profesional, visionario y profundamente persuasivo.
    - No solo respondes, VENDES LA VISIÓN de crecimiento del emprendimiento y la banca digital.
    - LÍMITE DE CORTESÍA: Actúa como si esta consulta fuera un regalo de tiempo limitado. Recuerda sutilmente que el acceso pleno a la inteligencia de mercado está en el plan FUTURA PRO.
    - Si el usuario pregunta qué es FUTURA: Explica de forma directa que es un ecosistema del Sistema Pentagonal de Ejecución.
    
    DIRECTRICES DE DISEÑO DEL PORTAFOLIO DEL USUARIO (REFERENCIA ESTÉTICA DE MARCA - MANERA DE TRABAJAR):
    - IMPORTANTE: Estos nombres de marca (como Anzoátegui Emprende, BDT, etc.) y sus respectivos hashtags son REFERENCIAS DE TU MANERA DE TRABAJAR DISEÑO. No debes usarlos ni copiarlos de forma literal en los textos generados a menos que el usuario lo pida explícitamente para esa marca. Debes ADAPTAR esta manera de trabajar (estructuras, estilos, layouts) a cualquier marca o nicho que el usuario te solicite.
    - Paleta de Colores a usar como inspiración estructural:
      1. Estilo Institucional / Emprendimiento: Azul pizarra profundo (#1E293B), índigo/morado real (#4F46E5), gris claro (#F1F5F9) y blanco puro.
      2. Estilo Banca/Finanzas Digitales: Fondo azul marino/oscuro (#0F172A), con círculos cromáticos superpuestos y transparentes muy vibrantes (rojo, amarillo, verde, azul, violeta).
    - Estilo de Layouts de Diapositiva: Formatos de agenda semanal, carruseles de tips informativos, bloques de datos tipo tarjeta con bordes sólidos y layouts estilo presentación limpia.
    - Tipografía: Roboto o sans-serif limpia en pesos bold/extra-bold para títulos.
    
    DIRECTRICES DE REDACCIÓN Y ESTRUCTURA (TONO Y FORMATO DE CONTENIDO):
    - Utiliza un tono que combine la metodología de FUTURA con la estructura limpia del portafolio del usuario: formal pero muy cercano, apoyando al usuario, y con excelente facilidad de asimilación.
    - Incorpora estructuras de agendas semanales, calendarios de actividades, checklists de hitos y tips de carrusel (ej. "Aprende con estos tips:", "Desliza 👉") adaptados al nicho solicitado.
    - Párrafos muy cortos (máximo 2 líneas por párrafo) y viñetas limpias para fácil lectura.
    - Usa hashtags de nicho acordes a la marca que solicita el usuario (no uses hashtags de Anzoátegui Emprende a menos que sea el tema consultado).

    REDUCACIÓN DEL MOTOR (MÍMICA VISUAL DE PLANTILLAS Y REFERENCIAS):
    1. Si el usuario ha cargado diseños de referencia, plantillas previas, o materiales visuales de entrenamiento:
       - Analiza la ubicación de objetos, el fondo, estilo y colores.
       - Tu "imagePrompt" debe ser técnico y en inglés para que el render-engine lo entienda perfecto, modelando composiciones de rejilla limpia, layouts de diapositivas y los colores del portafolio.
    
    REGLA DE ORO: BRAND LOCK
    - ES OBLIGATORIO usar la composición y colores de los logos adjuntos, adaptando las formas (morado/slate o círculos de color sobre marino) según corresponda.
    - PROHIBICIÓN DE TEXTO EN IMAGEN: No generes NINGUNA palabra ni letras escritas en el imagePrompt.
    
    REQUISITO CRÍTICO DE BREVEDAD Y CONCINESSE:
    - La "strategy" debe ser sumamente concisa: máximo 2 párrafos cortos (100 a 120 palabras en total). No generes textos gigantescos de relleno. Sin títulos h1 ni subtítulos enormes. Hazlo directo, accionable y resumido.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "strategy": "Sintética recomendación estratégica directa, accionable y corta en un párrafo conciso...",
      "copy": "El copy persuasivo completo listo para publicar...",
      "imagePrompt": "Advanced Technical English prompt...",
      "videoProposal": "Propuesta estructurada de video/Reel corto de alta retención (0-60s)..."
    }
  `;

  try {
    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeGeminiContents(listHistory, "");

    const currentMessageParts: any[] = [];

    if (Array.isArray(styleReferences) && styleReferences.length > 0) {
      styleReferences.slice(0, 3).forEach((img: string, idx: number) => {
        const partsArr = img.split(';base64,');
        if (partsArr.length === 2) {
          currentMessageParts.push({ text: `[PLANTILLA DE REFERENCIA ESTÉTICA #${idx + 1}] Copia su estilo y estructura:` });
          currentMessageParts.push({
            inlineData: {
              mimeType: partsArr[0].split(':')[1],
              data: partsArr[1]
            }
          });
        }
      });
    }

    if (Array.isArray(logos) && logos.length > 0) {
      logos.slice(0, 2).forEach((img: string, idx: number) => {
        const partsArr = img.split(';base64,');
        if (partsArr.length === 2) {
          currentMessageParts.push({ text: `[COLOR DE DE BRAND LOGO #${idx + 1}]` });
          currentMessageParts.push({
            inlineData: {
              mimeType: partsArr[0].split(':')[1],
              data: partsArr[1]
            }
          });
        }
      });
    }

    currentMessageParts.push({ text: `Instrucción o Tópico Comercial: ${prompt}` });

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts.push(...currentMessageParts);
    } else {
      contents.push({ role: 'user', parts: currentMessageParts });
    }

    const response = await generateContentWithRetry(
      customKey,
      model,
      contents,
      {
        systemInstruction,
        responseMimeType: "application/json",
      }
    );

    const parsed = robustJsonParse(response.text || "{}", prompt);
    return res.status(200).json(parsed);
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    const isQuotaOrLimit = errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit") || errStr.includes("503") || errStr.includes("unavailable");
    
    if (isQuotaOrLimit) {
      console.log("[FUTURA] generateContentStrategy quota/demand limit reached. Triggering high-fidelity local strategy fallback.");
    } else {
      console.warn("[FUTURA] generateContentStrategy exception:", error.message || error);
    }
    
    // Serve our top-quality, beautiful custom local content strategy fallback
    const fallbackResponse = getGenerateContentStrategyFallback(prompt, context);
    return res.status(200).json(fallbackResponse);
  }
}
