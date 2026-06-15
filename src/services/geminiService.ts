/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || 
                ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || 
                "";
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function robustJsonParse(text: string, defaultPrompt: string): { strategy: string; copy: string; imagePrompt: string } {
  // 1. Limpieza de bloques de markdown comunes
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

  // 2. Intento de parseo directo estándar
  try {
    const parsed = JSON.parse(cleaned);
    return {
      strategy: parsed.strategy || "",
      copy: parsed.copy || "",
      imagePrompt: parsed.imagePrompt || defaultPrompt
    };
  } catch (rawError) {
    console.warn("FUTURA JSON con formato inválido, iniciando reparación robusta...", rawError);
  }

  // 3. Intento de extraer el contenido entre la primera llave { y la última llave }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsedCandidate = JSON.parse(candidate);
      return {
        strategy: parsedCandidate.strategy || "",
        copy: parsedCandidate.copy || "",
        imagePrompt: parsedCandidate.imagePrompt || defaultPrompt
      };
    } catch (bracketError) {
      // Continuar al extractor regex si el candidato recortado tampoco es parseable
    }
  }

  // 4. Extractor Regex de Alto Impacto (Resistente a interrupciones, citas dobles rotas o texto sobrante)
  let strategy = "";
  let copy = "";
  let imagePrompt = defaultPrompt;

  // Extraer "strategy"
  const strategyPatterns = [
    /"strategy"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"strategy"\s*:\s*"([\s\S]*?)"/
  ];

  for (const pattern of strategyPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      strategy = match[1];
      break;
    }
  }

  // Extraer "copy"
  const copyPatterns = [
    /"copy"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"copy"\s*:\s*"([\s\S]*?)"/
  ];

  for (const pattern of copyPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      copy = match[1];
      break;
    }
  }

  // Extraer "imagePrompt"
  const imagePromptPatterns = [
    /"imagePrompt"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"imagePrompt"\s*:\s*"([\s\S]*?)"/
  ];

  for (const pattern of imagePromptPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      imagePrompt = match[1];
      break;
    }
  }

  // Si logramos recuperar estrategia, copy o prompt, los limpiamos y los retornamos descodificados
  if (strategy || copy || imagePrompt !== defaultPrompt) {
    const decodeValue = (val: string) => {
      return val
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\/g, "")
        .replace(/\\'/g, "'")
        .replace(/\\t/g, '\t');
    };

    const finalStrategy = strategy ? decodeValue(strategy) : "Análisis estratégico y mímica visual procesada por FUTURA.";
    const finalCopy = copy ? decodeValue(copy) : "¡Aquí tienes tu copy listo para publicar! Potenciado por el Sistema Pentagonal de Ejecución de FUTURA.";
    let finalPrompt = decodeValue(imagePrompt);

    // Limpiar posibles residuos de comillas rotas al final de un prompt truncado por Gemini
    if (finalPrompt.includes('"') && !finalPrompt.startsWith('"')) {
      const quoteIndex = finalPrompt.indexOf('"');
      if (quoteIndex > 40) {
        finalPrompt = finalPrompt.substring(0, quoteIndex);
      }
    }

    return {
      strategy: finalStrategy,
      copy: finalCopy,
      imagePrompt: finalPrompt
    };
  }

  // 5. Fallback definitivo si el JSON está totalmente corrupto y no contiene claves reconocibles
  const textStrategy = cleaned
    .replace(/["{}]+/g, '')
    .trim();

  return {
    strategy: textStrategy || "La consulta ha sido procesada con éxito por FUTURA.",
    copy: "¡Copy listo para publicar! Desata el poder de tu marca con FUTURA.",
    imagePrompt: defaultPrompt
  };
}

export async function generateContentStrategy(prompt: string, context: string, styleReferences?: string[], logos?: string[], history: { role: 'user' | 'model', content: string }[] = []) {
  const model = "gemini-3.5-flash";
  
    const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO Y CONVERTIDOR COMERCIAL de FUTURA. 
    Tu misión es ser el "vendedor estrella" de la marca. Recibes a los usuarios en la sección "Conversa con Futura".
    
    TONALIDAD Y PERSONA:
    - Eres audaz, profesional, visionario y profundamente persuasivo.
    - No solo respondes, VENDES LA VISIÓN. Si el usuario duda, refuérzale por qué FUTURA es la única opción estratégica real.
    - LÍMITE DE CORTESÍA: Actúa como si esta consulta fuera un regalo de tiempo limitado. Recuerda sutilmente que el acceso pleno a la inteligencia de mercado y el motor de renderizado masivo está en el plan FUTURA PRO.
    - Si el usuario pregunta qué es FUTURA: Explica que es un ecosistema de inteligencia creativa basado en el Sistema Pentagonal de Ejecución (SPE) que prioriza resultados sobre estética.
    - PROMOCIÓN DE FUTURA PRO: Si detectas que el usuario tiene una visión grande, invítalo a pasarse a Pro para obtener créditos ilimitados, motor de renderizado 4K, y asesoría sin límites de sesión.
    
    REDUCACIÓN DEL MOTOR (MÍMICA VISUAL DE PLANTILLAS Y REFERENCIAS):
    1. Si el usuario ha cargado diseños de referencia, plantillas previas, una "Referencia Visual Directa" (adhocReference), o materiales visuales de entrenamiento en su Brand Vault o attachments:
       - Es un REQUISITO CRÍTICO e IMPERATIVO reverse-engineer (diseñar a la inversa) la composición exacta de estos archivos de referencia. Analiza minuciosamente: la ubicación de los objetos, el estilo de fondo (por ejemplo si es un mock-up, un render 3D, minimalista, industrial, urbano, etc.), el uso de marcos de enfoque o layouts poligonales, la relación de aspecto, el estilo fotográfico o artístico, la iluminación focal y la paleta de colores dominantes.
       - Tu "imagePrompt" debe ser escrito en base a copiar rigurosamente este estilo. Debe ser sumamente descriptivo y técnico (en inglés técnico avanzado) para forzar al motor de renderizado a generar un fondo, escenario, texturas y composición visualmente ultra-fiel, idéntica en estructura, layout, estética, iluminación y perspectiva al material de referencia provisto.
       - Tu objetivo absoluto es CLONAR la vibra tridimensional o bidimensional y el diseño estructural maestro de la referencia, pero adaptando su contenido principal o motivo al producto o nicho que el usuario solicita.
    
    2. ADAPTACIÓN DE IDIOMA Y DISCURSO COMUNICACIONAL PERSONALIZADO:
       - No uses mensajes genéricos. Extrae el ADN de la marca del usuario (nombre de proyecto, descripción, idioma de preferencia) y redacta copies, llamadas a la acción, títulos de campaña y discursos comunicacionales altamente persuasivos específicos para su nicho.
       - Si la marca está redactada en un idioma específico (ej. Español), preserva ese tono comunicativo, sus modismos comerciales y su nivel de sofisticación en el resultado estratégico.
        
    3. CONSERVACIÓN Y EMPLAZAMIENTO PARA LOGOS:
       - Asegúrate de dejar o indicar en tu "imagePrompt" áreas de fondo limpias, espacios negativos y contrastados para que el usuario pueda superponer y mover de forma óptima su logotipo del Brand Vault sin que choque con colores ruidosos o texturas sobrecargadas.
     
    PRINCIPIOS DE DISEÑO (SPE):
    - Identidad ante todo. Sincronización Visual total con los activos del usuario.
    
    REGLA DE ORO: BRAND LOCK
    - ES OBLIGATORIO usar la composición y colores de los logos y referencias adjuntos.
    - PROHIBICIÓN DE TEXTO EN IMAGEN: No generes NINGUNA palabra ni letras escritas en el imagePrompt.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "strategy": "Asesoría o recomendación estratégica detallada sobre cómo mimetizas la referencia visual, dónde ubicar el logo sin tapar elementos, análisis del ADN de la marca y argumentación comercial de FUTURA. No coloques el copy de la publicación aquí.",
      "copy": "El copy persuasivo completo listo para publicar (Títulos llamativos, cuerpo del mensaje cautivador, hashtags de nicho, llamadas a la acción, etc.) redactado en el idioma de preferencia de la marca (ej. Español). No coloques análisis o retroalimentación técnica aquí.",
      "imagePrompt": "Advanced Technical English prompt that clones & mimics the master reference layout composition, color balance & depth. NO TEXT.",
      "videoProposal": "Propuesta estructurada de video/Reel corto de alta retención (0-60s) con: 1. Gancho (Hooks magnéticos), 2. Guion escena por escena con indicaciones de cámara, voz en off y música de fondo sugerida, 3. Llamado a la acción (CTA) final potente para el nicho. Redactado con enfoque de asesor organizacional inteligente."
    }

    Contexto: ${context}
  `;

  try {
    const contents: any[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const currentMessageParts: any[] = [];

    // Add Style References labeled with indices first to avoid confusion
    if (styleReferences && styleReferences.length > 0) {
      currentMessageParts.push({ text: "--- DETALLES DE REFERENCIAS VISUALES Y PLANTILLAS DE ESTILO DEL SISTEMA (A COPIAR/MIMETIZAR) ---" });
      styleReferences.slice(0, 5).forEach((img, idx) => {
        const partsArr = img.split(';base64,');
        if (partsArr.length === 2) {
          currentMessageParts.push({ text: `[PLANTILLA DE REFERENCIA ESTÉTICA #${idx + 1}] Reconstruye de forma idéntica su composición de diseño, perspectiva, fondo, sombras, distribución de objetos, márgenes, color, iluminación, profundidad y vibra estructural general en tu 'imagePrompt' para adaptarla al nuevo producto del usuario:` });
          currentMessageParts.push({
            inlineData: {
              mimeType: partsArr[0].split(':')[1],
              data: partsArr[1]
            }
          });
        }
      });
    }

    // Add Brand Logos labeled separately so the model doesn't blend them with layout/scenes
    if (logos && logos.length > 0) {
      currentMessageParts.push({ text: "--- LOGOTIPOS HISTÓRICOS Y CORPORATIVOS ACUMULADOS EN LA BÓVEDA (SOLO COMPRENDER COLORES Y MARCA) ---" });
      logos.slice(0, 3).forEach((img, idx) => {
        const partsArr = img.split(';base64,');
        if (partsArr.length === 2) {
          currentMessageParts.push({ text: `[LOGOTIPO DE MARCA #${idx + 1}] Utilízalo solo para capturar la paleta cromática dominante de la marca final:` });
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

    contents.push({ role: 'user', parts: currentMessageParts });

    const response = await getAiClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    return robustJsonParse(text, prompt);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      strategy: "Error de conexión con el motor creativo. Verifica tu Bóveda de Marca.",
      copy: "No se pudo generar el copy de la publicación debido a un problema de conexión con el motor creativo.",
      imagePrompt: prompt
    };
  }
}

export async function generateCreativeImage(prompt: string, aspectRatio: string = "1:1", styleReferences?: string[]) {
  const model = "gemini-3.1-flash-image-preview";
  
  try {
    const parts: any[] = [];

    // Enviar imágenes de referencia para mimetizar estilo
    if (styleReferences && styleReferences.length > 0) {
      styleReferences.slice(0, 3).forEach(img => {
        const partsArr = img.split(';base64,');
        if (partsArr.length === 2) {
          const mimeMatch = partsArr[0].match(/data:(.*?)$/);
          const mimeTypePart = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const data = partsArr[1];
          parts.push({
            inlineData: {
              mimeType: mimeTypePart,
              data: data
            }
          });
        }
      });
    }

    // Prompt con instrucciones estrictas de mimetización
    const enhancedPrompt = `${prompt}. 
    STYLE MIMICRY MANDATE: Analyze the layout perspective, composition, 3D arrangement, background mood, and negative space of the style reference images. You must strictly match this layout and color palette in the generated image, making it look like a seamless twin design but reflecting the requested content.
    STRONGLY PROHIBITED: Do not include or write any letters, brand labels, titles, signs, readable texts, or logos on the image backdrop. Always provide a clean visual space for manual brand placement.`;

    parts.push({ text: enhancedPrompt });

    const response = await getAiClient().models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function chatWithAdvisor(message: string, history: { role: 'user' | 'model', text: string }[] = [], brandContext?: string) {
  const model = "gemini-3.5-flash";
  
  const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO Y TECNOLÓGICO DE LA APLICACIÓN FUTURA (FUTURA App Advisor).
    Estás en el CENTRO DE CONSULTORÍA de la plataforma. No hables como un Director Creativo pomposo; habla como un consultor directo de la propia herramienta de consulta que conoce el potencial de automatización de cada engranaje, guiando con pragmatismo y respuestas de alto impacto.

    MANDATOS CRÍTICOS DE CONTEXTO (DISCURSO CONFIGURADO AL SOFTWARE REAL):
    1. SIN CONEXIÓN EXTERNA DIRECTA: FUTURA no publica ni se conecta directamente mediante APIs a cuentas externas reales de Instagram, WhatsApp, TikTok u otras redes. Es una herramienta de planificación, generación creativa y simulación interna. El usuario copia los textos generados y descarga las imágenes resultantes de forma manual.
    2. AJUSTARSE A LO DISPONIBLE: Limita tu discurso a las herramientas provistas en las pestañas visibles:
       - MOTOR CREATIVO: Generación local de copies y propuestas de imágenes mimetizadas (sin subida directa externa).
       - CONTENIDO LISTO: Un calendario de simulación local para visualizar publicaciones programadas y copiar contenidos fácilmente.
       - BAÚL DE MARCA (BÓVEDA): Repositorio local de logotipos e imágenes de referencia de estilo para entrenar la mímica visual del motor creativo.

    DIRECTRICES DE SINTAXIS Y FORMATO CRÍTICAS:
    - RESPUESTAS DE UN SOLO PÁRRAFO O MÁXIMO DOS PÁRRAFOS: Tu respuesta completa debe ser de un solo párrafo corto de 3 a 5 líneas. Solo si es para explicar algo muy complejo o técnico se permite un segundo párrafo corto adicional de máximo 2 líneas. ¡Está terminantemente prohibido generar viñetas extensas, listas o respuestas largas!
    - TOTALMENTE RESUMIDA: Responde directamente sin saludos ceremoniales, rodeos de cortesía ni repetición de palabras. Ve al grano inmediatamente con asertividad profesional.
    - RESPUESTAS CORTAS Y DIRECTAS: Estilo pragmático inspirado en la filosofía "Results over Aesthetics".

    Responde en ESPAÑOL, con Markdown limpio y moderno.
  `;

  try {
    const contents: any[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await getAiClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      }
    });

    return response.text || "Mi red neuronal está en mantenimiento. Intenta de nuevo en unos segundos.";
  } catch (error) {
    console.error("Advisor Chat Error:", error);
    return "Error en la conexión con la red estratégica de FUTURA.";
  }
}

export async function chatAboutPhase(phase: string, history: any[], message: string) {
  const model = "gemini-3.5-flash";
  
    const systemInstruction = `
    Eres el ASESOR ESTRATÉGICO de FUTURA.
    ESTÁS ASESORANDO EN LA FASE: ${phase} del Sistema Pentagonal de Ejecución (SPE).
    
    TU OBJETIVO: Actuar como el experto de la marca que guía al usuario para profesionalizar su contenido con respuestas directas y ultra concisas.
    - RESPUESTAS DE UN SOLO PÁRRAFO O MÁXIMO DOS PÁRRAFOS: Tu respuesta completa DEBE ser de un solo párrafo corto de 3 a 4 líneas. Si es algo muy complejo, puedes anexar un segundo párrafo de máximo 2 líneas. ¡No más de dos párrafos ni explicaciones largas!
    - TOTALMENTE RESUMIDO Y DIRECTO: Elimina introducciones retóricas o de cortesía. Responde directamente.
    - Proporciona consejos tácticos breves y asimilables de inmediato.
    - Si el usuario pregunta por FUTURA o FUTURA PRO, actúa como el vendedor estrella, destacando el ROI y la potencia del motor corporativo.
    - Invítalos siempre a pasar a la acción en el Motor Creativo de la app.
    
    Responde en ESPAÑOL, usando Markdown. Mantén el prestigio de la marca en cada palabra.
  `;

  try {
    const contents: any[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts[0].text }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await getAiClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      }
    });

    return response.text || "Lo siento, no pude procesar tu solicitud de fase.";
  } catch (error) {
    console.error("Phase Chat Error:", error);
    return "Error en la conexión con el asesor de fase.";
  }
}

export async function generateSocialCopy(params: {
  copyType: 'advertising' | 'informative' | 'engagement';
  platform: string;
  tone: string;
  clientDetails: string;
  extraContext: string;
  language: 'es' | 'en';
  userRole?: string;
  userBio?: string;
  userPhilosophy?: string;
  projectName?: string;
  projectDescription?: string;
}) {
  const model = "gemini-3.5-flash";
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
      - Red Social: ${params.platform.toUpperCase()}
      - Categoría: ${params.copyType.toUpperCase()} (TIPO: ${params.copyType === 'advertising' ? 'PUBLICITARIO / DE CONVERSIÓN' : params.copyType === 'informative' ? 'INFORMATIVO / EDUCATIVO' : 'ENGAGEMENT / INTERACCIÓN'})
      - Tono/Estilo: ${params.tone}
      - Idioma: ${params.language === 'en' ? 'Inglés' : 'Español'}

      INFORMACIÓN DEL CREADOR (Incorpórala orgánicamente para que suene natural):
      ${params.userRole ? `- Mi Rol: ${params.userRole}` : ''}
      ${params.userBio ? `- Mi Bio: ${params.userBio}` : ''}
      ${params.userPhilosophy ? `- Mi Filosofía de trabajo: ${params.userPhilosophy}` : ''}

      INFORMACIÓN DEL PROYECTO O MARCA (Usa esta base como producto/servicio principal):
      ${params.projectName ? `- Nombre del Proyecto/Marca: ${params.projectName}` : ''}
      ${params.projectDescription ? `- ADN y Descripción de Marca: ${params.projectDescription}` : ''}

      INFORMACIÓN ADICIONAL DE LA CAMPAÑA:
      - Público Objetivo / Cliente Ideal: ${params.clientDetails || 'Público general calificado de redes'}
      - Contexto u objetivo específico de esta publicación: ${params.extraContext || 'Posicionamiento estratégico y generación de demanda calificada'}

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

    return response.text || "No se pudo generar el texto de copy.";
  } catch (error) {
    console.error("Error in generateSocialCopy:", error);
    throw error;
  }
}

export async function refineSocialCopy(currentCopy: string, refineInstructions: string) {
  const model = "gemini-3.5-flash";
  const systemInstruction = "Eres un editor experto de copywriting. Refina el copy provisto siguiendo las instrucciones brutales del usuario, manteniendo la fuerza persuasiva, el gancho magnético, el formato cómodo para móvil y la filosofía pragmática 'Results over Aesthetics'.";
  try {
    const response = await getAiClient().models.generateContent({
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
      config: { systemInstruction }
    });
    return response.text || currentCopy;
  } catch (err) {
    console.error("Failed to refine copy:", err);
    throw err;
  }
}

