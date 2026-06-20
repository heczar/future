/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Maximize, 
  Sparkles, 
  Plus, 
  ShieldCheck, 
  Layout, 
  Send, 
  Loader2, 
  Phone, 
  Instagram, 
  Video, 
  Chrome, 
  Eye, 
  Sliders, 
  AlertTriangle, 
  Crown, 
  MessageSquare, 
  Clock, 
  ArrowUpRight, 
  Lock, 
  Check,
  Play,
  Share2,
  Calendar,
  CheckCircle,
  Smartphone,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface MasterControlEpicenterProps {
  profile: any;
  onUpdateProfile: (newProfile: any) => void;
  projectsList: any[];
  setActiveTab: (tab: string) => void;
  onTriggerConsult: (text: string) => void;
  isSimplifiedMode?: boolean;
}

export default function MasterControlEpicenter({ 
  profile, 
  onUpdateProfile, 
  projectsList,
  setActiveTab,
  onTriggerConsult,
  isSimplifiedMode
}: MasterControlEpicenterProps) {
  
  // Active page / brand managed in control center
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  
  // Custom brands in case projectManager/vault doesn't have any
  const fallbackBrands = [
    {
      id: "fb-1",
      name: "Estilo & Estrategia",
      description: "Servicios creativos digitales y consultoría de diseño para marcas en crecimiento.",
      industry: "Consultoría & Diseño",
      primaryColor: "#FF3366",
      secondaryColor: "#8B5CF6",
      tone: "Profesional, Claro y Empático",
      logos: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"]
    },
    {
      id: "fb-2",
      name: "Sabores Locales",
      description: "Distribuidora de alimentos gourmet artesanales con cadena de entrega veloz.",
      industry: "Gastronomía",
      primaryColor: "#FF8C00",
      secondaryColor: "#32CD32",
      tone: "Premium, Acogedor e Instructivo",
      logos: ["https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80"]
    }
  ];

  const currentBrands = projectsList.length > 0 ? projectsList : fallbackBrands;
  const selectedBrand = currentBrands[activeBrandIndex] || currentBrands[0];

  // Subscription formats: Demo vs Pro Mode state
  const isProMode = profile.isPremium;
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [generationsCount, setGenerationsCount] = useState(() => {
    return Number(localStorage.getItem('futura_demo_generations') || '0');
  });

  // Bonding apps status state
  const [bondedApps, setBondedApps] = useState({
    instagram: true,
    tiktok: false,
    shorts: false,
    whatsappPersonal: true,
    whatsappBusiness: false
  });

  // Toggling connection handler
  const toggleBond = (appKey: keyof typeof bondedApps, name: string) => {
    // If Demo Limitada, prevent bonding more than 2 accounts!
    if (!isProMode) {
      const activeCount = Object.values(bondedApps).filter(Boolean).length;
      if (!bondedApps[appKey] && activeCount >= 2) {
        setShowLimitReachedModal(true);
        return;
      }
    }
    setBondedApps(prev => ({ ...prev, [appKey]: !prev[appKey] }));
  };

  // Recommendations Alert list
  const [recommendations, setRecommendations] = useState([
    {
      id: "rec-1",
      type: "alert",
      message: "🚨 INCONSISTENCIA DETECTADA: Tu canal de Instagram lleva 4 días sin publicaciones de valor. Se debilita tu algoritmo estético.",
      targetChannel: "Instagram",
      advice: "Genera una publicación Brutalist de alta conversión.",
      promptPreset: "Escribe una oferta para Instagram con enfoque Brutalist directo sobre auditorías gratuitas de marketing digital"
    },
    {
      id: "rec-2",
      type: "opportunity",
      message: "📈 TENDENCIA DE CONVERSIÓN: Las respuestas de clientes en WhatsApp Business aumentaron 40% después de las 6:00 PM.",
      targetChannel: "WhatsApp Business",
      advice: "Lanza un mensaje promocional de enganche rápido.",
      promptPreset: "Genera un copy promocional de enganche para WhatsApp Business ofreciendo una consulta de 15 minutos en vivo"
    },
    {
      id: "rec-3",
      type: "warning",
      message: "⚠️ AUDIOVISUAL NOTA: Los videos cortos en TikTok con narrativa concisa capturan +35% de retención frente a carruseles estáticos.",
      targetChannel: "TikTok",
      advice: "Programa un video corto MP4 educativo para hoy.",
      promptPreset: "Desarrolla el guion y copy de un video corto MP4 sobre los 3 mayores errores que cometen las marcas al elegir logo"
    }
  ]);

  // Generator State
  const [assetType, setAssetType] = useState<'jpg' | 'carrusel' | 'mp4'>('jpg');
  const [customGoal, setCustomGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [generatedResult, setGeneratedResult] = useState<{
    advice: string;
    copy: string;
    imageUrl: string;
    videoSimulation?: {
      duration: string;
      resolution: string;
      thumbnailUrl: string;
      tag: string;
    };
    carruselSlides?: {
      title: string;
      text: string;
    }[];
  } | null>(null);

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Triggering generation simulated flow
  const handleGenerateContent = () => {
    // Check Demo restrictions
    if (!isProMode && generationsCount >= 2) {
      setShowLimitReachedModal(true);
      return;
    }

    if (!customGoal.trim()) {
      alert("Por favor indica qué deseas comunicar en tu estrategia.");
      return;
    }

    setIsGenerating(true);
    setGenerationSteps([]);
    setGeneratedResult(null);

    const steps = [
      "🤖 [Asistente de FUTURA] Leyendo ADN corporativo de " + selectedBrand.name + " en el Baúl de Marca...",
      "🔍 [Asistente de FUTURA] Extrayendo tono estratégico: \"" + (selectedBrand.tone || "Profesional") + "\" e industria: \"" + (selectedBrand.industry || "General") + "\"...",
      "✨ [Núcleo FUTURA] Transfiriendo pautas al motor de magia creativa para dar vida al nuevo activo...",
      "🎨 [Núcleo FUTURA] Renderizando composición estética limpia libre de plantillas genéricas...",
      "⚡ [Vínculo Creativo] Proceso culminado exitosamente. Copy estratégico refinado y listo para auto-publicación."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setGenerationSteps(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        
        // Save generation count
        const nextCount = generationsCount + 1;
        setGenerationsCount(nextCount);
        localStorage.setItem('futura_demo_generations', nextCount.toString());

        // Yield generated content
        const generatedImages = [
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1618005198143-e52834643664?auto=format&fit=crop&w=500&q=80"
        ];
        const randomImage = generatedImages[Math.floor(Math.random() * generatedImages.length)];

        let formatText = "Imagen JPG Inteligente";
        if (assetType === 'carrusel') formatText = "Carrusel de Marca de Alto Valor";
        if (assetType === 'mp4') formatText = "Video Continuo Reel MP4";

        setGeneratedResult({
          advice: `💡 RECOMENDACIÓN DE ASISTENTE DE FUTURA: He auditado tu configuración en el Baúl de Marca. Para comunicar "${customGoal}", hemos inyectado tus atributos estratégicos a FUTURA. El contenido fue estructurado con un peso visual óptimo. Tu auto-publicación está lista en formato de conversión rápida.`,
          copy: `✨ **[CREACIÓN MÁGICA: NÚCLEO CREATIVO FUTURA]**\n\n🎯 *Objetivo:* ${customGoal}\n⚡ *Formato:* ${formatText}\n🎨 *Identidad:* ${selectedBrand.tone || "Estándar de Conversión"}\n\n¿Cansado de la estética vacía que no genera clientes? En ${selectedBrand.name} aplicamos el teorema *Results over Aesthetics*. No diseñamos para ganar premios de dibujo, estructuramos para capturar atención diaria de manera coherente. 🔥\n\n📈 Descubre cómo el Protocolo SPE de ${selectedBrand.name} revoluciona tu conversión. ¡Haz clic en el enlace adjunto o escríbenos directamente por WhatsApp para activar tu auditoría estratégica hoy! 🚀`,
          imageUrl: randomImage,
          videoSimulation: assetType === 'mp4' ? {
            duration: "0:25 segundos",
            resolution: "1080 x 1920 (9:16 Vertical HD)",
            thumbnailUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=500&q=80",
            tag: `FUTURA REEL TRANSIT`
          } : undefined,
          carruselSlides: assetType === 'carrusel' ? [
            { title: "DESLIZA ➔", text: `La realidad secreta sobre ${selectedBrand.name}` },
            { title: "EL ERROR COMÚN", text: "Tratar de venderle a todos sin un ADN de marca consolidado." },
            { title: "EL PROTOCOLO SPE", text: "Diseñamos flujos continuos que generan confianza y llamadas directas." },
            { title: "FUTURA REVELACIÓN", text: "Sincroniza tus páginas hoy. Envíanos un mensaje privado para activar la auditoría." }
          ] : undefined
        });

        setIsGenerating(false);
      }
    }, 700);
  };

  // Export generated post straightforward into calendar database
  const handleAddToCalendar = async () => {
    if (!generatedResult) return;

    // Check Demo Limitada blocks
    if (!isProMode) {
      alert("⚠️ VERSIÓN DEMO: En la versión Demo Limitada no puedes automatizar la inserción en la cola del calendario sin restricciones. ¡Pásate a la versión FUTURA PRO para habilitar sincronización total!");
      setShowLimitReachedModal(true);
      return;
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1); // tomorrow as default
    scheduledDate.setHours(12, 0, 0, 0);

    const activeChannelsList = Object.keys(bondedApps)
      .filter(k => bondedApps[k as keyof typeof bondedApps])
      .map(k => {
        if (k === 'instagram') return 'Instagram';
        if (k === 'tiktok') return 'TikTok';
        if (k === 'shorts') return 'YouTube Shorts';
        if (k === 'whatsappPersonal') return 'WhatsApp Personal';
        return 'WhatsApp Business';
      });

    const newPublication = {
      title: `${selectedBrand.name} - ${customGoal.substring(0, 25)}...`,
      copy: generatedResult.copy,
      scheduledTime: scheduledDate.toISOString().substring(0, 16), // datetime-local format compatible
      channels: activeChannelsList.length > 0 ? activeChannelsList : ["Instagram", "WhatsApp Business"],
      imageUrl: generatedResult.imageUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      if (auth.currentUser) {
        await addDoc(collection(db, 'publications'), {
          ...newPublication,
          ownerId: auth.currentUser.uid
        });
      } else {
        const saved = localStorage.getItem('futura_content_ready');
        let currentArray = [];
        if (saved) {
          try { currentArray = JSON.parse(saved); } catch (e) { currentArray = []; }
        }
        currentArray.push({ id: `pub-${Date.now()}`, ...newPublication });
        localStorage.setItem('futura_content_ready', JSON.stringify(currentArray));
      }

      setNotificationMessage("🚀 ¡ÉXITO! Tu contenido se estructuró y programó directamente en la cola del calendario de forma automática.");
      setTimeout(() => setNotificationMessage(null), 5000);
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al intentar guardar en el calendario de publicaciones.");
    }
  };

  // Toggle dynamic subscription Pro status
  const handleToggleSubscription = () => {
    const newVal = !profile.isPremium;
    const updated = { ...profile, isPremium: newVal };
    onUpdateProfile(updated);
    
    // Clear limit alert if toggling to active
    if (newVal) {
      setShowLimitReachedModal(false);
    }
  };

  return (
    <div className="space-y-12 pb-32">
      
      {/* SUCCESS TRANSIT QUEUE POPUP INLINE ALERT */}
      <AnimatePresence>
        {notificationMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-between text-green-400 font-display text-sm relative z-30"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>{notificationMessage}</span>
            </div>
            <button 
              onClick={() => setActiveTab('content')}
              className="px-4 py-1.5 bg-green-500/20 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-500/30 transition-all flex items-center gap-1.5"
            >
              VER CALENDARIO <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN MASTER PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA DEL ASISTENTE DE FUTURA (COMPLETO) - GESTIÓN OPERATIVA, BAÚL Y ALERTAS */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="glass-panel p-8 rounded-[3rem] border-white/5 bg-surface-950/45 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3 text-left animate-fade-in">
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">
                      {isSimplifiedMode ? "Tu Asistente Personal de Marca" : "Asistente de FUTURA"}
                    </h3>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase tracking-widest rounded">
                      {isSimplifiedMode ? "Tu Marca Seleccionada" : "Enlace del Baúl"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    {isSimplifiedMode ? "Tu guía de negocio fácil de entender para todas las edades" : "Auditoría de Marcas y Sincronizaciones Operativas"}
                  </p>
                </div>
              </div>
 
              {/* BRAND / PAGE SELECTOR DROPDOWN */}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 font-mono uppercase">
                  {isSimplifiedMode ? "Marca actual:" : "Enlace Activo:"}
                </span>
                <select 
                  value={activeBrandIndex} 
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (!isProMode && idx > 0) {
                      setShowLimitReachedModal(true);
                      return;
                    }
                    setActiveBrandIndex(idx);
                  }}
                  className="bg-transparent border-none text-xs text-white outline-none focus:ring-0 font-sans cursor-pointer"
                >
                  {currentBrands.map((b, idx) => (
                    <option key={b.id || idx} value={idx} className="bg-surface-950 text-white">
                      {b.name} {(idx > 0 && !isProMode) ? '🔒 (PRO)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
 
            {/* BRAND SUMMARY CARD FROM VAULT */}
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start text-left">
              {selectedBrand.logos && selectedBrand.logos[0] ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                  <img src={selectedBrand.logos[0]} className="w-full h-full object-cover" alt="Brand Logo" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold font-display text-xl uppercase">
                  {selectedBrand.name[0]}
                </div>
              )}
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">{selectedBrand.name}</h4>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-mono rounded-lg uppercase">
                    {selectedBrand.industry || "Marketing"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{selectedBrand.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-slate-500">
                  <span>
                    {isSimplifiedMode ? "ESTILO DE VOZ:" : "TONO EN BAÚL:"} <strong className="text-slate-300">{selectedBrand.tone || "Directo & Clínico"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {isSimplifiedMode ? "CONEXIÓN:" : "ESTADO:"} <strong className="text-indigo-400">{isSimplifiedMode ? "Listo para Usar" : "Sincronizado"}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
 
          {/* VIGILANCIA SPE Y NOTIFICADOR DE ALERTAS */}
          <div className="glass-panel p-8 rounded-[3rem] border-white/5 bg-surface-950/45 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {isSimplifiedMode ? "Consejos y Tareas recomendadas hoy" : "Alertas y Notificaciones de Vigilancia"}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    {isSimplifiedMode ? "Acciones sencillas sugeridas por el asistente de forma cómoda" : "Detección operativa en tus canales por el Asistente"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {isSimplifiedMode ? "TODO AL DÍA" : "AUDITORÍA ACTIVA"}
              </span>
            </div>
 
            <div className="grid grid-cols-1 gap-4 text-left">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-5 bg-black/40 border border-white/5 hover:border-indigo-500/20 transition-all rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{rec.message}</p>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase">
                      <span>CANAL: {rec.targetChannel}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-bold">DIAGNÓSTICO: {rec.advice}</span>
                    </div>
                  </div>
 
                  <button
                    onClick={() => {
                      onTriggerConsult(rec.promptPreset);
                      setActiveTab('engine');
                    }}
                    className="self-start sm:self-auto px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-mono font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    CREAR CONTENIDO <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DEL GENERADOR INSTANTÁNEO SPE - EL ELEMENTO CLAVE SOLICITADO */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-6 rounded-[2.5rem] border-white/5 bg-surface-950/40 shadow-xl space-y-6 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary animate-pulse">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Generador Express</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Motor de Conversión Rápida</p>
              </div>
            </div>

            {/* ASSET TYPE TAB SELECTOR */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Formato Creativo</label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {(['jpg', 'carrusel', 'mp4'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (!isProMode && t !== 'jpg') {
                        setShowLimitReachedModal(true);
                      } else {
                        setAssetType(t);
                      }
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      assetType === t 
                        ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM OBJ / PROMPT FIELD */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Objetivo de Comunicación</label>
              <textarea
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Indica qué deseas vender o comunicar..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 placeholder-slate-600 focus:outline-none focus:border-brand-primary/40 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* SUBMIT COMPONENT BUTTON */}
            <button
              onClick={handleGenerateContent}
              disabled={isGenerating}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-40 text-white font-mono font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  SINTETIZANDO ESTRATEGIA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  GENERAR PUBLICACIÓN
                </>
              )}
            </button>

            {/* STEPS PREVIEW PANEL DURING GENERATION */}
            {isGenerating && (
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono animate-pulse">Flujo de Síntesis SPE:</p>
                <div className="space-y-1.5 font-mono text-[9px] text-slate-500 leading-relaxed text-left">
                  {generationSteps.map((step, sIdx) => (
                    <motion.p 
                      key={sIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[#00df89]"
                    >
                      {step}
                    </motion.p>
                  ))}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1.5">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      className="h-full bg-[#00df89]"
                      transition={{ duration: 3 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DETAILED GENERATION RESULT */}
            {generatedResult && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 pt-3 border-t border-white/5"
              >
                {/* Visual preview according to format */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 group">
                  <img 
                    src={assetType === 'mp4' && generatedResult.videoSimulation ? generatedResult.videoSimulation.thumbnailUrl : generatedResult.imageUrl} 
                    className="w-full h-full object-cover opacity-80" 
                    alt="Generated Asset Preview"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-3">
                    <span className="px-2 py-0.5 bg-brand-primary text-white font-mono text-[8px] font-black uppercase tracking-wider rounded">
                      {assetType.toUpperCase()} LISTO
                    </span>
                  </div>
                </div>

                {/* Advice block */}
                <div className="p-3 bg-[#00df89]/10 border border-[#00df89]/20 rounded-xl">
                  <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{generatedResult.advice}</p>
                </div>

                {/* Copy block with button */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TEXTO GENERADO</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedResult.copy);
                        alert("¡Texto copiado al portapapeles exitosamente!");
                      }}
                      className="text-[8px] font-black text-brand-primary uppercase tracking-widest hover:underline cursor-pointer"
                    >
                      COPIAR COPIA
                    </button>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-xl text-[10px] text-slate-300 font-sans whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto scrollbar-thin text-left border border-white/5">
                    {generatedResult.copy}
                  </pre>
                </div>

                {/* Action Schedule Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleAddToCalendar}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-mono font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-white" />
                    AGENDAR EN CALENDARIO
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* RENDER SPE EXPLANATION BLOCK FOR THE CORE CONCEPTS */}
      <section className="mt-12 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-12 h-12 bg-brand-primary/20 rounded-[1.25rem] flex items-center justify-center border border-brand-primary/20">
            <Sliders className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Cimientos Estratégicos SPE</h2>
        </div>
        <div className="glass-panel p-10 rounded-[4rem] bg-gradient-to-b from-white/5 to-transparent border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Zap, label: "Fase 1: Eficiencia Sincro", desc: "Optimiza contenido y velocidad para publicar diariamente sin esfuerzo manual." },
              { icon: Bot, label: "Fase 2: Asesoría IA Directa", desc: "Monitorea vacíos y tendencias en tus páginas para inyectar copies de alta penetración." },
              { icon: Check, label: "Fase 3: Crecimiento y Escala", desc: "Acumula publicaciones auto-programadas y domina tu nicho con volumen sistemático." }
            ].map((step, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-primary border border-white/5">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-white">{step.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. DEMO LIMIT REACHED MODAL/POPUP */}
      <AnimatePresence>
        {showLimitReachedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowLimitReachedModal(false)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-lg glass-panel p-8 md:p-10 rounded-[3rem] border-brand-primary/40 shadow-2xl text-center space-y-6 overflow-hidden"
            >
              <div className="absolute top-6 right-6">
                <button 
                  onClick={() => setShowLimitReachedModal(false)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/10">
                <Crown className="w-8 h-8 text-brand-primary" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">FUTURA PRO / ELITE REQUERIDO</p>
                <h3 className="text-3xl font-display font-extrabold text-white tracking-tight">ALCANZASTE EL LÍMITE DEMO</h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                Has superado los recursos permitidos para la versión de prueba. En la **Demo Limitada** solo se te permiten hasta 2 simulaciones de copia, vinculación básica de 2 cuentas offline, y ver el calendario de forma estéril. 
              </p>

              <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 text-xs text-left text-slate-400 space-y-2 leading-relaxed">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary shrink-0" /> Generación ilimitada del Motor Creativo</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary shrink-0" /> Sincronización Real con todas tus páginas de marca</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary shrink-0" /> Exportación en 1 clic directa al calendario auto-publicador</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary shrink-0" /> Guardado y almacenamiento de MP4 alta fidelidad en la nube</p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleToggleSubscription();
                    setShowLimitReachedModal(false);
                  }}
                  className="w-full py-4 bg-brand-primary text-white font-mono font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-primary/20 cursor-pointer"
                >
                  ACTIVAR SUSCRIPCIÓN PRO (PROBAR TIERS)
                </button>
                <button
                  onClick={() => setShowLimitReachedModal(false)}
                  className="w-full py-3 bg-white/5 text-slate-400 font-mono text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5 cursor-pointer"
                >
                  Continuar con Demo Limitada
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
