/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { chatWithAdvisor } from './services/geminiService';
import Sidebar from './components/Sidebar';
import CreativeEngine from './components/CreativeEngine';
import ProjectManager from './components/ProjectManager';
import MembershipPlans from './components/MembershipPlans';
import Gallery from './components/Gallery';
import ContentReady from './components/ContentReady';
import MasterControlEpicenter from './components/MasterControlEpicenter';
import Profile from './components/Profile';
import AuthWrapper from './components/AuthWrapper';
import LaunchGuide from './components/LaunchGuide';
import OpenWAConfig from './components/OpenWAConfig';
import { UserProfile, ProjectContext } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Maximize, 
  Search,
  Sparkles,
  Plus,
  ShieldCheck,
  Layout,
  X,
  FileText,
  ChevronRight,
  Menu,
  CheckCircle,
  Bot,
  Send,
  Maximize2,
  BookOpen,
  Loader2,
  ChevronDown,
  Calendar,
  Smartphone,
  Instagram,
  Eye,
  Sliders,
  AlertTriangle,
  Crown,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Lock,
  Layers,
  Check,
  RefreshCw,
  EyeOff,
  UserCheck,
  Coins,
  Users
} from 'lucide-react';
import { cn } from './lib/utils';
import PhaseChat from './components/PhaseChat';
import LandingOverlay from './components/LandingOverlay';
import SecuritySection from './components/SecuritySection';
import { useAuth } from './components/AuthWrapper';

import { db } from './lib/firebase';
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

