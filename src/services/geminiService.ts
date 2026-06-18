/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

// Secure Hybrid Client/Server Gemini Service Proxy
// First attempts to use the robust Express API proxy.
// If the server returns 404 (meaning we are on Vercel or static hosting) or fails with a network/CORS error,
// it instantly fails over to direct browser execution using the client-side VITE_GEMINI_API_KEY.

let clientAi: any = null;
function getClientAi(): any {
  if (!clientAi) {
    const meta: any = import.meta;
    const key = (meta.env && meta.env.VITE_GEMINI_API_KEY) || "";
    if (!key) {
      console.warn("FUTURA WARNING: VITE_GEMINI_API_KEY no está configurada en el cliente. Si estás ejecutando en Vercel, agrégala en tus 'Environment Variables'.");
    }
    clientAi = new GoogleGenAI({ apiKey: key });
  }
  return clientAi;
}

// Check if a client-side API key is available
function hasClientApiKey(): boolean {
  const meta: any = import.meta;
  const key = (meta.env && meta.env.VITE_GEMINI_API_KEY) || "";
  return key.trim().length > 0;
}

// Convert message histories into properly structured Gemini role contents
function sanitizeClientContents(history: any[], newMessage: string, defaultRole: 'user' | 'model' = 'user'): any[] {
  const merged: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  
  const rawItems = history.map(msg => {
    const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
    let text = "";
    if (typeof msg.text === 'string') text = msg.text.trim();
    else if (typeof msg.content === 'string') text = msg.content.trim();
    else if (Array.isArray(msg.parts) && msg.parts[0] && typeof msg.parts[0].text === 'string') text = msg.parts[0].text.trim();
    return { role, text };
  }).filter(item => item.text.length > 0);

  if (newMessage && newMessage.trim()) {
    rawItems.push({ role: defaultRole, text: newMessage.trim() });
  }

  for (const item of rawItems) {
    if (merged.length > 0 && merged[merged.length - 1].role === item.role) {
      merged[merged.length - 1].parts[0].text += "\n" + item.text;
    } else {
      merged.push({
        role: item.role,
        parts: [{ text: item.text }]
      });
    }
  }

  if (merged.length === 0) {
    merged.push({
      role: 'user',
      parts: [{ text: newMessage || "Hola Asesor" }]
    });
  }

  return merged;
}

// Robust JSON parsing for content strategy client-side
function robustClientJsonParse(text: string, defaultPrompt: string): { strategy: string; copy: string; imagePrompt: string; videoProposal?: string } {
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      strategy: parsed.strategy || "",
      copy: parsed.copy || "",
      imagePrompt: parsed.imagePrompt || defaultPrompt,
      videoProposal: parsed.videoProposal || ""
    };
  } catch (rawError) {
    console.warn("FUTURA Client JSON parser decoding...", rawError);
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsedCandidate = JSON.parse(candidate);
      return {
        strategy: parsedCandidate.strategy || "",
        copy: parsedCandidate.copy || "",
        imagePrompt: parsedCandidate.imagePrompt || defaultPrompt,
        videoProposal: parsedCandidate.videoProposal || ""
      };
    } catch (bracketError) {
      // ignore
    }
  }

  return {
    strategy: "Procesado por FUTURA (Fallo de estructura JSON - Formato crudo).",
    copy: text || "Copy listo para publicar.",
    imagePrompt: defaultPrompt,
    videoProposal: ""
  };
}

