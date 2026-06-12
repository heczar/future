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
}

export default function MasterControlEpicenter({ 
  profile, 
  onUpdateProfile, 
  projectsList,
  setActiveTab,
  onTriggerConsult
}: MasterControlEpicenterProps) {
  
  // Active page / brand managed in control center
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  
  // Custom brands in case projectManager/vault doesn't have any
  const fallbackBrands = [
    {
      id: "fb-1",
      name: "Gabinete de Innovación",
      description: "Servicios estratégicos digitales y consultoría de automatización avanzada.",
      industry: "Tecnología & IA",
      primaryColor: "#FF3366",
      secondaryColor: "#8B5CF6",
      tone: "Cercano, Brutalmente Directo y Profesional",
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
      
      {/* 1. HUD DE SUSCRIPCIÓN DINÁMICA: DEMO LIMITADA VS FUTURA PRO */}
      <section className="glass-panel p-6 rounded-[2.5rem] border-white/5 bg-gradient-to-r from-surface-950 to-brand-primary/5 shadow-2xl relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-[80px]" />
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isProMode ? 'bg-brand-primary/20 text-brand-primary animate-pulse' : 'bg-white/5 text-slate-500'}`}>
              {isProMode ? <Crown className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
                  {isProMode ? "MODO DE POTENCIA: FUTURA PRO / ELITE" : "MODO DE USO: VERSIÓN DEMO LIMITADA"}
                </h2>
                <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                  isProMode ? 'bg-brand-primary/20 border border-brand-primary/30 text-brand-primary' : 'bg-slate-700 text-slate-300'
                }`}>
                  {isProMode ? 'TIER ELITE SINCRO' : 'GAMA STARTER'}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
                {isProMode 
                  ? "Acceso ilimitado. Puedes gestionar marcas asimiladas infinitas, vincular ilimitados canales, obtener recomendaciones inteligentes 24/7 y agendar en cola de auto-publicación directa." 
                  : "Uso limitado para pruebas de flujo. El motor de generación restringe la simulación a 2 cargas y bloquea la inyección automática al calendario."
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <button 
              onClick={handleToggleSubscription}
              className={`px-6 py-3.5 rounded-xl font-mono font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2 ${
                isProMode 
                  ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' 
                  : 'bg-brand-primary text-white hover:bg-brand-primary/80 shadow-brand-primary/25'
              }`}
            >
              {isProMode ? "SUSCRIPCIÓN PRO ACTIVA (Volver a Demo)" : "ACTIVAR POTENCIA GLOBAL PRO"}
              <Zap className="w-4 h-4" />
            </button>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
              {!isProMode ? `Gasto: ${generationsCount}/2 Pruebas Semanales` : "Consumo sin limitaciones"}
            </span>
          </div>
        </div>
      </section>

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
        
        {/* COLUMNA DEL ASISTENTE DE FUTURA (2 COLS) - GESTIÓN OPERATIVA, BAÚL Y ALERTAS */}
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
                    <h3 className="font-bold text-white text-lg">Asistente de FUTURA</h3>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase tracking-widest rounded">
                      Enlace del Baúl
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    Auditoría de Marcas y Sincronizaciones Operativas
                  </p>
                </div>
              </div>

              {/* BRAND / PAGE SELECTOR DROPDOWN */}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 font-mono uppercase">Enlace Activo:</span>
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
                  <img src={selectedBrand.logos[0]} className="w-full h-full object-cover" alt="Brand Logo" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold font-display text-xl uppercase">
                  {selectedBrand.name[0]}
                </div>
              )}
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-md">{selectedBrand.name}</h4>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-mono rounded-lg uppercase">
                    {selectedBrand.industry || "Marketing"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{selectedBrand.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-slate-500">
                  <span>TONO EN BAÚL: <strong className="text-slate-300">{selectedBrand.tone || "Directo & Clínico"}</strong></span>
                  <span>•</span>
                  <span>ESTADO: <strong className="text-indigo-400">Sincronizado</strong></span>
                </div>
              </div>
            </div>

            {/* APP BONDING BUTTONS PANEL (GESTIONADO POR ASISTENTE) */}
            <div className="space-y-3 pt-2 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  Cuentas Operativas Vinculadas por Asistente de FUTURA
                </span>
                <span className="text-[8px] font-mono text-indigo-400 uppercase">Integración de Baúl</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { key: 'instagram' as const, name: "Instagram", icon: Instagram, color: "text-pink-400 hover:border-pink-500/30" },
                  { key: 'tiktok' as const, name: "TikTok", icon: Video, color: "text-sky-400 hover:border-sky-500/30" },
                  { key: 'shorts' as const, name: "YouTube", icon: Chrome, color: "text-red-400 hover:border-red-500/30" },
                  { key: 'whatsappPersonal' as const, name: "WhatsApp Pers", icon: Phone, color: "text-green-400 hover:border-green-500/30" },
                  { key: 'whatsappBusiness' as const, name: "WhatsApp Biz", icon: Smartphone, color: "text-emerald-400 hover:border-emerald-500/30" }
                ].map((app) => {
                  const isConnected = bondedApps[app.key];
                  return (
                    <button
                      key={app.key}
                      onClick={() => toggleBond(app.key, app.name)}
                      className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${
                        isConnected 
                          ? 'bg-white/5 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                          : 'bg-black/40 border-white/5 opacity-55 hover:opacity-100'
                      } ${app.color}`}
                    >
                      <app.icon className="w-6 h-6 shrink-0" />
                      <span className="text-[10px] font-extrabold text-white">{app.name}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-[7.5px] font-mono uppercase text-slate-400">
                          {isConnected ? 'SINCRO' : 'OFFLINE'}
                        </span>
                      </div>
                    </button>
                  );
                })}
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
                  <h3 className="font-bold text-white text-lg">Alertas y Notificaciones de Vigilancia</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Detección operativa en tus canales por el Asistente</p>
                </div>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                AUDITORÍA ACTIVA
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
                      setAssetType(rec.targetChannel === 'TikTok' ? 'mp4' : 'jpg');
                      setCustomGoal(rec.promptPreset);
                      
                      // Scroll to generation form smoothly
                      const formElem = document.getElementById('maestro-form-epicentro');
                      if (formElem) {
                        formElem.scrollIntoView({ behavior: 'smooth' });
                      }
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

        {/* COLUMNA DE FUTURA (1 COL) - LA MAGIA CREATIVA */}
        <div className="space-y-8" id="maestro-form-epicentro">
          <div className="glass-panel p-8 rounded-[3rem] border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-surface-950 to-transparent shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 bg-brand-primary/20 border border-brand-primary/30 rounded-2xl flex items-center justify-center text-brand-primary shadow-lg shadow-brand-primary/20">
                <Sparkles className="w-6 h-6 text-brand-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg font-display">FUTURA Creative Core</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">El Elixir Creativo de la Marca</p>
              </div>
            </div>

            {/* SELECTION TABS */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Parrilla & Activos de Creación</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { type: 'jpg' as const, label: 'Imagen JPG' },
                    { type: 'carrusel' as const, label: 'Carrusel' },
                    { type: 'mp4' as const, label: 'Reel MP4' }
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setAssetType(btn.type)}
                      className={`py-2 px-1 rounded-xl border font-mono text-[8.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center ${
                        assetType === btn.type 
                          ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20 scale-105' 
                          : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* COMM TONALITY LINK HINT */}
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-slate-400 leading-normal flex gap-2 items-start">
                <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-indigo-300">Vínculo de Marca:</strong> FUTURA extraerá automáticamente el tono de voz <strong className="text-white">"{selectedBrand.tone || "Cercano e Instructivo"}"</strong> definido por tu Asistente en el Baúl de Marca para confeccionar el activo de manera coherente.
                </p>
              </div>

              {/* WHAT TO COMMUNICATE INPUT */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">¿Qué idea deseas dar vida hoy?</label>
                <textarea
                  placeholder="Ej: Lanza una promoción sumamente agresiva sobre auditorías para marcas de gastronomía avanzada..."
                  rows={3}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="bg-black/60 border border-white/10 focus:border-brand-primary/50 text-white rounded-xl px-4 py-3 text-xs w-full outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 text-white font-mono font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-brand-primary/25 cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" /> DESPERTANDO LA IA CREATIVA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse text-white" /> CREAR ACTIVOS MÁGICOS
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GENERATION LOADER RUN LIST */}
          {isGenerating && (
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-black/60 space-y-3 font-mono text-[9px] text-slate-400">
              <span className="text-[9.5px] font-black text-brand-primary uppercase tracking-[0.2em] block">ROUTER ESTRATÉGICO IA</span>
              <div className="space-y-1.5 leading-normal">
                {generationSteps.map((step, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{step}</div>
                ))}
              </div>
            </div>
          )}

          {/* GENERATED RECURSOS OUTPUTS (COPY + JPG/MP4) */}
          {generatedResult && (
            <div className="space-y-6">
              
              {/* ADVISOR COMMENT BOX */}
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-slate-300 text-xs leading-relaxed italic space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Bot className="w-4 h-4 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Diagnóstico: Asistente de FUTURA</span>
                </div>
                <p>"{generatedResult.advice}"</p>
              </div>

              {/* COPY SECTOR */}
              <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-3 bg-surface-950 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">TEXTO GENERADO POR FUTURA</span>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-black">LISTO EN COLA</span>
                </div>
                
                <textarea
                  value={generatedResult.copy}
                  onChange={(e) => setGeneratedResult({ ...generatedResult, copy: e.target.value })}
                  rows={6}
                  className="w-full bg-black/40 border border-white/5 focus:border-brand-primary/50 text-slate-300 rounded-xl p-4 text-xs font-sans outline-none resize-none leading-relaxed"
                />
              </div>

              {/* ASSETS MATERIAL DISPLAY */}
              <div className="glass-panel p-6 rounded-3xl border-brand-primary/20 bg-surface-950 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
                    {assetType === 'jpg' ? 'DISEÑO JPG COTEJADO' : assetType === 'carrusel' ? 'PREVISUALIZADOR DE CARRUSEL' : 'ESTRUCTURA DE REEL MP4'}
                  </span>
                  <span className="text-[8px] font-mono text-brand-primary uppercase">PREVISUALIZACIÓN DE FUTURA</span>
                </div>

                {assetType === 'jpg' && (
                  /* JPG Display */
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner relative group bg-black">
                    <img 
                      src={generatedResult.imageUrl} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt="Generated Graphic" 
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{selectedBrand.name}</p>
                        <p className="text-[8px] text-slate-300 font-mono">Format: JPG High Quality 1:1</p>
                      </div>
                      <span className="text-[7px] font-mono bg-brand-primary/80 px-1.5 py-0.5 rounded text-white font-black tracking-widest">FUTURA CORE</span>
                    </div>
                  </div>
                )}

                {assetType === 'carrusel' && (
                  /* Carrusel Slider Visualizer */
                  <div className="space-y-4">
                    <div className="relative h-44 bg-gradient-to-br from-brand-primary/10 to-indigo-950/40 border border-brand-primary/20 rounded-2xl flex flex-col justify-between p-6">
                      <div className="absolute top-3 right-3 text-[8px] font-mono text-slate-500">
                        DIAPOSITIVA {activeSlideIndex + 1} DE {generatedResult.carruselSlides?.length || 1}
                      </div>

                      <div className="space-y-2">
                        <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-[8px] font-black uppercase tracking-widest rounded animate-pulse">
                          {generatedResult.carruselSlides?.[activeSlideIndex]?.title || "Diapositiva del Carrusel"}
                        </span>
                        <p className="text-xs font-bold text-white tracking-tight leading-relaxed">
                          {generatedResult.carruselSlides?.[activeSlideIndex]?.text || "No slides loaded"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                        <span>Marca: {selectedBrand.name}</span>
                        <span className="text-brand-primary font-black">➔ Desliza para ver la magia</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeSlideIndex === 0}
                        className="px-3 py-1.5 bg-white/5 text-white hover:bg-white/10 rounded-lg text-[9px] font-mono uppercase disabled:opacity-30 cursor-pointer"
                      >
                        ◀ Anterior
                      </button>

                      <div className="flex gap-1.5">
                        {(generatedResult.carruselSlides || [1, 2, 3]).map((_, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                              activeSlideIndex === idx ? 'bg-brand-primary w-4' : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSlideIndex(prev => Math.min((generatedResult.carruselSlides?.length || 1) - 1, prev + 1))}
                        disabled={activeSlideIndex === (generatedResult.carruselSlides?.length || 1) - 1}
                        className="px-3 py-1.5 bg-white/5 text-white hover:bg-white/10 rounded-lg text-[9px] font-mono uppercase disabled:opacity-30 cursor-pointer"
                      >
                        Siguiente ▶
                      </button>
                    </div>
                  </div>
                )}

                {assetType === 'mp4' && (
                  /* MP4 Display Simulator */
                  <div className="space-y-3">
                    <div className="layer-mp4 bg-gradient-to-br from-indigo-950 to-surface-950 px-5 py-6 rounded-2xl border border-brand-primary/30 relative overflow-hidden group">
                      
                      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%), linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)', backgroundSize: '100% 100%, 20px 20px' }} />
                      
                      <div className="flex gap-4 relative z-10">
                        {generatedResult.videoSimulation && (
                          <div className="w-20 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-white/20 relative flex items-center justify-center">
                            <img src={generatedResult.videoSimulation.thumbnailUrl} className="w-full h-full object-cover opacity-60" alt="Video frame" />
                            <div className="absolute inset-0 bg-brand-primary/10 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                            <span className="absolute bottom-1 right-1 text-[7px] font-mono bg-black/80 text-white px-1 rounded-sm leading-none py-0.5">MP4</span>
                          </div>
                        )}

                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-[10.5px] font-black uppercase text-brand-primary tracking-widest">
                            {generatedResult.videoSimulation?.tag}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Duración:</span>
                              <span className="text-white">{generatedResult.videoSimulation?.duration}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Resolución:</span>
                              <span className="text-white">{generatedResult.videoSimulation?.resolution}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>FUTURA Render:</span>
                              <span className="text-white">Motor Dinámico Activo</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fake video timeline */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 text-[8.5px] font-mono text-slate-500">
                        <span className="text-indigo-400">0:00</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full relative">
                          <div className="absolute left-0 top-0 h-full w-2/5 bg-brand-primary rounded-full" />
                          <div className="absolute left-2/5 -top-1 w-3 h-3 rounded-full bg-white border border-brand-primary cursor-pointer shadow-lg" />
                        </div>
                        <span>{generatedResult.videoSimulation?.duration.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AUTOMATIC CALENDAR PUSH DISPATCH BUTTON */}
                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  className="w-full py-4 bg-gradient-to-r from-brand-primary to-purple-600 hover:from-brand-primary/80 hover:to-purple-600/80 text-white font-mono font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-brand-primary/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> 
                  EXPORTAR DIRECTO A MI CALENDARIO DE PUBLICACIÓN
                </button>
              </div>

            </div>
          )}
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
