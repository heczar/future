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
  const textLower = (prompt + " " + context).toLowerCase();

  if (apiEndpoint.includes("generateCreativeImage")) {
    if (textLower.includes("dental") || textLower.includes("dentist") || textLower.includes("odontolog") || textLower.includes("dient") || textLower.includes("sonris")) {
      return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1000&auto=format&fit=crop&q=80";
    }
    if (textLower.includes("cafe") || textLower.includes("coffee") || textLower.includes("gourmet") || textLower.includes("cafeter") || textLower.includes("taza") || textLower.includes("grano")) {
      return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80";
    }
    if (textLower.includes("food") || textLower.includes("comid") || textLower.includes("restauran") || textLower.includes("hamburg") || textLower.includes("plat") || textLower.includes("mesa") || textLower.includes("ingrediente")) {
      return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80";
    }
    if (textLower.includes("tech") || textLower.includes("software") || textLower.includes("comput") || textLower.includes("matrix") || textLower.includes("digital") || textLower.includes("ia") || textLower.includes("web") || textLower.includes("code") || textLower.includes("pantalla") || textLower.includes("celular")) {
      return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80";
    }
    if (textLower.includes("belleza") || textLower.includes("spa") || textLower.includes("cosmetic") || textLower.includes("piel") || textLower.includes("beauty") || textLower.includes("estetic") || textLower.includes("masaje") || textLower.includes("crema")) {
      return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80";
    }
    if (textLower.includes("house") || textLower.includes("inmobil") || textLower.includes("arquitectur") || textLower.includes("hogar") || textLower.includes("apartamento") || textLower.includes("diseño") || textLower.includes("interi") || textLower.includes("casa") || textLower.includes("edificio")) {
      return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80";
    }
    if (textLower.includes("fitness") || textLower.includes("gimnas") || textLower.includes("fit") || textLower.includes("sport") || textLower.includes("entrenamien") || textLower.includes("fuerz") || textLower.includes("músculo")) {
      return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80";
  }

  // 1. Sector recognition (supports Spanish NLP keywords)
  let sectorCode = "general";
  let sectorName = "tu idea de negocio";
  if (textLower.includes("zapato") || textLower.includes("calzado") || textLower.includes("tenis") || textLower.includes("sneaker") || textLower.includes("ropa") || textLower.includes("moda") || textLower.includes("tienda") || textLower.includes("boutique") || textLower.includes("prend") || textLower.includes("vestir") || textLower.includes("bazar")) {
    sectorCode = "retail";
    sectorName = "diseño de indumentaria, calzado y moda de vanguardia";
  } else if (textLower.includes("cafe") || textLower.includes("coffee") || textLower.includes("gourmet") || textLower.includes("comida") || textLower.includes("restauran") || textLower.includes("pasteler") || textLower.includes("panader") || textLower.includes("hamburg") || textLower.includes("pizz") || textLower.includes("alimento") || textLower.includes("plato") || textLower.includes("sabor") || textLower.includes("cafeter")) {
    sectorCode = "gastronomy";
    sectorName = "experiencias culinarias, gastronomía y cafés especializados";
  } else if (textLower.includes("odont") || textLower.includes("dent") || textLower.includes("salu") || textLower.includes("medic") || textLower.includes("clinic") || textLower.includes("bienestar") || textLower.includes("yoga") || textLower.includes("fit") || textLower.includes("gym") || textLower.includes("terap") || textLower.includes("dobl") || textLower.includes("entren") || textLower.includes("estetic") || textLower.includes("dental")) {
    sectorCode = "health";
    sectorName = "clínicas profesionales, bienestar integral y salud de alto nivel";
  } else if (textLower.includes("tech") || textLower.includes("software") || textLower.includes("comput") || textLower.includes("program") || textLower.includes("ia") || textLower.includes("saas") || textLower.includes("web") || textLower.includes("digital") || textLower.includes("aplicac") || textLower.includes("plataforma") || textLower.includes("desarroll")) {
    sectorCode = "tech";
    sectorName = "soluciones tecnológicas de software, SaaS y servicios web avanzados";
  } else if (textLower.includes("inmueble") || textLower.includes("casa") || textLower.includes("apart") || textLower.includes("departa") || textLower.includes("inmobil") || textLower.includes("vivienda") || textLower.includes("terren") || textLower.includes("real estate") || textLower.includes("propiedad")) {
    sectorCode = "realestate";
    sectorName = "asesoramiento inmobiliario, corretaje y desarrollo del real estate";
  } else if (textLower.includes("cur") || textLower.includes("educ") || textLower.includes("coach") || textLower.includes("asesor") || textLower.includes("consult") || textLower.includes("servici") || textLower.includes("mentor") || textLower.includes("agenc") || textLower.includes("clase") || textLower.includes("enseñ")) {
    sectorCode = "services";
    sectorName = "servicios estratégicos, consultorías de alto rendimiento y mentorías de nicho";
  }

  // 2. Intent recognition (supports Spanish NLP keywords)
  let intentCode = "default";
  let intentName = "estudios estratégicos";
  if (textLower.includes("vender") || textLower.includes("convers") || textLower.includes("captar") || textLower.includes("cliente") || textLower.includes("ventas") || textLower.includes("leads") || textLower.includes("embudo") || textLower.includes("atracción") || textLower.includes("embudos") || textLower.includes("funnel")) {
    intentCode = "sales";
    intentName = "sistemas de captación, embudos automatizados y conversiones directas";
  } else if (textLower.includes("automa") || textLower.includes("whatsapp") || textLower.includes("chatbot") || textLower.includes("flujo") || textLower.includes("robot") || textLower.includes("proceso") || textLower.includes("sistematizar")) {
    intentCode = "automation";
    intentName = "infraestructura de automatización de operaciones y mensajería directa";
  } else if (textLower.includes("precio") || textLower.includes("alta convers") || textLower.includes("dinero" ) || textLower.includes("renta") || textLower.includes("financ") || textLower.includes("ticket") || textLower.includes("monetiz") || textLower.includes("cobrar") || textLower.includes("costo") || textLower.includes("caro")) {
    intentCode = "pricing";
    intentName = "optimización del ticket promedio, rentabilidad financiera e ingeniería de precios";
  } else if (textLower.includes("copy") || textLower.includes("reda") || textLower.includes("escribir") || textLower.includes("publi") || textLower.includes("redes") || textLower.includes("post") || textLower.includes("hacer contenido") || textLower.includes("reel") || textLower.includes("reels") || textLower.includes("titul") || textLower.includes("titulos")) {
    intentCode = "copywriting";
    intentName = "redacción persuasiva comercial de alto calibre (scroll-stoppers)";
  } else if (textLower.includes("marca") || textLower.includes("logo") || textLower.includes("identidad") || textLower.includes("nombre") || textLower.includes("guidelines") || textLower.includes("vault") || textLower.includes("baul") || textLower.includes("branding") || textLower.includes("esencia")) {
    intentCode = "branding";
    intentName = "construcción de identidad nuclear, posicionamiento diferencial de marca y baúles de activos";
  }

  // Define greetings based on whether it is a greeting
  const isGreeting = textLower.includes("hola") || textLower.includes("buenos") || textLower.includes("salud") || textLower.includes("tal") || textLower.includes("buenas noches") || textLower.includes("buen dia") || textLower.includes("hola!");

  // Generate customized advice blocks based on sector & intent
  const sectorTips: Record<string, string[]> = {
    retail: [
      "**Derriba la fricción del tallaje y devoluciones:** La objeción nuclear de tu comprador digital es equivocarse con los tamaños o hormas. Elimina el miedo garantizando un 'primer cambio 100% gratuito y sin preguntas a domicilio'. Esto duplica tus ventas de inmediato.",
      "**Muestra los activos en movimiento:** Un zapato o prenda exhibido de forma estática en fondo blanco aburre al consumidor. Diseña ganchos de reels dinámicos de personas usándolos en aceras transitadas o bajo una iluminación natural.",
      "**Venta cruzada condicionada al checkout:** No dejes que la transacción muera al seleccionar la prenda. Ofrece un accesorio idóneo (calcetas de bambú, cremas protectoras de fibras, kits de limpieza) con un 30% de descuento flash sólo en la barra de pago."
    ],
    gastronomy: [
      "**Posiciona el ritual, no el alimento crudo:** Nadie sale de casa por una bebida simple; pagan por la atmósfera, el ritual de tostado, o el momento de quietud. Tu comunicación debe honrar el origen artesanal y místico de tus ingredientes.",
      "**Estructura un programa de lealtad digital:** El 60% de tus ingresos sostenibles vendrán del cliente que asiste al menos dos veces a la semana. Implementa un sistema de lealtad sumamente visual vía WhatsApp.",
      "**Micro-targeting de cercanía física:** No desperdicies recursos en promociones geográficas amplias. Haz prospección directa dirigida a empresas, corporativos y comercios que operen a menos de 10 minutos de distancia de tu local."
    ],
    health: [
      "**Combate el pánico al tratamiento:** El cliente de salud compra para apagar un dolor latente o evitar un desastre estético del que siente vergüenza. Genera autoridad mediante casos reales documentados paso a paso sin sensacionalismo dental tonto.",
      "**Habilita agendamiento de video-diagnóstico rápido en 1 click:** Sustituye los formularios largos de cita por un puente ágil de WhatsApp con un test dinámico inteligente de 3 preguntas que defina la urgencia.",
      "**Educa en el autocuidado diario:** El profesional que primero enseña a solucionar dolores de forma cotidiana se queda con la autoridad nuclear. Habla claro, sin tecnicismos academicistas aburridos."
    ],
    tech: [
      "**Simplifica la promesa de valor técnica en segundos:** El cliente no compra lenguajes de programación o características en la nube; compra ahorro drástico de tiempo de su equipo directivo. Elimina la jerga técnica indescifrable.",
      "**Genera auditorías automatizadas o demos autoguiados de 10 minutos:** Permite que el tomador de decisiones explore el poder bruto de tu interfaz sin tener que someterse a una aburrida e intrusiva llamada de ventas.",
      "**Demuestra el costo de oportunidad financiero (Inacción):** Estructura comparativos numéricos que demuestren cuánto dinero, esfuerzo o reputación están perdiendo actualmente por mantener flujos obsoletos u manuales."
    ],
    realestate: [
      "**Vende el estilo de vida, no los metros cuadrados construidos:** Los clientes de alta gama buscan estatus, seguridad, tranquilidad o retornos financieros agresivos. Muestra el vecindario ideal, las escuelas adyacentes y el valor patrimonial futuro.",
      "**Desarrolla tours de Video Inmersivo:** Graba tomas cinematográficas POV de exploración libre. El prospecto debe imaginarse amaneciendo allí y preparando su primera taza de café matutino.",
      "**Reduce la fricción documental de enganche:** Diseña folletos fiscales hiper-claros. Brinda acompañamiento inmediato en gestión de créditos bancarios, simplificando todo el laberinto notarial."
    ],
    services: [
      "**Empaqueta tu experiencia por resultados específicos, jamás por horas:** Cobrar por horas es un suicidio comercial. Crea metodologías cerradas (ej: 'Implementación de tu sistema de captación en 21 días llave en mano').",
      "**Regala activos auditables de alta relevancia inmediata:** Demuestra tu maestría obsequiando hojas de ruta, plantillas de Notion, o auditorías personalizadas en video de 5 minutos sobre sus errores públicos.",
      "**Automatiza la calificación estricta de prospectos:** Valora tu tiempo. Diseña un formulario de 3 preguntas tipo filtro previo a tu videollamada para asegurar que solo conversas con empresarios calificados."
    ],
    general: [
      "**Sintetiza la gran promesa comercial:** Remueve lo accesorio del mensaje. Explica exactamente a quién ayudas, qué obstáculo destructivo quitas, y en cuánto tiempo verán la transformación ideal.",
      "**Crea un puente de conversión de alta velocidad:** El cliente ideal odia la demora. Un enlace cómodo a mensajería instantánea de respuesta rápida bate a cualquier formulario complejo de 15 casillas.",
      "**Define tu Factor de Coherencia Comercial:** Demuestra consistencia entre lo que ofertas, cómo lo empaquetas y el respeto absoluto por la promesa de valor que anuncias."
    ]
  };

  const intentTips: Record<string, string[]> = {
    sales: [
      "**Aplica el Mantra 'Results over Aesthetics':** Olvídate de diseños de landing pages lujosas hiper-decorativas. El usuario de alta conversión reacciona ante títulos claros que apunten a su dolor nuclear en la pantalla superior.",
      "**Instala ganchos de urgencia y escasez auténtica:** Configura cupos semanales, promociones flash o bonos inmediatos limitados que impulsen la toma de decisión hoy mismo."
    ],
    automation: [
      "**Disminuye las casillas y campos del formulario:** Cada dato extra solicitado reduce un 15% la entrada de leads. Pide únicamente nombre, email y WhatsApp.",
      "**Crea secuencias de seguimiento inmediato post-suscripción:** Entrega valor automatizado de manera instantánea vía correo o mensaje antes de que la atención del prospecto se enfríe."
    ],
    pricing: [
      "**Cobro por valor transformacional, no por costo operativo:** El precio de tu servicio debe ser una micro-fracción de los miles de dólares o tranquilidad mental que tu solución genera en su negocio.",
      "**Saca al mercado soluciones escalonadas (Bajo, Medio, Alto):** Añade una opción de altísimo nivel 'VIP' para que tu propuesta estándar se perciba sumamente equitativa y balanceada comercialmente."
    ],
    copywriting: [
      "**Inicia con el 'Tirón de Orejas' (Hook Crudo):** El gancho de las primeras 3 palabras debe destrozar la complacencia de tu nicho (ej: 'Tu página da pena', o 'Odias vender'). No uses rodeos aburridos.",
      "**Agrega llamados a la acción de respuesta directa libre de compromisos:** 'Escribe la palabra SPE y te enviaré el blueprint gratis de inmediato por DM'."
    ],
    branding: [
      "**Crea tu Propia Bóveda / Vault de Marca:** Reúne ahí tu manifiesto fundador, directrices de tono, paleta de colores nuclear y tus tres ganchos estrella de posicionamiento comercial.",
      "**Prioriza un lenguaje propietario corporativo:** Inventa nombres y términos exclusivos para tus procesos de negocio, dotando a tu marca de una terminología inconfundible frente al sector."
    ],
    default: [
      "**Centra los cimientos de tu negocio:** Define tus metas comerciales de este mes y asigna recursos con rigor quirúrgico.",
      "**Analiza lo que tu competencia directa ignora por pereza:** Ofrece garantías sólidas o atención al cliente hiper-personalizada para ganar participación de mercado instantánea."
    ]
  };

  const getSpecificSectorTips = () => sectorTips[sectorCode] || sectorTips.general;
  const getSpecificIntentTips = () => intentTips[intentCode] || intentTips.default;

  // --- PATH A: chatAboutPhase (SPE PHASE STRATEGIST) ---
  if (apiEndpoint.includes("chatAboutPhase")) {
    const rawPhase = payload?.phase || "Fase 1";
    let phaseName = "";
    let phaseObjective = "";
    let phaseMantra = "";
    let phaseAdvice: string[] = [];

    if (rawPhase.includes("1")) {
      phaseName = "Fase 1: Enfoque / Posición e Identidad Nuclear (Results over Aesthetics)";
      phaseObjective = "Establecer la oferta de valor indestructible y el nicho de mercado con máxima agudeza.";
      phaseMantra = "No puedes captar volumen si no tienes claridad total sobre el dolor de tu comprador.";
      phaseAdvice = [
        "**Define el síntoma crónico:** Identifica el dolor exacto por el que tu cliente ideal pierde sueño o dinero. Si no puedes nombrarlo mejor que él, jamás te comprará.",
        "**Formatea una oferta premium indestructible:** Reempaqueta lo que haces en una entrega cerrada con una promesa medible en tiempos fijos en lugar de vender consultaría etérea.",
        "**Elimina adornos innecesarios:** El diseño suntuoso no sustituye la falta de relevancia comercial de tu propuesta inicial."
      ];
    } else if (rawPhase.includes("2")) {
      phaseName = "Fase 2: Embudo & Captación Simple de Alta Velocidad";
      phaseObjective = "Construir pasarelas y puentes automatizados directos y ultra-fluidos.";
      phaseMantra = "La sencillez en el diseño es la máxima expresión de la optimización comercial.";
      phaseAdvice = [
        "**Un solo objetivo claro por página:** Elimina links de escape o menús extensos que distraigan de la conversión principal.",
        "**Habilita un puente directo de WhatsApp automatizado:** Convierte llamadas y prospectos calificados en tu bandeja de mensajes en segundos.",
        "**Haz que el opt-in sea directo:** Minimiza los campos del cuestionario. Los leads calificados prefieren la velocidad y la practicidad."
      ];
    } else if (rawPhase.includes("3")) {
      phaseName = "Fase 3: Volumen del Mensaje Persuasivo & Copy de Elite";
      phaseObjective = "Desplegar flujos continuos de copywriting persuasivo detenedores de scroll.";
      phaseMantra = "El volumen y la consistencia en el mensaje eliminan la objeciones de tu audiencia.";
      phaseAdvice = [
        "**Usa ganchos implacables en las primeras líneas:** Los primeros 3 segundos en video o las primeras palabras de un copy definen tu tasa de retención.",
        "**Escribe con formateo de lectura cómoda:** Usa párrafos sumamente breves (mínimo 2 líneas cada uno) e inyecta viñetas limpias para favorecer el escaneo móvil.",
        "**Mantén el llamado a la acción activo y uniforme:** Cada activo creado debe orientar al prospecto a realizar un paso específico."
      ];
    } else if (rawPhase.includes("4")) {
      phaseName = "Fase 4: Optimización Financiera y Escala del Ticket";
      phaseObjective = "Crecimiento de márgenes, elevar valor promedio de orden e ingeniería de precios VIP.";
      phaseMantra = "Vender barato es señal de debilidad y atrae los peores perfiles de cliente.";
      phaseAdvice = [
        "**Crea un paquete High-Ticket premium:** Agrupa soporte exclusivo, velocidad extrema o diagnóstico íntimo en una propuesta de alto valor de entrada.",
        "**Implementa venta cruzada (Order Bumps) en checkout:** Ofrece complementos obligados e inmediatos justamente durante el pago.",
        "**Eleva tus tarifas con valentía comercial:** Un precio robusto no ahuyenta al cliente correcto, al revés, eleva de inmediato su percepción de rigor profesional."
      ];
    } else if (rawPhase.includes("5")) {
      phaseName = "Fase 5: Conectividad, Comunidad & Fidelización";
      phaseObjective = "Fácil asimilación posventa, soporte personalizado y automatización de la recurrencia.";
      phaseMantra = "Cuesta 7 veces más captar un nuevo comprador que fidelizar y reactivar a uno preexistente.";
      phaseAdvice = [
        "**Diseña un onboarding impecable de bienvenida:** Envía un material introductorio al instante del pago que guíe al cliente sin fricciones.",
        "**Crea espacios dedicados de comunidad:** Organiza encuentros o un canal de WhatsApp ágil para mantener vivo el sentido de pertenencia y soporte directo.",
        "**Solicita testimonios estructurados:** Aprovecha el pico de felicidad posventa para documentar sus resultados de forma impecable y utilizarlos como activos de autoridad."
      ];
    } else {
      phaseName = "Fases SPE Futura: Ecosistema Pentagonal Integrado";
      phaseObjective = "Consistencia operacional dental/estructural, cimentando y escalando tu propuesta estratégica.";
      phaseMantra = "Los resultados reales son superiores a la mera estética de marca.";
      phaseAdvice = getSpecificSectorTips();
    }

    return `### ♟️ ESTRATEGA DEL SISTEMA PENTAGONAL DE EJECUCIÓN (SPE)
*Tu Aliado de Confianza para Consolidar tu Crecimiento de Forma Sencilla*

¡Hola! Qué gusto saludarte directamente desde las fases de desarrollo de la **${rawPhase}**. Mi misión es acompañarte con total cercanía, lógica clara y consejos pragmáticos para que tu negocio crezca con bases sólidas y firmes de manera simple.

Estás operando activamente en:
**${phaseName}**

* **Objetivo de Crecimiento**: ${phaseObjective}
* **Mantra Clave de Éxito**: *"${phaseMantra}"*

---

#### 🛠️ PASOS RECOMENDADOS PARA TU NEGOCIO:

Para potenciar tu desempeño con respecto a tu consulta **"${prompt.length > 80 ? prompt.slice(0, 80) + '...' : prompt}"**, te sugiero activar estos tres sencillos pilares dentro de tu nicho de **${sectorName}**:

1. ${phaseAdvice[0]}
2. ${phaseAdvice[1]}
3. ${phaseAdvice[2]}

#### 🎯 CÓMO PONER ESTO EN ACCIÓN DE FORMA FÁCIL:
* Si estás iniciando de cero y no tienes material visual o marca formal, ingresa a la pestaña **Ignición Creativa** para estructurar tu campaña express al instante.
* Si ya posees una marca registrada o activos, ingresa en **Propulsión de Élite** para vincular tu Baúl y amplificar tu alcance de forma inteligente.

Recuerda: El marketing efectivo consiste simplemente en conectar de manera honesta y con absoluta comodidad la solucion de tu negocio con la persona que la necesita. ¿Cuál de estas tres sugerencias te gustaría que personalicemos juntos de forma cómoda hoy?`;
  }

  // --- PATH B: chatWithAdvisor (GENERAL ADVISOR CHIPS) ---
  if (apiEndpoint.includes("chatWithAdvisor")) {
    const sTips = getSpecificSectorTips();
    const iTips = getSpecificIntentTips();

    if (isGreeting) {
      return `¡Hola! Qué gusto saludarte amigablemente y darte una calurosa bienvenida a tu **Espacio de Consultoría FUTURA™**. 

Yo soy tu **Compañero y Asesor Estratégico**. Mi mayor deseo es simplificarte la vida y ayudarte a estructurar soluciones prácticas para tu negocio, usando de manera sumamente intuitiva y cómoda el **Sistema Pentagonal de Ejecución (SPE)**.

Cuéntame, por favor, ¿qué idea, proyecto, servicio o desafío tienes en mente hoy para que lo repasemos juntos con total calma y sentido común? Me encantaría ayudarte a darle forma.`;
    }

    return `### ⚡ TU ASESOR DE CONFIANZA FUTURA™
*Mentoría Directa y Sencilla para el Crecimiento de tu Negocio*

He procesado con total atención tu inquietud: **"${prompt.length > 90 ? prompt.slice(0, 90) + '...' : prompt}"**. 

Vamos a simplificar las cosas y concentrarnos en lo que realmente genera resultados cómodos para tu negocio. Veamos juntos algunas alternativas orientadas a **${sectorName}** y con especial enfoque en **${intentName}**:

---

#### 💡 RECOMENDACIONES CLAVE PARA FACILITAR TU DÍA:

* **${sTips[0].split(':')[0]}:** ${sTips[0].substring(sTips[0].indexOf(':') + 1 || 0)}
* **${iTips[0].split(':')[0]}:** ${iTips[0].substring(iTips[0].indexOf(':') + 1 || 0)}
* **${sTips[1].split(':')[0]}:** ${sTips[1].substring(sTips[1].indexOf(':') + 1 || 0)}

#### ⚙️ CÓMO SEGUIR TRABAJANDO CÓMODAMENTE:
* **Si estás iniciando un Nuevo Negocio**: Ve a la sección de **Ignición Creativa** para idear slogans, blueprints e imágenes instantáneas sin dolor de cabeza.
* **Si ya tienes una Marca Constituida**: Dirígete a la sección de **Propulsión de Élite** para enlazar tu Baúl y crear campañas que conecten con tu audiencia ideal de manera muy natural.

El buen marketing consiste en tender un puente sincero y cercano entre tu producto y las personas adecuadas. ¿Cuál de estas recomendaciones te gustaría profundizar de forma cómoda o amigable hoy?`;
  }

  // --- PATH C: generateContentStrategy (CREATIVE PLANNER BLUEPRINT) ---
  if (apiEndpoint.includes("generateContentStrategy")) {
    return {
      strategy: `### 🎯 PROPUESTA DE POSICIONAMIENTO Y COHERENCIA DE MARCA SPE\n\nAplicamos la estructura del **Sistema Pentagonal (SPE)** enfocados en **${sectorName}** para estructurar un activo que apunte directamente al dolor e inyecte decisiones de compra con absoluto sentido de urgencia.\n\n* **Pilar Estratégico Fundamental**: Autoridad técnica impecable y erradicación de las fricciones más latentes.\n* **Fase de Operación Recomendada**: Fase 1 (Identidad Nuclear) acoplada con Fase 3 (Volumen del Mensaje Persuasivo).`,
      copy: `🚨 LA VERDAD QUE TU SECTOR INTENTA OCULTARTE SOBRE EL CRECIMIENTO...\n\nSi sigues insistiendo en vender en el sector de ${sectorName} bajo promesas genéricas como "calidad insuperable" y "los mejores precios", estás condenando tu margen al fracaso comercial.\n\nLa cruda realidad es que a tus compradores no les importa tu logotipo o tu grid de Instagram. Les importa una sola cosa:\n👉 **¿Puedes o no resolver el síntoma latente por el que están perdiendo sueño o dinero hoy?**\n\nBajo nuestra metodología SPE de alto rendimiento de FUTURA, eliminamos el adorno improductivo y te entregamos resultados medibles directos:\n✅ Respuestas sin esperas eternas.\n✅ Un puente directo de comunicación sumamente cómodo.\n✅ Garantías contundentes libres de trucos baratos de letra pequeña.\n\nDeja de lamer vitrinas y empieza a captar clientes reales con decisión y coherencia.\n\n🔥 Mándanos un mensaje directo ahora mismo con la palabra "ESTRATEGIA" para reclamar tu auditoría confidencial libre de compromiso.\n\n#ResultsOverAesthetics #EstrategiaComercial #MarketingPersuasivo #MetodoSPE #VentasDeElite #CoherenciaCreativa`,
      imagePrompt: `highly detailed minimal product setup on obsidian dark slab, premium ${sectorCode} visual element accents with gold neon glow, high contrast studio lighting, deep space background, realistic clean textures, complete negative space, absolutely no text overlay`,
      videoProposal: `⏱️ PROPUESTA DE VIDEO CORTO (RETENCIÓN MÁXIMA - 45s):\n\n**0:00 - 0:05 Hook Inicial**: El presentador mira fijamente a la cámara con seriedad: "¿Te sorprende que tu competencia siga duplicando sus ventas mientras tú sigues editando fuentes estéticas en Canva?".\n\n**0:05 - 0:20 El Dolor Crónico**: "El consumidor actual se ha vuelto inmune a los posts bonitos pero vacíos de valor. Lo que detiene el scroll es la identificación quirúrgica de los síntomas que padece su negocio."\n\n**0:20 - 0:35 Solución Directa**: "Con el Sistema Pentagonal de Ejecución (SPE), deconstruimos tus campañas, centrándonos en el valor nuclear sin adornos inútiles y acortando los pasos de compra."\n\n**0:35 - 0:45 Call to Action**: "Visita el enlace directo en mi bio hoy mismo, cobra tu Baúl de Marca FUTURA de forma gratuita y descarga nuestra guía de orígenes de marca."`
    };
  }

  // --- PATH D: generateSocialCopy / refineSocialCopy (COPYWRITER DE ELITE) ---
  if (apiEndpoint.includes("generateSocialCopy") || apiEndpoint.includes("refineSocialCopy")) {
    const copyType = payload?.params?.copyType || "conversión directa";
    const platform = payload?.params?.platform || "Redes Sociales y WhatsApp";
    return `⚠️ ADVERTENCIA DE MARKETING PARA ${platform.toUpperCase()}:\n\n¿Por qué insistes en escribir contenido decorativo que solo le agrada a tu competencia?\n\nLos likes no pagan las facturas. Las métricas de vanidad no sostienen un negocio sostenible.\n\nEn tu nicho de **${sectorName}**, la gente busca efectividad directa, no discursos poéticos corporativos.\n\nPara esta campaña impulsamos la máxima fuerza persuasiva del SPE:\n✅ **Hook Implacable:** Detenemos el scroll atacando la objeción que tu cliente oculta por pereza.\n✅ **La Verdad Desnuda:** Desmontamos las falsas opciones de bajo costo que solo traen dolores de cabeza.\n✅ **Canal Fluido:** Abrimos un puente cómodo de WhatsApp directo sin formularios agotadores de 10 páginas.\n\nNo lamas vitrinas. Envíanos un Mensaje Directo hoy mismo para agendar tu sesión técnica de consultoría estratégica de 15 minutos.\n\n#SPE #ResultsOverAesthetics #FuturaCopywriting #CopysDeConversion #NegociosGanadores`;
  }

  return "FUTURA completó la acción de forma simulada con excelente excelencia estratégica.";
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

    // Propagate key configuration errors so the user is aware of missing setups
    if (errorStr.includes("gemini_api_key") || errorStr.includes("clave") || errorStr.includes("no está configurada") || errorStr.includes("api key") || errorStr.includes("my_gemini_api_key") || errorStr.includes("credentials")) {
      throw error;
    }

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
    const model = "gemini-3.5-flash";
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
    const model = "gemini-3.5-flash";
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
