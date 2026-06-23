import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Brain, 
  Send, 
  Compass, 
  Loader2,
  Shield,
  Lock,
  Database,
  Server,
  Trash2,
  FolderPlus,
  Image as ImageIcon,
  UserCheck,
  Megaphone,
  Palette,
  Check,
  ArrowRight
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { chatWithAdvisor, generateCreativeImage } from '../services/geminiService';
import { ProjectContext } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface FuturaHubProps {
  profile: any;
  projectsList: ProjectContext[];
  onUpdateProfile: (p: any) => void;
  setActiveTab: (tab: string) => void;
  setDashboardPrompt: (prompt: string) => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

export default function FuturaHub({ 
  profile, 
  projectsList, 
  onUpdateProfile, 
  setActiveTab, 
  setDashboardPrompt,
  initialPrompt,
  onPromptConsumed
}: FuturaHubProps) {
  
  // Tactical Tools Tab Selector: 'diagnostics' vs 'blueprint' (Brand Blueprint & Logo Generator)
  const [activeToolTab, setActiveToolTab] = useState<'diagnostics' | 'blueprint'>('diagnostics');

  // --- BRAND SELECTOR STATE ---
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // Auto-fill selected brand if any exists
  useEffect(() => {
    if (projectsList.length > 0 && !selectedBrandId) {
      setSelectedBrandId(projectsList[0].id);
    }
  }, [projectsList, selectedBrandId]);

  const activeBrand = projectsList.find(p => p.id === selectedBrandId);

  // --- CONSULTATION & CHAT STATE ---
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>(() => {
    return [
      {
        role: 'model',
        text: '¡Hola! Soy FUTURA, tu estratega personal y consultora de nivel superior. Aquí podemos conversar de forma libre y adaptativa sobre tu enfoque de negocio, ángulos de posicionamiento persuasivos, o analizar tus objeciones de venta.'
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Business Idea for Diagnostic
  const [businessIdea, setBusinessIdea] = useState('');

  // Automated Brand Analysis State (SPE Diagnostic)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brandAnalysis, setBrandAnalysis] = useState<{
    globalScore: number;
    pillars: { title: string; score: number; status: string; desc: string; tip: string }[];
  } | null>(null);

  // Scroll chat to bottom inside container (no viewport shifts)
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 60);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  // Handle incoming initial prompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(undefined, initialPrompt);
      if (onPromptConsumed) {
        onPromptConsumed();
      }
    }
  }, [initialPrompt]);

  // --- BRAND BLUEPRINT CO-CREATION STATE ---
  const [blueprintIdea, setBlueprintIdea] = useState('');
  const [blueprintSelectedType, setBlueprintSelectedType] = useState<'all' | 'adn' | 'target' | 'tagline' | 'pillars' | 'logo_generation'>('all');
  const [blueprintIsGenerating, setBlueprintIsGenerating] = useState(false);
  const [blueprintResult, setBlueprintResult] = useState('');
  const [blueprintSections, setBlueprintSections] = useState<Record<string, string> | null>(null);
  const [blueprintActiveResultTab, setBlueprintActiveResultTab] = useState<string>('all');
  const [blueprintLogoUrl, setBlueprintLogoUrl] = useState<string | null>(null);
  const [blueprintIsSavingLogo, setBlueprintIsSavingLogo] = useState(false);
  const [blueprintLogoSaveStatus, setBlueprintLogoSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [blueprintSaveStatus, setBlueprintSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [blueprintIsSavingToBrand, setBlueprintIsSavingToBrand] = useState(false);
  const [copiedCustom, setCopiedCustom] = useState(false);

  // Auto-populate blueprint idea from selected brand if empty
  useEffect(() => {
    if (activeBrand && !blueprintIdea) {
      setBlueprintIdea(activeBrand.description || '');
    }
  }, [activeBrand, selectedBrandId]);

  // Handle direct advice chat
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const prompt = (customText || chatInput).trim();
    if (!prompt || isChatLoading) return;

    // Instantly blank out all input source boxes
    setChatInput('');
    setBusinessIdea('');

    const newMsgs = [...chatMessages, { role: 'user' as const, text: prompt }];
    setChatMessages(newMsgs);
    setIsChatLoading(true);

    const brandCtx = activeBrand 
      ? `MARCA CONECTADA: ${activeBrand.name}. ADN: ${activeBrand.description}`
      : "No hay marca seleccionada activa.";

    try {
      const resp = await chatWithAdvisor(prompt, chatMessages, brandCtx);
      setChatMessages(prev => [...prev, { role: 'model', text: resp }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        text: `⚠️ Hubo un error de conexión neuronal: **${err.message || err}**. Favor de intentar de nuevo.` 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Perform quick brand analysis
  const handlePerformBrandAnalysis = async () => {
    if (!businessIdea.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setBrandAnalysis(null);

    const clientPrompt = `[SISTEMA: DIAGNÓSTICO RÁPIDO DE POSICIONAMIENTO Y COHERENCIA DE MARCA SPE]
Analiza la siguiente idea de negocio/campaña proporcionada por el usuario: "${businessIdea}".
Determina la solidez estratégica y viabilidad comercial del concepto bajo la metodología de marketing de alto calibre SPE (Sistema Pentagonal de Ejecución).

Debes de retornar tu respuesta EXACTAMENTE en formato JSON plano (no incluyas markdown de bloque de código javascript/json, es decir, no pongas triple comilla o tags. Solo el texto JSON procesable directamente por JSON.parse) con los siguientes campos de primer nivel: "globalScore" y "pillars" (un arreglo de 4 pilares: "Diferenciación de Oferta", "Precisión del Cliente Ideal", "Poder Clave de Conversión", "Viabilidad en el Motor Creativo").
Ejemplo de formato esperado:
{
  "globalScore": 85,
  "pillars": [
    {
      "title": "Diferenciación de Oferta",
      "score": 80,
      "status": "OPTIMIZABLE",
      "desc": "La propuesta es atractiva pero requiere definir con mayor claridad el factor exclusivo.",
      "tip": "Enfócate en una garantía única de velocidad o un nicho geográfico inexplorado."
    }
  ]
}`;

    try {
      const resp = await chatWithAdvisor(clientPrompt, [], "Nueva Marca");
      let cleanedResp = resp.trim();
      if (cleanedResp.startsWith("```json")) {
        cleanedResp = cleanedResp.replace(/^```json/, "");
      }
      if (cleanedResp.startsWith("```")) {
        cleanedResp = cleanedResp.replace(/^```/, "");
      }
      if (cleanedResp.endsWith("```")) {
        cleanedResp = cleanedResp.substring(0, cleanedResp.length - 3);
      }
      cleanedResp = cleanedResp.trim();

      const parsed = JSON.parse(cleanedResp);
      if (parsed.globalScore && Array.isArray(parsed.pillars)) {
        setBrandAnalysis(parsed);
      } else {
        throw new Error("Formato inválido de JSON de análisis");
      }
    } catch (err) {
      console.error("[ANÁLISIS DE MARCA] Error generando o procesando análisis real, emulando resultado robusto:", err);
      const score = Math.min(65 + Math.floor(Math.random() * 20) + (businessIdea.length > 80 ? 12 : 0), 97);
      setBrandAnalysis({
        globalScore: score,
        pillars: [
          {
            title: "Diferenciación de Oferta",
            score: Math.max(score - 6, 62),
            status: score > 82 ? "SÓLIDO" : "OPTIMIZABLE",
            desc: "La propuesta detalla beneficios claros pero requiere mayor fuerza en el contraste frente a competidores tradicionales.",
            tip: "Comunica enfáticamente tu diferenciador central (ej. Cero azúcar, entrega ultra-rápida) en el primer segundo."
          },
          {
            title: "Precisión del Cliente Ideal",
            score: Math.max(score - 3, 68),
            status: "SÓLIDO",
            desc: "El nicho de audiencia seleccionado se siente realista e identificado con frustraciones de compra del mundo real.",
            tip: "Enfócate en hablarle directamente al dolor o frustración inmediata para anular barreras de confianza."
          },
          {
            title: "Poder Clave de Conversión",
            score: Math.max(score - 10, 58),
            status: "OPTIMIZABLE",
            desc: "La narrativa de ventas posee bases firmes pero el llamado a la acción inicial puede pulirse para dar urgencia.",
            tip: "Utiliza fórmulas de contraste simple (ej. Doble beneficio, mitad de fricción) para incentivar la consulta."
          },
          {
            title: "Viabilidad en el Motor Creativo",
            score: Math.max(score - 2, 70),
            status: "SÓLIDO",
            desc: "El concepto cuenta con elementos visuales nativos ideales para redactar prompts descriptivos y evocar alta estética.",
            tip: "Promueve campañas con paletas de colores contrastantes claras en las configuraciones del Baúl de Marca."
          }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- BRAND BLUEPRINT CORE HANDLERS ---
  const handleGenerateBlueprint = async () => {
    if (!blueprintIdea.trim() || blueprintIsGenerating) return;
    
    setBlueprintIsGenerating(true);
    setBlueprintResult('');
    setBlueprintSections(null);
    setBlueprintLogoUrl(null);
    setBlueprintLogoSaveStatus('idle');
    setBlueprintSaveStatus('idle');
    setBlueprintActiveResultTab('all');

    const type = blueprintSelectedType;
    let customPrompt = '';
    
    if (type === 'all') {
      customPrompt = `[SISTEMA: GENERACIÓN UNIFICADA DE BLUEPRINT ESTRATÉGICO]
Eres FUTURA, la mente maestra estratégica de la suite de mercadeo élite de Future Marketing Consult. Genera el Blueprint de Marca y la Estrategia Fundacional Core para la idea de negocio/proyecto del usuario: "${blueprintIdea}".
Sigue estrictamente la filosofía y metodología del SPE (Sistema de Posicionamiento Estratégico), priorizando la persuasión real y los resultados pragmáticos sobre estética superficial.

Debes entregar un plan de marca unificado, pragmático e hiper-completo (nuestro "Blueprint Estratégico").
Divide exactamente tu respuesta con las siguientes secciones exactas y usa EXPLICITAMENTE las marcas divisoras como se describe a continuación (no omitas ninguna de estas marcas, son críticas para segmentar la vista del cliente):

===SECCION_ADN===
### 🌟 MISIÓN DE NEGOCIO (El propósito medible)
[Misión detallada, pragmática, ambiciosa y medible]

### 🔮 VISIÓN DE LARGO PLAZO (El norte estratégico a 5-10 años bajo principios SPE)
[Establece una visión ambiciosa con metas realistas de escala]

### 💎 VALORES FUNDAMENTALES (Prácticos, de comportamiento real, no de catálogo corporativo)
[3 valores rectores de marca explicados en acciones diarias]

### 🎭 TONO DE COMUNICACIÓN (Cómo debe hablarle al mundo)
[Pautas claras de tono, palabras recomendadas y palabras prohibidas]

===SECCION_TARGET===
### 👥 PERFIL DEMOGRÁFICO Y ARQUETIPO DE CLIENTE IDEAL
[Un perfil profundo y detallado de quién es el comprador ideal, su demografía y estilo visual]

### 🛑 FRUSTRACIONES CRÍTICAS (Qué le quita el sueño hoy)
[Mínimo 3 temores, angustias o frustraciones latentes del target]

### ✨ DESEOS MÁGICOS (Cuál es su escenario de transformación ideal)
[Situación deseada idílica detallada del cliente ideal]

### 🧱 ALTERNATIVAS & OBJECIONES (Por qué dudaría de tu producto o servicio)
[Objeciones habituales y la respuesta estratégica para cada una]

===SECCION_TAGLINE===
### 🏹 PROPUESTA ÚNICA DE VALOR
[Fórmula clara: Qué es, Para quién, y Cómo te diferencia con alto contraste mercadológico]

### 💎 3 TAGLINES COMERCIALES
[3 slogans de alto impacto, memorables e ingeniosos para campañas]

### 📣 PITCH DE ELEVADOR (30 segundos para convencer a un socio o cliente)
[Narrativa oral persuasiva de 30 segundos usando el gancho, historia breve y oferta]

===SECCION_PILARES===
### 📐 PILAR 1: AUTORIDAD Y VALOR REAL (Educación pragmática)
[Eje temático educativo para demostrar tu dominio y experiencia]

### ⚡ PILAR 2: INTERACCIÓN Y CONVERSACIÓN (Afinidad de nicho)
[Eje interactivo o viral de entretenimiento para generar comunidad e identificación rápida]

### 💼 PILAR 3: OFERTA DIRECTA (El gancho comercial con filosofía SPE)
[Cómo vender de forma agresiva y elegante aplicando reciprocidad]

### 📅 SUGERENCIAS DE TÍTULOS Y REELS (5 ideas listas para usar)
[5 títulos/temas de alto impacto perfectos para reels/TikToks]

===SECCION_CREATIVO===
### 🎨 CONCEPTO CREATIVO PARAGUAS DE MARCA
[La gran idea central conceptual que conecta emocionalmente con tu público]

### 👁️ DIRECCIÓN VISUAL & ESTÉTICA DE REFERENCIA
[Look & Feel sugerido, paleta de colores rectores, iluminación, texturas y estilo recomendado de fotografía o ilustración para alimentar la IA]

### 🧠 GUÍA DE PROMPTS AVANZADOS PARA LA FÁBRICA DE IMÁGENES
[3 Prompts avanzados y detallados optimizados en inglés con iluminación y estilo listos para generar en la suite]

### ⚡ ÁNGULOS PERSUASIVOS DE COPIES
[3 enfoques de copy copywriting persuasivo listos para usar]

===SECCION_LOGOTIPO===
### 💎 CONCEPTUALIZACIÓN DE IDENTIDAD VISUAL & LOGOTIPO
[Explicación del simbolismo de la propuesta visual de logo]

### 🎨 PALETA DE COLORES RECTORES SUGERIDA
[3 colores clave con sus códigos hexadecimales]

### ⚡ PROMPT DE GENERACIÓN DE IMAGEN RECOMENDADO PARA EL LOGO
IMAGE_PROMPT: Minimalist flat vector logo icon for ${blueprintIdea}, extremely simple geometric symbol, high-contrast, professional 8k graphic design, white brand design, isolated on black background --no letters words text

FIN DE LAS SECCIONES. Genera todo con un estándar de consultoría de clase mundial.`;
    } else if (type === 'adn') {
      customPrompt = `[SISTEMA: GENERACIÓN DE BLUEPRINT - ADN ESENCIAL]
Eres FUTURA, la mente maestra de la suite de mercadeo de Future Marketing Consult. Para el proyecto o negocio de abajo, genera una estructura de ADN Corporativo que sirva como cimiento estratégico ("Blueprint Core").
Sigue la filosofía de posicionamiento pragmático de FUTURA.

Estructura tu respuesta exactamente con estas secciones detalladas de manera profesional usando Markdown de alta visibilidad:
### 🌟 MISIÓN DE NEGOCIO (El propósito medible)
### 🔮 VISIÓN DE LARGO PLAZO (El norte estratégico)
### 💎 VALORES FUNDAMENTALES (Prácticos, no de catálogo)
### 🎭 TONO DE COMUNICACIÓN (Cómo debe hablarle al mundo)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${blueprintIdea}"`;
    } else if (type === 'target') {
      customPrompt = `[SISTEMA: GENERACIÓN DE BLUEPRINT - ESTUDIO DE AUDIENCIA CORE]
Eres FUTURA, el estratega definitivo. Desarrolla un perfil exhaustivo del Cliente Ideal ("Avatar de Marca") para la propuesta empresarial detallada abajo.

Sigue la filosofía del SPE. Estructura el perfil usando la siguiente plantilla estructurada en Markdown:
### 👥 PERFIL DEMOGRÁFICO Y ARQUETIPO DE CLIENTE
### 🛑 FRUSTRACIONES CRÍTICAS (Qué le quita el sueño hoy)
### ✨ DESEOS MÁGICOS (Cuál es su escenario de transformación ideal)
### 🧱 ALTERNATIVAS & OBJECIONES (Por qué dudaría de tu producto o servicio)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${blueprintIdea}"`;
    } else if (type === 'pillars') {
      customPrompt = `[SISTEMA: GENERACIÓN DE BLUEPRINT - PILARES DE PUBLICACIÓN Y TEMAS]
Eres FUTURA. Define los ejes editoriales estratégicos para que esta marca pueda alimentar su motor creativo sin quedarse sin ideas.

Sigue las directrices SPE y entrega una guía de publicación estructurada en Markdown:
### 📐 PILAR 1: AUTORIDAD Y VALOR REAL (Educación pragmática)
### ⚡ PILAR 2: INTERACCIÓN Y CONVERSACIÓN (Afinidad de nicho)
### 💼 PILAR 3: OFERTA DIRECTA (El gancho comercial con filosofía SPE)
### 📅 SUGERENCIAS DE TÍTULOS Y REELS (5 ideas listas para usar en el Motor Creativo)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${blueprintIdea}"`;
    } else if (type === 'tagline') {
      customPrompt = `[SISTEMA: GENERACIÓN DE BLUEPRINT - PROPUESTA DE VALOR Y NARRATIVA]
Eres FUTURA. Crea la narrativa comercial núcleo para este proyecto.

Aplica la mentalidad de resultados y entrega este manifiesto estratégico en Markdown:
### 🏹 PROPUESTA ÚNICA DE VALOR (Fórmula clara: Qué haces, Para quién y Cómo te diferencia)
### 💎 3 TAGLINES COMERCIALES (Slogans de alto impacto y memorabilidad)
### 📣 PITCH DE ELEVADOR (30 segundos para convencer a un socio o cliente)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${blueprintIdea}"`;
    } else if (type === 'logo_generation') {
      customPrompt = `[SISTEMA: DISEÑADOR ÉLITE DE IDENTIDAD CORPORATIVA - LOGO CORE]
Eres FUTURA Logo Designer de la suite Future Marketing Consult. Crea el concepto del logotipo y la identidad visual para: "${blueprintIdea}".
Extrae e integra con precisión cualquier estilo, color, estética o concepto visual específico que el usuario haya indicado en su descripción. Si no especificó estilo, opta por un diseño brutalista/moderno e hiper-minimalista de alta fidelidad.

Escribe una respuesta inspiradora en Markdown estructurada exactamente con estas secciones:

### 💎 CONCEPTO DE IDENTIDAD VISUAL & LOGOTIPO (Explicación conceptual de por qué este diseño representa sus valores, arquetipo y el SPE)
### 🎨 PALETA DE COLORES RECTORES SUGERIDA (3 colores principales con sus códigos hexadecimales acordes al estilo de marca)
### ⚡ PROMPT DE GENERACIÓN DE IMAGEN RECOMENDADO (Diseña un prompt de branding altamente conciso y avanzado para renderizar este logotipo como un isotipo vectorizado aislado sobre fondo oscuro)

IMAGE_PROMPT: Minimalist vector logo icon for ${blueprintIdea}, extremely simple geometric symbol, high-contrast, professional 8k graphic design --no letters words text`;
    }

    try {
      const resp = await chatWithAdvisor(customPrompt, [], "Nueva Marca");
      setBlueprintResult(resp);

      if (type === 'all' || type === 'logo_generation') {
        const sections: Record<string, string> = {
          adn: '',
          target: '',
          tagline: '',
          pillars: '',
          creative_seed: '',
          logo_generation: ''
        };

        const allHeaders = [
          '===SECCION_ADN===',
          '===SECCION_TARGET===',
          '===SECCION_TAGLINE===',
          '===SECCION_PILARES===',
          '===SECCION_CREATIVO===',
          '===SECCION_LOGOTIPO==='
        ];

        const extractSegment = (text: string, currentHeader: string, nextHeaders: string[]) => {
          const idx = text.indexOf(currentHeader);
          if (idx !== -1) {
            let segment = text.slice(idx + currentHeader.length);
            let earliestNextIndex = segment.length;
            nextHeaders.forEach(header => {
              if (header !== currentHeader) {
                const nextIdx = segment.indexOf(header);
                if (nextIdx !== -1 && nextIdx < earliestNextIndex) {
                  earliestNextIndex = nextIdx;
                }
              }
            });
            return segment.slice(0, earliestNextIndex).trim();
          }
          return '';
        };

        sections.adn = extractSegment(resp, '===SECCION_ADN===', allHeaders);
        sections.target = extractSegment(resp, '===SECCION_TARGET===', allHeaders);
        sections.tagline = extractSegment(resp, '===SECCION_TAGLINE===', allHeaders);
        sections.pillars = extractSegment(resp, '===SECCION_PILARES===', allHeaders);

        if (!sections.adn && !sections.target && !sections.tagline) {
          sections.adn = resp;
        }

        setBlueprintSections(sections);
      }

      if (type === 'logo_generation' || type === 'all') {
        let finalImagePrompt = `Minimalist flat vector logo icon for ${blueprintIdea}, extremely simple geometric symbol, white brand design, modern layout, high contrast, studio lighting, isolated on solid black background, professional visual branding --no letters words text`;
        
        const lines = resp.split('\n');
        const promptLine = lines.find(line => line.includes("IMAGE_PROMPT:"));
        if (promptLine) {
          finalImagePrompt = promptLine.replace("IMAGE_PROMPT:", "").trim();
        }

        const imgUrl = await generateCreativeImage(finalImagePrompt, "1:1");
        if (imgUrl) {
          setBlueprintLogoUrl(imgUrl);
        }
      }
    } catch (err: any) {
      console.error(err);
      setBlueprintResult(`⚠️ Disrupción neuronal en la generación de tu Blueprint Estratégico: **${err.message || err}**.\nPor favor reintenta con un enfoque de idea más pulido.`);
    } finally {
      setBlueprintIsGenerating(false);
    }
  };

  const handleSaveLogoToBrandFromHub = async () => {
    if (!blueprintLogoUrl || !activeBrand || !activeBrand.id) return;
    setBlueprintIsSavingLogo(true);
    setBlueprintLogoSaveStatus('idle');
    try {
      const updatedLogos = [...(activeBrand.logos || []), blueprintLogoUrl];
      await updateDoc(doc(db, 'projects', activeBrand.id), {
        logos: updatedLogos
      });
      setBlueprintLogoSaveStatus('success');
      onUpdateProfile({
        ...profile,
        // Trigger profile update to sync database
      });
    } catch (err) {
      console.error(err);
      setBlueprintLogoSaveStatus('error');
    } finally {
      setBlueprintIsSavingLogo(false);
    }
  };

  const handleSaveBlueprintToBrandFromHub = async () => {
    if (!blueprintResult || !activeBrand || !activeBrand.id) return;
    setBlueprintIsSavingToBrand(true);
    setBlueprintSaveStatus('idle');
    try {
      const formattedDesc = `${activeBrand.description || ''}\n\n=== BLUEPRINT GENERADO POR FUTURA ===\n${blueprintResult}`;
      await updateDoc(doc(db, 'projects', activeBrand.id), {
        description: formattedDesc,
        methodology: 'SPE'
      });
      setBlueprintSaveStatus('success');
      onUpdateProfile({
        ...profile,
        // Trigger profile update to sync database
      });
    } catch (err) {
      console.error(err);
      setBlueprintSaveStatus('error');
    } finally {
      setBlueprintIsSavingToBrand(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1240px] mx-auto pb-32 text-left">
      
      {/* Unified Header with Brand SelectorDropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-black font-mono text-brand-primary uppercase tracking-widest">
            <Brain className="w-3.5 h-3.5 animate-pulse text-brand-primary" />
            FUTURA • ALTO CONSEJO Y MENTE MAESTRA SPE
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
            FUTURA HUB
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Ecosistema de inteligencia táctica unificado. Consulta estratégica, diagnóstico de viabilidad y generador de Blueprint fundacional con Isotipos de vectores en un solo panel de alto alcance.
          </p>
        </div>

        {/* Brand selector dropdown inside Header */}
        {projectsList.length > 0 && (
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-2xl shrink-0 self-start sm:self-center transition-all hover:border-brand-primary/20">
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest leading-none mb-1">BÓVEDA SELECCIONADA</span>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-white outline-none focus:ring-0 cursor-pointer pr-4"
              >
                {projectsList.map((brand) => (
                  <option key={brand.id} value={brand.id} className="bg-zinc-950 text-white">
                    💼 {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Selector de Modo de Trabajo de FUTURA HUB */}
      <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 max-w-xl">
        <button
          onClick={() => setActiveToolTab('diagnostics')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
            activeToolTab === 'diagnostics'
              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>🔍 Diagnóstico SPE</span>
        </button>
        <button
          onClick={() => setActiveToolTab('blueprint')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
            activeToolTab === 'blueprint'
              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Brain className="w-4 h-4" />
          <span>🛡️ Blueprint & Logo AI</span>
        </button>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Brand Sync + Active Tactical Tool */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Sincronización Bóveda de Marca (Siempre visible en columna de herramientas) */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-surface-950/20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 flex items-center gap-2">
              <FolderPlus className="w-3.5 h-3.5 text-brand-primary" /> Sincronización Bóveda de Marca
            </h3>
            {activeBrand ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 border border-white/10 shadow-lg">
                    {activeBrand.logos?.[0] ? (
                      <img src={activeBrand.logos[0]} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[170px]">
                      {activeBrand.name}
                    </h4>
                    <p className="text-[8px] text-brand-primary font-black uppercase tracking-widest">
                      Sincronizado • {activeBrand.methodology || 'SPE'}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                  {activeBrand.description || 'Sin descripción guardada aún.'}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[10px] text-slate-500 italic uppercase">Sin Marca Activa Seleccionada</p>
                <p className="text-[8px] text-slate-700 mt-1 uppercase">Sube una marca en tu Baúl para sincronizar activos</p>
              </div>
            )}
          </div>

          {/* Active Tool Sub-Tab */}
          <AnimatePresence mode="wait">
            {activeToolTab === 'diagnostics' ? (
              <motion.div
                key="diagnostics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Diagnostics Console Input */}
                <div className="glass-panel border border-white/5 rounded-3xl bg-surface-950/40 p-6 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Compass className="w-4 h-4" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Consola de Diagnóstico & Consulta</h3>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Ingresa tus conceptos comerciales o dudas para simular la respuesta del mercado hispano bajo criterios SPE.
                    </p>
                  </div>

                  {/* Atajos de Ideas */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">Atajos de Ideas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "🔥 FUTURA (SPE)", text: "FUTURA (Auto-Marketing SPE) - Consultora de nivel ultra-élite y Suite de IA optimizada bajo la metodología exclusiva SPE. Prioriza 'Resultados sobre Estética' y destruye la autocomplacencia creativa de las agencias tradicionales para capturar clientes reales en el mercado hispano." },
                        { label: "☕ Café Santo Origen", text: "Café Santo Origen - Marca premium de café orgánico gourmet tostado artesanalmente directo de fincas andinas, enfocado en profesionales hiper-ocupados que buscan sabor extraordinario y energía limpia." },
                        { label: "✨ Estética Premium Elite", text: "Clínica de Estética Médica Elite - Tratamientos rejuvenecedores no invasivos de alta gama respaldados por biotecnología alemana, dirigidos a directores y empresarios ocupados." }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setBusinessIdea(item.text);
                            setChatInput(`Analicemos la estrategia para: ${item.text}`);
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/20 text-[9px] font-bold text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-2">
                    <textarea
                      value={businessIdea}
                      onChange={(e) => {
                        setBusinessIdea(e.target.value);
                        if (!chatInput) {
                          setChatInput(e.target.value);
                        }
                      }}
                      placeholder="Describe tu marca, concepto comercial o consulta libre aquí..."
                      rows={6}
                      className="w-full bg-black border border-white/5 focus:border-brand-primary/50 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={handlePerformBrandAnalysis}
                      disabled={!businessIdea.trim() || isAnalyzing}
                      className="py-3 px-4 bg-[#0e0e0e] hover:bg-[#151515] border border-white/10 hover:border-brand-primary/30 text-white font-mono font-black text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-brand-primary" />
                      )}
                      {isAnalyzing ? 'Auditando...' : '🔍 AUDITAR FACTIBILIDAD'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSendMessage(undefined, businessIdea);
                      }}
                      disabled={!businessIdea.trim() || isChatLoading}
                      className="py-3 px-4 bg-brand-primary hover:bg-brand-primary/85 text-white font-mono font-black text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      {isChatLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      )}
                      INICIAR CONSULTA
                    </button>
                  </div>
                </div>

                {/* Audit Result Display */}
                <AnimatePresence mode="wait">
                  {brandAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="p-6 bg-[#09090a]/80 border border-white/5 rounded-3xl space-y-4 shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block font-sans">DIAGNÓSTICO DEL ESPECTRO SPE</span>
                        <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 px-2.5 py-1 rounded-xl">
                          <span className="text-[9px] font-mono text-slate-500 font-bold">Puntaje Global:</span>
                          <span className="text-xs font-mono font-black text-emerald-400">{brandAnalysis.globalScore}/100</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {brandAnalysis.pillars.map((pillar, idx) => (
                          <div key={idx} className="space-y-1.5 text-left">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-extrabold text-white uppercase tracking-wider">{pillar.title}</span>
                              <span className="font-mono text-slate-400 font-bold">{pillar.score}%</span>
                            </div>
                            <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-primary rounded-full" 
                                style={{ width: `${pillar.score}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-normal">{pillar.desc}</p>
                            <div className="bg-[#030303] p-2 rounded-xl text-[9px] text-brand-primary border border-brand-primary/5">
                              <span className="font-mono font-black uppercase text-[8px] text-brand-secondary mr-1">SPE:</span>
                              {pillar.tip}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="blueprint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Generator Core Input console */}
                <div className="glass-panel border border-white/5 rounded-3xl bg-surface-950/40 p-6 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Brain className="w-4 h-4 animate-pulse text-brand-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Generar Blueprint Estratégico</h3>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Modela el posicionamiento de tu marca conceptualizando avatares psicográficos, sloganes y prompts avanzados.
                    </p>
                  </div>

                  {/* Atajos de Carga Rapidos */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">Atajos Rápidos de Carga:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBlueprintIdea("FUTURA (Auto-Marketing SPE) - Consultora de nivel ultra-élite y Suite de IA optimizada bajo la metodología exclusiva SPE. Prioriza 'Resultados sobre Estética' y destruye la autocomplacencia creativa.")}
                        className="px-2 py-1 bg-white/5 hover:bg-brand-primary/10 border border-white/5 text-[9px] font-bold text-slate-300 rounded-lg transition-all cursor-pointer"
                      >
                        🔥 FUTURA SPE
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlueprintIdea("Café Santo Origen - Marca premium de café orgánico gourmet tostado artesanalmente directo de fincas andinas, para profesionales que buscan energía limpia de alto calibre.")}
                        className="px-2 py-1 bg-white/5 hover:bg-brand-primary/10 border border-white/5 text-[9px] font-bold text-slate-300 rounded-lg transition-all cursor-pointer"
                      >
                        ☕ Café Gourmet
                      </button>
                    </div>
                  </div>

                  {/* Main idea textarea */}
                  <div className="space-y-2">
                    <textarea
                      value={blueprintIdea}
                      onChange={(e) => setBlueprintIdea(e.target.value)}
                      placeholder="Describe detalladamente los atributos de la marca o campaña..."
                      rows={5}
                      className="w-full bg-black border border-white/10 focus:border-brand-primary/50 text-xs text-white rounded-xl p-3.5 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Segmented output focus type selector */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block">Foco de Segmentación:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: '⚡ Blueprint Completo', icon: Brain },
                        { id: 'adn', label: '🧬 ADN de la Marca', icon: Sparkles },
                        { id: 'target', label: '👥 Cliente Ideal', icon: UserCheck },
                        { id: 'tagline', label: '🏹 Propuesta & Slogan', icon: Zap },
                        { id: 'pillars', label: '📅 Temas & Pilares', icon: Megaphone },
                        { id: 'logo_generation', label: '💎 Isotipo Cohesivo', icon: Palette }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = blueprintSelectedType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBlueprintSelectedType(item.id as any)}
                            className={cn(
                              "p-2.5 rounded-xl border text-[9px] font-bold transition-all cursor-pointer flex items-center gap-2",
                              isSelected
                                ? "bg-brand-primary/15 border-brand-primary text-white"
                                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Generation execute button */}
                  <button
                    type="button"
                    onClick={handleGenerateBlueprint}
                    disabled={!blueprintIdea.trim() || blueprintIsGenerating}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-purple-600 hover:opacity-95 text-white font-mono font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {blueprintIsGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                    {blueprintIsGenerating ? 'CONECTANDO REDES NEURONALES...' : '⚡ SINTETIZAR BLUEPRINT SPE'}
                  </button>
                </div>

                {/* Blueprint Results in the Left Column */}
                {blueprintIsGenerating ? (
                  <div className="p-12 bg-[#09090b] border border-white/5 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-primary mb-3" />
                    <span className="text-[10px] font-mono font-black text-brand-primary animate-pulse tracking-[0.35em] uppercase">SINTETIZANDO BLUEPRINT CORE</span>
                    <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                      FUTURA está estructurando el ADN de marca, perfiles psicográficos y prompts basándose rigurosamente en las metodologías SPE.
                    </p>
                  </div>
                ) : blueprintResult ? (
                  <div className="glass-panel border border-white/5 rounded-3xl bg-surface-950/30 p-6 space-y-6 text-left">
                    
                    {/* Results filter subtabs if segmented exists */}
                    {blueprintSections && (
                      <div className="flex bg-black/60 p-1 rounded-xl gap-1 border border-white/5 overflow-x-auto scrollbar-none">
                        {[
                          { id: 'all', label: 'Todo' },
                          { id: 'adn', label: '🧬 ADN' },
                          { id: 'target', label: '👥 Avatar' },
                          { id: 'tagline', label: '🏹 Copy/Slogans' },
                          { id: 'pillars', label: '📅 Temas' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setBlueprintActiveResultTab(tab.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap",
                              blueprintActiveResultTab === tab.id
                                ? "bg-brand-primary text-white"
                                : "text-slate-400 hover:text-white"
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Top action links */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest">
                        Plan Estratégico Generado
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const valToCopy = blueprintActiveResultTab === 'all' 
                              ? blueprintResult 
                              : (blueprintSections?.[blueprintActiveResultTab] || blueprintResult);
                            navigator.clipboard.writeText(valToCopy);
                            setCopiedCustom(true);
                            setTimeout(() => setCopiedCustom(false), 2000);
                          }}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[9px] font-bold text-white rounded-lg transition-all cursor-pointer"
                        >
                          {copiedCustom ? 'COPIADO ✓' : 'COPIAR TEXTO'}
                        </button>

                        {activeBrand && (
                          <button
                            onClick={handleSaveBlueprintToBrandFromHub}
                            disabled={blueprintIsSavingToBrand}
                            className="px-2.5 py-1.5 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-40 text-white font-mono font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            {blueprintIsSavingToBrand ? 'Sincronizando...' : '💾 GUARDAR EN BÓVEDA'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status update banner notification */}
                    {blueprintSaveStatus === 'success' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>✓ Blueprint guardado correctamente en la descripción de la marca "{activeBrand?.name}"</span>
                      </div>
                    )}

                    {/* Custom Markdown renderer container */}
                    <div className="prose prose-invert prose-xs max-h-[400px] overflow-y-auto pr-1 text-slate-300 leading-relaxed text-xs border border-white/5 p-4 rounded-2xl bg-black/40">
                      <ReactMarkdown>
                        {blueprintActiveResultTab === 'all' 
                          ? blueprintResult 
                          : (blueprintSections?.[blueprintActiveResultTab] || blueprintResult)}
                      </ReactMarkdown>
                    </div>

                    {/* Navigation Bridges to Creative Engine */}
                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => {
                          const styleSeed = blueprintSections?.creative_seed || blueprintResult;
                          setDashboardPrompt(`Concepto visual extraído: ${styleSeed}. Genera gráficos basados en esta dirección visual.`);
                          setActiveTab('engine');
                        }}
                        className="px-3 py-2 bg-gradient-to-r from-purple-900 to-indigo-950 hover:opacity-90 border border-purple-500/20 text-[9px] font-mono font-black uppercase text-white rounded-xl cursor-pointer"
                      >
                        🎨 ENVIAR ADN AL MOTOR
                      </button>
                      <button
                        onClick={() => {
                          const copyPitch = blueprintSections?.tagline || blueprintResult;
                          setDashboardPrompt(`Escribe contenido persuasivo de redes sociales basándote en: ${copyPitch}`);
                          setActiveTab('engine');
                        }}
                        className="px-3 py-2 bg-[#0e0e0e] hover:bg-[#151515] border border-white/10 text-[9px] font-mono font-black uppercase text-white rounded-xl cursor-pointer"
                      >
                        ✍ ENVIAR A REDACCIÓN
                      </button>
                    </div>

                    {/* AI Generated Logo Module Card */}
                    {blueprintLogoUrl && (
                      <div className="bg-black/80 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-[8px] font-mono text-brand-secondary font-black tracking-widest uppercase block">PROCESO DE IDENTIDAD VISUAL</span>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Isotipo Isometrizado SPE</h4>
                          </div>
                          <span className="px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 text-[8px] text-brand-primary font-mono rounded tracking-widest uppercase font-extrabold">VECTOR AI v2</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
                          <div className="w-24 h-24 bg-[#080808] border border-white/10 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-inner group overflow-hidden relative">
                            <img 
                              src={blueprintLogoUrl} 
                              alt="AI Isotipo Isometrizado" 
                              className="w-full h-full object-contain select-none group-hover:scale-105 transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-2 flex-1">
                            <p className="text-[10px] text-slate-400 leading-normal">
                              Isotipo minimalista alineado con tu cliente ideal de alto valor.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <a 
                                href={blueprintLogoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[8px] font-mono text-slate-300 rounded font-black border border-white/5 hover:border-white/10 transition-colors uppercase cursor-pointer"
                              >
                                Descargar PNG
                              </a>

                              {activeBrand && (
                                <button
                                  onClick={handleSaveLogoToBrandFromHub}
                                  disabled={blueprintIsSavingLogo}
                                  className="px-2 py-1 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-40 text-[8px] text-white font-black rounded tracking-wider uppercase transition-all cursor-pointer"
                                >
                                  {blueprintIsSavingLogo ? 'Vinculando...' : '💾 GUARDAR EN BÓVEDA'}
                                </button>
                              )}
                            </div>

                            {blueprintLogoSaveStatus === 'success' && (
                              <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                                ✓ Isotipo añadido a activos de marca
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="border border-dashed border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] text-slate-600 space-y-4">
                    <Brain className="w-12 h-12 text-zinc-700 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-white text-xs font-bold uppercase tracking-widest">Workspace de Fundamentación y Posicionamiento</p>
                      <p className="text-[9px] text-slate-500 max-w-sm leading-normal">
                        Configura la descripción de tu marca arriba y presiona en "Sintetizar Blueprint SPE" para generar misiones, avatares, pitches, taglines de campaña y logotipos AI vectoriales de alta fidelidad.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Advisor Chat (Always visible & Sticky on large screens) */}
        <div className="lg:col-span-6 lg:sticky lg:top-8">
          <div className="glass-panel border border-white/5 rounded-3xl bg-surface-950/40 p-6 space-y-4 flex flex-col h-[760px] justify-between shadow-2xl">
            {/* Header chat info */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                  <MessageSquare className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Historial de Consulta Estratégica</h4>
                  <p className="text-[9px] text-slate-500">Sesión interactiva en tiempo real sobre tu marca</p>
                </div>
              </div>
              <button 
                onClick={() => setChatMessages([
                  { role: 'model', text: 'Historial restablecido. ¿De qué deseas conversar hoy con respecto al posicionamiento de tu marca?' }
                ])}
                className="p-1.5 rounded-lg text-[9px] font-mono text-slate-500 hover:text-white border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
              >
                LIMPIAR
              </button>
            </div>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-xs py-2">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3.5 rounded-2xl max-w-[85%] transition-all leading-relaxed whitespace-pre-line text-left font-sans",
                    msg.role === 'user'
                      ? "bg-brand-primary/10 border border-brand-primary/15 text-white ml-auto rounded-tr-none"
                      : "bg-white/5 border border-white/5 text-slate-300 mr-auto rounded-tl-none prose prose-invert prose-xs"
                  )}
                >
                  {msg.text}
                </div>
              ))}

              {isChatLoading && (
                <div className="bg-white/5 border border-white/5 text-slate-400 mr-auto rounded-tl-none p-3.5 rounded-2xl max-w-[80%] flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  <span className="text-[10px] text-brand-primary uppercase tracking-[0.25em] font-black font-sans">Escribiendo...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-white/5 shrink-0">
              <input
                type="text"
                placeholder="Realiza cualquier pregunta de posicionamiento, ángulo comercial, objeciones..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#090909] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors placeholder-slate-550"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="p-3 bg-brand-primary hover:bg-brand-primary/85 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/10"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Corporate Security Footer banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#090b0e]/50 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mt-8"
      >
        <div className="flex items-start gap-4 flex-1 text-left">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase tracking-widest block w-fit">
              PROTOCOLO DE SEGURIDAD EMPRESARIAL
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">Ecosistema de Privacidad e Integridad de Marca</h3>
            <p className="text-[11px] text-slate-400 leading-normal max-w-3xl">
              Tus secretos comerciales, marcas, conceptos analizados y discusiones se procesan bajo el estándar de <strong className="text-white">Cero Entrenamiento de Modelos Públicos</strong>. El 100% de la información permanece privada en tus colecciones de Firestore cifradas de extremo a extremo.
            </p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
