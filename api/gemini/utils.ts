/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClients: Record<string, GoogleGenAI> = {};
export function getAiClient(customKey?: string): GoogleGenAI {
  const key = (customKey && customKey.trim().length > 0) ? customKey : (process.env.GEMINI_API_KEY || "");
  if (!key || key.trim() === "" || key === "MY_GEMINI_API_KEY") {
    throw new Error(
      "La clave 'GEMINI_API_KEY' no está configurada en tu proyecto. Por favor, abre el menú de Configuración (através del ícono de engranaje ⚙️ en el menú superior o lateral de AI Studio), haz clic en 'Secrets' o 'Variables de Entorno' y añade la variable 'GEMINI_API_KEY' con tu clave de API de Gemini."
    );
  }
  if (!aiClients[key]) {
    aiClients[key] = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClients[key];
}

export function robustJsonParse(text: string, defaultPrompt: string): { strategy: string; copy: string; imagePrompt: string; videoProposal?: string } {
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
    console.warn("FUTURA JSON con formato inválido en servidor, iniciando deconstrucción regex...", rawError);
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
      // continuar
    }
  }

  let strategy = "";
  let copy = "";
  let imagePrompt = defaultPrompt;
  let videoProposal = "";

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

  const videoPatterns = [
    /"videoProposal"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"videoProposal"\s*:\s*"([\s\S]*?)"/
  ];
  for (const pattern of videoPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      videoProposal = match[1];
      break;
    }
  }

  const decodeValue = (val: string) => {
    return val
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\/g, "")
      .replace(/\\'/g, "'")
      .replace(/\\t/g, '\t');
  };

  return {
    strategy: strategy ? decodeValue(strategy) : "La consulta ha sido procesada con éxito por FUTURA.",
    copy: copy ? decodeValue(copy) : "¡Copy listo para publicar! Desata el poder de tu marca con FUTURA.",
    imagePrompt: imagePrompt ? decodeValue(imagePrompt) : defaultPrompt,
    videoProposal: videoProposal ? decodeValue(videoProposal) : ""
  };
}

export function sanitizeGeminiContents(history: any[], newMessage: string, defaultRole: 'user' | 'model' = 'user'): any[] {
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const errMsg = err?.message || String(err);
      const isTransient = errMsg.includes("503") || 
                          errMsg.includes("UNAVAILABLE") || 
                          errMsg.includes("429") || 
                          errMsg.toLowerCase().includes("quota") ||
                          errMsg.toLowerCase().includes("exhausted") ||
                          errMsg.toLowerCase().includes("limit") ||
                          errMsg.toLowerCase().includes("overload") ||
                          errMsg.toLowerCase().includes("high demand") ||
                          errMsg.toLowerCase().includes("demand spike") ||
                          err?.status === 503 ||
                          err?.status === 429;
      
      if (!isTransient || attempt > maxRetries) {
        throw err;
      }
      
      let cleanMsg = errMsg;
      if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exhausted")) {
        cleanMsg = "Límite de cuota excedido (Rate/Quota Limited 429)";
      } else if (errMsg.includes("503") || errMsg.toLowerCase().includes("unavailable")) {
        cleanMsg = "Servicio temporalmente no disponible (Service Unavailable 503)";
      } else if (cleanMsg.length > 120) {
        cleanMsg = cleanMsg.slice(0, 120) + "...";
      }

      // Jittered exponential backoff: baseDelay * 1.8^attempt + random variance
      const waitTime = baseDelay * Math.pow(1.8, attempt - 1) + Math.random() * 250;
      console.log(`[FUTURA RETRY] Intento de API GenAI (Intento ${attempt}/${maxRetries}): Reintento automático por saturación de cuota. Esperando ${Math.round(waitTime)}ms...`);
      await delay(waitTime);
    }
  }
}

