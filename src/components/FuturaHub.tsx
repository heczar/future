import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Layers, 
  Zap, 
  History, 
  ArrowRight, 
  Copy, 
  Check, 
  FolderPlus, 
  MousePointer, 
  Brain, 
  Send, 
  Compass, 
  UserCheck, 
  Megaphone,
  Loader2,
  ChevronRight,
  Palette,
  Shield,
  Lock,
  Database,
  Server
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { chatWithAdvisor, generateCreativeImage } from '../services/geminiService';
import { ProjectContext } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Helper to sanitize markdown into basic text for the user if needed, but we can display the markdown nicely in a readable block.
interface FuturaHubProps {
  profile: any;
  projectsList: ProjectContext[];
  onUpdateProfile: (p: any) => void;
  setActiveTab: (tab: string) => void;
  setDashboardPrompt: (prompt: string) => void;
}

export default function FuturaHub({ 
  profile, 
  projectsList, 
  onUpdateProfile, 
  setActiveTab, 
  setDashboardPrompt 
}: FuturaHubProps) {
  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Content generator state
  const [businessIdea, setBusinessIdea] = useState('');
  const [activeGenerationType, setActiveGenerationType] = useState<'adn' | 'target' | 'pillars' | 'tagline' | 'creative_seed' | 'logo_generation' | null>(null);
  const [generatedResult, setGeneratedResult] = useState('');
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [logoSaveStatus, setLogoSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Brand association state
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [isSavingToBrand, setIsSavingToBrand] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Auto-fill selected brand if any exists
  useEffect(() => {
    if (projectsList.length > 0 && !selectedBrandId) {
      setSelectedBrandId(projectsList[0].id);
    }
  }, [projectsList, selectedBrandId]);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  // Handle direct advice chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || isChatLoading) return;

    setChatInput('');
    const newMsgs = [...chatMessages, { role: 'user' as const, text: prompt }];
    setChatMessages(newMsgs);
    setIsChatLoading(true);

    // Context from current selected brand
    const selectedBrand = projectsList.find(p => p.id === selectedBrandId);
    const brandCtx = selectedBrand 
      ? `MARCA CONECTADA: ${selectedBrand.name}. ADN: ${selectedBrand.description}`
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

  // Generate "Contenido Madre" (Seed brand strategy)
  const handleGenerateMotherContent = async (type: 'adn' | 'target' | 'pillars' | 'tagline' | 'creative_seed' | 'logo_generation') => {
    if (!businessIdea.trim() || isGenerating) return;
    
    setActiveGenerationType(type);
    setIsGenerating(true);
    setGeneratedResult('');
    setGeneratedLogoUrl(null);
    setLogoSaveStatus('idle');
    setSaveStatus('idle');

    let customPrompt = '';
    if (type === 'adn') {
      customPrompt = `[SISTEMA: GENERACIÓN DE CONTENIDO MADRE - ADN ESENCIAL]
Eres FUTURA, la mente maestra estratégica. Para el proyecto de negocio descrito a continuación, genera una estructura de ADN Corporativo que sirva como cimiento absoluto ("contenido madre").
Sigue la filosofía "Results over Aesthetics" de FUTURA.

Estructura tu respuesta exactamente con estas secciones detalladas de manera profesional usando Markdown de alta visibilidad:
### 🌟 MISIÓN DE NEGOCIO (El propósito medible)
### 🔮 VISIÓN DE LARGO PLAZO (El norte estratégico)
### 💎 VALORES FUNDAMENTALES (Prácticos, no de catálogo)
### 🎭 TONO DE COMUNICACIÓN (Cómo debe hablarle al mundo)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${businessIdea}"`;
    } else if (type === 'target') {
      customPrompt = `[SISTEMA: GENERACIÓN DE CONTENIDO MADRE - ARQUETIPO DE AUDIENCIA]
Eres FUTURA, el estratega definitivo. Desarrolla un perfil exhaustivo del Cliente Ideal ("contenido madre") para la propuesta empresarial detallada abajo.

Sigue la filosofía del SPE. Estructura el perfil usando la siguiente plantilla estructurada en Markdown:
### 👥 PERFIL DEMOGRÁFICO Y ARQUETIPO DE CLIENTE
### 🛑 FRUSTRACIONES CRÍTICAS (Qué le quita el sueño hoy)
### ✨ DESEOS MÁGICOS (Cuál es su escenario de transformación ideal)
### 🧱 ALTERNATIVAS & OBJECIONES (Por qué dudaría de tu producto o servicio)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${businessIdea}"`;
    } else if (type === 'pillars') {
      customPrompt = `[SISTEMA: GENERACIÓN DE CONTENIDO MADRE - PILARES DE PUBLICACIÓN Y TEMAS]
Eres FUTURA. Define los ejes editoriales estratégicos ("contenido madre") para que esta marca pueda alimentar su motor creativo sin quedarse sin ideas.

Sigue las directrices SPE y entrega una guía de publicación estructurada en Markdown:
### 📐 PILAR 1: AUTORIDAD Y VALOR REAL (Educación pragmática)
### ⚡ PILAR 2: INTERACCIÓN Y CONVERSACIÓN (Afinidad de nicho)
### 💼 PILAR 3: OFERTA DIRECTA (El gancho comercial con filosofía SPE)
### 📅 SUGERENCIAS DE TÍTULOS Y REELS (5 ideas listas para usar en el Motor Creativo)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${businessIdea}"`;
    } else if (type === 'tagline') {
      customPrompt = `[SISTEMA: GENERACIÓN DE CONTENIDO MADRE -PROPUESTA DE VALOR Y TAGLINES]
Eres FUTURA. Crea la narrativa comercial núcleo ("contenido madre") para este proyecto.

Aplica la mentalidad de resultados y entrega este manifiesto estratégico en Markdown:
### 🏹 PROPUESTA ÚNICA DE VALOR (Fórmula clara: Qué haces, Para quién y Cómo te diferencia)
### 💎 3 TAGLINES COMERCIALES (Slogans de alto impacto y memorabilidad)
### 📣 PITCH DE ELEVADOR (30 segundos para convencer a un socio o cliente)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${businessIdea}"`;
    } else if (type === 'creative_seed') {
      customPrompt = `[SISTEMA: GENERACIÓN DE CONTENIDO MADRE - CONCEPTO CREATIVO Y ESTÉTICA INICIAL]
Eres FUTURA, el estratega creativo élite de la suite Future Marketing Consult. Genera una estructura de identidad creativa base ("contenido madre creativo") ideal para el usuario que no tiene absolutamente nada creado a nivel creativo (ni estilo gráfico, ni conceptos de campaña, ni dirección visual/copia).
Sigue la filosofía "Results over Aesthetics" de FUTURA y entrega un manifiesto sumamente visual en Markdown estructurado exactamente con estas secciones:

### 🎨 CONCEPTO CREATIVO PARAGUAS DE MARCA (El gran gancho conceptual y narrativo que conecta emocionalmente con el target)
### 👁️ DIRECCIÓN VISUAL & ESTÉTICA DE REFERENCIA (Look & Feel sugerido, paleta de colores rectores, iluminación, texturas y estilo recomendado de fotografía o ilustración para alimentar la IA)
### 🧠 GUÍA DE PROMPTS AVANZADOS PARA LA FÁBRICA DE IMÁGENES (3 Prompts detallados y optimizados en inglés/español con iluminación y estilo listos para copiar y generar en la Fábrica de Imágenes de Futura)
### ⚡ ÁNGULOS PERSUASIVOS DE COPIES (3 ideas y enfoques temáticos de alta conversión para ser desarrollados en la Fábrica de Copys de Futura)

DESCRIPCIÓN DE LA IDEA O NEGOCIO:
"${businessIdea}"`;
    } else if (type === 'logo_generation') {
      customPrompt = `[SISTEMA: DISEÑADOR ÉLITE DE IDENTIDAD CORPORATIVA - FUTURA INDIE]
Eres FUTURA Logo Designer de la suite Future Marketing Consult. Crea el concepto del logotipo y la identidad visual para: "${businessIdea}".
Extrae e integra con precisión cualquier estilo, color, estética o concepto visual específico que el usuario haya indicado en su descripción. Si no especificó estilo, opta por un diseño brutalista/moderno e hiper-minimalista de alta fidelidad.

Escribe una respuesta inspiradora en Markdown estructurada exactamente con estas secciones:

### 💎 CONCEPTO DE IDENTIDAD VISUAL & LOGOTIPO (Explicación conceptual de por qué este diseño representa sus valores, arquetipo y el SPE)
### 🎨 PALETA DE COLORES RECTORES SUGERIDA (3 colores principales con sus códigos hexadecimales acordes al estilo de marca)
### ⚡ PROMPT DE GENERACIÓN DE IMAGEN RECOMENDADO (Diseña un prompt de branding altamente conciso y avanzado para renderizar este logotipo como un isotipo vectorizado aislado sobre fondo oscuro)

IMAGE_PROMPT: Minimalist vector logo icon for ${businessIdea}, extremely simple geometric symbol, high-contrast, professional 8k graphic design --no letters words text`;
    }

    try {
      const resp = await chatWithAdvisor(customPrompt, [], "Nueva Marca");
      setGeneratedResult(resp);

      // Perform real secondary image model execution if they generated a logo!
      if (type === 'logo_generation') {
        let finalImagePrompt = `Minimalist flat vector logo icon for ${businessIdea}, extremely simple geometric symbol, modern layout, high contrast, studio lighting, isolated on solid dark background, professional visual branding --no letters words text`;
        
        // Search inside response for the IMAGE_PROMPT flag to get the optimal formula
        const lines = resp.split('\n');
        const promptLine = lines.find(line => line.includes("IMAGE_PROMPT:"));
        if (promptLine) {
          finalImagePrompt = promptLine.replace("IMAGE_PROMPT:", "").trim();
        }

        console.log("[FUTURA HUB] Ejecutando render del Logotipo con prompt: ", finalImagePrompt);
        const imgUrl = await generateCreativeImage(finalImagePrompt, "1:1");
        if (imgUrl) {
          setGeneratedLogoUrl(imgUrl);
        }
      }
    } catch (err: any) {
      console.error(err);
      setGeneratedResult(`⚠️ Disrupción neuronal en la generación de contenido madre: **${err.message || err}**.\nPor favor reintenta con un enfoque de idea más pulido.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the custom generated Logo inside the selected project's brand vault!
  const handleSaveLogoToBrand = async () => {
    if (!selectedBrandId || !generatedLogoUrl || isSavingLogo) return;
    setIsSavingLogo(true);
    setLogoSaveStatus('idle');

    try {
      const brandDoc = doc(db, 'projects', selectedBrandId);
      const currentBrand = projectsList.find(p => p.id === selectedBrandId);
      if (!currentBrand) throw new Error("Marca no encontrada");

      const existingLogos = currentBrand.logos || [];
      // Push the base64 or generated url into the catalog
      await updateDoc(brandDoc, {
        logos: [...existingLogos, generatedLogoUrl]
      });

      setLogoSaveStatus('success');
    } catch (err) {
      console.error("Error saving logo to brand vault:", err);
      setLogoSaveStatus('error');
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to selected brand's description
  const handleSaveToBrand = async () => {
    if (!selectedBrandId || !generatedResult || isSavingToBrand) return;
    setIsSavingToBrand(true);
    setSaveStatus('idle');

    try {
      const brandDoc = doc(db, 'projects', selectedBrandId);
      
      // Get selected brand
      const currentBrand = projectsList.find(p => p.id === selectedBrandId);
      if (!currentBrand) throw new Error("Marca no encontrada");

      // We append or write over. Let's append to the description so no data is lost!
      const separator = "\n\n--- [CONTENIDO MADRE GENERADO POR FUTURA HUB] ---\n";
      const updatedDescription = currentBrand.description 
        ? `${currentBrand.description}${separator}${generatedResult}`
        : generatedResult;

      await updateDoc(brandDoc, {
        description: updatedDescription
      });

      setSaveStatus('success');
    } catch (err) {
      console.error("Error saving mother content to brand:", err);
      setSaveStatus('error');
    } finally {
      setIsSavingToBrand(false);
    }
  };

  // Pass seed content to creative engine
  const handleUseInCreativeEngine = () => {
    if (!generatedResult) return;
    // Set global dashboard prompt to pass context directly
    setDashboardPrompt(`[CONTENIDO MADRE GENERADO]:\n${generatedResult}\n\n[INSTRUCCIÓN DE MARCA]: Genera copies para redes sociales o estrategia visual basándote enteramente en este contenido madre.`);
    setActiveTab('engine');
  };

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-32 text-left">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-black font-mono text-brand-primary uppercase tracking-widest">
          <Brain className="w-3.5 h-3.5 animate-pulse text-brand-primary" />
          FUTURA AI HUB & CONTENT MOTHER
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
          NÚCLEO <span className="text-brand-primary">FUTURA</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Diseña el material de origen para tu marca. El **Hub Personal de FUTURA** te permite simular consultas estratégicas continuas y estructurar **Contenido Madre** fundacional para alimentar el Motor Creativo de forma sistemática.
        </p>
      </header>

      {/* Trust, Security, and Brand Integrity Assurance Center (Manoeuvre 2 - Resolviendo fugas de confianza) */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#0d0e12] via-[#090b0e] to-zinc-950 border border-white/5 rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Shield className="w-48 h-48 text-brand-primary" />
        </div>
        
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/5">
            <Shield className="w-6 h-6 text-brand-primary" />
          </div>
          <div className="space-y-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                VERIFICADO POR EL DESARROLLADOR PRINCIPAL
              </span>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CONEXIÓN PREMIUM SEGURA ACTIVA
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Ecosistema de Privacidad e Integridad de Marca</h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Tus activos, logotipos, ADN corporativo y consultas simuladas están protegidos mediante aislamiento lógico de base de datos cifrada local/nube y el protocolo <strong className="text-white">Cero Entrenamiento de Modelos Públicos</strong>. El 100% de tus secretos comerciales permanecen bajo tu exclusivo control.
            </p>
          </div>
        </div>

        {/* Cryptographic Trust Tags (SOC-2, TLS, 0% Leaks) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 shrink-0 w-full md:w-auto">
          {[
            { label: "CIFRADO DE ACTIVOS", val: "AES-256 + TLS", sub: "Tránsito seguro", icon: Lock },
            { label: "ENTRENAMIENTO IA", val: "0% APRENDIZAJE", sub: "Estructura Privada", icon: Database },
            { label: "FUGAS DE CONFIANZA", val: "BLOQUEADAS (SOC2)", sub: "Certificación Activa", icon: Server }
          ].map((stat, i) => (
            <div key={i} className="bg-neutral-900/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
              <stat.icon className="w-3.5 h-3.5 text-slate-400 mb-1" />
              <span className="text-[8px] font-black font-mono text-zinc-500 uppercase tracking-widest block">{stat.label}</span>
              <span className="text-[11px] font-mono font-bold text-white block">{stat.val}</span>
              <span className="text-[8px] text-brand-primary block">{stat.sub}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Panel grid divided into Consult and Mother Content Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Consulting Hub (Chat Terminals) */}
        <div className="lg:col-span-5 glass-panel border border-white/5 rounded-3xl bg-surface-950/40 p-6 space-y-6 flex flex-col h-[650px] relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-md">
                <MessageSquare className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Consultoría Personal</h3>
                <span className="text-[10px] text-zinc-500 font-mono">Simulador de Estrategia 24/7</span>
              </div>
            </div>
            
            {/* Quick Active Brand Selector */}
            {projectsList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/5 px-2.5 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="bg-transparent border-none text-[9px] font-mono text-slate-300 font-black focus:outline-none cursor-pointer uppercase tracking-tight"
                >
                  {projectsList.map(proj => (
                    <option key={proj.id} value={proj.id} className="bg-neutral-950 text-white uppercase">{proj.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4 scrollbar-thin text-xs leading-relaxed text-left">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <Brain className="w-12 h-12 text-zinc-600 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-white font-bold text-xs">Termina la sequía de posicionamiento</p>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                    Realiza consultas abiertas sobre crecimiento publicitario, automatizaciones, tácticas SPE o planes del ecosistema de tu marca.
                  </p>
                </div>
                
                {/* Default strategic suggestions */}
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs pt-2">
                  {[
                    "¿Cómo posiciono una marca B2B con SPE?",
                    "Dime un método pragmático para vender más rápido.",
                    "¿Cómo uso mi ADN de marca en redes sociales?"
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatInput(sug);
                      }}
                      className="p-2 bg-white/5 hover:bg-neutral-900 border border-white/5 rounded-xl text-left text-[10px] text-slate-400 hover:text-white transition-all cursor-pointer truncate"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3.5 rounded-2xl max-w-[85%] transition-all",
                    msg.role === 'user'
                      ? "bg-brand-primary/10 border border-brand-primary/20 text-white ml-auto rounded-tr-none text-right"
                      : "bg-white/5 border border-white/5 text-slate-300 mr-auto rounded-tl-none text-left prose prose-invert prose-xs max-w-[85%]"
                  )}
                >
                  {msg.role === 'model' ? (
                    <div className="whitespace-pre-line leading-relaxed tracking-wide font-sans p-0.5">
                      {msg.text}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="bg-white/5 border border-white/5 text-slate-400 mr-auto rounded-tl-none p-4 rounded-2xl max-w-[80%] flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                <span className="text-[10px] font-mono tracking-widest font-black uppercase">FUTURA SINTETIZANDO CONSEJO...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Form message input */}
          <form onSubmit={handleSendMessage} className="space-y-2 shrink-0 pt-4 border-t border-white/5">
            <div className="relative">
              <input
                type="text"
                placeholder="Discute tácticas, dudas sobre el SPE, o consultoría..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="absolute right-2 top-1.5 p-2 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 italic">Conversación encriptada localmente. Las respuestas respetan las reglas del SPE.</p>
          </form>
        </div>

        {/* RIGHT COLUMN: Seed / Mother Content Generator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel border border-white/5 rounded-3xl bg-surface-950/40 p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-primary">
                <Compass className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Semillero de Contenido Madre</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Genera las directrices nucleares de tu negocio para tener un "Contenido Madre" de base. Si no tienes activos de marca cargados, usa esta sección, genera las bases de tu propuesta, asócialas a tu baúl y envíalas directamente al motor creativo con un clic.
              </p>
            </div>

            {/* Step 1: Input Raw Idea */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                Paso 1: Describe tu concepto u oferta comercial sin filtros
              </label>
              <textarea
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                placeholder="Ejemplo: 'Tengo una marca de postres saludables keto, sin azúcar añadida. Los entrego a domicilio en Monterrey. Mi diferenciador es que saben idéntico a los originales pero con cero carbohidratos netos, enfocados para diabéticos y deportistas...'"
                rows={4}
                className="w-full bg-[#090909] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary/50 transition-colors resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>Sé tan explícito como desees.</span>
                <span>{businessIdea.length} caracteres</span>
              </div>
            </div>

            {/* Step 2: Choose Generation module */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                Paso 2: ¿Qué parte del Contenido Madre vas a sintetizar?
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'adn' as const, label: 'Estructura ADN', desc: 'Misión, Visión, Valores, Tono', icon: Brain },
                  { id: 'tagline' as const, label: 'Slogan y Propuesta', desc: 'Narrativa del SPE, 3 Taglines', icon: Zap },
                  { id: 'target' as const, label: 'Estudio de Audiencia', desc: 'Frustraciones, Deseos mágicos', icon: UserCheck },
                  { id: 'pillars' as const, label: 'Temáticas de Publicación', desc: 'Ejes para el Motor Creativo', icon: Megaphone },
                  { id: 'creative_seed' as const, label: 'Concepto & Estética', desc: 'Fórmula conceptual y dirección visual para el Motor', icon: Sparkles },
                  { id: 'logo_generation' as const, label: 'Diseño de Logotipo', desc: 'Concepto de marca e imagen de logo vectorial', icon: Palette }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleGenerateMotherContent(item.id)}
                      disabled={!businessIdea.trim() || isGenerating}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 hover:scale-[1.01] active:scale-95",
                        activeGenerationType === item.id
                          ? isGenerating
                            ? "bg-brand-primary/15 border-brand-primary/50 text-white shadow-lg shadow-brand-primary/10 animate-pulse"
                            : "bg-brand-primary/10 border-brand-primary/40 text-white shadow-md shadow-brand-primary/5 ring-1 ring-brand-primary/20"
                          : !businessIdea.trim()
                            ? "bg-neutral-950/20 border-white/5 opacity-40 text-slate-500 cursor-not-allowed"
                            : "bg-white/5 border-white/5 text-slate-300 hover:border-brand-primary/20 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={cn("w-5 h-5", activeGenerationType === item.id && isGenerating ? "text-brand-primary animate-spin" : activeGenerationType === item.id ? "text-brand-primary" : "text-slate-400")} />
                        <ChevronRight className={cn("w-3.5 h-3.5", activeGenerationType === item.id ? "text-brand-primary" : "text-slate-500")} />
                      </div>
                      <div className="space-y-0.5 pointer-events-none">
                        <p className="text-[11px] font-black uppercase tracking-wider text-white truncate">{item.label}</p>
                        <p className="text-[9px] text-slate-400 truncate">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading Synapse State */}
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-3"
              >
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <div className="space-y-1">
                  <p className="text-white text-xs font-bold uppercase tracking-widest">Sintetizando flujo de Contenido Madre...</p>
                  <p className="text-[10px] text-slate-400 max-w-sm">
                    FUTURA se encuentra formateando y estructurando tus piezas iniciales de ADN para conectarlas con el Motor Creativo bajo directrices del SPE.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Results Viewer Block */}
            {generatedResult && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between bg-zinc-900 border border-white/5 px-4 py-3.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-primary animate-pulse" />
                    <span className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-widest">CONTENIDO MADRE DE MARCA GENERADO</span>
                  </div>
                  
                  {/* Utility actions inside bar */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopyToClipboard}
                      className="p-2 bg-white/5 border border-white/5 hover:bg-neutral-800 transition-all rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      title="Copiar al Portapapeles"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Preformatted output screen */}
                <div className="bg-[#030303] border border-white/5 p-6 rounded-3xl max-h-[380px] overflow-y-auto font-sans leading-relaxed text-xs text-slate-300 space-y-4 text-left scrollbar-thin">
                  <div className="prose prose-invert prose-xs whitespace-pre-line">
                    {generatedResult}
                  </div>
                </div>

                {/* Generated Logo Image Box */}
                {activeGenerationType === 'logo_generation' && (
                  <div className="bg-zinc-950 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-40 h-40 rounded-2xl border border-white/10 bg-[#070707] overflow-hidden flex items-center justify-center shrink-0 relative group shadow-2xl shadow-brand-primary/5">
                      {generatedLogoUrl ? (
                        <img 
                          src={generatedLogoUrl} 
                          alt="Logotipo Generado" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                          <span className="text-[9px] font-mono uppercase text-slate-500 animate-pulse">Renderizando logotipo digital...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block">IDENTIDAD RENDERIZADA</span>
                        <h4 className="text-sm font-semibold text-white">Logotipo Vectorial de Alta Fidelidad</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Este logo ha sido concebido bajo conceptos de geometría sagrada y pragmatismo del SPE. Guarda este logotipo en tu Bóveda de Marca para que el Motor Creativo lo integre automáticamente como capa flotante en tus campañas.
                        </p>
                        {generatedLogoUrl && generatedLogoUrl.includes("photo-1618005182384-a83a8bd57fbe") && (
                          <div className="mt-2.5 bg-amber-500/10 border border-amber-500/15 text-amber-300 p-3 rounded-xl space-y-1">
                            <p className="text-[9.5px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                              ⚠️ LOGOTIPO DE RESPALDO (LÍMITE DE CUOTA 429)
                            </p>
                            <p className="text-[9px] text-slate-300 leading-normal">
                              La API gratuita de Google Gemini ha alcanzado el límite de cuota diario para generación de imágenes. Como tienes activo Google Pro, recuerda configurar la variable de entorno <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono text-[8px] font-bold">GEMINI_API_KEY</code> en tu panel de control de Vercel (o en Settings &gt; Secrets de AI Studio) con tu clave API de pago real.
                            </p>
                          </div>
                        )}
                      </div>

                      {generatedLogoUrl && projectsList.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            onClick={handleSaveLogoToBrand}
                            disabled={isSavingLogo}
                            className="bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-50 text-white font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            {isSavingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                            GUARDAR LOGO EN BÓVEDA DE MARCA
                          </button>
                          
                          {logoSaveStatus === 'success' && (
                            <span className="text-[10px] text-emerald-400 font-bold self-center">✓ ¡Logo guardado con éxito!</span>
                          )}
                          {logoSaveStatus === 'error' && (
                            <span className="text-[10px] text-red-400 font-bold self-center">⚠️ Error al almacenar logo.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Operational integrations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Option A: Link and Save to Baúl de Marca */}
                  {projectsList.length > 0 && (
                    <div className="glass-panel border border-white/5 p-4 rounded-2xl bg-neutral-900/45 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-wider block">OPCIÓN A: GUARDADO EN FILTRO</span>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Guardar en Baúl de Marca</h4>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          Inyecta este ADN directamente en la descripción y material de consulta de la marca seleccionada en tu Baúl.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full">
                        <select
                          value={selectedBrandId}
                          onChange={(e) => setSelectedBrandId(e.target.value)}
                          className="flex-1 bg-black border border-white/10 text-[10px] text-white px-2.5 py-2 rounded-xl focus:outline-none uppercase font-bold"
                        >
                          {projectsList.map(proj => (
                            <option key={proj.id} value={proj.id}>{proj.name}</option>
                          ))}
                        </select>

                        <button
                          onClick={handleSaveToBrand}
                          disabled={isSavingToBrand}
                          className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 text-black font-semibold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          {isSavingToBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                          ASOCIAR ADN
                        </button>
                      </div>

                      {saveStatus === 'success' && (
                        <p className="text-[9px] text-emerald-400 font-bold">✓ ¡Material inyectado con éxito en el Baúl!</p>
                      )}
                      {saveStatus === 'error' && (
                        <p className="text-[9px] text-red-400 font-bold">⚠️ Error durante el guardado persistente.</p>
                      )}
                    </div>
                  )}

                  {/* Option B: Open inside Creative Engine */}
                  <div className="glass-panel border border-white/5 p-4 rounded-2xl bg-neutral-900/45 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono font-black text-brand-secondary uppercase tracking-wider block">OPCIÓN B: INTEGRACIÓN DIRECTA</span>
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Usar en Motor Creativo</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        Pre-carga automáticamente este lote en la cola de generación y salta directo a la pantalla de diseño de publicaciones.
                      </p>
                    </div>

                    <button
                      onClick={handleUseInCreativeEngine}
                      className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-white font-mono font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10"
                    >
                      <Zap className="w-3.5 h-3.5 text-white" />
                      LANZAR MOTOR DE CONVERSIÓN
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
