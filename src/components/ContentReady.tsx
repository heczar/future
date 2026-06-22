/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Play, 
  Eye, 
  ArrowRight, 
  Inbox, 
  BookOpen,
  Sliders,
  Image as ImageIcon,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Plus,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { chatWithAdvisor, generateCreativeImage } from '../services/geminiService';
import { assertHasQuota, trackActionConsumption } from '../services/consumptionTracker';
import { cn } from '../lib/utils';

interface CampaignPreset {
  id: string;
  title: string;
  angle: string;
  promptSeed: string;
}

const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'pain_point',
    title: '💥 Demoler Dolor Crónico',
    angle: 'Atacar directamente la frustración oculta del cliente y demostrar por qué las soluciones baratas fallan.',
    promptSeed: 'Crea una campaña enfocada en el dolor oculto que avergüenza a mi cliente ideal, destrozando su complacencia y mostrando el peligro de no actuar.'
  },
  {
    id: 'disruptive_launch',
    title: '🚀 Lanzamiento Disruptivo',
    angle: 'Presentar una propuesta de alta velocidad empaquetada como una oferta irresistible con cupos estrictos.',
    promptSeed: 'Crea una campaña de lanzamiento flash para una oferta irresistible premium, introduciendo escasez y urgencia legítima.'
  },
  {
    id: 'expert_authority',
    title: '👑 Autoridad de Élite',
    angle: 'Entregar un diagnóstico o lección táctica de alto valor para demostrar maestría instantánea frente al mercado.',
    promptSeed: 'Crea una campaña educativa de máxima autoridad científica, revelando un error diario tonto de mi nicho que asombra al lector.'
  }
];

interface GeneratedBrand {
  nameOptions: string[];
  sloganOptions: string[];
  mission: string;
  vision: string;
  visualDirection: string;
}

interface ContentReadyProps {
  initialProfile?: 'ignicion' | 'propulsion' | null;
  profile?: any;
}