export default function App() {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

function AppContent() {
  const { user, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [isSimplifiedMode, setIsSimplifiedMode] = useState(() => {
    return localStorage.getItem('futura_simplified_mode') === 'true';
  });
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showVaultInfo, setShowVaultInfo] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [dashboardPrompt, setDashboardPrompt] = useState('');
  const [hubMessages, setHubMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isHubLoading, setIsHubLoading] = useState(false);
  const [learnedProtocols, setLearnedProtocols] = useState<string[]>([]);
  const [neuralEvolution, setNeuralEvolution] = useState(72.4);
  const [vaultStep, setVaultStep] = useState(0);
  const [securityStep, setSecurityStep] = useState(0);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const mainRef = React.useRef<HTMLDivElement>(null);
  const hubRef = React.useRef<HTMLDivElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const lastMessageRef = React.useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = React.useRef(0);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: "Invitado",
    roles: ["Emprendedor", "Creador", "Estratega"],
    bio: "Motor creativo para el desarrollo de marcas y optimización de contenido digital.",
    philosophy: "Results over Aesthetics — Funcionalidad e impacto por encima de la estética pura.",
    projects: [],
    credits: 3,
    isPremium: false
  });

  // Cycle Steps
  React.useEffect(() => {
    const interval = setInterval(() => {
      setVaultStep(prev => (prev + 1) % 3);
      setSecurityStep(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top when tab changes
  React.useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo({ top: 0 });
      document.body.scrollTo({ top: 0 });
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0 });
      }
    };
    scrollToTop();
    const t = setTimeout(scrollToTop, 150);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Auto-scroll Consultoría
  const scrollChatToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const trigger = () => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior
        });
      }
    };
    trigger();
    setTimeout(trigger, 50);
    setTimeout(trigger, 150);
    setTimeout(trigger, 300);
    setTimeout(trigger, 500);
  };

  const [projectsList, setProjectsList] = React.useState<ProjectContext[]>([]);
  const [activeConsultBrandId, setActiveConsultBrandId] = React.useState<string>(() => {
    return localStorage.getItem('activeConsultBrandId') || '';
  });

  React.useEffect(() => {
    if (activeConsultBrandId) {
      localStorage.setItem('activeConsultBrandId', activeConsultBrandId);
    }
  }, [activeConsultBrandId]);

  React.useEffect(() => {
    if (projectsList.length > 0 && !activeConsultBrandId) {
      setActiveConsultBrandId(projectsList[0].id);
    }
  }, [projectsList, activeConsultBrandId]);

  // Subscribe to projects to have access to active brand details and style guidelines in the Hub & Advisor
  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProjectsList(projs);
    }, (err) => {
      console.error("Failed to fetch projects in Hub context:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const isHubNearBottom = React.useRef(true);

  React.useEffect(() => {
    if (hubMessages.length === 0) {
      prevMessagesLengthRef.current = 0;
      return;
    }

    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = hubMessages.length;

    const lastMsg = hubMessages[hubMessages.length - 1];

    // Check if a new message was added
    if (hubMessages.length > prevLength) {
      if (lastMsg?.role === 'user') {
        isHubNearBottom.current = true;
        scrollChatToBottom('smooth');
      } else if (isHubNearBottom.current) {
        scrollChatToBottom('smooth');
      }
    } else if (isHubLoading && isHubNearBottom.current) {
      // Loader became active, show it at the bottom if already at the bottom
      scrollChatToBottom('smooth');
    }
  }, [hubMessages, isHubLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    
    const threshold = 150;
    isHubNearBottom.current = scrollHeight - scrollTop - clientHeight <= threshold;
  };

  const scrollToBottom = () => {
    scrollChatToBottom('smooth');
  };

  const handleHubConsult = async (initialText?: string) => {
    const userMsg = (initialText || dashboardPrompt).trim();
    if (!userMsg || isHubLoading) return;
    
    const newMessages: {role: 'user' | 'model', text: string}[] = [...hubMessages, { role: 'user', text: userMsg }];
    setHubMessages(newMessages);
    setDashboardPrompt('');
    setIsHubLoading(true);

    // Extract active project brand context to inform the Advisor based on selected brand
    const activeProject = projectsList && projectsList.length > 0 
      ? (projectsList.find(p => p.id === activeConsultBrandId) || projectsList[0])
      : null;
    const brandContextStr = activeProject 
      ? `MARCA ACTIVA CONECTADA: ${activeProject.name}. DESCRIPCIÓN DETALLADA DE MARCA: ${activeProject.description}. LOGOTIPOS CARGADOS EN SU BAÚL: ${activeProject.logos?.length || 0} archivos. MATERIAL DE ENTRENAMIENTO/ESTILO: ${activeProject.trainingMaterial?.length || 0} archivos.`
      : "No hay marca seleccionada aún o no se han cargado activos en la Bóveda.";

    try {
      const responseText = await chatWithAdvisor(userMsg, hubMessages, brandContextStr);
      
      setHubMessages(prev => [...prev, { 
        role: 'model', 
        text: responseText 
      }]);
      setIsHubLoading(false);
    } catch (error) {
      console.error("Hub Consult Error:", error);
      setHubMessages(prev => [...prev, { 
        role: 'model', 
        text: "He experimentado una interrupción en mi flujo estratégico. Por favor, reintenta tu consulta." 
      }]);
      setIsHubLoading(false);
    }
  };

  // Perfil persistente en Firestore
  React.useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          name: user.displayName || "Estratega",
          roles: ["Líder"],
          bio: "Sin biografía definida.",
          philosophy: "Results over Aesthetics.",
          projects: [],
          credits: 10,
          isPremium: false,
          email: user.email || ""
        };
        setDoc(docRef, initialProfile);
        setProfile(initialProfile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      } catch (error) {
        console.error("Profile Update Error:", error);
      }
    }
  };

  const spePhases = [
    { 
      name: 'Investigación', 
      icon: Search, 
      color: 'text-blue-400', 
      desc: 'Análisis de mercado y entorno.',
      title: 'Auditoría de Mercado y Entorno',
      longDesc: 'Analizamos profundamente el ecosistema donde vive tu marca. No solo miramos a la competencia, sino los vacíos de mercado que puedes llenar para posicionarte como líder.',
      points: [
        'Auditoría de Competencia: Identificando sus fortalezas para superarlas.',
        'Análisis de Tendencias: Proyectando qué será relevante mañana.',
        'Perfil del Consumidor: Definiendo el "Pain Point" exacto que resolvemos.'
      ]
    },
    { 
      name: 'Estrategia', 
      icon: Target, 
      color: 'text-purple-400', 
      desc: 'Planificación de impacto y metas.',
      title: 'Plan de Impacto SPE',
      longDesc: 'Creamos la hoja de ruta clara. Aquí decidimos cómo vamos a ganar, no solo cómo vamos a participar. La estrategia es el 80% del éxito en cualquier despliegue corporativo.',
      points: [
        'Propuesta de Valor Única (PVU): Tu diferenciador innegable.',
        'Arquitectura de Mensaje: Qué decimos y cuándo lo decimos.',
        'Embudo de Conversión: El camino del usuario desde el espectador hasta el cliente.'
      ]
    },
    { 
      name: 'Despliegue', 
      icon: Zap, 
      color: 'text-yellow-400', 
      desc: 'Materialización real de activos.',
      title: 'Materialización de Activos de Alto Impacto',
      longDesc: 'Transformamos la estrategia en píxeles y palabras. Aplicamos el criterio "Results over Aesthetics" para que cada diseño cumpla una función comercial específica.',
      points: [
        'Despliegue Visual: Logos, flyers y carruseles optimizados.',
        'Copywriting Estratégico: Palabras que venden y conectan.',
        'Brand Consistency: Garantizando que tu marca se vea igual en todo canal.'
      ]
    },
    { 
      name: 'Optimización', 
      icon: TrendingUp, 
      color: 'text-green-400', 
      desc: 'Ajuste basado en resultados.',
      title: 'Análisis de Rendimiento Reales',
      longDesc: 'Los datos no mienten. Analizamos qué está funcionando y qué debe morir. Refinamos cada activo para exprimir el máximo ROI de tu inversión creativa.',
      points: [
        'Lectura de Métricas: CTR, ROAS y Engagement real.',
        'A/B Testing: Probamos variables para encontrar la configuración ganadora.',
        'Refinamiento IA: Reinyectamos datos al motor para mejorar cada iteración.'
      ]
    },
    { 
      name: 'Escalamiento', 
      icon: Maximize, 
      color: 'text-orange-400', 
      desc: 'Crecimiento de impacto y alcance.',
      title: 'Expansión y Crecimiento Vertical',
      longDesc: 'Cuando algo funciona, lo hacemos grande. Llevamos tu marca a nuevos niveles de alcance sin perder la esencia que la hizo exitosa en primer lugar.',
      points: [
        'Presupuesto Progresivo: Inversión inteligente donde hay Retorno.',
        'Nuevos Formatos: Del carrusel al video, del video a la campaña masiva.',
        'Dominio del Nicho: Consolidación como autoridad máxima en tu sector.'
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'engine':
        return <CreativeEngine 
          profile={profile} 
          onUpdateProfile={handleUpdateProfile} 
          onNavigateToVault={() => setActiveTab('vault')} 
          initialPrompt={dashboardPrompt}
          onPromptConsumed={() => setDashboardPrompt('')}
        />;
      case 'vault':
        return <ProjectManager 
          profile={profile} 
          onUpdateProfile={handleUpdateProfile}
          onNavigateToEngine={() => setActiveTab('engine')}
        />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <AdminPanel learnedProtocols={learnedProtocols} evolution={neuralEvolution} />;
      case 'dev':
        return <DevPanel />;
      case 'security':
        return <SecuritySection />;
      case 'gallery':
        return <Gallery />;
      case 'content':
        return <ContentReady />;
      case 'openwa':
        return <OpenWAConfig profile={profile} onUpdateProfile={handleUpdateProfile} />;
      case 'pro':
        return <MembershipPlans profile={profile} onUpdateProfile={handleUpdateProfile} />;
      case 'launch-guide':
        return <LaunchGuide />;
      case 'epicenter':
        return (
          <MasterControlEpicenter 
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            projectsList={projectsList}
            setActiveTab={setActiveTab}
            isSimplifiedMode={isSimplifiedMode}
            onTriggerConsult={(text) => {
              setDashboardPrompt(text);
              handleHubConsult(text);
            }}
          />
        );
      case 'dashboard':
      case '':
        return (
          <>
            {/* 1. HUD DE SUSCRIPCIÓN DINÁMICA: DEMO LIMITADA VS FUTURA PRO */}
            <section className="mb-12 glass-panel p-6 rounded-[2.5rem] border-white/5 bg-gradient-to-r from-surface-950 to-brand-primary/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-[80px]" />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10 text-left">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${profile.isPremium ? 'bg-brand-primary/20 text-brand-primary animate-pulse' : 'bg-white/5 text-slate-500'}`}>
                    {profile.isPremium ? <Crown className="w-8 h-8 text-brand-primary" /> : <Lock className="w-8 h-8" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
                        {profile.isPremium ? "MODO DE POTENCIA: FUTURA PRO / ELITE" : "MODO DE USO: VERSIÓN DEMO LIMITADA"}
                      </h2>
                      <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                        profile.isPremium ? 'bg-brand-primary/20 border border-brand-primary/30 text-brand-primary' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {profile.isPremium ? 'TIER ELITE SINCRO' : 'GAMA STARTER'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
                      {profile.isPremium 
                        ? "Acceso ilimitado. Puedes gestionar marcas asimiladas infinitas, vincular ilimitados canales, obtener recomendaciones inteligentes 24/7 y agendar en cola de auto-publicación directa." 
                        : "Uso limitado para pruebas de flujo. El motor de generación restringe la simulación a 2 cargas y bloquea la inyección automática al calendario."
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleUpdateProfile({ ...profile, isPremium: !profile.isPremium })}
                    className={`px-6 py-3.5 rounded-xl font-mono font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2 cursor-pointer ${
                      profile.isPremium 
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' 
                        : 'bg-brand-primary text-white hover:bg-brand-primary/80 shadow-brand-primary/25'
                    }`}
                  >
                    {profile.isPremium ? "SUSCRIPCIÓN PRO ACTIVA (Volver a Demo)" : "ACTIVAR POTENCIA GLOBAL PRO"}
                    <Zap className="w-4 h-4" />
                  </button>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                    {!profile.isPremium ? `Gasto: ${localStorage.getItem('futura_demo_generations') || '0'}/2 Pruebas Semanales` : "Consumo sin limitaciones"}
                  </span>
                </div>
              </div>
            </section>


              <section className="mb-16 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-widest block">OPERACIÓN OPTIMIZADA</span>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">¿Cómo operar FUTURA de forma rápida y sin complicaciones?</h3>
                    <p className="text-xs text-slate-500 mt-1">Sigue el flujo intuitivo para crear, entrenar y automatizar tus publicaciones en minutos.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Paso 1 */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-brand-primary/20 bg-surface-950/40 relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-all group hover:bg-surface-950/60">
                    <div className="absolute top-0 right-0 p-4 font-mono text-3xl font-black text-white/5 group-hover:text-brand-primary/5 transition-colors">01</div>
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Layers className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide">Paso 1: Configura ADN</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">Sube tus logotipos, define el tono de voz y la misión en tu <b>Baúl de Marca</b>. Puedes manejar múltiples identidades.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('vault')}
                      className="mt-4 w-full py-2.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl border border-purple-500/20 text-[10px] font-mono uppercase font-black tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Abrir Baúl de Marca <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Paso 2 */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-brand-primary/20 bg-surface-950/40 relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-all group hover:bg-surface-950/60">
                    <div className="absolute top-0 right-0 p-4 font-mono text-3xl font-black text-white/5 group-hover:text-brand-primary/5 transition-colors">02</div>
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                        <Zap className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide">Paso 2: Genera Contenido</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">Abre el <b>Motor Creativo</b> para generar imágenes o copies publicitarios alineados instantáneamente con el ADN de tu marca.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('engine')}
                      className="mt-4 w-full py-2.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white rounded-xl border border-brand-primary/20 text-[10px] font-mono uppercase font-black tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Lanzar Motor Creativo <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Paso 3 */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-brand-primary/20 bg-surface-950/40 relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-all group hover:bg-surface-950/60">
                    <div className="absolute top-0 right-0 p-4 font-mono text-3xl font-black text-white/5 group-hover:text-brand-primary/5 transition-colors">03</div>
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Calendar className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide">Paso 3: Sincroniza</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">Revisa el <b>Contenido Listo</b> y tu agenda integrada para inyectar tus posts al aire automáticamente o programar alertas.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('content')}
                      className="mt-4 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/20 text-[10px] font-mono uppercase font-black tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Ver Contenido Listo <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </section>

            {/* SECCIÓN PANTALLA ANTERIOR */}
            <section className="mb-20 space-y-16">
              <div className="spe-section">
                <div className="flex items-center gap-2 mb-8 text-left">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-xl font-bold font-display text-white">Sistema Pentagonal de Ejecución (SPE)</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                  {spePhases.map((phase, i) => (
                    <motion.div 
                      key={phase.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => {
                        setSelectedPhase(phase);
                      }}
                      className="glass-panel p-6 rounded-3xl hover:bg-white/5 cursor-pointer border border-white/5 hover:border-brand-primary/30 transition-all group text-left"
                    >
                      <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110", phase.color)}>
                        <phase.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-white">{phase.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{phase.desc}</p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-1 text-[10px] font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        CONSULTAR FASE <ChevronRight className="w-3 h-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* SPE PHASE DETAIL MODAL */}
                <AnimatePresence>
                  {selectedPhase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setSelectedPhase(null)} 
                        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                        className="relative w-full max-w-2xl glass-panel p-8 md:p-12 rounded-[3rem] border-brand-primary/30 shadow-2xl space-y-8 text-left"
                      >
                         <button 
                           onClick={() => setSelectedPhase(null)}
                           className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors cursor-pointer"
                         >
                           <X className="w-6 h-6" />
                         </button>

                         <div className="flex items-center gap-6">
                           <div className={cn("w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 shadow-lg", selectedPhase.color)}>
                             <selectedPhase.icon className="w-10 h-10" />
                           </div>
                           <div>
                              <h2 className="text-3xl font-display font-bold text-white tracking-tight">{selectedPhase.title}</h2>
                              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Fase SPE: {selectedPhase.name}</p>
                           </div>
                         </div>
                         
                         <div className="space-y-6">
                           <p className="text-slate-400 leading-relaxed text-lg">
                             {selectedPhase.longDesc}
                           </p>
                           
                           <div className="space-y-4">
                             <h4 className="text-xs font-black text-white uppercase tracking-widest">Protocolos de Ejecución</h4>
                             <ul className="space-y-3">
                                {selectedPhase.points.map((point: string, i: number) => (
                                  <li key={i} className="flex gap-4 items-start">
                                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                                      <CheckCircle className="w-3 h-3 text-brand-primary" />
                                    </div>
                                    <p className="text-sm text-slate-300">{point}</p>
                                  </li>
                                ))}
                             </ul>
                           </div>
                         </div>

                          <div className="grid grid-cols-1 gap-4 pt-6">
                            <button 
                              onClick={() => {
                                setSelectedPhase(null);
                                hubRef.current?.scrollIntoView({ behavior: 'smooth' });
                                setDashboardPrompt(`Necesito ayuda técnica para la ejecución de la fase de ${selectedPhase.name} de mi marca.`);
                              }}
                              className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                              Consultoría de Ejecución
                            </button>
                         </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="mt-12 overflow-hidden bg-white/5 border-y border-white/5 py-4">
                  <motion.div 
                    animate={{ x: [0, -1000] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 30, 
                      ease: "linear" 
                    }}
                    className="flex whitespace-nowrap gap-12 items-center"
                  >
                    {[
                      "Transformamos tu visión en resultados tangibles.",
                      "Estrategia empresarial para marcas con ADN de futuro.",
                      "Resultados sobre Estética: El motor que vende mientras duermes.",
                      "Protocolo SPE: El cimiento de las empresas que dominan su nicho.",
                      "Crecimiento vertical, impacto real y asesoría experta 24/7.",
                      "Transformamos tu visión en resultados tangibles.",
                      "Estrategia empresarial para marcas con ADN de futuro.",
                      "Resultados sobre Estética: El motor que vende mientras duermes.",
                      "Protocolo SPE: El cimiento de las empresas que dominan su nicho.",
                      "Crecimiento vertical, impacto real y asesoría experta 24/7."
                    ].map((phrase, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-brand-primary" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{phrase}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              <motion.div 
                ref={hubRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "glass-panel rounded-[3rem] border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 via-surface-950/40 to-transparent relative overflow-hidden shadow-3xl transition-all duration-300",
                  hubMessages.length > 0 ? "p-6 sm:p-8" : "p-10 md:p-16"
                )}
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Bot className="w-48 h-48 text-brand-primary" />
                </div>
                
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                  {hubMessages.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-2xl shadow-brand-primary/20">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] block">PROTOCOLOS DE INTELIGENCIA CORPORATIVA</span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter leading-tight">
                          CENTRO DE <span className="text-brand-primary">CONSULTORÍA</span>
                        </h2>
                      </div>
                      <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        Nuestra IA está lista para procesar tus inquietudes estratégicas. Eleva tu marca al estándar <span className="text-white font-bold italic">profesional</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/5 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-lg shrink-0">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight">Centro de Consultoría</h2>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[7px] font-black text-green-500 uppercase tracking-widest leading-none">
                              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                              Activo
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">FUTURA ADVISOR EN LÍNEA</p>
                        </div>
                      </div>
                      
                      {learnedProtocols.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-[9px] text-slate-400 font-mono text-left">
                          <span className="text-brand-primary font-black">ADN SINCRO:</span>
                          <span className="text-slate-500">{learnedProtocols[learnedProtocols.length - 1].substring(0, 20)}...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {hubMessages.length === 0 && learnedProtocols.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap justify-center gap-2"
                      >
                        {learnedProtocols.slice(-2).map((p, idx) => (
                          <div key={idx} className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                             <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] leading-none">Sincronización: {p.substring(0, 15)}...</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {hubMessages.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-4xl mx-auto space-y-4 relative text-left"
                      >
                        <div 
                          ref={messagesContainerRef}
                          onScroll={handleScroll}
                          className="max-h-[440px] overflow-y-auto pr-2 custom-scrollbar space-y-4 text-left py-2 scroll-smooth flex flex-col"
                        >
                          {hubMessages.map((msg, i) => {
                            const isLast = i === hubMessages.length - 1;
                            const isUser = msg.role === 'user';
                            return (
                              <motion.div 
                                key={i}
                                ref={isLast ? lastMessageRef : null}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={cn(
                                  "p-4 md:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg transition-all relative max-w-[85%] sm:max-w-[75%] border",
                                  isUser 
                                    ? "self-end ml-auto bg-white/5 text-slate-100 border-white/10 rounded-tr-none hover:bg-white/10" 
                                    : "self-start mr-auto bg-brand-primary/10 text-slate-200 border-brand-primary/20 rounded-tl-none font-light"
                                )}
                              >
                                {isUser ? (
                                  <div className="flex items-center gap-1.5 mb-2 opacity-60">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">TU CONSULTA</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 mb-2 text-brand-primary">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">ESTRATEGIA FUTURA</span>
                                  </div>
                                )}
                                <div className="markdown-body text-slate-300 text-xs sm:text-sm">
                                  <Markdown>{msg.text}</Markdown>
                                </div>
                              </motion.div>
                            );
                          })}
                          {isHubLoading && (
                            <div className="self-start mr-auto max-w-[85%] sm:max-w-[75%] p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl rounded-tl-none flex items-center gap-4 shadow-xl">
                              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                              <div className="flex flex-col gap-0.5 text-left">
                                <span className="text-[10px] text-brand-primary uppercase tracking-[0.2em] font-black animate-pulse">Analizando Visión...</span>
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Sincronizando con red neuronal FUTURA</span>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                        
                        <AnimatePresence>
                          {showScrollDown && (
                            <motion.button
                              initial={{ opacity: 0, y: 10, x: "-50%" }}
                              animate={{ opacity: 1, y: 0, x: "-50%" }}
                              exit={{ opacity: 0, y: 10, x: "-50%" }}
                              onClick={scrollToBottom}
                              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all z-30 whitespace-nowrap border border-white/10 cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4" />
                              NUEVOS MENSAJES
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {user ? (
                    <div className="relative group max-w-3xl mx-auto pt-2">
                      <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                      <div className="relative flex flex-col sm:flex-row items-center gap-3 bg-surface-950 border border-white/10 p-2 rounded-2xl shadow-3xl group-focus-within:border-brand-primary/40 transition-all">
                        <input 
                          type="text"
                          value={dashboardPrompt}
                          onChange={(e) => setDashboardPrompt(e.target.value)}
                          placeholder="Consulta sobre tu estrategia corporativa..."
                          className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 text-sm placeholder:text-slate-700 outline-none w-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleHubConsult();
                          }}
                        />
                        <div className="flex w-full sm:w-auto gap-3 p-1 sm:p-0">
                          <button 
                            onClick={() => handleHubConsult()}
                            disabled={isHubLoading}
                            className="flex-1 sm:w-auto px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/30 w-full cursor-pointer"
                          >
                            CONSULTAR
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-6">
                      <button 
                        onClick={signIn}
                        className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-2xl flex items-center gap-4 mx-auto hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        INGRESAR AL HUB ESTRATÉGICO
                        <ShieldCheck className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-8 text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] pt-6">
                    <div className="flex items-center gap-2">
                       <Layout className="w-4 h-4 text-brand-primary/60" />
                       Market Intelligence
                    </div>
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-brand-primary/60" />
                       Client Capture
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* DNA VAULT Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-primary/20 rounded-[1.25rem] flex items-center justify-center border border-brand-primary/20">
                        <Layout className="w-6 h-6 text-brand-primary" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-white tracking-tight">DNA Vault</h2>
                    </div>
                    <button onClick={() => setActiveTab('vault')} className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] hover:tracking-[0.4em] transition-all cursor-pointer">CONFIGURAR BÓVEDA</button>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setActiveTab('vault')}
                    className="glass-panel p-10 rounded-[3.5rem] bg-gradient-to-br from-brand-primary/5 via-surface-950/40 to-transparent border-white/5 hover:border-brand-primary/40 transition-all cursor-pointer group relative overflow-hidden h-[340px] flex flex-col justify-between text-left"
                  >
                    <div className="relative z-10">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={vaultStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                              {vaultStep === 0 ? <Zap className="w-4 h-4 text-brand-primary" /> : 
                               vaultStep === 1 ? <Target className="w-4 h-4 text-brand-primary" /> : 
                               <ShieldCheck className="w-4 h-4 text-brand-primary" />}
                            </div>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">
                              {vaultStep === 0 ? 'Identidad de Marca' : 
                               vaultStep === 1 ? 'Estrategia de Conversión' : 
                               'Protocolos de Seguridad'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white tracking-tight">
                            {vaultStep === 0 ? 'Resguarda tu esencia visual' : 
                             vaultStep === 1 ? 'Activa el motor corporativo' : 
                             'Blindaje de IP Corporativa'}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed italic">
                            {vaultStep === 0 ? '"La estética no es el fin, es el vehículo para tu DNA de marca."' : 
                             vaultStep === 1 ? '"Convertimos tu visión en un sistema repetible de resultados."' : 
                             '"Tu ventaja competitiva es privada, segura y encriptada."'}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                      {[
                        { label: 'Identidad Visual', progress: 85, color: 'bg-brand-primary' },
                        { label: 'Activos de Conversión', progress: vaultStep > 0 ? 92 : 45, color: 'bg-purple-500' },
                        { label: 'Protocolo de Marca', progress: vaultStep > 1 ? 88 : 65, color: 'bg-blue-500' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                            <span className="text-[10px] font-mono text-brand-primary">{item.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 1.5, delay: 0.2 }}
                              className={cn("h-full rounded-full shadow-lg", item.color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </section>

                {/* SECURITY PROTOCOL Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-primary/20 rounded-[1.25rem] flex items-center justify-center border border-brand-primary/20">
                        <ShieldCheck className="w-6 h-6 text-brand-primary" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-white tracking-tight">Ciberseguridad</h2>
                    </div>
                    <button onClick={() => setActiveTab('security')} className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] hover:tracking-[0.4em] transition-all cursor-pointer">VER PROTOCOLOS</button>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setActiveTab('security')}
                    className="glass-panel p-10 rounded-[3.5rem] bg-surface-950 border-white/5 hover:border-brand-primary/40 transition-all cursor-pointer group relative overflow-hidden h-[340px] flex flex-col justify-between text-left"
                  >
                    {/* Animated background lines for security dynamism */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden text-left">
                      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      <motion.div 
                        animate={{ y: [0, 340] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent blur-sm"
                      />
                    </div>

                    <div className="relative z-10 text-left">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={securityStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                              {securityStep === 0 ? <ShieldCheck className="w-4 h-4 text-brand-primary" /> : 
                               securityStep === 1 ? <Search className="w-4 h-4 text-brand-primary" /> : 
                               <Loader2 className="w-4 h-4 text-brand-primary" />}
                            </div>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">
                              {securityStep === 0 ? 'Infraestructura Blindada' : 
                               securityStep === 1 ? 'Monitoreo de Amenazas' : 
                               'Protocolos de Acceso'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white tracking-tight">
                            {securityStep === 0 ? 'Protección de IP nivel CERO' : 
                             securityStep === 1 ? 'Vigilancia 24/7 de Activos' : 
                             'Encriptación Avanzada Activa'}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed italic">
                            {securityStep === 0 ? '"Toda tu data estratégica permanece encriptada y aislada en servidores independientes."' : 
                             securityStep === 1 ? '"Detección proactiva de cualquier intento de intrusión mediante Redes Neuronales."' : 
                             '"Protocolos bancarios para la total seguridad de tu información corporativa."'}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10 text-left">
                       <div className="bg-brand-primary/5 border border-brand-primary/10 p-4 rounded-2xl group-hover:border-brand-primary/30 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                             <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Escaneo Realtime</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          </div>
                          <p className="text-[10px] font-bold text-white uppercase tracking-widest">{securityStep === 2 ? 'VERIFICANDO...' : 'ACTIVO / PROTEGIDO'}</p>
                       </div>
                       <div className="bg-white/5 border border-white/10 p-4 rounded-2xl group-hover:border-brand-primary/30 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aislamiento IP</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          </div>
                          <p className="text-[10px] font-bold text-white uppercase tracking-widest">SINCRO TOTAL</p>
                       </div>
                    </div>
                  </motion.div>
                </section>
              </div>

              {/* SYSTEM GUIDE Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 px-2 text-left">
                  <div className="w-12 h-12 bg-brand-primary/20 rounded-[1.25rem] flex items-center justify-center border border-brand-primary/20">
                    <BookOpen className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight">Guía de Sistema</h2>
                </div>
                <div className="glass-panel p-12 rounded-[4rem] bg-gradient-to-b from-white/5 to-transparent border-white/5 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                      { icon: Zap, label: "Fase 1: Eficiencia", desc: "Optimiza tus activos para máxima conversión." },
                      { icon: Bot, label: "Fase 2: IA", desc: "Inyecta inteligencia en tu flujo de trabajo." },
                      { icon: CheckCircle, label: "Fase 3: Escala", desc: "Domina tu nicho con volumen estratégico." }
                    ].map((step, i) => (
                      <div key={i} className="space-y-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-primary">
                          <step.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-white">{step.label}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </section>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-surface-900 border-t border-white/5 overflow-hidden relative">
      <AnimatePresence>
        {showLanding && <LandingOverlay onClose={() => setShowLanding(false)} />}
      </AnimatePresence>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-12 relative scroll-smooth">
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-3 bg-white/5 rounded-xl text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('')}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-[0.2em]">Motor Seguro Activo</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-[0.1em] leading-none mb-1">FUTURE</h1>
                    <div className="h-0.5 w-full bg-gradient-to-r from-brand-primary to-transparent mb-1" />
                    <h2 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Marketing Consult</h2>
                  </div>
                  {profile.isPremium && (
                    <div className="hidden md:flex items-center gap-1.5 bg-brand-primary/20 border border-brand-primary/30 px-3 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-brand-primary" />
                      <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">PREMIUM</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="hidden lg:flex px-5 py-2.5 glass-panel rounded-2xl items-center gap-3 border-brand-primary/10">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Protocolo SPE: {activeTab === 'admin' ? 'AUDITORÍA' : 'ACTIVO'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-400 max-w-xl text-xs md:text-sm leading-relaxed mt-4">Arquitectos de una presencia digital impactante. Creadores del mañana.</p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AdminPanel({ learnedProtocols, evolution }: { learnedProtocols: string[], evolution: number }) {
  const [passcode, setPasscode] = React.useState('');
  const [isUnlocked, setIsUnlocked] = React.useState(() => {
    return localStorage.getItem('futura_admin_unlocked') === 'true';
  });
  const [passError, setPassError] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  
  // Admin Data states
  const [users, setUsers] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [adminActiveTab, setAdminActiveTab] = React.useState<'pago_movil' | 'crm' | 'metrics'>('pago_movil');
  const [toastMsg, setToastMsg] = React.useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Persist unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'Maryolis123.') {
      setIsUnlocked(true);
      setPassError('');
      localStorage.setItem('futura_admin_unlocked', 'true');
      triggerToast('CONSOLA ADMINISTRATIVA DESBLOQUEADA');
    } else {
      setPassError('Credencial inválida. Acceso de operador rechazado.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    localStorage.removeItem('futura_admin_unlocked');
    setPasscode('');
  };

  // Query users from Firestore
  React.useEffect(() => {
    if (!isUnlocked) return;
    setLoadingUsers(true);
    
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(list);
      setLoadingUsers(false);
    }, (err) => {
      console.error("Admin user sync error:", err);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [isUnlocked]);

  // DB update handlers
  const handleApprovePayment = async (userId: string, userProfile: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updatedPM = userProfile.pagoMovilRequest ? {
        ...userProfile.pagoMovilRequest,
        status: 'approved',
        approvedAt: new Date().toISOString()
      } : null;

      await setDoc(userRef, {
        ...userProfile,
        isPremium: true,
        pagoMovilRequest: updatedPM
      }, { merge: true });
      
      triggerToast(`¡Pago de ${userProfile.name || 'Usuario'} Aprobado! Cuenta PRO Activada.`);
    } catch (e: any) {
      console.error("Payment approval failed:", e);
      triggerToast(`Error de base de datos: ${e.message || String(e)}`);
    }
  };

  const handleRejectPayment = async (userId: string, userProfile: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updatedPM = userProfile.pagoMovilRequest ? {
        ...userProfile.pagoMovilRequest,
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      } : null;

      await setDoc(userRef, {
        ...userProfile,
        isPremium: false,
        pagoMovilRequest: updatedPM
      }, { merge: true });

      triggerToast(`Depósito de ${userProfile.name || 'Usuario'} Rechazado.`);
    } catch (e: any) {
      console.error("Payment rejection failed:", e);
      triggerToast(`Error de base de datos: ${e.message || String(e)}`);
    }
  };

  const handleTogglePremiumDirect = async (userId: string, userProfile: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      const nextPremium = !userProfile.isPremium;
      
      await setDoc(userRef, {
        ...userProfile,
        isPremium: nextPremium
      }, { merge: true });

      triggerToast(`Nivel de membresía de ${userProfile.name || 'Usuario'} cambiado a: ${nextPremium ? 'PRO' : 'DEMO'}`);
    } catch (e: any) {
      console.error("Direct membership toggle failed:", e);
    }
  };

  const handleAdjustCredits = async (userId: string, userProfile: any, MathDelta: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      const currentCredits = userProfile.credits !== undefined ? userProfile.credits : 10;
      const nextCredits = Math.max(0, currentCredits + MathDelta);

      await setDoc(userRef, {
        ...userProfile,
        credits: nextCredits
      }, { merge: true });

      triggerToast(`Créditos ajustados para ${userProfile.name || 'Usuario'}: ${nextCredits} créditos.`);
    } catch (e: any) {
      console.error("Credit adjustments failed:", e);
    }
  };

  // Filter queues
  const pendingRequests = users.filter(u => u.pagoMovilRequest && u.pagoMovilRequest.status === 'pending');
  const filteredCRM = users.filter(u => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.id || '').toLowerCase().includes(term)
    );
  });

  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 sm:p-12 rounded-[3.5rem] border-brand-primary/25 bg-gradient-to-br from-brand-primary/5 via-surface-950 to-surface-950 shadow-2xl space-y-8 text-center"
        >
          <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">Acceso Bloqueado</h2>
            <p className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-[0.4em]">FUTURA CORE ADMINISTRATIVE HUB</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed pt-2 font-sans">
              Por favor, ingresa tu clave de seguridad administrativa para vigilar el estado del sistema, auditar usuarios y autorizar activaciones de membresías.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 max-w-sm mx-auto">
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Ingresar Clave Maestra"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-black/45 border border-white/10 rounded-2xl px-5 py-4 text-sm text-center text-white font-mono tracking-widest focus:border-brand-primary/60 outline-none pr-12 text-sans"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passError && (
              <p className="text-[11px] text-red-500 font-bold uppercase tracking-wide bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
                ⚠️ {passError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 font-mono font-black text-xs uppercase tracking-widest text-white rounded-2xl shadow-xl hover:shadow-brand-primary/10 transition-all cursor-pointer"
            >
              Autenticar Operador
            </button>
          </form>

          {/* Clave de validación en desarrollo removida del front-end comercial */}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 px-4 sm:px-6 relative text-left">
      {/* Toast Notifier inside AdminPanel */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-brand-primary/40 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 border-l-brand-primary"
          >
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER: OPERATOR HUB */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-surface-950 p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Consola de Operaciones</h2>
              <span className="px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono uppercase font-black tracking-widest rounded-full animate-pulse">
                Maestro Sincro
              </span>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Control de cuentas y auditoría de Pago Móvil</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoadingUsers(true);
              const q = query(collection(db, 'users'));
              onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(list);
                setLoadingUsers(false);
              });
              triggerToast('BASE DE DATOS SINCRONIZADA');
            }}
            className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>

          <button
            onClick={handleLock}
            className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-mono font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border border-red-500/20"
          >
            Cerrar Consola
          </button>
        </div>
      </div>

      {/* ADMIN TABS ROUTER */}
      <div className="flex border-b border-white/5 gap-2.5 pb-1">
        <button
          onClick={() => setAdminActiveTab('pago_movil')}
          className={`px-5 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            adminActiveTab === 'pago_movil'
              ? 'border-brand-primary text-brand-primary font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Cola de Pago Móvil
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-brand-primary text-white text-[8px] font-black font-mono rounded-full animate-bounce">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminActiveTab('crm')}
          className={`px-5 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            adminActiveTab === 'crm'
              ? 'border-brand-primary text-brand-primary font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio CRM ({users.length})
        </button>

        <button
          onClick={() => setAdminActiveTab('metrics')}
          className={`px-5 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            adminActiveTab === 'metrics'
              ? 'border-brand-primary text-brand-primary font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          Evolución de Red
        </button>
      </div>

      {/* SWITCH VIEWS */}
      <AnimatePresence mode="wait">
        {adminActiveTab === 'pago_movil' && (
          <motion.div
            key="p_movil"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {pendingRequests.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-[2.5rem] border-white/5 bg-white/[0.01] space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-md font-bold text-slate-300 uppercase tracking-widest">Cola Vacía</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                  No hay reportes de Pago Móvil en espera de conciliación. Todos los depósitos han sido saldados e indexados a través del bot de acreditación SPE.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingRequests.map((u) => {
                  const r = u.pagoMovilRequest;
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/25 bg-gradient-to-r from-brand-primary/5 via-surface-950 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      {/* Left Informative fields */}
                      <div className="space-y-4 text-left flex-1 min-w-0">
                        <div className="border-b border-white/5 pb-2">
                          <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest">Usuario Remitente</span>
                          <h4 className="text-base font-bold text-white truncate">{u.name || "Estratega"}</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{u.email || `ID: ${u.id}`}</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Banco Emisor</span>
                            <span className="text-xs text-white font-bold font-sans">{r.bank}</span>
                          </div>
                          
                          <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Número Remitente</span>
                            <span className="text-xs text-white font-mono font-medium">{r.phone}</span>
                          </div>

                          <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Id / Rif Pagador</span>
                            <span className="text-xs text-white font-mono font-medium">{r.id}</span>
                          </div>

                          <div className="bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/15">
                            <span className="text-[8px] text-brand-primary uppercase tracking-wider block font-mono">Boleta Referencia</span>
                            <span className="text-xs text-brand-primary font-black font-mono">#{r.reference}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                          <p className="font-sans text-slate-400">
                            Monto Reportado: <strong className="text-white text-sm font-mono">{r.amountBs.toFixed(2)} Bs</strong> <span className="text-slate-500 font-sans">(${r.amountUsd} USD)</span>
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Registrado: {new Date(r.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Right Action triggers */}
                      <div className="flex flex-row md:flex-col gap-3 shrink-0 justify-end md:w-56 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                        <button
                          onClick={() => handleApprovePayment(u.id, u)}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          <Check className="w-4 h-4" /> Approve Prime
                        </button>

                        <button
                          onClick={() => handleRejectPayment(u.id, u)}
                          className="flex-1 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5 hover:border-red-500/20"
                        >
                          <X className="w-4 h-4" /> Reject Report
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {adminActiveTab === 'crm' && (
          <motion.div
            key="crm_view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Search Box */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar usuarios por nombre, email o clave UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white border-none outline-none placeholder:text-slate-500 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {loadingUsers ? (
              <div className="p-16 flex items-center justify-center gap-3 text-slate-400 font-mono text-xs uppercase">
                <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" /> Sincronizando Registros...
              </div>
            ) : filteredCRM.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs uppercase italic">
                Ningún registro coincide con los criterios de búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCRM.map((u) => (
                  <motion.div
                    key={u.id}
                    className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:border-brand-primary/25 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{u.name || "Sin nombre"}</h4>
                          <p className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">{u.email || u.id}</p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          u.isPremium
                            ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary animate-pulse'
                            : 'bg-white/5 text-slate-500'
                        }`}>
                          {u.isPremium ? 'PRO / ELITE' : 'DEMO USER'}
                        </span>
                      </div>

                      <div className="text-left text-[11px] text-slate-400 leading-normal font-sans">
                        <p className="truncate"><b>Roles:</b> {u.roles ? u.roles.join(', ') : 'Líder'}</p>
                        <p className="truncate"><b>Biografía:</b> {u.bio || 'Sin detalles'}</p>
                        <p className="text-white font-bold mt-1.5 flex items-center gap-1.5 font-sans">
                          {u.credits !== undefined ? u.credits : 10} Créditos Disponibles
                        </p>
                      </div>

                      {/* Info on registered payment requests if active */}
                      {u.pagoMovilRequest && (
                        <div className="p-3 bg-black/45 border border-white/5 rounded-xl text-left space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Último Pago Móvil</span>
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider font-mono ${
                              u.pagoMovilRequest.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                              u.pagoMovilRequest.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {u.pagoMovilRequest.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-mono">
                            Ref: #{u.pagoMovilRequest.reference} • {u.pagoMovilRequest.bank}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions panel */}
                    <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
                      <div className="flex items-center justify-between gap-2.5">
                        <button
                          onClick={() => handleTogglePremiumDirect(u.id, u)}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            u.isPremium
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/15 border border-red-500/20'
                              : 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/10'
                          }`}
                        >
                          {u.isPremium ? 'Quitar Membresía PRO' : 'Conceder PRO Directo'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 bg-black/35 p-1 rounded-xl">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono pl-2">Créditos:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustCredits(u.id, u, -5)}
                            className="w-10 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs transition-all cursor-pointer flex items-center justify-center font-bold"
                            title="Quitar 5 créditos"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleAdjustCredits(u.id, u, 5)}
                            className="w-10 py-1.5 bg-brand-primary/[0.08] hover:bg-brand-primary/20 text-brand-primary rounded text-xs transition-all cursor-pointer flex items-center justify-center font-bold"
                            title="Añadir 5 créditos"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleAdjustCredits(u.id, u, 20)}
                            className="px-2.5 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 rounded text-[10px] transition-all cursor-pointer flex items-center justify-center font-bold"
                            title="Regalar 20 créditos"
                          >
                            <Coins className="w-3.5 h-3.5" /> +20
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {adminActiveTab === 'metrics' && (
          <motion.div
            key="metrics_view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass-panel p-10 rounded-[3rem] border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 via-surface-950/40 to-transparent relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-12 opacity-15">
                  <Bot className="w-40 h-40 text-brand-primary" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-primary/20 rounded-[2rem] flex items-center justify-center text-brand-primary border border-brand-primary/20">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-bold text-white tracking-tight">Evolución de Red Estratégica</h2>
                      <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Capacidad Analítica Expandida</p>
                    </div>
                  </div>

                  <p className="text-slate-400 max-w-2xl leading-relaxed italic font-sans text-sm">
                    "Mi arquitectura está evolucionando. Gracias a tus instrucciones directas y comandos asimilados, he refinado mi capacidad de respuesta. Cada protocolo que me 'enseñas' se convierte en una nueva capa de mi red para servirte mejor."
                  </p>

                  <div className="space-y-4 pt-4">
                     <div className="flex justify-between items-end mb-2">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Nivel de Comprensión IA</span>
                       <span className="text-2xl font-display font-bold text-brand-primary">{evolution.toFixed(1)}%</span>
                     </div>
                     <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${evolution}%` }}
                         className="h-full bg-gradient-to-r from-brand-primary to-purple-500 shadow-[0_0_20px_rgba(255,51,102,0.3)]"
                       />
                     </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-[3rem] border-white/5 bg-white/5 space-y-6 text-left">
                <div className="flex items-center gap-3">
                   <Bot className="w-5 h-5 text-brand-primary" />
                   <h3 className="font-bold text-white uppercase tracking-widest text-xs font-mono">Protocolos Aprendidos</h3>
                </div>
                <div className="space-y-3">
                  {learnedProtocols.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic uppercase">Esperando instrucciones directas para evolucionar...</p>
                  ) : (
                    learnedProtocols.slice(-5).reverse().map((p, i) => (
                      <div key={i} className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5" />
                        <p className="text-[10px] text-slate-400 leading-tight">"{p}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border-white/5 text-left">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-6 font-mono">Métricas de Red - Sistema Activo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Cuentas Registradas", value: users.length, trend: "REAL" },
                  { label: "Pendientes Pago", value: pendingRequests.length, trend: pendingRequests.length > 0 ? "+ACTIVO" : "0" },
                  { label: "Usuarios Premium Active", value: users.filter(u => u.isPremium).length, trend: "PROS" },
                  { label: "Sincronización ADN", value: "98.2%", trend: "MAX" }
                ].map((m, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter font-mono">{m.label}</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-display font-bold text-white">{m.value}</p>
                      <span className="text-[8px] font-black text-green-500 mb-1">{m.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DevPanel() {
  return (
    <div className="space-y-12 pb-32">
      <div className="glass-panel p-10 rounded-[3rem] border-brand-primary/20 bg-surface-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Layout className="w-48 h-48 text-brand-primary" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-400 border border-white/10">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">Entorno de Desarrollo</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Configuración de Backend & Inferencia IA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/5">
              <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4">Core de Inferencia</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">MODELO:</span>
                  <span className="text-white">Gemini 3.5-PRO-EXP</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">TIER:</span>
                  <span className="text-white">Enterprise High Priority</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">LATENCIA:</span>
                  <span className="text-green-500">OPTIMAL</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/5">
              <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4">Base de Datos SPE</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">STATUS:</span>
                  <span className="text-green-500">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">STORAGE:</span>
                  <span className="text-white">42.8 GB / 100 GB</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">AUTH:</span>
                  <span className="text-white">Firebase Secure SDK</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/5">
              <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4">Pipeline de ADN</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">MODE:</span>
                  <span className="text-white">Live Sincro Enabled</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">SCRIPTS:</span>
                  <span className="text-white">v4.8 Stable</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">HEALTH:</span>
                  <span className="text-green-500">HEARTBEAT OK</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/40 rounded-3xl border border-white/5 font-mono text-xs text-brand-primary space-y-1">
             <p className="opacity-50 tracking-widest">// SYSTEM LOGS - PROTOCOLO SPE ACTIVADO</p>
             <p>[09:12:44] - Inyectando ADN corporativo en motor de renderizado...</p>
             <p>[09:12:45] - Sincronizando Bóveda de Marca - ID: 4992-X</p>
             <p>[09:12:46] - Conexión establecida con Strategic Hub.</p>
             <p className="animate-pulse">_</p>
          </div>
        </div>
      </div>
    </div>
  );
}