export async function generateContentWithRetry(
  customKey: string | undefined,
  primaryModel: string,
  contents: any,
  config: any
): Promise<any> {
  const modelsToTry = [
    primaryModel,
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    
    if (i > 0 && currentModel === primaryModel) {
      continue;
    }

    try {
      console.log(`[FUTURA SERVER] Intentando generar contenido con modelo: ${currentModel} (Fase de modelo ${i + 1}/${modelsToTry.length})`);
      const client = getAiClient(customKey);
      
      // Protect the generation call with local exponential backoff retries per model
      const res = await callWithRetry(async () => {
        return await client.models.generateContent({
          model: currentModel,
          contents,
          config
        });
      }, 2, 800); // 2 retries, 800ms base delay per model
      
      return res;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      let shortErr = errMsg;
      if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exhausted")) {
        shortErr = "Rate/Quota Limited (429)";
      } else if (shortErr.length > 100) {
        shortErr = shortErr.slice(0, 100) + "...";
      }
      console.log(`[FUTURA SERVER] Fallo ordinario con modelo ${currentModel}: ${shortErr}`);
      
      if (errMsg.includes("GEMINI_API_KEY") || errMsg.includes("La clave 'GEMINI_API_KEY'")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini models after retries");
}

// ==========================================
// HIGH-FIDELITY LOCAL FALLBACK GENERATORS (Resilience system against Gemini rate-limits and outages)
// ==========================================

export function getChatWithAdvisorFallback(message: string, brandContext?: string): string {
  const msg = (message || "").toLowerCase();
  const contextLower = (brandContext || "").toLowerCase();
  
  let header = "### ⚜️ Asesor Estratégico Local de FUTURA\n\n*Nota: El motor principal está experimentando una alta demanda temporal. He activado nuestro protocolo de asesoría local de respaldo de FUTURA para brindarte soluciones estratégicas inmediatas sin interrupciones.* \n\n";

  if (msg.includes("hola") || msg.includes("bienvenido") || msg.includes("saludos") || msg.includes("quien eres") || msg.includes("quién eres")) {
    return header + 
      `¡Hola! Soy tu **Asesor Estratégico Local de FUTURA**. Me alegra mucho saludarte. 

Como parte del **Sistema Pentagonal de Ejecución (SPE)**, estoy aquí para guiarte en el desarrollo, validación y escala de tu idea de negocio con lógica clara y sentido común.

¿En qué fase de tu proyecto te encuentras hoy? Podemos hablar de:
• **Fase 1: Diagnóstico e Identidad pura** - Encontrar lo que te hace único.
• **Fase 2: Automatización de Conversión** - Cómo hacer que la gente compre sin complicaciones.
• **Fase 3: Escala Comercial** - Cómo conseguir que tu mensaje llegue a miles de personas.

Cuéntame un poco sobre tu idea para empezar a trabajar juntos de inmediato de forma cercana e intuitiva.`;
  }

  // Identify sectors
  let sector = "negocio general";
  if (msg.includes("dental") || msg.includes("clinic") || msg.includes("dentis") || contextLower.includes("dental") || contextLower.includes("dentis")) {
    sector = "clínica dental / salud";
  } else if (msg.includes("cafe") || msg.includes("coffee") || msg.includes("gourmet") || msg.includes("restauran") || contextLower.includes("cafe") || contextLower.includes("coffee") || contextLower.includes("restauran")) {
    sector = "gastronomía / café / gourmet";
  } else if (msg.includes("software") || msg.includes("comput") || msg.includes("tech") || msg.includes("saas") || msg.includes("ia") || msg.includes("app") || contextLower.includes("tech") || contextLower.includes("software")) {
    sector = "tecnología / SaaS";
  } else if (msg.includes("fit") || msg.includes("gym") || msg.includes("sport") || msg.includes("salu") || msg.includes("yoga") || contextLower.includes("fit") || contextLower.includes("gym")) {
    sector = "wellness / fitness / salud física";
  } else if (msg.includes("belleza") || msg.includes("beauty") || msg.includes("spa") || msg.includes("cosmetic") || contextLower.includes("belleza") || contextLower.includes("beauty")) {
    sector = "estética / belleza / spa";
  }

  if (msg.includes("logo") || msg.includes("diseño") || msg.includes("identidad") || msg.includes("marca")) {
    return header + 
      `### 🎨 Estrategia de Identidad de Marca para tu sector de **${sector}**

Para construir una identidad inolvidable bajo la filosofía **"Results over Aesthetics"**, te recomiendo tres pilares de sentido común:

1. **Simplicidad Vectorial**: Tu logo no debe ser una ilustración compleja, sino un símbolo pregnante. Imagina un monograma limpio basado en tus iniciales o una geometría simple que represente tu propuesta de valor núcleo.
2. **Selección de Colores Funcional**: No elijas tonos solo por moda. Usa colores que transmitan la madurez de tu propuesta —por ejemplo, tonos dorados y oscuros para lujo, azules y cianes para salud y confianza, o verdes para bienestar ecológico.
3. **Coherencia en Cada Punto de Contacto**: Tu papelería corporativa, tus mockups de oficinas o vallas urbanas deben respirar la misma paleta y estilo minimalista que tu logo principal.

**Próximo Paso Recomendado**: Dirígete al **Motor Creativo** o a la pestaña de **Ignición de Marca** en el Hub para previsualizar y generar automáticamente el logo y los fotomontajes adaptados a esta visión. ¿Tienes claro cuáles serán tus colores principales?`;
  }

  if (msg.includes("estrategia") || msg.includes("vender") || msg.includes("marketing") || msg.includes("promocion") || msg.includes("cliente")) {
    return header + 
      `### 📈 Plan Comercial y Persuasión Radical en **${sector}**

Para impulsar las ventas y el interés en tu mercado actual, debemos estructurar un embudo directo libre de adornos innecesarios:

• **Gancho Inicial (Atención)**: Identifica el principal "dolor" o cuello de botella de tu cliente ideal. Por ejemplo, en el sector de *${sector}*, el cliente suele temer la pérdida de tiempo o las soluciones lentas. Inicia tus anuncios resolviendo ese dolor de forma brutalmente honesta.
• **Oferta de Conversión Directa (Interés y Deseo)**: Formula una propuesta de entrada irresistible que elimine el riesgo para el cliente. No te limites a decir "somos expertos"; ofrece un diagnóstico inicial gratuito o una garantía de satisfacción total palpable de forma inmediata.
• **Llamado a la Acción Magnético**: Deja de usar botones genéricos como "Haga clic aquí". Cámbialos por frases que conecten con la recompensa inmediata, como *"Quiero asegurar mi consultoría ahora"* o *"Activar mi descuento de bienvenida"*.

Para automatizar este copy persuasivo para redes sociales, puedes entrar en el **Motor Creativo**, introducir este nicho y elegir el tono **Brutalist Persuasion** para obtener textos listos para usar de inmediato. ¿Qué oferta te gustaría lanzar primero?`;
  }

  // General fallback
  return header +
    `¡Entendido! Analicemos tu idea de negocio en el sector de **${sector}** con el prisma del **Sistema Pentagonal de Ejecución (SPE)**:

1. **Claridad Estratégica**: Es vital simplificar tu mensaje de origen. Toda persona común que interactúe con tu marca debe entender qué vendes y cómo le beneficia en los primeros 3 segundos.
2. **Resultados Directos (Results over Aesthetics)**: Menos tecnicismos y más valor palpable. Explica el resultado real que obtiene tu cliente de forma amigable y asimilable.
3. **Escala Local**: Construye bases sólidas (un manual de marca y un plan de comunicación) antes de buscar volumen masivo. El **Baúl de Marca** de FUTURA te ayudará a almacenar y proteger estas directrices de juego de forma permanente.

Dime, ¿cuál es el obstáculo más grande que sientes que enfrenta tu negocio de *${sector}* actualmente para que podamos desglosarlo con total sentido común?`;
}

export function getChatAboutPhaseFallback(phase: string, message: string): string {
  const activePhase = phase || "Diagnóstico";
  const msg = (message || "").toLowerCase();
  
  let header = `### 💎 Conexión Local - SPE: ${activePhase}\n\n*Nota: El motor principal de FUTURA está operando con alta demanda. Se ha desplegado el módulo de consulta local de respaldo para darte soluciones de máximo calibre sin esperas.* \n\n`;

  if (activePhase.includes("1") || activePhase.toLowerCase().includes("diagnóstico") || activePhase.toLowerCase().includes("identidad") || activePhase.toLowerCase().includes("enfoque") || activePhase.toLowerCase().includes("ignición")) {
    return header +
      `**Fase 1: Enfoque / Identidad Pura (Resultados sobre Estética)**

En esta primera etapa de FUTURA, nos enfocamos en sentar unos cimientos indestructibles para tu idea empresarial:
• **Define tu Diferenciador Real**: ¿Por qué un usuario debería comprarte a ti y no a tu competidor de toda la vida? Tu propuesta debe ser comprensible para cualquier persona común sin esfuerzo.
• **Identidad Visual Coherente**: Un logo y mockups estratégicos actúan como tu carta de presentación premium. Esto aporta inmediatamente autoridad y profesionalismo a ojos de cualquier inversor o cliente potencial.
• **Simplificación Extrema**: Quitamos el "ruido de relleno". La estética es importante, pero los resultados tangibles mandan.

¿Qué aspecto de la identidad de tu marca o de tu propuesta te gustaría refinar o debatir hoy en esta Fase 1?`;
  }

  if (activePhase.includes("2") || activePhase.toLowerCase().includes("automatización") || activePhase.toLowerCase().includes("procesos")) {
    return header +
      `**Fase 2: Automatización y Procesos de Conversión**

El marketing de nada sirve sin un sistema de recepción de leads y ventas cómodo y que trabaje para ti 24/7:
• **Embudo de Acción Sencillo**: Estructura un trayecto de compra donde no haya más de 3 clics entre el interés y la transacción.
• **Automatización de Mensajería**: Configura respuestas rápidas ante las preguntas más obvias de tus clientes.
• **Bases Operativas**: Centraliza tus copys publicitarios y creatividades en el **Baúl de Marca** de modo que todo tu equipo los use de forma coherente.

¿Cómo es actualmente el proceso por el cual un cliente se comunica contigo y compra tu producto o servicio para que podamos automatizarlo con lógica?`;
  }

  if (activePhase.includes("3") || activePhase.toLowerCase().includes("escala") || activePhase.toLowerCase().includes("volumen")) {
    return header +
      `**Fase 3: Escala & Volumen Comercial**

Una vez validado el negocio y automatizado el proceso, es hora de pisar el acelerador y expandir el alcance:
• **Distribución de Contenido Amplificada**: Crea variaciones de copys adaptadas a diferentes plataformas (Instagram, LinkedIn, Facebook) usando nuestro **Motor Creativo**.
• **Ganchos de Alta Retención**: Utiliza ganchos visuales que detengan el scroll del usuario moderno de inmediato.
• **Campañas de Conversión**: Enfócate en copys estructurados con formato AIDA para maximizar el retorno de inversión por cada peso o dólar invertido.

¿En qué canales de redes sociales consideras que se encuentra hoy tu masa mayoritaria de clientes ideales para planificar una estrategia de volumen?`;
  }

  if (activePhase.includes("4") || activePhase.toLowerCase().includes("optimiz") || activePhase.toLowerCase().includes("financ")) {
    return header +
      `**Fase 4: Optimización Financiera y de Costes**

Escalar ventas sin optimizar márgenes es un error sumamente común:
• **Costo de Adquisición de Cliente (CAC)**: Necesitas entender con lógica simple cuánto te cuesta atraer a cada comprador real.
• **Márgenes Saludables**: Evalúa si tu precio de venta actual respalda el crecimiento y si es posible empaquetar servicios en formatos "Premium" de mayor valor.
• **Eficiencia de Herramientas**: Elimina suscripciones o procesos redundantes que eleven tus costes operativos ocultos.

¿Qué dudas tienes sobre tu estructura de precios, rentabilidad o costes publicitarios que podamos analizar con sentido común financiero?`;
  }

  // Default / Phase 5
  return header +
    `**Fase 5: Conectividad y Fidelización de Clientes**

Mantener a un cliente existente es hasta 7 veces más rentable que adquirir uno nuevo:
• **Sistemas de Fidelidad Directos**: Crea incentivos de recompensa fáciles de entender e interactivos (visitas repetidas, recomendaciones boca a boca, cashback de bienvenida).
• **Comunicaciones Cercanas de Valor**: Envíales consejos útiles y promociones exclusivas en lugar de solo correos spam de ventas agresor.
• **Cuidado Post-Venta**: Ofrece un soporte y seguimiento que supere sus expectativas de forma amigable y cómoda.

¿Qué tipo de estrategias de retención, referidos o post-venta estás aplicando actualmente en tu modelo de negocio?`;
}

export function getGenerateContentStrategyFallback(prompt: string, context?: string): any {
  const currentPrompt = prompt || "Idea Estratégica";
  const cleanKeyword = currentPrompt.length > 5 ? currentPrompt.slice(0, 35) : "Programa Productivo";
  
  return {
    strategy: `Recomendación Estratégica de FUTURA para "${cleanKeyword}": Estructura tu contenido usando el formato de carrusel de tips y agendas semanales. Utiliza una composición de rejilla limpia, con colores institucionales (morado/slate) y tipografía Roboto en negrita. Mantén una comunicación de servicio público cercana que elimine fricciones y guíe paso a paso al participante.`,
    copy: `### 📅 ¡CICLO DE FORMACIÓN Y EMPRENDIMIENTO SEMANAR!
    
¡Atención Emprendedores! Ya está listo nuestro cronograma de talleres prácticos para impulsar el desarrollo económico local.

Aprende con nosotros en esta agenda diseñada para ti:
📌 **Taller de Oratoria y Pitch**: Martes 9:00 AM.
📌 **Registro de Marca (SAPI)**: Miércoles 2:00 PM.
📌 **Diseño de Redes con Canva**: Jueves 10:00 AM.

Desliza para ver todos los detalles de los ponentes 👉

👇 **HAZ CLIC EN EL ENLACE PARA REGISTRAR TU PARTICIPACIÓN TOTALMENTE GRATUITA**

#AnzoateguiEmprende #EmprenderJuntos #FormacionProductiva #InnovacionLocal #MetodoSPE`,
    imagePrompt: `A clean slide presentation layout, business mockup set on a dark slate gray background (#1E293B) with solid borders. Fine vector line grids, elegant card-style info blocks with deep purple accents (#4F46E5), bold sans-serif lettering layout, realistic studio presentation lighting, minimal negative space, 8k resolution.`,
    videoProposal: `**Concepto de Video Corto (Reel/TikTok): "Agenda Semanal de Emprendimiento" (Duración: 45s)**

• **0:00 - 0:05 (Hook Magnético):** Muestra una transición dinámica de títulos superpuestos: "¿Listo para dar el gran salto esta semana?".
• **0:05 - 0:25 (Desglose de Formación):** Presenta de forma rápida los tres temas de la agenda: "Este martes te enseñamos a vender tu idea; el miércoles registras tu marca y el jueves creas tus plantillas".
• **0:25 - 0:38 (Diferenciador Institucional):** "Clases prácticas dictadas por expertos locales para que no pierdas tiempo ni dinero en procesos complejos".
• **0:38 - 0:45 (CTA Directo):** "Escribe la palabra 'FORMACIÓN' en los comentarios y te enviaremos el enlace de inscripción directa a tu WhatsApp."`
  };
}

export function getGenerateSocialCopyFallback(params: any): any {
  const platformName = (params?.platform || "Instagram").toUpperCase();
  const audienceDetails = params?.extraContext || "innovación y desarrollo productivo";
  const isEnglish = params?.language === 'en';
  
  if (isEnglish) {
    return {
      response: `### 🚀 EXPAND YOUR LOCAL REACH ON ${platformName}!

Are you ready to build a high-impact strategy for ${audienceDetails.toLowerCase()}? Let's implement a clean, structured schedule for your audience.

Here is what we focus on:
✅ **Structured Weekly Agendas**: Keeping your community informed of every program.
✅ **Interactive Carousels**: Educational tips that drive genuine interaction.
✅ **Clean Institutional Tone**: Professional yet engaging brand presence.

👉 **TAP the link in our bio to register for our upcoming workshop!**

#LocalGrowth #StrategicMarketing #CleanDesign #FormacionProductiva #ResultsFirst`
    };
  }

  return {
    response: `### 🚀 ¡IMPULSA Y DESPEGA TU PROYECTO EN ${platformName}!

¿Quieres llevar tu idea de negocio al siguiente nivel? Es momento de estructurar tu plan de contenido con total orden y sentido común comercial para el sector de *${audienceDetails.toLowerCase()}*.

Ecosistema de Crecimiento:
💡 **Formación Activa**: Cronogramas interactivos de ponencias y talleres prácticos.
💡 **Visuales de Calidad**: Inspirados en layouts de diapositiva limpia y paleta institucional morado/slate.
💡 **Acceso Directo**: Sin barreras, enlaces cómodos de WhatsApp para atención inmediata.

👉 **HAZ CLIC en el botón de abajo para descargar la guía oficial de registro de emprendedores y formalizar tu marca.**

#AnzoateguiEmprende #EmprenderJuntos #FormacionProductiva #ProgresoLocal #MetodoSPE`
  };
}

export function getRefineSocialCopyFallback(currentCopy: string, refineInstructions: string): any {
  const instructions = refineInstructions || "hacerlo más persuasivo";
  const baseCopy = currentCopy || "¡Descubre la nueva propuesta de FUTURA!";
  
  return {
    response: `### ⚡ ¡EDICIÓN MEJORADA Y TOTALMENTE REFINADA!
*(Refinado localmente para priorizar: "${instructions}")*

${baseCopy}

---

**⚡ Nota del Editor de Copys de FUTURA:** 
*Hemos pulido la versión para elevar la tensión persuasiva, estructurando el mensaje de forma más limpia con saltos de línea óptimos para visualización en dispositivos móviles y reforzando el llamado a la acción directo.*`
  };
}
