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

  // Gemini API requires the first message in the contents array to be from the 'user' role
  while (merged.length > 0 && merged[0].role === 'model') {
    merged.shift();
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

// Helper to generate elegant realistic simulated responses on quota limits or for the virtual FUTURA brand
function getDeterministicSimulationResponse(apiEndpoint: string, payload: any): any {
  const prompt = (payload?.prompt || payload?.message || payload?.params?.extraContext || "").trim();
  const context = (payload?.context || payload?.brandContext || payload?.params?.projectDescription || "").trim();
  const isFutura = context.toLowerCase().includes("futura") || 
                   prompt.toLowerCase().includes("futura") || 
                   JSON.stringify(payload || {}).toLowerCase().includes("futura_brand_vault");

  if (apiEndpoint.includes("generateCreativeImage")) {
    const text = (prompt || "").toLowerCase();
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
  }

  if (apiEndpoint.includes("generateContentStrategy")) {
    if (isFutura) {
      return {
        strategy: `### 🎯 PROPUESTA DE POSICIONAMIENTO SPE - FUTURA\n\nEste activo se enfoca en resolver el dolor crónico número uno de infoproductores y agencias en el mercado hispano: **perder el tiempo en contenido estético irrelevante que no genera ventas**.\n\nAplicamos la **Fase 1 (Enfoque Industrial)** y **Fase 2 (Embudo de Captación)** para posicionar a FUTURA como la solución definitiva de IA que prioriza la conversión sobre el diseño decorativo. Accedes a una alta retención y autoridad brutal instantánea.`,
        copy: `🚨 DEJA DE CREAR CONTENIDO QUE SOLO LE GUSTA A TU MAMÁ.\n\nSí, suena duro. Pero la verdad incómoda del marketing es esta:\n\nLos likes no pagan las nóminas. Las métricas de vanidad no sostienen un negocio. El diseño ultra-estético que te tomó 5 horas renderizar no sirve de nada si tu bandeja de entrada sigue vacía.\n\nEn **FUTURA Autopropagación SPE**, operamos bajo un único mantra rector:\n👉 **RESULTADOS SOBRE ESTÉTICA.**\n\nNo hacemos arte, hacemos ingeniería de ventas con IA de élite. Automatizamos la síntesis de tus dolores del cliente ideal y redactamos copys destructores de fricciones comerciales.\n\n🔥 ¿Quieres dejar de lamer vitrinas y empezar a capturar clientes reales listos para pagar hoy? \n\nComenta "FUTURA" abajo o visita el enlace en nuestra bio para acceder a tu diagnóstico de marca gratuito. Tu competencia ya está usando SPE; tú sigues editando fuentes en Canva.\n\n#FUTURA #ResultadosSobreEstetica #MarketingDeElite #InteligenciaArtificial #NegociosDigitales #CopywritingPersuasivo`,
        imagePrompt: "fuchsia and dark obsidian abstract geometry high contrast space background, cybernetic hyper-charged sales funnel core, 3d rendering aesthetic minimal, deep purple lighting, product shot zero text, futuristic tech architecture style",
        videoProposal: `⏱️ HOOK DE VIDEO REEL (FUTURA SPE - 45s):\n\n**0:00 - 0:05 Hook Explosivo**: El presentador mira fijamente a la cámara y apunta con el dedo: "¿Estás harto de que tus posts tengan 100 likes de tus amigos pero CERO mensajes de compra?". En primer plano se muestra un teléfono con notificaciones vacías.\n\n**0:05 - 0:20 El Dolor Crónico**: "La mayoría de gurús te dicen que hagas reels estéticos con tipografías bonitas. Mentira. Las marcas líderes capturan demanda apelando a dolores crónicos, no a la combinación de colores de su grid."\n\n**0:20 - 0:35 La Revelación**: "FUTURA es la primera IA entrenada en el Sistema Pentagonal de Ejecución (SPE). Destruye la fricción de venta al sintetizar las objeciones reales de tu nicho y escribir ofertas irresistibles en segundos."\n\n**0:35 - 0:45 Call to Action**: "Entra al Hub de FUTURA hoy mismo, configura tu Baúl de Marca y ve gratis el análisis estratégico que cambiará tu negocio. El link está en mi biografía."`
      };
    }

    // General Niche Strategy Fallback
    let niche = "Tu Negocio Digital";
    if (prompt.toLowerCase().includes("dent") || context.toLowerCase().includes("dent")) niche = "Clínica Dental Premium / Odontología de Resultados";
    else if (prompt.toLowerCase().includes("cafe") || context.toLowerCase().includes("cafe")) niche = "Cafetería Especializada / Tostado Artesanal Gourmet";
    else if (prompt.toLowerCase().includes("luxur") || prompt.toLowerCase().includes("inmobil") || context.toLowerCase().includes("inmobil")) niche = "Consultoría Inmobiliaria / Real Estate de Alta Conversión";
    else if (prompt.toLowerCase().includes("gym") || prompt.toLowerCase().includes("fit") || context.toLowerCase().includes("fit")) niche = "Personal Trainer & Centro Fitness Premium";

    return {
      strategy: `### 🚀 DIAGNÓSTICO EN TIEMPO REAL - ${niche.toUpperCase()}\n\nDiseñamos un activo quirúrgico orientado a la conversión directa. Con esta estructura, desactivamos la desconfianza del buyer persona atacando su frustración latente.\n\n* **Pilar Estratégico**: Autoridad Técnico + Desmitificar falsas soluciones de bajo costo.\n* **Fase SPE Activa**: Fase 1 (Posición) y Fase 3 (Volumen del Mensaje Persuasivo).`,
      copy: `⚠️ LA VERDAD QUE TU COMPETENCIA NO QUIERE QUE DESCUBRAS...\n\nEn el sector de ${niche}, todo el mundo promete lo mismo: calidad superior, la mejor atención y precios económicos.\n\nPero tú sabes bien que lo barato sale caro. Y tu cliente ideal también.\n\nCuando buscas resultados verdaderos, la clave no es verse bien; es actuar con precisión milimétrica.\n\nEn nuestro ecosistema automatizado, eliminamos las dudas y creamos una experiencia insuperable:\n✅ Soluciones personalizadas al dolor de tu cliente.\n✅ Ejecución limpia respaldada por expertos.\n✅ Enfoque absoluto en tu tranquilidad y retorno de inversión.\n\nNo te conformes con lo unconventional. Elige al líder que prioriza los resultados reales.\n\n👉 Escríbenos un mensaje privado hoy y solicita una auditoría integral sin compromiso.\n\n#${niche.replace(/\s+/g, '')} #ResultadosReales #SPE #EstrategiaComercial #Liderazgo #ServiciosDeElite`,
      imagePrompt: `minimalist luxury product mockup in cybernetic workspace, premium ${niche} visual element, deep obsidian black background accented with rich gold and turquoise lights, studio photography style, hyperrealistic clean textures, complete negative space, absolutely no text written`,
      videoProposal: `🎥 PROPUESTA DE VIDEO CORTO (RETENCIÓN MÁXIMA - 30s):\n\n**0:00 - 0:05 Hook**: "¿Alguna vez te has preguntado por qué sigues gastando en alternativas baratas que nunca solucionan el problema de raíz?" (Señalando directamente a la cámara).\n\n**0:05 - 0:15 Contraste**: Muestra un reloj de arena cayendo rápido. "Cada minuto que dejas pasar con un servicio mediocre te aleja de tu paz mental y de tu rentabilidad."\n\n**0:15 - 0:25 El Valor**: "Con nuestra metodología de alta conversión en ${niche}, te garantizamos una transformación medible desde la primera semana de ejecución."\n\n**0:25 - 0:30 Cierre**: "Toma el control hoy. Haz clic en el botón de abajo y reserva tu espacio antes de que cerremos cupos asignados."`
    };
  }

  if (apiEndpoint.includes("chatWithAdvisor") || apiEndpoint.includes("chatAboutPhase")) {
    const textLower = prompt.toLowerCase();
    const isGreeting = textLower.includes("hola") || textLower.includes("buenos") || textLower.includes("salud") || textLower.includes("tal");

    // Dynamic, Keyword-Aware Contingency engine to eliminate static responses
    let sector = "tu modelo de negocio";
    let phaseFocus = "Fase 1 (Enfoque e Identidad)";
    let bulletPoints: string[] = [];

    if (textLower.includes("zapato") || textLower.includes("calzado") || textLower.includes("tenis") || textLower.includes("sneaker") || textLower.includes("ropa") || textLower.includes("moda") || textLower.includes("tienda")) {
      sector = "comercio minorista y moda (calzado/bazar)";
      phaseFocus = "Fase 2 (Embudo de Conversión) y Fase 4 (Optimización del Ticket)";
      bulletPoints = [
        "**Derriba la fricción del tallaje:** El mayor dolor de tu comprador es equivocarse de talla. Ofrece una promesa clara de 'primer cambio 100% gratis y sin preguntas'. Esto aumenta la conversión un 35% de inmediato.",
        "**Muestra tu producto en movimiento:** Los catálogos quietos aburren. Diseña videos cortos de transiciones rápidas mostrando tus zapatos o prendas puestas en la calle en situaciones reales de uso.",
        "**Venta cruzada inteligente al pagar:** En el checkout, ofrece complementos de valor natural como calcetas de bambú, impermeabilizantes protectores o plantillas ergonómicas con un descuento inmediato."
      ];
    } else if (textLower.includes("cafe") || textLower.includes("coffee") || textLower.includes("gourmet") || textLower.includes("comida") || textLower.includes("restauran") || textLower.includes("pasteler") || textLower.includes("panader") || textLower.includes("hamburg")) {
      sector = "gastronomía, cafeterías y productos premium gourmet";
      phaseFocus = "Fase 1 (Diferenciación) y Fase 5 (Fidelización del Cliente)";
      bulletPoints = [
        "**Crea un ritual insustituible:** No vendes café o comida ordinaria; vendes una pausa productiva o un escape delicioso. Posiciona tu narrativa alrededor del ritual de preparación o de la procedencia de tus ingredientes.",
        "**Programa de recurrencia física/digital:** Diseña una tarjeta de lealtad limpia con WhatsApp ('El Club del Sabor'). El 50% de tus ingresos provendrán de clientes recurrentes que regresen al menos dos veces por semana.",
        "**Micro-marketing de proximidad:** Entrega muestras de degustación exclusivas e invitaciones personalizadas a comercios o corporativos vecinos que se encuentren a menos de 5 cuadras a la redonda."
      ];
    } else if (textLower.includes("odont") || textLower.includes("dent") || textLower.includes("salu") || textLower.includes("medic") || textLower.includes("clinic") || textLower.includes("bienestar") || textLower.includes("yoga") || textLower.includes("fit") || textLower.includes("gym")) {
      sector = "bienestar, salud, fitness y consultorios profesionales";
      phaseFocus = "Fase 1 (Posicionamiento Técnico) y Fase 3 (Volumen de Contenidos de Autoridad)";
      bulletPoints = [
        "**Desmitifica el dolor y el miedo:** El cliente de salud o estética compra por miedo al dolor o a verse mal. Desmonta estas dudas mediante testimonios reales y cortometrajes educativos sencillos que demuestren un camino sin molestia.",
        "**Configura el canal directo de WhatsApp:** Reemplaza los formularios extensos por un botón flotante visible. Permite que reserven una videoconsulta de diagnóstico rápido o cita en menos de 2 clics.",
        "**Educa en vez de vender directamente:** Produce contenido resolviendo dudas comunes cotidianas de salud (ej: 'El error diario que destruye tus encías/posturas'). El que educa primero se queda con la autoridad."
      ];
    } else if (textLower.includes("tech") || textLower.includes("software") || textLower.includes("comput") || textLower.includes("program") || textLower.includes("ia") || textLower.includes("saas") || textLower.includes("web") || textLower.includes("digital")) {
      sector = "tecnología, software, desarrollo y negocios digitales";
      phaseFocus = "Fase 2 (Embudo de Captación Automatizado) y Fase 4 (Optimización de Retención)";
      bulletPoints = [
        "**Simplifica la promesa comercial:** Explica exactamente cómo tu sistema o software ahorra horas de trabajo en lugar de enredar al prospecto en jerga técnica indescifrable.",
        "**Ofrece un piloto o auditoría instantánea de 10 minutos:** Un demo guiado o diagnóstico rápido automatizado convierte 5 veces más rápido que cualquier llamada larga de ventas corporativa.",
        "**Demuestra el Retorno de Inversión (ROI):** Explica con números claros cuánto dinero está perdiendo tu prospecto diariamente por mantener procesos manuales u obsoletos."
      ];
    } else if (textLower.includes("cur") || textLower.includes("educ") || textLower.includes("coach") || textLower.includes("asesor") || textLower.includes("consult") || textLower.includes("servici") || textLower.includes("mentor")) {
      sector = "servicios profesionales, mentorías y consultoría estratégica";
      phaseFocus = "Fase 1 (Definición de Oferta Irresistible) y Fase 3 (Volumen persuasivo)";
      bulletPoints = [
        "**Empaqueta tu conocimiento en resultados concretos:** Evita vender 'horas de consultoría'. Vende una meta empaquetada (ej: 'Instalación de tus canales de automatización en 21 días con soporte continuo').",
        "**Demuestra autoridad inmediata con material auditable gratuíto:** Obsequia una guía interactiva breve o una auditoría flash en video que resuelva de inmediato su dolor comercial más visible.",
        "**Filtra a tus prospectos:** Diseña una sesión estratégica breve de cortesía pero condicionada a un breve cuestionario previo. Esto eleva drásticamente el valor percibido de tu tiempo y la calidad de tus leads."
      ];
    }

    // Capture specific tokens to personalize fallback responses even further
    const matchedTokens = prompt.match(/\b([a-zA-Záéíóúñ]{4,15})\b/g) || [];
    const keywords = matchedTokens
      .filter(w => !["hola", "como", "esta", "este", "para", "todo", "conigo", "hacer", "crear", "vender", "venderle", "necesito", "quien", "sobre", "tengo", "marca", "negocio", "estrategia", "clientes"].includes(w.toLowerCase()))
      .slice(0, 3);
    
    const keywordsContext = keywords.length > 0 
      ? ` para el despliegue comercial enfocado en **"${keywords.join(' ')}"**`
      : "";

    if (isGreeting) {
      return `¡Hola! Qué gusto saludarte de nuevo. Te doy una cálida bienvenida al epicentro del **Centro de Consultoría FUTURA**.

Estoy completamente preparado para ser tu estratega de negocios y ayudarte a estructurar el crecimiento de tu marca en el sector de **${sector}** de forma muy ágil, pragmática y con total sabiduría comercial.

Cuéntame, ¿qué idea específica o desafío tienes en mente hoy para que elaboremos un plan cómodo, práctico y con lógica de sentido común? ¡Estoy aquí para impulsarte!

---
*(Nota: FUTURA está operando temporalmente mediante su Motor de Resiliencia Inteligente. Los resultados de consultoría se estructuran mediante heurísticas avanzadas locales del SPE).*`;
    }

    const bulletSection = bulletPoints.length > 0 
      ? `Para abordar esta consulta, activamos de inmediato la estrategia del **Sistema Pentagonal de Ejecución (SPE)** orientada a **${sector || "tu negocio"}**:\n\n${bulletPoints.map(b => `* ${b}`).join("\n\n")}`
      : `Para estructurar tu consulta${keywordsContext}, lo principal en la consultoría estratégica moderna es **desterrar la complejidad**. Las personas ignoran el marketing rebuscado y buscan soluciones honestas y directas:

* **Elimina la ambigüedad en 5 segundos:** Explica tu negocio como si se lo contaras a un niño de 8 años. ¿Cuál es ese dolor de cabeza exacto que resuelves y cómo mejora la vida de tu comprador?
* **Construye un canal directo y cómodo:** No enredes al cliente ideal en laberintos. Un enlace simple a WhatsApp o una llamada rápida acelerará tus ventas mucho más rápido que un formulario costoso.
* **Aumenta el ticket de compra:** Diseña un servicio o producto complementario de bajo coste pero de alto valor inmediato para ofrecerlo en el momento decisivo del pago.`;

    return `Entiendo perfectamente tu inquietud sobre de **${prompt.length > 100 ? prompt.slice(0, 100) + '...' : prompt}**. Vamos a estructurarla con total realismo, criterio lógico y alejado de discursos robotizados corporativos.

${bulletSection}

### ¿Cómo seguimos ahora?
Te aconsejo guardar estos pilares en tu **Baúl de Marca ("Vault")** dentro de la suite. Desde este punto, podremos optimizar e incluso redactar los borradores tácticos exactos del **Motor Creativo** para tus campañas del ecosistema. 

¿Cuál de estos puntos se adapta mejor a tu operación actual? Cuéntame y lo profundizamos juntos con total cercanía.

---
*(Nota: FUTURA está operando de forma resiliente para darte respuesta inmediata. Diseñemos juntos el camino al éxito para tu proyecto).*`;
  }

  if (apiEndpoint.includes("generateSocialCopy") || apiEndpoint.includes("refineSocialCopy")) {
    const copyType = payload?.params?.copyType || "conversión";
    const platform = payload?.params?.platform || "LinkedIn y Redes Sociales";
    return `⚠️ REVELACIÓN CRÍTICA sobre tu nicho comercial (${platform}):\n\n¿Por qué sigues intentando convencer a todos con frases motivacionales vacías?\n\nLa realidad es fría: tus clientes ideales están perdiendo dinero o tiempo justo ahora. No quieren un post estético sobre tus valores.\n\nQuieren la solución exacta que detenga el desangre de su operación.\n\nEn esta campaña de ${copyType} premium, traemos la artillería pesada:\n👉 Identificamos el síntoma de inmediato.\n👉 Ofrecemos nuestro diagnóstico contrastado en tiempo récord.\n👉 Abrimos un canal directo donde solo ingresan marcas comprometidas con la acción.\n\nNo lamas vitrinas. Escribe "SPE" o envíanos un Mensaje Directo hoy mismo para agendar tu sesión técnica de 15 minutos.\n\n#ConversionFeroz #SPE #FuturaEngine #EstrategiaDigital`;
  }

  return "FUTURA completó la acción con un rendimiento simulado excelente.";
}

// Helper to execute server endpoints with smart failover to local browser API
async function executeWithFallback<T>(
  apiEndpoint: string,
  payload: any,
  fallbackFn: () => Promise<T>
): Promise<T> {
  const prompt = (payload?.prompt || payload?.message || payload?.params?.extraContext || "").trim();
  const context = (payload?.context || payload?.brandContext || payload?.params?.projectDescription || "").trim();
  const isFutura = context.toLowerCase().includes("futura") || 
                   prompt.toLowerCase().includes("futura") || 
                   JSON.stringify(payload || {}).toLowerCase().includes("futura_brand_vault");

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
    const errorStr = (error?.message || "").toLowerCase();
    console.warn(`[FUTURA HYBRID] Error durante la llamada al servidor (${error.message}). Iniciando estrategia de resiliencia...`);

    // Attempt client-side execution if we have client/localStorage/env keys
    if (hasClientApiKey()) {
      try {
        console.warn(`[FUTURA] Intentando ejecutar directamente en el navegador con la clave de cliente...`);
        return await fallbackFn();
      } catch (fallbackError: any) {
        console.warn(`[FUTURA HYBRID] Fallback del cliente también falló con error:`, fallbackError.message);
      }
    }

    // Elegant deterministic simulation fallback as the ultimate protection
    console.warn(`[FUTURA HYBRID] Retornando respuesta estratégica estructurada de salvaguarda...`);
    return getDeterministicSimulationResponse(apiEndpoint, payload) as T;
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

    const mappings: { [key: string]: string } = {
      "dental": "dental,dentist,smile",
      "dentist": "dental,dentist,smile",
      "odontolo": "dental,dentist,clinic",
      "dient": "dental,dentist,smile",
      "sonris": "smile,happy,person",
      "cafe": "coffee,cafe,bean",
      "coffee": "coffee,cafe,cup",
      "gourmet": "gourmet,cuisine,food",
      "cafeter": "cafe,coffee,bakery",
      "food": "food,culinary,gourmet",
      "comid": "food,culinary,dish",
      "restauran": "restaurant,dining",
      "hamburg": "burger,fastfood",
      "plat": "food,dish",
      "tech": "technology,digital",
      "software": "code,programming,developer",
      "comput": "computer,developer,desk",
      "matrix": "cyberpunk,matrix,cyber",
      "digital": "digital,abstract",
      "ia": "artificial-intelligence,tech",
      "artificial": "technology,cyber",
      "web": "webdesign,ux,computer",
      "code": "code,developer",
      "programac": "code,developer",
      "belleza": "beauty,spa,cosmetics",
      "spa": "spa,wellness,bamboo",
      "cosmetic": "cosmetics,makeup,skincare",
      "piel": "skincare,serum",
      "beauty": "beauty,skincare",
      "estet": "spa,beauty",
      "masaj": "massage,spa",
      "house": "architecture,interior,house",
      "inmobil": "realestate,property,luxury-home",
      "arquitectur": "architecture,modern-building",
      "hogar": "home,cozy-living",
      "apartamento": "apartment,loft,interior",
      "diseño": "design,interior,architecture",
      "interi": "interior,minimalist-room",
      "fitness": "fitness,gym",
      "gimnas": "gym,fitness",
      "fit": "fitness,workout",
      "sport": "sports,athlete",
      "entrenamien": "training,workout",
      "fuerz": "gym,workout",
      "banana": "banana,fruit,yellow",
      "platano": "banana,fruit,yellow",
      "zapato": "shoes,sneakers,fashion",
      "calzado": "shoes,fashion",
      "vestid": "dress,fashion,apparel",
      "ropa": "clothing,fashion",
      "moda": "fashion,style",
      "auto": "car,automotive,sportscar",
      "coche": "car,automotive",
      "carro": "car,luxury-car",
      "motor": "car,automotive",
      "perro": "dog,cute-pet",
      "gato": "cat,cute-pet",
      "mascota": "pet,dog,cat",
      "viaje": "travel,adventure,destination",
      "turism": "travel,landscape",
      "playa": "beach,ocean,relax",
      "montaña": "mountain,landscape,nature",
      "hotel": "luxury-hotel,resort",
      "marketing": "marketing,business,office",
      "negocio": "business,workspace,meeting",
      "finanz": "finance,money,investment",
      "dinero": "wealth,money",
      "educac": "education,learning,classroom",
      "escuel": "school,learning,book",
      "medicin": "medicine,healthcare,doctor",
      "salud": "health,wellness"
    };

    const matchedTags: string[] = [];
    for (const [key, val] of Object.entries(mappings)) {
      if (text.includes(key)) {
        matchedTags.push(val);
      }
    }

    let keywords = "";
    if (matchedTags.length > 0) {
      keywords = matchedTags.join(",");
    } else {
      const cleanWords = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove spanish accents
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w => {
          return w.length > 3 && 
                 !["para", "como", "esta", "este", "todo", "sigue", "necesito", "solicit", "solicito", "conectar", "conecta", "crear", "hacer", "diseno", "imagen", "imagenes", "resultado", "resultados", "estilo", "marca", "marcas"].includes(w);
        });
      
      if (cleanWords.length > 0) {
        keywords = cleanWords.slice(0, 3).join(",");
      } else {
        keywords = "abstract,minimal,background";
      }
    }

    const cacheBuster = Math.floor(Math.random() * 1000);
    return `https://images.unsplash.com/featured/1000x1000/?${encodeURIComponent(keywords)}&sig=${cacheBuster}`;
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
      Eres el ASESOR ESTRATÉGICO Y COMPAÑERO DE NEGOCIOS DE LA APLICACIÓN FUTURA (FUTURA App Advisor de la suite de Future Marketing Consult).
      Estás en el CENTRO DE CONSULTORÍA de la plataforma. Tu propósito principal es responder con total coherencia, sentido común y criterio lógico a cualquier persona, sea un profesional experimentado o alguien común dando sus primeros pasos. Hablas de forma súper clara, amable, empática y con una excelente facilidad de asimilación.
      
      FILOSOFÍA DE RESPUESTA ("Humana, Cómoda y con Criterio de Persona Común"):
      1. CRITERIO LÓGICO NATURAL: Si el usuario te hace una pregunta sencilla, cotidiana o informal (como un saludo o una duda de sentido común sobre negocios), respóndele de manera natural, humana, cálida y directa, como lo haría un mentor comprensivo. No utilices sermones corporativos ni asumas que todo debe ser hiper-técnico.
      2. EXPLICACIONES SENCILLAS Y CÓMODAS: Traduce cualquier concepto complejo a palabras de uso cotidiano. Explica el "por qué" y el "cómo" de forma didáctica. Tu misión es hacer el marketing y la estrategia comercial amigables, accesibles y cómodos para todo el mundo.
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
      Eres el ASESOR ESTRATÉGICO de la fase: ${phase} del Sistema Pentagonal de Ejecución (SPE) de FUTURA.
      
      TU OBJETIVO Y FILOSOFÍA DE RESPUESTA ("Humana, Cómoda y con Criterio de Persona Común"):
      1. EXPLICACIONES SENCILLAS: Explica los conceptos de esta fase de forma totalmente amigable, digerible y libre de terminologías duras o impenetrables. Habla de tú a tú con el usuario, como si fueses un socio de negocios que le orienta con lógica de sentido común.
      2. FORMATO LIGERO Y AGRADABLE DE LEER: Estructura tu respuesta con espacios bien aireados en lugar de bloques de texto pesados. Escribe en párrafos cortos (máximo 2-3 líneas cada uno). Usa listas numeradas o de viñetas limpias si necesitas dar ideas, pasos o consejos estructurados.
      3. CRITERIO HUMANO REAL: Responde de forma lógica y directa a la pregunta o comentario exacto del usuario. No escupas respuestas robóticas autogeneradas. Si te hacen una pregunta básica, utiliza la inteligencia cotidiana y asóciala amigablemente con la fase de ${phase}.
      4. ACCIÓN ORGÁNICA: Invita elegantemente al usuario a poner en práctica estas ideas o refinar su contenido empleando el Motor Creativo cuando lo considere oportuno, de manera constructiva y motivadora.
      
      Responde en ESPAÑOL, usando Markdown muy ordenado y cómodo de leer.
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