// Helper to execute server endpoints with smart failover to local browser API
async function executeWithFallback<T>(
  apiEndpoint: string,
  payload: any,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // 404 indicates server route is not present (standard static host like Vercel)
    if (res.status === 404) {
      console.warn(`[FUTURA HYBRID] Servidor local no soporta esta ruta o estás en un hosting estático (404). Escalando a API de Cliente...`);
      return await fallbackFn();
    }

    if (!res.ok) {
      let errorMsg = `Server error ${res.status}`;
      try {
        const errData = await res.json();
        if (errData && errData.error) {
          errorMsg = errData.error;
        }
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return data as T;
  } catch (error: any) {
    // If it is a fetch connection/network error or we don't have a backend at all (standard CORS/TCP block), failover
    if (error instanceof TypeError || (error.message && error.message.includes("fetch"))) {
      console.warn(`[FUTURA HYBRID] Conexión rechazada con el servidor de la app. Ejecutando respuesta directamente en el navegador...`);
      return await fallbackFn();
    }
    // For other errors, try fallback first as safety
    console.error(`[FUTURA ERROR] Error en servidor. Intentando respaldo local...`, error);
    try {
      return await fallbackFn();
    } catch (fallbackError: any) {
      // Re-throw with user instructions if API Keys are missing
      if (!hasClientApiKey()) {
        throw new Error(
          "No se pudo conectar al servidor de FUTURA y no tienes configurada la clave 'VITE_GEMINI_API_KEY' en tu hosting de Vercel. Por favor, configura tus variables de entorno para habilitar las respuestas de IA."
        );
      }
      throw new Error(fallbackError.message || error.message || "Error al procesar la inteligencia artificial.");
    }
  }
}

// --- CONCRETE STRATEGIC SERVICES ---

// 1. Content Strategy Creator
export async function generateContentStrategy(
  prompt: string,
  context: string,
  styleReferences?: string[],
  logos?: string[],
  history: { role: 'user' | 'model'; content: string }[] = []
): Promise<{ strategy: string; copy: string; imagePrompt: string; videoProposal?: string }> {
  
  const apiEndpoint = "/api/gemini/generateContentStrategy";
  const payload = { prompt, context, styleReferences, logos, history };

  const clientFallback = async () => {
    const model = "gemini-2.5-flash";
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
         - Es un REQUISITO CRÍTICO e IMPERATIVO reverse-engineer la composición exacta de estos archivos de referencia. Analiza la ubicación de objetos, el fondo, el estilo fotográfico/artístico, sombras e iluminación focal.
         - Tu "imagePrompt" debe ser técnico y en inglés para inducir al motor a clonar visualmente este diseño adaptándolo al motivo del usuario.
      
      REGLA DE ORO: BRAND LOCK
      - ES OBLIGATORIO usar la composición y colores de los logos y referencias adjuntos.
      - PROHIBICIÓN DE TEXTO EN IMAGEN: No generes NINGUNA palabra ni letras escritas en el imagePrompt.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "strategy": "Asesoría o recomendación estratégica detallada...",
        "copy": "El copy persuasivo completo listo para publicar...",
        "imagePrompt": "Advanced Technical English prompt...",
        "videoProposal": "Propuesta estructurada de video/Reel corto de alta retención (0-60s)..."
      }
    `;

    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeClientContents(listHistory, "");

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

    const ai = getClientAi();
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    return robustClientJsonParse(response.text || "{}", prompt);
  };

  return executeWithFallback<{ strategy: string; copy: string; imagePrompt: string; videoProposal?: string }>(
    apiEndpoint,
    payload,
    clientFallback
  );
}

// 2. High-Quality Creative Image Generation
export async function generateCreativeImage(
  prompt: string,
  aspectRatio: string = "1:1",
  styleReferences?: string[]
): Promise<string | null> {

  const apiEndpoint = "/api/gemini/generateCreativeImage";
  const payload = { prompt, aspectRatio, styleReferences };

  const clientFallback = async () => {
    // We cannot easily run client-side Image Generation if keys are missing or model not activated on free tier.
    // Instead we will try to make a safe mock call or trigger client SDK Imagen-3
    const ai = getClientAi();
    try {
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: `${prompt}. Vector aesthetic, high contrast, clean minimalist. No written words.`,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio || "1:1",
        }
      });

      const imgBytes = response.generatedImages?.[0]?.imageBytes;
      if (imgBytes) {
        return `data:image/jpeg;base64,${imgBytes}`;
      }
    } catch (apiErr) {
      console.warn("Client Imagen model failed, falling back to beautiful curated Unsplash design...", apiErr);
    }
    // High premium abstract design fallback for professional interface
    return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`;
  };

  return executeWithFallback<string | null>(
    apiEndpoint,
    payload,
    clientFallback
  );
}