export default function ContentReady({ initialProfile, profile }: ContentReadyProps = {}) {
  // Profiles: 'ignicion' (brand creation from scratch) vs 'propulsion' (established workflow with existing / client materials)
  const [selectedProfile, setSelectedProfile] = useState<'ignicion' | 'propulsion' | null>(initialProfile || null);

  useEffect(() => {
    if (initialProfile !== undefined && initialProfile !== null) {
      setSelectedProfile(initialProfile);
    }
  }, [initialProfile]);
  
  // Custom or selected brands list (for Propulsion profile)
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Ignition brand generator inputs
  const [ignitionNiche, setIgnitionNiche] = useState('');
  const [ignitionOffer, setIgnitionOffer] = useState('');
  const [ignitionAudience, setIgnitionAudience] = useState('');
  const [ignitionTone, setIgnitionTone] = useState('Persuasivo de Elite');

  // Ignitron Generation state
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);
  const [generatedBrandData, setGeneratedBrandData] = useState<GeneratedBrand | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState('');
  const [brandSaveStatus, setBrandSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [newlySavedBrand, setNewlySavedBrand] = useState<any | null>(null);

  // General Campaign Form States
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pain_point');
  const [customAngle, setCustomAngle] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<string>('Instagram Feed / Reels');
  
  // Propulsion: Additional Client Provided Material Toggle
  const [supplyClientMaterial, setSupplyClientMaterial] = useState(false);
  const [clientSuppliedMaterial, setClientSuppliedMaterial] = useState('');

  // Generation output states
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignOutputs, setCampaignOutputs] = useState<{
    concept: string;
    hook: string;
    copy: string;
    visualDirection: string;
    generatedVisualUrl?: string;
  } | null>(null);

  // Error logging
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Image generation states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Status and feedback
  const [copiedText, setCopiedText] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load user brands for propulsion mode
  const loadBrands = async () => {
    if (!auth.currentUser) return;
    setLoadingBrands(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('ownerId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBrands(list);
      
      // If we just saved a brand, prioritize selecting it!
      if (newlySavedBrand) {
        setSelectedBrandId(newlySavedBrand.id);
      } else if (list.length > 0 && !selectedBrandId) {
        setSelectedBrandId(list[0].id);
      }
    } catch (err) {
      console.warn("Error loading brands for workflow:", err);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [selectedProfile, newlySavedBrand]);

  const activePreset = CAMPAIGN_PRESETS.find(p => p.id === selectedPresetId);
  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  // HANDLER: GENERATE NEW BRAND DESIGNATION FROM SCRATCH (IGNICIÓN)
  const handleGenerateBrandDNA = async () => {
    if (!ignitionNiche) {
      setErrorMessage("Por favor ingresa un nicho de negocio para tu marca.");
      return;
    }

    setIsGeneratingBrand(true);
    setErrorMessage(null);
    setGeneratedBrandData(null);
    setNewlySavedBrand(null);
    setBrandSaveStatus('idle');

    // Quota validation
    if (auth.currentUser) {
      try {
        await assertHasQuota(auth.currentUser.uid, profile?.isPremium ?? false, 'consult');
      } catch (quotaErr: any) {
        setErrorMessage(quotaErr.message);
        setIsGeneratingBrand(false);
        return;
      }
    }

    const brandGenerationPrompt = `
      Cubre una estructuración e identidad de marca premium desde cero bajo la metodología de alto impacto comercial SPE.
      
      VARIABLES APORTADAS:
      - Nicho: ${ignitionNiche}
      - Oferta principal / Producto: ${ignitionOffer || "Servicios premium integrados"}
      - Público Objetivo: ${ignitionAudience || "Público General de Alto Valor"}
      - Tono Estratégico: ${ignitionTone}

      Entrega una propuesta impecable. Genera un formato con encabezados exactos en corchetes como se muestra a continuación, utilizando un español asertivo y de negocios:

      ### [NOMBRES PROPUESTOS]
      Genera exactamente 3 nombres estratégicos, atractivos y memorables, listados con números del 1 al 3, cada uno con una breve explicación de 1 frase del significado de su nombre.

      ### [SLOGANS PERSUASIVOS]
      Genera exactamente 3 slogans rompedores y ultra-persuasivos (con números del 1 al 3) orientados a erradicar objeciones.

      ### [MISIÓN CORPORATIVA SPE]
      Genera una declaración de misión corporativa implacable de 2-3 líneas centrada en demoler los dolores del mercado.

      ### [VISIÓN DE IMPACTO DIRECTO]
      Genera una visión corporativa audaz de 2-3 líneas de expansión y liderazgo.

      ### [DIRECCIÓN DE ARTE VISUAL]
      Propón un estilo visual y colores base sofisticados y modernos (ej: "Obsidian Minimalist", "Gold Brutalist", "Retro Amber Rust") y describe una breve directriz en inglés para usar como base gráfica de imágenes.
    `;

    try {
      const response = await chatWithAdvisor(brandGenerationPrompt, [], "Fase de Creación: Ignición de Marca");
      
      // Parse output sections
      let nameOptions: string[] = [];
      let sloganOptions: string[] = [];
      let mission = "Empoderar clientes mediante maestría técnica.";
      let vision = "Dominar el nicho con soluciones inigualables.";
      let visualDirection = "Brutalist Gold & Dark Slate colors, luxury, minimal";

      const parts = response.split('###');
      parts.forEach(part => {
        const lowerPart = part.toLowerCase();
        if (lowerPart.includes('[nombres propuestos]')) {
          const rawNames = part.replace(/\[nombres propuestos\]/i, '').trim();
          nameOptions = rawNames.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
        } else if (lowerPart.includes('[slogans persuasivos]')) {
          const rawSlogans = part.replace(/\[slogans persuasivos\]/i, '').trim();
          sloganOptions = rawSlogans.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
        } else if (lowerPart.includes('[misión corporativa spe]')) {
          mission = part.replace(/\[misión corporativa spe\]/i, '').trim();
        } else if (lowerPart.includes('[visión de impacto directo]')) {
          vision = part.replace(/\[visión de impacto directo\]/i, '').trim();
        } else if (lowerPart.includes('[dirección de arte visual]')) {
          visualDirection = part.replace(/\[dirección de arte visual\]/i, '').trim();
        }
      });

      // If parser failed, fallback cleanups
      if (nameOptions.length === 0) {
        nameOptions = ["1. " + (ignitionNiche.split(' ')[0] || "Futur") + " Elevate", "2. Nexus Prime", "3. " + (ignitionNiche.split(' ')[0] || "Aero") + " Labs"];
      }
      if (sloganOptions.length === 0) {
        sloganOptions = ["1. Resultados sobre Estética.", "2. Tu visión, ejecutada sin fricciones.", "3. La solución real para tu nicho."];
      }

      setGeneratedBrandData({
        nameOptions,
        sloganOptions,
        mission,
        vision,
        visualDirection
      });

      // Pre-select first name option
      const cleanFirstName = nameOptions[0].replace(/^\d+\.\s*/, '').split(':')[0].trim();
      setSelectedBrandName(cleanFirstName);

      // Charge credits
      if (auth.currentUser) {
        await trackActionConsumption(auth.currentUser.uid, profile?.isPremium ?? false, 'strategy');
      }

    } catch (err: any) {
      console.error("Error generating brand DNA:", err);
      setErrorMessage(`Ocurrió una interrupción al generar tu marca: ${err.message || err}`);
    } finally {
      setIsGeneratingBrand(false);
    }
  };

  // HANDLER: PERSIST THE BRAND IDENTITY INTENT TO SECURITY VAULT / FIREBASE
  const handleSaveGeneratedBrand = async () => {
    if (!auth.currentUser || !generatedBrandData) return;
    setBrandSaveStatus('saving');
    setErrorMessage(null);

    try {
      const formattedDescription = `Misión: ${generatedBrandData.mission}\n\nVisión: ${generatedBrandData.vision}\n\nSlogans propuestos:\n${generatedBrandData.sloganOptions.join('\n')}\n\nEstilo Visual: ${generatedBrandData.visualDirection}`;
      
      const newBrandDoc = {
        name: selectedBrandName || ignitionNiche + " Labs",
        description: formattedDescription,
        logos: [],
        trainingMaterial: [],
        driveContext: [],
        methodology: 'SPE',
        brandGuidelines: {
          tone: ignitionTone,
          suggestedArt: generatedBrandData.visualDirection,
        },
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'projects'), newBrandDoc);
      setNewlySavedBrand({ id: docRef.id, ...newBrandDoc });
      setBrandSaveStatus('saved');
    } catch (err: any) {
      console.error("Error creating brand document in Firestore:", err);
      setBrandSaveStatus('error');
      setErrorMessage(`No se pudo consolidar la marca en tu Baúl: ${err.message || err}`);
    }
  };

  // HANDLER: GENERATE EXPRESS CAMPAIGN UNDER PROPULSIÓN MODE
  const handleGenerateCampaign = async () => {
    setErrorMessage(null);
    setIsGenerating(true);
    setCampaignOutputs(null);
    setGeneratedImage(null);
    setSaveStatus('idle');

    // Quota validation
    if (auth.currentUser) {
      try {
        await assertHasQuota(auth.currentUser.uid, profile?.isPremium ?? false, 'consult');
      } catch (quotaErr: any) {
        setErrorMessage(quotaErr.message);
        setIsGenerating(false);
        return;
      }
    }

    // Compile active brand / niche context based on selected profile
    let brandContextText = "";
    if (selectedProfile === 'propulsion') {
      if (selectedBrand) {
        brandContextText = `MARCA CONECTADA: ${selectedBrand.name}. DESCRIPCIÓN Y ADN DE MARCA: ${selectedBrand.description}. TONO PROPUESTO: ${selectedBrand.brandGuidelines?.tone || 'Profesional / SPE'}.`;
      } else {
        brandContextText = "Marca general consolidada en crecimiento de mercado.";
      }

      // Add custom supplied client materials!
      if (supplyClientMaterial && clientSuppliedMaterial.trim()) {
        brandContextText += `\n\n⚠️ INGREDIENTE CRÍTICO: MATERIAL ADICIONAL SUMINISTRADO POR EL CLIENTE PARA EL DESARROLLO (Asimilar y deconstruir este material para generar copies ultra-ajustados): "${clientSuppliedMaterial.trim()}"`;
      }
    } else {
      // Direct Ignition
      brandContextText = `NUEVA IDEA DE NEGOCIO (INICIANDO DESDE CERO): Niche comercial: ${ignitionNiche || 'General'}. Propuesta u Oferta clave: ${ignitionOffer || 'Servicio de alta calidad'}. No posee logotipos o material visual preexistente.`;
    }

    const angleText = customAngle.trim() || activePreset?.promptSeed || "";
    
    // Formulate a robust surgical instruction for Gemini in Spanish, completely avoiding WhatsApp reference
    const dynamicPrompt = `
      Crea un "BUNKER DE CAMPAÑA Y MATERIAL" detallado basado en la metodología SPE (Resultados sobre Estética).
      Evita en absoluto proponer canales de WhatsApp, enlaces a WhatsApp, o automatización de mensajería de WhatsApp para esta campaña. Concéntrate rigurosamente en contenido para canales de alcance premium como: ${targetPlatform}.
      
      CONSULTA E INSTRUMENTACIÓN:
      - Ángulo de Enfoque Táctico: ${angleText}
      - Plataforma Objetivo: ${targetPlatform}
      
      Escribe la respuesta estructurada en secciones con títulos limpios en Markdown:
      
      ### [CONCEPTO CENTRAL]
      Especifica la dirección conceptual y la psicología del scroll-stopping aplicada a este ángulo en 2-3 líneas de lógica comercial pura.
      
      ### [EL GANCHO SUPREMO]
      Escribe 3 variantes de títulos de choque (hooks) ultra-disruptivos adaptados a ${targetPlatform}. El hook debe destrozar la complacencia del lector inmediatamente.
      
      ### [CUERPO DEL COPY PERSUASIVO]
      Escribe un copy robusto, impecable y de altísimo calibre. Utiliza párrafos cortos (máximo 2-3 líneas) e inyecta viñetas de autoridad técnica claras. Debe terminar con un llamado a la acción enfocado a recibir un mensaje directo (DM) o agendar una consulta en la biografía. (RECUERDA: CERO WHATSAPP).
      
      ### [DIRECCIÓN DE ARTE VISUAL]
      Genera una instrucción de prompt de imagen hiper-detallista en inglés para enviarle al motor de generación de imágenes de la IA de FUTURA. El prompt debe evocar un aspecto sofisticado, oscuro, de alto contraste (estilo Brutalist u Obsidian Slate) o acorde al nicho, indicando texturas realistas y completa ausencia de texto decorativo.
    `;

    try {
      const responseText = await chatWithAdvisor(
        dynamicPrompt, 
        [], 
        `WORKFLOW DE CAMPAÑA CON ACELERADOR DE COMPORTAMIENTOS: ${brandContextText}`
      );

      // Parse the response into clean slots
      let concept = "Desarrollo estratégico simplificado.";
      let hook = "¡Atención!";
      let copy = responseText;
      let visualDirection = " obsidian slate style, minimalist design, high contrast, gold accents, no text";

      const parts = responseText.split('###');
      parts.forEach(part => {
        const lowerPart = part.toLowerCase();
        if (lowerPart.includes('[concepto central]')) {
          concept = part.replace(/\[concepto central\]/i, '').trim();
        } else if (lowerPart.includes('[el gancho supremo]')) {
          hook = part.replace(/\[el gancho supremo\]/i, '').trim();
        } else if (lowerPart.includes('[cuerpo del copy persuasivo]')) {
          copy = part.replace(/\[cuerpo del copy persuasivo\]/i, '').trim();
        } else if (lowerPart.includes('[dirección de arte visual]')) {
          visualDirection = part.replace(/\[dirección de arte visual\]/i, '').trim();
        }
      });

      setCampaignOutputs({
        concept,
        hook,
        copy,
        visualDirection
      });

      // Charge credits
      if (auth.currentUser) {
        await trackActionConsumption(auth.currentUser.uid, profile?.isPremium ?? false, 'consult');
      }

    } catch (err: any) {
      console.error("Error generating campaign workflow:", err);
      setErrorMessage(`Error de compilación estratégico de campaña: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // HANDLER: GENERATE VISUAL ASSET USING FUTURA'S IMAGE ENGINE
  const handleGenerateVisualAsset = async () => {
    if (!campaignOutputs) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setErrorMessage(null);

    // Image quota validation
    if (auth.currentUser) {
      try {
        await assertHasQuota(auth.currentUser.uid, profile?.isPremium ?? false, 'image');
      } catch (quotaErr: any) {
        setErrorMessage(quotaErr.message);
        setIsGeneratingImage(false);
        return;
      }
    }

    try {
      let rawPrompt = campaignOutputs.visualDirection;
      rawPrompt = rawPrompt.replace(/```/g, '').replace(/prompt:/gi, '').trim();
      if (rawPrompt.length > 300) {
        rawPrompt = rawPrompt.slice(0, 300);
      }

      const imgUrl = await generateCreativeImage(
        rawPrompt || "obsidian minimalist graphic style, premium tech design, gold accents, high contrast noir render",
        "1:1",
        ["Brutalist Tech"]
      );

      setGeneratedImage(imgUrl);

      // Charge credits
      if (auth.currentUser) {
        await trackActionConsumption(auth.currentUser.uid, profile?.isPremium ?? false, 'image');
      }
    } catch (err: any) {
      console.error("Error generating image asset:", err);
      setErrorMessage(`Interrupción de render de imagen publicitaria: ${err.message || err}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ACTION: COPY COPYWRITING TO CLIPBOARD
  const handleCopyText = () => {
    if (!campaignOutputs) return;
    const bulletText = `**Concepto:**\n${campaignOutputs.concept}\n\n**Ganchos:**\n${campaignOutputs.hook}\n\n**Copy:**\n${campaignOutputs.copy}`;
    navigator.clipboard.writeText(bulletText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block">
            CENTRO OPERATIVO EXPRESS
          </span>
          <h2 className="text-3xl font-display font-black tracking-tight text-white uppercase mt-0.5">
            Ecosistema de Campaña y <span className="text-brand-primary">ADN Estratégico</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Produce la estructura de tu marca desde cero con Ignición, o extrae los activos de tu Baúl agregando materiales crudos del cliente en Propulsión.
          </p>
        </div>

        {selectedProfile && (
          <div className="flex gap-2">
            <button 
              onClick={() => { 
                setSelectedProfile(null); 
                setCampaignOutputs(null); 
                setGeneratedBrandData(null); 
                setNewlySavedBrand(null);
                setErrorMessage(null);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] font-bold text-slate-300 rounded-xl transition duration-150 uppercase tracking-widest cursor-pointer border border-white/5"
            >
              Reiniciar Modos
            </button>
          </div>
        )}
      </div>

      {/* GLOBAL ERROR BANNER */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-mono font-bold text-red-400 block uppercase">ALERTA COMPUTACIONAL</span>
            <p className="text-xs text-slate-300 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedProfile ? (
          /* STEP 1: CHOOSE PROFILE LAUNCHPAD */
          <motion.div 
            key="profile-selector"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
          >
            {/* PROFILE 1: IGNICION */}
            <div 
              onClick={() => setSelectedProfile('ignicion')}
              className="group relative flex flex-col justify-between bg-surface-950 border border-white/10 p-8 rounded-3xl cursor-pointer hover:border-brand-primary/45 transition-all duration-300 shadow-3xl text-left overflow-hidden h-96"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500"></div>
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-6 h-6 fill-amber-500/20 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-wide">Perfil: Ignición Creativa</h3>
                  <p className="text-[10px] text-amber-500 font-mono mt-1 font-bold tracking-widest">DISEÑO Y CREACIÓN DE MARCA</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  <strong>Exclusivo para el inicio y creación de tu marca.</strong> Si no posees directrices ni identidad corporativa, este motor diseña tu ADN inicial (nombre, slogan, misión) listo para guardarlo en tu Baúl.
                </p>
                <ul className="text-[10px] text-slate-500 space-y-1.5 pt-2 font-mono">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Propuesta de nombres y slogans estratégicos</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Sintonización de visión y misión corporativa</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Guardado permanente directo a tu Baúl</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 mt-6 relative z-10 group-hover:translate-x-1.5 transition-transform font-mono uppercase tracking-widest">
                CREAR MARCA DESDE CERO (INICIO)
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* PROFILE 2: PROPULSION */}
            <div 
              onClick={() => setSelectedProfile('propulsion')}
              className="group relative flex flex-col justify-between bg-surface-950 border border-white/10 p-8 rounded-3xl cursor-pointer hover:border-brand-primary/45 transition-all duration-300 shadow-3xl text-left overflow-hidden h-96"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500"></div>
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-wide">Perfil: Propulsión de Élite</h3>
                  <p className="text-[10px] text-brand-primary font-mono mt-1 font-bold tracking-widest">CAMPAÑAS Y MATERIAL CLIENTE</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  <strong>El motor principal de campañas.</strong> Conecta tus marcas del Baúl (incluidas las de Ignición) o adjunta materiales directos del cliente para propulsar copys altamente persuasivos, conceptos visuales e imágenes de alto impacto.
                </p>
                <ul className="text-[10px] text-slate-500 space-y-1.5 pt-2 font-mono">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Creación de campañas y copies con marcas del baúl</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Asimilación de material directo suministrado</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Modelos con tu Llave Gemini / Contraseñas</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-brand-primary mt-6 relative z-10 group-hover:translate-x-1.5 transition-transform font-mono uppercase tracking-widest">
                PROPULSAR MARCA Y CREAR CAMPAÑAS
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ) : (
          /* WORKFLOW WIZARD STEPS COMPRISING BOTH ROLES */
          <motion.div 
            key="workflow-wizard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
          >
            {/* COLUMN 1: CONFIGURATION CONTROL (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* BRAND / PROFILE SUMMARY CONTAINER */}
              <div className="bg-surface-950 border border-white/5 p-5 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">MODO OPERATIVO ACTIVO</span>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5 uppercase tracking-wide">
                      {selectedProfile === 'ignicion' ? (
                        <>
                          <Flame className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                          Ignición: Crear Marca
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 text-brand-primary" />
                          Propulsión: Campañas
                        </>
                      )}
                    </h4>
                  </div>
                  <button 
                    onClick={() => { 
                      setSelectedProfile(selectedProfile === 'ignicion' ? 'propulsion' : 'ignicion');
                      setCampaignOutputs(null);
                      setGeneratedBrandData(null);
                      setNewlySavedBrand(null);
                      setErrorMessage(null);
                    }}
                    className="text-[10px] text-brand-primary hover:underline font-mono uppercase font-black tracking-wider"
                  >
                    Ir a {selectedProfile === 'ignicion' ? 'Propulsión' : 'Ignición'}
                  </button>
                </div>

                {/* DYNAMIC FORM PER PROFILE */}
                <div className="space-y-4">
                  {selectedProfile === 'ignicion' ? (
                    /* IGNICIÓN INPUT FIELDS (BRAND CREATION) */
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">1. Nicho / Giro comercial *</label>
                        <input 
                          type="text" 
                          value={ignitionNiche}
                          onChange={(e) => setIgnitionNiche(e.target.value)}
                          placeholder="Ej: Odontología Estética, Hamburguesería Gourmet, Software SaaS" 
                          className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary/45 transition"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">2. ¿Qué producto/servicio ofreces? *</label>
                        <textarea 
                          rows={2}
                          value={ignitionOffer}
                          onChange={(e) => setIgnitionOffer(e.target.value)}
                          placeholder="Ej: Ortodoncia invisible premium con diagnóstico 3D incluido o Hamburguesas de costilla ahumada con pan brioche artesanal." 
                          className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary/45 transition resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">3. Público objetivo (Target)</label>
                          <span className="text-[9px] font-mono text-slate-600">Opcional</span>
                        </div>
                        <input 
                          type="text" 
                          value={ignitionAudience}
                          onChange={(e) => setIgnitionAudience(e.target.value)}
                          placeholder="Ej: Profesionales jóvenes de 25-40 años, amantes de la comida rápida premium" 
                          className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary/45 transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">4. Tono de Voz Sugerido</label>
                        <select
                          value={ignitionTone}
                          onChange={(e) => setIgnitionTone(e.target.value)}
                          className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Persuasivo de Elite SRE">Persuasivo de Elite SRE</option>
                          <option value="Analítico Brutalista Stark">Analítico Brutalista Stark</option>
                          <option value="Seductor y Audaz">Seductor y Audaz</option>
                          <option value="Serio, Corporativo y Científico">Serio, Corporativo y de Alta Autoridad</option>
                        </select>
                      </div>

                      <button
                        onClick={handleGenerateBrandDNA}
                        disabled={isGeneratingBrand || !ignitionNiche}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/15"
                      >
                        {isGeneratingBrand ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> PRODUCIONANDO ADN CORPORATIVO...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> GENERAR ADN E IDENTIDAD DE MARCA
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* PROPULSIÓN INPUT FIELDS (VAULT CONNECT + CUSTOM MATERIAL) */
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">1. Conectar Marca Guardada del Baúl *</label>
                        {loadingBrands ? (
                          <div className="flex items-center gap-2 py-2 text-xs text-slate-500 font-mono">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" /> Cargando tu portafolio...
                          </div>
                        ) : brands.length === 0 ? (
                          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl space-y-2">
                            <p className="text-[11px] text-amber-500 leading-normal">
                              No tienes ninguna marca estructurada en tu Baúl actualmente. ¡Utiliza Ignición para crear una primero!
                            </p>
                            <button
                              onClick={() => {
                                setSelectedProfile('ignicion');
                                setErrorMessage(null);
                              }}
                              className="text-[10px] bg-amber-500 text-black font-semibold px-3 py-1.5 rounded-lg font-mono uppercase tracking-wider block"
                            >
                              Ir a Ignición Creativa
                            </button>
                          </div>
                        ) : (
                          <select 
                            value={selectedBrandId}
                            onChange={(e) => setSelectedBrandId(e.target.value)}
                            className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary/45 transition cursor-pointer"
                          >
                            {brands.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* EXTRAED ACTIVE BRAND SUMMARY */}
                      {selectedBrand && !loadingBrands && (
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-brand-primary font-bold uppercase font-mono text-[9px] tracking-wider mb-1">
                            <CheckCircle2 className="w-3 h-3 text-brand-primary" /> ADN Corporativo Conectado:
                          </div>
                          <p className="text-slate-300 line-clamp-3">"{selectedBrand.description || 'Sin descripción'}"</p>
                        </div>
                      )}

                      {/* DUAL MODE ACCELERATION: SUPPLY CLIENT SUPPLIED ASSETS */}
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-brand-primary" /> ¿Material Extra de Clientes?
                          </label>
                          <input 
                            type="checkbox" 
                            checked={supplyClientMaterial}
                            onChange={(e) => setSupplyClientMaterial(e.target.checked)}
                            className="w-4 h-4 accent-brand-primary cursor-pointer" 
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Activa esta opción si el cliente te ha suministrado briefs crudos, copies de su web, especificaciones técnicas o anotaciones desordenadas para deconstruir.
                        </p>

                        <AnimatePresence>
                          {supplyClientMaterial && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden pt-1 space-y-1.5"
                            >
                              <textarea
                                value={clientSuppliedMaterial}
                                onChange={(e) => setClientSuppliedMaterial(e.target.value)}
                                rows={3}
                                placeholder="Pega aquí los recursos, copys de referencia o briefs sueltos que te entregó el cliente para su producto..."
                                className="w-full bg-surface-900 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none placeholder:text-slate-600 focus:border-brand-primary/45 transition resize-none"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2 CONTAINER: CAMPAIGN IDEA & ANGLES (ONLY SHOWN OR RELEVANT WHEN GENERATING EXPRESS CAMPAIGN UNDER PROPULSIÓN) */}
              {selectedProfile === 'propulsion' && (
                <div className="bg-surface-950 border border-white/5 p-5 rounded-3xl shadow-xl space-y-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">PARTE OPERATIVA</span>
                    <h3 className="text-md font-display font-black text-white uppercase tracking-tight">Idea y Ángulo de Conversión</h3>
                  </div>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {CAMPAIGN_PRESETS.map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={cn(
                          "p-3.5 rounded-xl border cursor-pointer text-left transition-all duration-150",
                          selectedPresetId === preset.id 
                            ? "bg-brand-primary/5 border-brand-primary/30 shadow-md" 
                            : "bg-surface-900/60 border-white/5 hover:border-white/10"
                        )}
                      >
                        <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wide flex items-center gap-1.5">
                          {preset.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal">{preset.angle}</p>
                      </div>
                    ))}
                  </div>

                  {/* Custom Angle text input */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Refinar Foco del Ángulo</label>
                      <span className="text-[9px] font-mono text-slate-600">Opcional</span>
                    </div>
                    <textarea 
                      rows={2}
                      value={customAngle}
                      onChange={(e) => setCustomAngle(e.target.value)}
                      placeholder="Ej: Resaltar los 3 errores tontos que comete la gente al elegir pastas de dientes caras..."
                      className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary/45 transition resize-none placeholder:text-slate-600"
                    />
                  </div>

                  {/* Format selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Plataforma Formato</label>
                    <select 
                      value={targetPlatform}
                      onChange={(e) => setTargetPlatform(e.target.value)}
                      className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary/45 transition cursor-pointer"
                    >
                      <option value="Instagram Feed / Reels">Instagram (Post / Reels de Alta Retención)</option>
                      <option value="TikTok Viral Loop">TikTok (Formato Deconstruido)</option>
                      <option value="LinkedIn Expert Articles">LinkedIn Insights (Autoridad Técnica de Élite)</option>
                      <option value="X Micro-Hooks Threads">X (Hilo persuasivo y ganchos de conversión)</option>
                    </select>
                  </div>

                  {/* CTA Action button to generate campaign */}
                  <button
                    onClick={handleGenerateCampaign}
                    disabled={isGenerating || (brands.length === 0)}
                    className="w-full py-3.5 bg-brand-primary hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-brand-primary/10 mt-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        EJECUTANDO SISTEMA DE COPIA SPE...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        PROPULSAR CAMPAÑA EXPRESO
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* COLUMN 2: STRATEGIC RESULTS & MATERIAL (7 cols) */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {selectedProfile === 'ignicion' && !generatedBrandData && (
                  /* IGNICIÓN EMPTY STATE - CAPTURE AND WAIT BRAND DEFINITION */
                  <motion.div 
                    key="ignicion-waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full min-h-[420px] bg-surface-950/40 border border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 border-dashed"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                      <Flame className="w-7 h-7" />
                    </div>
                    <h3 className="text-md font-display font-black text-white uppercase tracking-tight">Incubadora de Nuevas Marcas</h3>
                    <p className="text-xs text-slate-400 text-center max-w-sm mt-1 mb-4 leading-relaxed">
                      Escribe el nicho de tu negocio y tu oferta en el panel izquierdo. El motor de Ignición de FUTURA redactará e ideará tu nombre comercial corporativo y bases de marca de alto calibre.
                    </p>
                  </motion.div>
                )}

                {selectedProfile === 'ignicion' && generatedBrandData && (
                  /* IGNICIÓN: DISPLAY THE GENERATED BRAND DEFINITION WITH SAVE MECHANISM */
                  <motion.div
                    key="ignicion-brand-display"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="bg-surface-950 border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4 relative z-10">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-amber-500/10" /> ADN de Marca Producido
                          </span>
                          <h4 className="text-md font-display font-black text-white uppercase tracking-tight mt-1">Estructura Corporativa SPE</h4>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 font-mono font-bold">
                          Ignición Activa
                        </span>
                      </div>

                      {/* Proposed Names with radio picker to select the favorite */}
                      <div className="space-y-3 relative z-10">
                        <label className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">Nombres Producidos (Selecciona tu Favorito):</label>
                        <div className="grid grid-cols-1 gap-2">
                          {generatedBrandData.nameOptions.map((nameOpt, index) => {
                            const cleanNameObj = nameOpt.replace(/^\d+\.\s*/, '').trim();
                            const isSelected = selectedBrandName === cleanNameObj.split(':')[0].trim();
                            return (
                              <div 
                                key={index}
                                onClick={() => setSelectedBrandName(cleanNameObj.split(':')[0].trim())}
                                className={cn(
                                  "p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between",
                                  isSelected 
                                    ? "bg-amber-500/10 border-amber-500/40 text-white font-bold" 
                                    : "bg-white/[0.01] border-white/5 text-slate-300 hover:border-white/10"
                                )}
                              >
                                <span>{nameOpt}</span>
                                <div className={cn(
                                  "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2",
                                  isSelected ? "border-amber-500 bg-amber-500" : "border-slate-600"
                                )}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slogans */}
                      <div className="space-y-2 mt-5 relative z-10">
                        <label className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">Slogans de Conversión Redactados:</label>
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                          {generatedBrandData.sloganOptions.map((slogan, index) => (
                            <p key={index} className="flex gap-1.5"><strong className="text-amber-500 font-mono shrink-0 select-none">↳</strong> {slogan}</p>
                          ))}
                        </div>
                      </div>

                      {/* Mission & Vision */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 relative z-10 font-sans">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider block">Misión de Combate</span>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">"{generatedBrandData.mission}"</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider block">Visión de Dominio</span>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">"{generatedBrandData.vision}"</p>
                        </div>
                      </div>

                      {/* Creative Art direction suggested */}
                      <div className="space-y-1 mt-5 bg-white/[0.01] border border-white/5 p-4 rounded-xl relative z-10">
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider block">Dirección de Arte Visual Recomendada:</span>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{generatedBrandData.visualDirection}</p>
                      </div>

                      {/* DATABASE CONSOLIDATION BUTTON */}
                      <div className="border-t border-white/5 mt-6 pt-5 relative z-10 flex flex-col sm:flex-row gap-3">
                        {brandSaveStatus === 'saved' ? (
                          <div className="w-full space-y-3">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-xs">
                              <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                              <span>¡Marca **{selectedBrandName}** guardada correctamente en tu Baúl de Seguridad!</span>
                            </div>
                            <button
                              onClick={() => {
                                // Jump directly to Propulsion campaign creation with this brand active!
                                setSelectedProfile('propulsion');
                                setErrorMessage(null);
                              }}
                              className="w-full py-3.5 bg-brand-primary text-white rounded-xl text-xs font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] transition cursor-pointer"
                            >
                              USAR ESTA MARCA EN PROPULSIÓN DE CAMPAÑA 🚀
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleSaveGeneratedBrand}
                            disabled={brandSaveStatus === 'saving'}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-mono font-black uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                          >
                            {brandSaveStatus === 'saving' ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> CONSOLIDANDO MARCA...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" /> CONSOLIDAR Y GUARDAR EN MI BAÚL DE MARCA
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedProfile === 'propulsion' && !campaignOutputs && (
                  /* PROPULSIÓN EMPTY STATE - WAITING FOR INPUTS */
                  <motion.div 
                    key="propulsion-waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full min-h-[420px] bg-surface-950/40 border border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 border-dashed"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-brand-primary/5 border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-4 animate-pulse">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <h3 className="text-md font-display font-black text-white uppercase tracking-tight">Consola de Despliegue de Campaña</h3>
                    <p className="text-xs text-slate-400 text-center max-w-sm mt-1 leading-relaxed">
                      Selecciona una marca preguardada de tu Baúl, modula opcionalmente el material crudo entregado por tu contratante o cliente, elige tu ángulo central de ataque de la izquierda y presiona "PROPULSAR CAMPAÑA EXPRESO".
                    </p>
                  </motion.div>
                )}

                {selectedProfile === 'propulsion' && campaignOutputs && (
                  /* REALS CAMPAIGNS GENERATED OUTPUTS PANELS (PROPULSIÓN) */
                  <motion.div 
                    key="propulsion-outputs"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    {/* STRATEGIC CONCEPTS DEPLOY */}
                    <div className="bg-surface-950 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4 relative">
                      {/* Concept */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                            <Sliders className="w-3.5 h-3.5 text-amber-500" /> Concepto de Choque SPE Activo
                          </span>
                          <span className="text-[10px] bg-white/5 text-slate-400 font-mono py-1 px-3 rounded-full uppercase">
                            Para: {targetPlatform}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed italic bg-white/[0.01] p-3 rounded-xl border border-white/5">
                          "{campaignOutputs.concept}"
                        </p>
                      </div>

                      {/* Hooks list */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[9px] font-mono font-bold text-brand-primary uppercase tracking-widest block">Ganchos de Parada de Scroll Producidos:</span>
                        <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl space-y-2 font-mono text-[11px] text-brand-primary">
                          {campaignOutputs.hook.split('\n').filter(h => h.trim().length > 0).map((h, i) => (
                            <p key={i} className="flex gap-2">
                              <span className="text-amber-500 shrink-0">►</span> 
                              <span className="text-slate-200 font-bold">{h.replace(/^\d+\.\s*/, '')}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Copy Core */}
                      <div className="space-y-2 pt-2 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-brand-primary" /> Cuerpo del Copy Persuasivo (Asimilador Activo)
                          </span>
                          <button
                            onClick={handleCopyText}
                            className="text-[9px] font-mono font-bold text-brand-primary flex items-center gap-1 border border-brand-primary/20 bg-brand-primary/5 px-2.5 py-1 rounded-lg uppercase tracking-wide hover:bg-brand-primary/10 transition"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> ¡Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copiar Todo
                              </>
                            )}
                          </button>
                        </div>
                        <div className="relative bg-black/40 border border-white/5 p-5 rounded-2xl max-h-[300px] overflow-y-auto font-sans leading-relaxed text-xs text-slate-300 whitespace-pre-wrap">
                          {campaignOutputs.copy}
                        </div>
                      </div>
                    </div>

                    {/* GRAPHIC ASSET GENERATION ENVELOPE */}
                    <div className="bg-surface-950 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">MÉTODO MULTICANAL VISUAL</span>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Renderizador de Propuesta Creativa</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 leading-normal">
                            FUTURA compila la dirección de arte en un prompt hiper-detallado en inglés de acuerdo al nicho y restricciones del Baúl. Presiona el botón para renderizar el activo publicitario de base.
                          </p>
                          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-1">PROMPT DE IA VISUAL COMPILADO</span>
                            <p className="text-[10px] text-slate-400 italic line-clamp-3 leading-normal font-mono">
                              "{campaignOutputs.visualDirection}"
                            </p>
                          </div>
                          
                          <button
                            onClick={handleGenerateVisualAsset}
                            disabled={isGeneratingImage}
                            className="w-full py-3 bg-emerald-500 hover:scale-[1.01] active:scale-95 text-black font-mono text-[9px] font-black uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                          >
                            {isGeneratingImage ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> RENDERIZANDO ACTIVO DE BASE...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4" /> COMPILAR ACTIVO PUBLICITARIO
                              </>
                            )}
                          </button>
                        </div>

                        {/* Rendering canvas frame */}
                        <div className="aspect-square bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                          {isGeneratingImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                              <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-emerald-400 animate-pulse">INYECTANDO PÍXELES...</span>
                            </div>
                          ) : generatedImage ? (
                            <>
                              <img 
                                src={generatedImage} 
                                alt="FUTURA Promo Asset" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <a 
                                href={generatedImage} 
                                download="FUTURA_campaign_asset.png"
                                target="_blank"
                                rel="noreferrer"
                                className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white p-2 rounded-xl text-xs flex items-center gap-1 border border-white/10 font-mono transition shadow-lg"
                              >
                                Descargar Original <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-4 text-center">
                              <ImageIcon className="w-8 h-8 text-zinc-600" />
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Canvas de Activo Publicitario</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
