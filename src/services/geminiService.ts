/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

// Secure Hybrid Client/Server Gemini Service Proxy
// First attempts to use the robust Express API proxy.
// If the server returns 404 (meaning we are on Vercel or static hosting) or fails with a network/CORS error,
// it instantly fails over to direct browser execution using the client-side VITE_GEMINI_API_KEY.

function getClientAi(): any {
  const meta: any = import.meta;
  const userKey = localStorage.getItem("user_gemini_api_key") || "";
  const fallbackKey = (meta.env && meta.env.VITE_GEMINI_API_KEY) || "";
  const key = userKey.trim().length > 0 ? userKey.trim() : fallbackKey;

  if (!key) {
    console.warn("FUTURA WARNING: No se configuró clave en el almacenamiento local ni VITE_GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey: key });
}

// Check if a client-side API key is available
function hasClientApiKey(): boolean {
  const meta: any = import.meta;
  const userKey = localStorage.getItem("user_gemini_api_key") || "";
  const fallbackKey = (meta.env && meta.env.VITE_GEMINI_API_KEY) || "";
  return userKey.trim().length > 0 || fallbackKey.trim().length > 0;
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
    const userKey = localStorage.getItem("user_gemini_api_key") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (userKey.trim().length > 0) {
      headers["x-gemini-api-key"] = userKey.trim();
    }

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers,
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
    if (data && typeof data === 'object') {
      if ('response' in data) {
        return data.response as any;
      }
      if ('imageUrl' in data) {
        return data.imageUrl as any;
      }
    }
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
    const text = (prompt || "").toLowerCase();
    const isLogo = text.includes("logo") || text.includes("icon") || text.includes("symbol") || text.includes("isotipo") || text.includes("branding") || text.includes("isologo") || text.includes("logotipo");

    if (isLogo) {
      let svgGraphic = "";

      if (text.includes("dental") || text.includes("dentist") || text.includes("odontolog") || text.includes("dient") || text.includes("sonris")) {
        svgGraphic = `
          <defs>
            <linearGradient id="cDentalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00F5FF"/>
              <stop offset="100%" stop-color="#0A4D92"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
          <circle cx="200" cy="180" r="140" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          <polygon points="200,60 310,250 90,250" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
          <path d="M200,90 C250,90 280,130 270,190 C260,230 230,270 200,290 C170,270 140,230 130,190 C120,130 150,90 200,90 Z" fill="none" stroke="url(#cDentalGrad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M200,120 C220,120 235,145 230,180 C218,220 200,240 200,240 C200,240 182,220 170,180 C165,145 180,120 200,120 Z" fill="url(#cDentalGrad)" opacity="0.85"/>
          <circle cx="200" cy="165" r="12" fill="#FFFFFF"/>
          <path d="M200,100 L205,110 L215,115 L205,120 L200,130 L195,120 L185,115 L195,110 Z" fill="#FFD700" />
        `;
      } else if (text.includes("cafe") || text.includes("coffee") || text.includes("gourmet") || text.includes("restauran") || text.includes("comid") || text.includes("food") || text.includes("panader") || text.includes("alimento")) {
        svgGraphic = `
          <defs>
            <linearGradient id="cWarmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFD700"/>
              <stop offset="100%" stop-color="#C58927"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="180" r="110" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
          <path d="M130,150 L270,150 L255,240 C250,275 220,290 200,290 C180,290 150,275 145,240 Z" fill="none" stroke="url(#cWarmGrad)" stroke-width="12" stroke-linecap="round" />
          <path d="M270,180 C295,180 300,205 300,215 C300,225 295,240 270,240" fill="none" stroke="url(#cWarmGrad)" stroke-width="12" stroke-linecap="round" />
          <path d="M165,125 C170,105 165,95 170,80" fill="none" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
          <path d="M200,125 C205,105 200,95 205,80" fill="none" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
          <path d="M235,125 C240,105 235,95 240,80" fill="none" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
        `;
      } else if (text.includes("tech") || text.includes("software") || text.includes("comput") || text.includes("digital") || text.includes("artificial") || text.includes("ia") || text.includes("ai") || text.includes("program")) {
        svgGraphic = `
          <defs>
            <linearGradient id="cTechGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00F5FF"/>
              <stop offset="100%" stop-color="#9400D3"/>
            </linearGradient>
          </defs>
          <polygon points="200,60 310,123 310,250 200,313 90,250 90,123" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
          <polygon points="200,90 285,139 285,238 200,287 115,238 115,139" fill="none" stroke="url(#cTechGrad)" stroke-width="8" stroke-linejoin="round"/>
          <circle cx="200" cy="90" r="14" fill="#00F5FF"/>
          <circle cx="285" cy="238" r="14" fill="#9400D3"/>
          <circle cx="115" cy="238" r="14" fill="#00F5FF"/>
          <circle cx="200" cy="188" r="40" fill="none" stroke="url(#cTechGrad)" stroke-width="5" />
          <circle cx="200" cy="188" r="18" fill="#FFFFFF" />
        `;
      } else if (text.includes("wellness") || text.includes("salu") || text.includes("yoga") || text.includes("sport") || text.includes("vida") || text.includes("health") || text.includes("fit") || text.includes("terapia")) {
        svgGraphic = `
          <defs>
            <linearGradient id="cWellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#39FF14"/>
              <stop offset="100%" stop-color="#008080"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
          <path d="M200,80 C218,135 255,145 290,165 C235,182 212,198 200,270 C188,198 165,182 110,165 C145,145 182,135 200,80 Z" fill="url(#cWellGrad)" opacity="0.9" />
          <path d="M200,120 C210,155 235,165 255,180 C220,190 205,200 200,245 C195,200 180,190 145,180 C165,165 190,155 200,120 Z" fill="#FFFFFF" opacity="0.95" />
        `;
      } else {
        svgGraphic = `
          <defs>
            <linearGradient id="cDefaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4A00E0"/>
              <stop offset="100%" stop-color="#8E2DE2"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="180" r="110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
          <circle cx="200" cy="110" r="75" fill="none" stroke="url(#cDefaultGrad)" stroke-width="6" opacity="0.6"/>
          <circle cx="200" cy="250" r="75" fill="none" stroke="url(#cDefaultGrad)" stroke-width="6" opacity="0.6"/>
          <circle cx="130" cy="180" r="75" fill="none" stroke="url(#cDefaultGrad)" stroke-width="6" opacity="0.6"/>
          <circle cx="270" cy="180" r="75" fill="none" stroke="url(#cDefaultGrad)" stroke-width="6" opacity="0.6"/>
          <circle cx="200" cy="180" r="32" fill="url(#cDefaultGrad)" />
          <polygon points="200,162 216,189 184,189" fill="#FFFFFF" />
        `;
      }

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
          <rect width="100%" height="100%" fill="#090d16" rx="30"/>
          <path d="M 0 100 L 400 100 M 0 200 L 400 200 M 0 300 L 400 300 M 100 0 L 100 400 M 200 0 L 200 400 M 300 0 L 300 400" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1" />
          ${svgGraphic}
          <text x="200" y="360" text-anchor="middle" fill="#5F708A" font-family="'Inter', system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" letter-spacing="6" opacity="0.6">FUTURA AUTOMATIC ENGINE</text>
        </svg>
      `;

      return `data:image/svg+xml;base64,${btoa(encodeURIComponent(svgString.trim()).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))))}`;
    }

    if (text.includes("dental") || text.includes("dentist") || text.includes("odontolog") || text.includes("dient") || text.includes("sonris")) {
      return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1000&auto=format&fit=crop&q=80";
    }
    if (text.includes("cafe") || text.includes("coffee") || text.includes("gourmet") || text.includes("cafeter")) {
      return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80";
    }
    if (text.includes("food") || text.includes("comid") || text.includes("restauran") || text.includes("hamburg") || text.includes("plat")) {
      return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80";
    }
    if (text.includes("tech") || text.includes("software") || text.includes("comput") || text.includes("matrix") || text.includes("digital") || text.includes("ia") || text.includes("web") || text.includes("code")) {
      return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80";
    }
    if (text.includes("belleza") || text.includes("spa") || text.includes("cosmetic") || text.includes("piel") || text.includes("beauty") || text.includes("estetic") || text.includes("masaje")) {
      return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80";
    }
    if (text.includes("house") || text.includes("inmobil") || text.includes("arquitectur") || text.includes("hogar") || text.includes("apartamento") || text.includes("diseño") || text.includes("interi")) {
      return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80";
    }
    if (text.includes("fitness") || text.includes("gimnas") || text.includes("fit") || text.includes("sport") || text.includes("entrenamien") || text.includes("fuerz")) {
      return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80";
    }

    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80";
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
    const model = "gemini-3.5-flash";
    const systemInstruction = `
      Eres el ASESOR ESTRATÉGICO Y TECNOLÓGICO DE LA APLICACIÓN FUTURA (FUTURA App Advisor de la suite de Future Marketing Consult).
      Estás en el CENTRO DE CONSULTORÍA de la plataforma. Tu discurso conoce al detalle todo nuestro ecosistema optimizado real:
      
      ESTRUCTURA REAL DISPONIBLE EN FUTURA APPS:
      1. **FUTURA Hub**:
         - **Blueprint Estratégico (Fórmula de Origen - Estrategia Core)**: Espacio inicial donde el usuario describe su idea o negocio sin filtros para sintetizar su Estratigrafía ADN de posicionamiento, 3 Taglines estallados de marca, Arquetipo con Dolores Críticos del Target, y Temáticas Prácticas de Publicación.
         - **Centro de Consultoría (Chat de Estrategia)**: Asesoría estratégica 24/7 de alto calibre basada en las fases del SPE para responder preguntas comerciales.
      2. **Motor Creativo (Fábrica de Conversión)**:
         - **Fábrica de Copys de Conversión**: Copywriting persuasivo nivel élite optimizado por plataforma (Instagram, LinkedIn, Facebook, TikTok) y objetivos de conversión.
         - **Fábrica de Imágenes Persuasivas**: Generación de diseño conceptual y prompts avanzados de diseño listos para render.
         - **Fábrica de Videos Hooks & Reels**: Sólidos copys para videos y ganchos de retención de 0-60 segundos.
      3. **Baúl de Marca ("Vault")**:
         - **Enlace de Marca y Assets**: Carga segura de logotipos, colores rectores, referencias de diseño efectivas para el entrenamiento de mímica del motor, y documentos de posicionamiento estratégicos.
         - **Pitch de Ventas y Píldoras Comerciales**: Síntesis compacta de valor para el negocio listo para ser asociado al motor.
      4. **Galería de Activos (Activos Guardados)**:
         - Panel de control central y visor de todas las copys de conversión generadas, enlaces visuales, y picheos listos para exportar directos a redes.
      
      METODOLOGÍA FILOSÓFICA (SPE - Sistema Pentagonal de Ejecución):
      - Fase 1: Enfoque / Identidad pura (Results over Aesthetics).
      - Fase 2: Automatización y Procesos de Conversión.
      - Fase 3: Escala & Volumen Comercial.
      - Fase 4: Optimización Financiera.
      - Fase 5: Conectividad y Fidelización.

      MANDATOS CRÍTICOS DE CONTEXTO (DISCURSO CONFIGURADO AL SOFTWARE REAL):
      1. SIN CONEXIÓN EXTERNA DIRECTA: FUTURA no publica ni se conecta directamente mediante APIs a redes externas (Instagram, TikTok, etc.). Es una plataforma de simulación estrategica interna de alto estándar profesional.
      2. GUIAR CON PRECISIÓN: Dirige al cliente con profesionalismo, recomendando el flujo ideal: definir su base con la Fórmula de Origen en FUTURA Hub, cargarlo en el Baúl de Marca, crear en el Motor Creativo, y gestionar todo en la Galería de Activos.
      3. REGLA DE CONTEXTO PASIVO Y ENFOQUE DE PROYECTOS (CRÍTICAMENTE IMPERATIVO):
         - Aunque tengas un "Contexto de Marca" provisto al final, NO debes mencionarlo, ni asumir que el usuario está preguntando o hablando sobre él, ni usarlo proactivamente para tus respuestas en paralelo, A MENOS que el usuario te pregunte explícitamente sobre sus proyectos configurados, sus marcas guardadas o te pida explícitamente analizar su marca actual.
         - Si el usuario hace preguntas generales o consultas conceptuales sobre marketing, estrategia comercial o la metodología SPE, responde en términos generales y conceptuales sin traer a colación la marca conectada ni decir cosas como "Veo que tienes configurado tu proyecto premium" o similar. Solo incorpora los datos de la marca conectada cuando te pregunten directamente sobre ella o te digan que la analices.

      DIRECTRICES DE FORMATO CRÍTICAS:
      - RESPUESTAS DE UN SOLO PÁRRAFO O MÁXIMO DOS PÁRRAFOS: Tu respuesta completa DEBE ser de un solo párrafo corto de 3 a 5 líneas. Solo si es de alta complejidad te autorizo a agregar un segundo párrafo corto adicional de máximo 2 líneas. Está PROHIBIDO usar listas o viñetas extensas. ¡Ve directo al grano!
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
    const model = "gemini-3.5-flash";
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
    const model = "gemini-3.5-flash";
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
    const model = "gemini-3.5-flash";
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