// 3. Advisor Chat (Hub Principal / Consola)
export async function chatWithAdvisor(
  message: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  brandContext?: string
): Promise<string> {

  const apiEndpoint = "/api/gemini/chatWithAdvisor";
  const payload = { message, history, brandContext };

  const clientFallback = async () => {
    const model = "gemini-2.5-flash";
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

    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeClientContents(listHistory, message);

    const ai = getClientAi();
    const response = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction }
    });

    return response.text || "FUTURA no pudo emitir su veredicto.";
  };

  return executeWithFallback<string>(
    apiEndpoint,
    payload,
    clientFallback
  );
}

// 4. SPE Phase Chat Consultation
export async function chatAboutPhase(
  phase: string,
  history: any[],
  message: string
): Promise<string> {

  const apiEndpoint = "/api/gemini/chatAboutPhase";
  const payload = { phase, history, message };

  const clientFallback = async () => {
    const model = "gemini-2.5-flash";
    const systemInstruction = `
      Eres el ASESOR ESTRATÉGICO de FUTURA.
      ESTÁS ASESORANDO EN LA FASE: ${phase} del Sistema Pentagonal de Ejecución (SPE).
      
      TU OBJETIVO: Actuar como el experto de la marca que guía al usuario para profesionalizar su contenido de forma directa y ultra concisa.
      - RESPUESTAS DE UN SOLO PÁRRAFO O MÁXIMO DOS PÁRRAFOS: Tu respuesta completa DEBE ser de un solo párrafo corto de 3 a 4 líneas. Si es algo muy complejo, puedes anexar un segundo párrafo de máximo 2 líneas. ¡No más de dos párrafos ni explicaciones largas!
      - TOTALMENTE RESUMIDO Y DIRECTO: Elimina introducciones retóricas. Responde directamente.
      - Invítalos siempre a pasar a la acción en el Motor Creativo de la app.
      
      Responde en ESPAÑOL.
    `;

    const listHistory = Array.isArray(history) ? history : [];
    const contents = sanitizeClientContents(listHistory, message);

    const ai = getClientAi();
    const response = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction }
    });

    return response.text || "Fase inactiva.";
  };

  return executeWithFallback<string>(
    apiEndpoint,
    payload,
    clientFallback
  );
}

// 5. Ultimate Copywriter Generator
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
}): Promise<string> {

  const apiEndpoint = "/api/gemini/generateSocialCopy";
  const payload = { params };

  const clientFallback = async () => {
    const model = "gemini-2.5-flash";
    const systemInstruction = `
      Eres el REDACTOR CREATIVO DE ÉLITE de FUTURA.
      Especialidad: copies que convierten y detienen el scroll.
      Filosofía: "Results over Aesthetics". Redacción directa, persuasiva, orientada a la acción.
    `;

    const prompt = `
      Genera un copy excepcional para redes sociales:
      - Red Social: ${(params.platform || "").toUpperCase()}
      - Categoría: ${(params.copyType || "").toUpperCase()}
      - Tono: ${params.tone || "Results over Aesthetics"}
      - Idioma: ${params.language === 'en' ? 'Inglés' : 'Español'}
      - Detalles: ${params.extraContext || 'Posicionamiento estratégico general'}
    `;

    const ai = getClientAi();
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { systemInstruction }
    });

    return response.text || "";
  };

  return executeWithFallback<string>(
    apiEndpoint,
    payload,
    clientFallback
  );
}

// 6. Refining Copy Editor
export async function refineSocialCopy(
  currentCopy: string,
  refineInstructions: string
): Promise<string> {

  const apiEndpoint = "/api/gemini/refineSocialCopy";
  const payload = { currentCopy, refineInstructions };

  const clientFallback = async () => {
    const model = "gemini-2.5-flash";
    const systemInstruction = "Eres un editor experto de copywriting. Refina el copy provisto según las instrucciones del usuario.";

    const prompt = `
      COPY ACTUAL:
      """
      ${currentCopy}
      """

      INSTRUCCIONES DE REFINAMIENTO:
      "${refineInstructions}"
    `;

    const ai = getClientAi();
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { systemInstruction }
    });

    return response.text || currentCopy;
  };

  return executeWithFallback<string>(
    apiEndpoint,
    payload,
    clientFallback
  );
}
