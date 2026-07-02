/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { chatWithAdvisor } from './services/geminiService';
import Sidebar from './components/Sidebar';
import ProjectManager from './components/ProjectManager';
import MembershipPlans from './components/MembershipPlans';
import Gallery from './components/Gallery';
import Profile from './components/Profile';
import AuthWrapper from './components/AuthWrapper';
import AdvisoryHub from './components/AdvisoryHub';
import CreativeStudio from './components/CreativeStudio';
import AccountAuthPortal from './components/AccountAuthPortal';
import DevStation from './components/DevStation';
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
  Terminal,
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
  Rocket,
  RefreshCw,
  EyeOff,
  UserCheck,
  Coins,
  DollarSign,
  Users,
  HelpCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import LandingOverlay from './components/LandingOverlay';
import { useAuth } from './components/AuthWrapper';
import { AccountProvider } from './components/AccountProvider';

import { db } from './lib/firebase';
import { doc, setDoc, onSnapshot, collection, query, where, addDoc, deleteDoc } from 'firebase/firestore';

interface DashboardInputProps {
  value: string;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

function DashboardInput({ value, onSubmit, isLoading }: DashboardInputProps) {
  const [localVal, setLocalVal] = React.useState(value);

  React.useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localVal.trim()) {
      onSubmit(localVal);
      setLocalVal('');
    }
  };

  return (
    <div className="relative group max-w-3xl mx-auto pt-2">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
      <div className="relative flex flex-col sm:flex-row items-center gap-3 bg-surface-950 border border-white/10 p-2 rounded-2xl shadow-3xl group-focus-within:border-brand-primary/40 transition-all">
        <input 
          type="text"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          placeholder="Consulta sobre tu estrategia corporativa..."
          className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 text-sm placeholder:text-slate-700 outline-none w-full"
          onKeyDown={handleKeyDown}
        />
        <div className="flex w-full sm:w-auto gap-3 p-1 sm:p-0">
          <button 
            onClick={() => {
              if (localVal.trim()) {
                onSubmit(localVal);
                setLocalVal('');
              }
            }}
            disabled={isLoading || !localVal.trim()}
            className="flex-1 sm:w-auto px-6 py-3 bg-brand-primary disabled:opacity-40 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/30 w-full cursor-pointer"
          >
            CONSULTAR
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthWrapper>
      <AccountProvider>
        <AppContent />
      </AccountProvider>
    </AuthWrapper>
  );
}

const virtualFuturaBrand: ProjectContext = {
  id: 'futura_brand_vault',
  name: 'FUTURA (Auto-Marketing SPE)',
  description: 'Consultora Estratégica y Suite de IA Avanzada de Future Marketing Consult enfocada en el lema "Resultados sobre Estética". Es un robot pensante y generador de activos de alta conversión bajo la metodología SPE para dominar el mercado hispanohablante de infoproductores y agencias de marketing, capturando clientes listos para pagar.',
  logos: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop'],
  trainingMaterial: [
    'Mantra central: Resultados sobre Estética.',
    'Metodología base: Sistema Pentagonal de Ejecución (SPE).',
    'Gancho clave: Deja de crear contenido que solo le gusta a tu mamá y empieza a capturar clientes reales.',
    'Paleta de diseño recomendada: Fucsia eléctrico, Violeta y Slate profundo con gran espacio negativo.',
    'Enfoque promocional: Destrucción de fricciones de compra mediante la consultoría y la IA de nivel ultra-élite.'
  ],
  methodology: 'SPE',
  brandGuidelines: {
    primaryColor: '#BF5AF2',
    secondaryColor: '#0A0A0C',
    tone: 'Persuasivo brutal de alta conversión, de élite educadora y analítico pragmático'
  }
};

function AppContent() {
  const { user, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [isSimplifiedMode, setIsSimplifiedMode] = useState(() => {
    return localStorage.getItem('futura_simplified_mode') === 'true';
  });
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
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

  // Scroll to top when tab changes or when landing closes
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
  }, [activeTab, showLanding]);

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
  const [onboardingPath, setOnboardingPath] = React.useState<'no-brand' | 'has-brand'>('no-brand');
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
    if (!user) {
      setProjectsList([virtualFuturaBrand]);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProjectsList([virtualFuturaBrand, ...projs]);
    }, (err) => {
      console.error("Failed to fetch projects in Hub context:", err);
      setProjectsList([virtualFuturaBrand]);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      setHubMessages(prev => [...prev, { 
        role: 'model', 
        text: `⚠️ He experimentado una interrupción en mi flujo estratégico. Detalle del error: **${errorMessage}**. Por favor, reintenta tu consulta.` 
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
        let loaded = docSnap.data() as UserProfile;
        if (user.email?.toLowerCase() === 'heczaroficial@gmail.com') {
          // Absolute owner administrative override
          loaded = {
            ...loaded,
            roles: ["Líder", "Administrador Principal", "Estratega Supremo"],
            isPremium: true,
            membershipMonths: 9999,
            membershipExpiresAt: "2050-12-31T00:00:00.000Z",
            credits: loaded.credits !== undefined && loaded.credits > 1000 ? loaded.credits : 999999
          };
          // Sync automatically back to Firestore if not matching
          if (!docSnap.data().isPremium || !docSnap.data().membershipExpiresAt || (docSnap.data().credits || 0) < 1000) {
            setDoc(docRef, loaded, { merge: true }).catch(err => console.error("Admin auto sync back err:", err));
          }
        }
        setProfile(loaded);
      } else {
        const isMaster = user.email?.toLowerCase() === 'heczaroficial@gmail.com';
        const initialProfile: UserProfile = {
          name: user.displayName || (isMaster ? "Heczar (Director)" : "Estratega"),
          roles: isMaster ? ["Líder", "Administrador Principal", "Estratega Supremo"] : ["Líder"],
          bio: isMaster ? "Propietario y titular absoluto del sistema FUTURA." : "Sin biografía definida.",
          philosophy: "Results over Aesthetics.",
          projects: [],
          credits: isMaster ? 999999 : 10,
          isPremium: isMaster,
          membershipMonths: isMaster ? 9999 : 1,
          membershipExpiresAt: isMaster ? "2050-12-31T00:00:00.000Z" : null,
          email: user.email || ""
        };
        setDoc(docRef, initialProfile);
        setProfile(initialProfile);
      }
    }, (err) => {
      console.error("Failed to fetch user profile in App context, using initial state:", err);
      // Fallback: build standard default profile for this user
      const isMaster = user.email?.toLowerCase() === 'heczaroficial@gmail.com';
      setProfile({
        name: user.displayName || (isMaster ? "Heczar (Director)" : "Estratega"),
        roles: isMaster ? ["Líder", "Administrador Principal", "Estratega Supremo"] : ["Líder"],
        bio: isMaster ? "Propietario y titular absoluto del sistema FUTURA." : "Sin biografía definida.",
        philosophy: "Results over Aesthetics.",
        projects: [],
        credits: isMaster ? 999999 : 10,
        isPremium: isMaster,
        membershipMonths: isMaster ? 9999 : 1,
        membershipExpiresAt: isMaster ? "2050-12-31T00:00:00.000Z" : null,
        email: user.email || ""
      });
    });

    return () => unsubscribe();
  }, [user]);

  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(item => sanitizeForFirestore(item));
    if (typeof obj === 'object') {
      const copy: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        copy[key] = obj[key] === undefined ? null : sanitizeForFirestore(obj[key]);
      }
      return copy;
    }
    return obj;
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    const sanitized = sanitizeForFirestore(newProfile);
    setProfile(sanitized);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), sanitized, { merge: true });
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
      ],
      prompt: 'Necesito asistencia táctica integral y consultoría de nivel élite sobre la fase de Investigación (Análisis de Mercado y Auditoría de Competidores) para identificar vacíos y superar a mis competidores bajo la metodología SPE.'
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
      ],
      prompt: 'Necesito asistencia táctica integral y consultoría de nivel élite sobre la fase de Estrategia (Plan de Impacto SPE) para definir de manera contundente la Propuesta de Valor Única (PVU) de mi marca con el sistema SPE.'
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
      ],
      prompt: 'Necesito asistencia táctica integral y consultoría de nivel élite sobre la fase de Despliegue (Materialización de Activos de Alto Impacto) para producir copies persuasivos y consistencia de marca bajo las pautas del sistema SPE.'
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
      ],
      prompt: 'Necesito asistencia táctica integral y consultoría de nivel élite sobre la fase de Optimización (Análisis de Rendimiento Reales) para la lectura adecuada de métricas, pruebas A/B y refinamiento técnico bajo la metodología SPE.'
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
      ],
      prompt: 'Necesito asistencia táctica integral y consultoría de nivel élite sobre la fase de Escalamiento (Expansión y Crecimiento Vertical) para realizar una inversión publicitaria inteligente y consolidar mi dominio de nicho con el sistema SPE.'
    }
  ];

  const renderDashboardView = () => {
    const brandsCount = projectsList.length > 1 ? projectsList.length - 1 : 0; // Exclude virtual brand
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        {/* Welcome Section */}
        <section className="p-5 md:p-6 bg-gradient-to-br from-brand-primary/10 via-surface-950/40 to-transparent border border-white/5 rounded-3xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-32 h-32 text-brand-primary" />
          </div>
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-brand-primary uppercase tracking-widest">Panel de Control General</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Bienvenido, <span className="text-brand-primary">{profile?.name || 'Líder'}</span>
            </h2>
            <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed max-w-2xl">
              Accede de forma directa a tus herramientas de consultoría, redacción publicitaria y creación visual de alto rendimiento.
            </p>
          </div>

          {/* User Credits Status */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5 relative z-10">
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Créditos de IA</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {profile?.credits === 999999 ? 'Ilimitados 👑' : `${profile?.credits || 0} Restantes`}
              </span>
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Marcas Registradas</span>
              <span className="text-base font-bold text-white mt-0.5 block">{brandsCount} Activas</span>
            </div>
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl col-span-2 md:col-span-1">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Nivel de Cuenta</span>
              <span className="text-base font-bold text-brand-primary mt-0.5 block">
                {profile?.isPremium ? 'Acceso Premium' : 'Plan Básico'}
              </span>
            </div>
          </div>
        </section>

        {/* Services / Consoles Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-sans">
          {/* Card 1: Advisory & Copy Hub */}
          <div 
            onClick={() => setActiveTab('hub')}
            className="group cursor-pointer p-5 bg-surface-900/30 border border-white/5 hover:border-brand-primary/30 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all hover:bg-surface-900/50 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 p-3 font-mono text-4xl font-black text-white/5 group-hover:text-brand-primary/5 transition-colors pointer-events-none">CODELAB</div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-sm tracking-wide uppercase">Asesoría & Copys</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Conéctate con tu estratega corporativo de IA para analizar ideas de negocio, debatir enfoques comerciales y redactar copys persuasivos en segundos.
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold text-brand-primary tracking-widest">
              <span>Abrir Consola</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Creative Studio */}
          <div 
            onClick={() => setActiveTab('studio')}
            className="group cursor-pointer p-5 bg-surface-900/30 border border-white/5 hover:border-brand-primary/30 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all hover:bg-surface-900/50 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 p-3 font-mono text-4xl font-black text-white/5 group-hover:text-brand-primary/5 transition-colors pointer-events-none">STUDIO</div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-sm tracking-wide uppercase">Estudio Creativo</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Genera logotipos vectoriales de gran diseño, ilustra imágenes promocionales hiper-realistas para tus redes sociales y edítalos con el lienzo de dibujo.
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold text-brand-primary tracking-widest">
              <span>Abrir Consola</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </section>

        {/* PROTOCOLO SPE EN EL INICIO */}
        <section className="spe-section pt-1">
          <div className="flex items-center gap-2 mb-4 text-left">
            <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
            <h2 className="text-lg md:text-xl font-bold font-display text-white">Sistema Pentagonal de Ejecución (SPE)</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 font-sans">
            {spePhases.map((phase, i) => (
              <div 
                key={phase.name}
                onClick={() => {
                  setSelectedPhase(phase);
                }}
                className="glass-panel p-4 rounded-2xl hover:bg-white/5 cursor-pointer border border-white/5 hover:border-brand-primary/30 transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1.5 font-mono text-2xl font-black text-white/5 group-hover:text-brand-primary/5 transition-colors pointer-events-none">0{i+1}</div>
                <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-105", phase.color)}>
                  <phase.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm mb-0.5 text-white">{phase.name}</h3>
                <p className="text-[10px] text-slate-400 leading-normal">{phase.desc}</p>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 text-[8.5px] font-bold text-brand-primary opacity-90 transition-opacity">
                  VER MÁS <ChevronRight className="w-2.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#050505] border-t border-white/5 relative w-full max-w-full overflow-x-hidden">
      {/* Dynamic Absolute Background-Glows to eliminate black vacuums and scroll blackouts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 h-full w-full bg-[#050505]">
        {/* Ambient grids / dot matrix background for ultra-modern digital depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Soft glowing ambient orbs */}
        <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[30%] rounded-full bg-brand-primary/8 blur-[130px] opacity-70" />
        <div className="absolute bottom-[5%] right-[-10%] w-[60%] h-[30%] rounded-full bg-brand-secondary/4 blur-[150px] opacity-60" />
        <div className="absolute top-[35%] right-[15%] w-[40%] h-[30%] rounded-full bg-[#8B5CF6]/5 blur-[120px] opacity-50" />
        <div className="absolute bottom-[25%] left-[10%] w-[50%] h-[25%] rounded-full bg-brand-primary/4 blur-[140px] opacity-40" />
      </div>

      <AnimatePresence>
        {showLanding && <LandingOverlay onClose={() => setShowLanding(false)} />}
      </AnimatePresence>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <main ref={mainRef} className="flex-1 min-w-0 max-w-full overflow-x-hidden p-4 md:p-12 pb-12 md:pb-16 relative bg-transparent selection:bg-brand-primary/20 z-10">
        <header className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/25 rounded-lg text-white transition-all active:scale-95 text-xs font-mono font-bold tracking-wider relative overflow-hidden group shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-purple-600/10 to-brand-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Menu className="w-3.5 h-3.5 text-brand-primary animate-pulse shrink-0" />
                <span className="text-[8.5px] font-black uppercase text-brand-primary tracking-widest pl-0.5">MENÚ ☰</span>
                <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-brand-primary rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-brand-primary rounded-full" />
              </button>
              
              <div className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('')}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-[0.2em]">Motor Seguro Activo</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-left">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-[0.1em] leading-none mb-1">FUTURE</h1>
                    <div className="h-0.5 w-full bg-gradient-to-r from-brand-primary to-transparent mb-1" />
                    <h2 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Marketing Consult</h2>
                  </div>
                  {profile?.isPremium && (
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
        </header>

        <div className="w-full min-h-[calc(100vh-16rem)] flex flex-col justify-start relative">
          {/* HOME / DASHBOARD */}
          <div className={cn("w-full transition-all duration-150", (activeTab === '' || activeTab === 'dashboard') ? "block opacity-100" : "hidden opacity-0")}>
            {renderDashboardView()}
          </div>

          {/* ASESORÍA & COPYS */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'hub' ? "block opacity-100" : "hidden opacity-0")}>
            <AdvisoryHub 
              profile={profile} 
              projectsList={projectsList} 
              onUpdateProfile={handleUpdateProfile} 
              setActiveTab={setActiveTab}
              setDashboardPrompt={setDashboardPrompt}
              initialPrompt={dashboardPrompt}
              onPromptConsumed={() => setDashboardPrompt('')}
            />
          </div>

          {/* ESTUDIO CREATIVO */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'studio' ? "block opacity-100" : "hidden opacity-0")}>
            <CreativeStudio 
              profile={profile} 
              projectsList={projectsList} 
              onUpdateProfile={handleUpdateProfile} 
              setActiveTab={setActiveTab}
            />
          </div>

          {/* BAÚL DE MARCA / PROJECT MANAGER */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'vault' ? "block opacity-100" : "hidden opacity-0")}>
            <ProjectManager 
              profile={profile} 
              onUpdateProfile={handleUpdateProfile}
            />
          </div>

          {/* GALERÍA */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'gallery' ? "block opacity-100" : "hidden opacity-0")}>
            <Gallery />
          </div>

          {/* MEMBERSHIP PLANS */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'pro' ? "block opacity-100" : "hidden opacity-0")}>
            <MembershipPlans profile={profile} onUpdateProfile={handleUpdateProfile} />
          </div>

          {/* PROFILE */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'profile' ? "block opacity-100" : "hidden opacity-0")}>
            <Profile />
          </div>

          {/* ADMIN PANEL */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'admin' ? "block opacity-100" : "hidden opacity-0")}>
            <AdminPanel 
              learnedProtocols={learnedProtocols} 
              evolution={neuralEvolution} 
              profile={profile} 
              onUpdateProfile={handleUpdateProfile} 
            />
          </div>

          {/* DEV PANEL */}
          <div className={cn("w-full transition-all duration-150", activeTab === 'dev' ? "block opacity-100" : "hidden opacity-0")}>
            {user?.email?.toLowerCase() !== 'heczaroficial@gmail.com' ? (
              <div className="flex flex-col items-center justify-center p-12 min-h-[50vh] text-center space-y-4">
                <Lock className="w-16 h-16 text-brand-primary animate-pulse" />
                <h2 className="text-xl font-bold font-display text-white">ACCESO EXCLUSIVO DE ADMINISTRADOR</h2>
                <p className="text-xs text-slate-400 max-w-md">FUTURA ha restringido el aprovisionamiento de claves API personalizadas. Este panel solo se encuentra habilitado para el Administrador Principal (heczaroficial@gmail.com).</p>
              </div>
            ) : (
              <DevPanel />
            )}
          </div>
        </div>
      </main>

      {/* Floating Mobile Navigation Button (FAB) for seamless guidance as users scroll */}
      <div className="md:hidden fixed bottom-5 right-5 z-[99] pointer-events-none">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="pointer-events-auto w-10 h-10 bg-gradient-to-r from-brand-primary to-purple-600 border border-brand-primary/40 rounded-full text-white shadow-xl active:scale-90 hover:scale-105 transition-all flex items-center justify-center relative overflow-hidden group shadow-brand-primary/20"
          title="Abrir menú de módulos de FUTURA"
        >
          <Menu className="w-4 h-4 text-white animate-pulse" />
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* SPE PHASE DETAIL MODAL (Viewport root) */}
      <AnimatePresence>
        {selectedPhase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedPhase(null)} 
              className="absolute inset-0 bg-black/40" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative w-full max-w-lg bg-surface-800 border border-white/10 shadow-2xl rounded-2xl md:rounded-[2rem] p-6 md:p-8 space-y-6 text-left overflow-y-auto max-h-[90vh] z-10"
            >
               <button 
                 onClick={() => setSelectedPhase(null)}
                 className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5"
               >
                 <X className="w-4 h-4" />
               </button>

               <div className="flex items-center gap-4 pr-6">
                 <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-md shrink-0", selectedPhase.color)}>
                   <selectedPhase.icon className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight leading-tight">{selectedPhase.title}</h2>
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] mt-0.5">Fase SPE: {selectedPhase.name}</p>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <p className="text-slate-300 leading-relaxed text-xs md:text-sm">
                   {selectedPhase.longDesc}
                 </p>
                 
                 <div className="space-y-2 pt-1">
                   <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest font-mono">Protocolos de Ejecución</h4>
                   <ul className="space-y-2">
                      {selectedPhase.points.map((point: string, i: number) => (
                        <li key={i} className="flex gap-2.5 items-start">
                          <div className="w-4 h-4 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                            <CheckCircle className="w-2.5 h-2.5 text-brand-primary" />
                          </div>
                          <p className="text-xs text-slate-400 font-sans leading-relaxed">{point}</p>
                        </li>
                      ))}
                   </ul>
                 </div>
               </div>

               <div className="pt-2">
                 <button 
                   onClick={() => setSelectedPhase(null)}
                   className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                 >
                   Entendido
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminPanel({ learnedProtocols, evolution, profile, onUpdateProfile }: { learnedProtocols: string[], evolution: number, profile: any, onUpdateProfile: (p: any) => void }) {
  const { user, signIn } = useAuth();
  const [passcode, setPasscode] = React.useState('');
  const [isUnlocked, setIsUnlocked] = React.useState(() => {
    return localStorage.getItem('futura_admin_unlocked') === 'true';
  });
  const [passError, setPassError] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);

  // Auto-unlock for Heczar (owner and absolute administrator)
  React.useEffect(() => {
    const email = user?.email?.toLowerCase();
    if (email === 'heczaroficial@gmail.com') {
      setIsUnlocked(true);
      localStorage.setItem('futura_admin_unlocked', 'true');
    }
  }, [user]);
  
  // Admin Data states
  const [users, setUsers] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [adminActiveTab, setAdminActiveTab] = React.useState<'payment_reports' | 'member_console' | 'crm' | 'advisory' | 'metrics' | 'dev_station'>('payment_reports');
  const [toastMsg, setToastMsg] = React.useState('');
  const [deleteConfirmUserId, setDeleteConfirmUserId] = React.useState<string | null>(null);

  // User inline editing state
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editFormName, setEditFormName] = React.useState('');
  const [editFormEmail, setEditFormEmail] = React.useState('');
  const [editFormCredits, setEditFormCredits] = React.useState(10);
  const [editFormIsPremium, setEditFormIsPremium] = React.useState(false);
  const [editFormMonths, setEditFormMonths] = React.useState(1);
  const [editFormExpiresAt, setEditFormExpiresAt] = React.useState('');

  const startEditingUser = (u: any) => {
    setEditingUserId(u.id);
    setEditFormName(u.name || '');
    setEditFormEmail(u.email || '');
    setEditFormCredits(u.credits !== undefined ? u.credits : 10);
    setEditFormIsPremium(!!u.isPremium);
    setEditFormMonths(u.membershipMonths !== undefined ? u.membershipMonths : 1);
    
    if (u.membershipExpiresAt) {
      setEditFormExpiresAt(u.membershipExpiresAt.substring(0, 10));
    } else {
      const defaultExp = new Date();
      defaultExp.setMonth(defaultExp.getMonth() + 1);
      setEditFormExpiresAt(defaultExp.toISOString().substring(0, 10));
    }
  };

  const handleSaveUserEdit = async (userId: string, originalUser: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      let finalExpiresAt = originalUser.membershipExpiresAt || null;
      if (editFormIsPremium) {
        finalExpiresAt = new Date(editFormExpiresAt).toISOString();
      }

      await setDoc(userRef, {
        ...originalUser,
        name: editFormName.trim(),
        email: editFormEmail.trim().toLowerCase(),
        credits: Number(editFormCredits),
        isPremium: editFormIsPremium,
        membershipMonths: Number(editFormMonths),
        membershipExpiresAt: finalExpiresAt
      }, { merge: true });

      triggerToast(`FUTURA: Perfil de ${editFormName} actualizado.`);
      setEditingUserId(null);
    } catch (e: any) {
      console.error("Save user update failed:", e);
      triggerToast(`Error al guardar: ${e.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`⚠️ ¿Deseas eliminar definitivamente la cuenta de ${userName || 'este usuario'}? Esta acción es irreversible.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      triggerToast(`FUTURA: Cuenta de ${userName} permanentemente eliminada.`);
    } catch (e: any) {
      console.error("Failed to delete user account:", e);
      triggerToast(`Error al eliminar cuenta: ${e.message}`);
    }
  };

  // FUTURA Admin Consultation Chat (Hub Interno FUTURA)
  const [adminChatHistory, setAdminChatHistory] = React.useState<{role: 'user' | 'model', text: string}[]>(() => {
    try {
      const saved = localStorage.getItem('futura_admin_chat_history');
      return saved ? JSON.parse(saved) : [
        {
          role: 'model',
          text: '¡Hola Operador! Bienvenido a la consola de control estratégico interno de FUTURA. Desde aquí puedes hablar directamente conmigo para planificar nuevas directrices, idear campañas tácticas de mercadeo o resolver dudas sobre la operación del sistema.'
        }
      ];
    } catch {
      return [
        {
          role: 'model',
          text: '¡Hola Operador! Bienvenido a la consola de control estratégico interno de FUTURA. Desde aquí puedes hablar directamente conmigo para planificar nuevas directrices, idear campañas tácticas de mercadeo o resolver dudas sobre la operación del sistema.'
        }
      ];
    }
  });
  const [adminChatPrompt, setAdminChatPrompt] = React.useState('');
  const [isAdminChatLoading, setIsAdminChatLoading] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('futura_admin_chat_history', JSON.stringify(adminChatHistory));
  }, [adminChatHistory]);

  const handleAdminChatSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = adminChatPrompt.trim();
    if (!promptText || isAdminChatLoading) return;

    const newHist = [...adminChatHistory, { role: 'user' as const, text: promptText }];
    setAdminChatHistory(newHist);
    setAdminChatPrompt('');
    setIsAdminChatLoading(true);

    try {
      const response = await chatWithAdvisor(
        promptText, 
        adminChatHistory,
        "Consola de administración de FUTURA. El usuario actual es el operador o administrador principal de la plataforma. Ayúdalo a idear estrategias de crecimiento, redactar copy para redes, planificar respuestas, idear campañas de mercadeo internas u resolver dudas operativas del software de manera audaz."
      );
      setAdminChatHistory([...newHist, { role: 'model' as const, text: response }]);
    } catch (error: any) {
      console.error("Error talking to Futura inside Admin Panel:", error);
      setAdminChatHistory([...newHist, { role: 'model' as const, text: "Hubo un error de sincronización de datos con mi núcleo cognitivo. Por favor, reintenta en breve." }]);
    } finally {
      setIsAdminChatLoading(false);
    }
  };

  const handleClearAdminChat = () => {
    setAdminChatHistory([
      {
        role: 'model',
        text: '¡Consola de conversación reiniciada! ¿Cuál es el siguiente paso para escalar nuestra plataforma, operador?'
      }
    ]);
  };

  // Manual membership direct action states
  const [manualUserId, setManualUserId] = React.useState('');
  const [manualUserEmail, setManualUserEmail] = React.useState('');
  const [manualProposedPremium, setManualProposedPremium] = React.useState<'premium' | 'demo'>('premium');

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
      setAdminActiveTab('payment_reports');
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
    if (!isUnlocked || !user) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }
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
      console.warn("Admin user sync query skipped/denied (Requires Google SignIn or permissions):", err.message);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [isUnlocked, user]);

  // DB update handlers
  const handleApprovePayment = async (userId: string, userProfile: any, months: number = 1) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updatedPM = userProfile.pagoMovilRequest ? {
        ...userProfile.pagoMovilRequest,
        status: 'approved',
        approvedAt: new Date().toISOString()
      } : null;

      const expiration = new Date();
      expiration.setMonth(expiration.getMonth() + months);

      await setDoc(userRef, {
        ...userProfile,
        isPremium: true,
        membershipMonths: months,
        membershipExpiresAt: expiration.toISOString(),
        pagoMovilRequest: updatedPM
      }, { merge: true });
      
      triggerToast(`¡Pago de ${userProfile.name || 'Usuario'} Aprobado (${months} ${months === 1 ? 'mes' : 'meses'} FUTURA PRO)!`);
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

  const handleArchivePayment = async (userId: string, userProfile: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userProfile,
        pagoMovilRequest: null
      }, { merge: true });

      triggerToast("Reporte de pago archivado de la cola de verificación.");
    } catch (e: any) {
      console.error("Archiving payment failed:", e);
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

  const getRemainingMembershipTime = (expiresAtStr?: string) => {
    if (!expiresAtStr) return "Sin límite / No configurado";
    const now = new Date();
    const exp = new Date(expiresAtStr);
    const diffTime = exp.getTime() - now.getTime();
    if (diffTime <= 0) return "Expirada ✕";
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} ${months === 1 ? 'mes' : 'meses'} y ${days} ${days === 1 ? 'día' : 'días'} restantes`;
    }
    return `${diffDays} ${diffDays === 1 ? 'día' : 'días'} restantes`;
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

      {!user && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Sesión Desconectada
            </h4>
            <p className="text-xs text-slate-400">
              Has desbloqueado la consola, pero no tienes sesión iniciada en Google. Para poder consultar, sincronizar o modificar registros de usuario, debes identificarte primero.
            </p>
          </div>
          <button
            onClick={signIn}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
          >
            Iniciar Sesión con Google
          </button>
        </div>
      )}

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
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Control de cuentas y auditoría de membresías Binance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!user) {
                triggerToast('⚠️ Error: Debes iniciar sesión de Google primero.');
                return;
              }
              setLoadingUsers(true);
              const q = query(collection(db, 'users'));
              const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(list);
                setLoadingUsers(false);
                triggerToast('BASE DE DATOS SINCRONIZADA');
              }, (err) => {
                console.error("Manual user sync failed:", err);
                setLoadingUsers(false);
                triggerToast('⚠️ Error: Permisos de base de datos denegados.');
              });
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-white/5 gap-2 pb-2.5 pt-4">
        <button
          onClick={() => setAdminActiveTab('payment_reports')}
          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminActiveTab === 'payment_reports'
              ? 'border-brand-primary text-brand-primary font-black bg-brand-primary/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-t-xl'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-brand-primary" />
          Reportes de Pago
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[8px] font-black font-mono rounded-full animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminActiveTab('member_console')}
          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminActiveTab === 'member_console'
              ? 'border-brand-primary text-brand-primary font-black bg-brand-primary/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-t-xl'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-brand-primary" />
          Membresías Directas
        </button>

        <button
          onClick={() => setAdminActiveTab('crm')}
          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminActiveTab === 'crm'
              ? 'border-brand-primary text-brand-primary font-black bg-brand-primary/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-t-xl'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Directorio CRM
        </button>

        <button
          onClick={() => setAdminActiveTab('advisory')}
          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminActiveTab === 'advisory'
              ? 'border-brand-primary text-brand-primary font-black bg-brand-primary/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-t-xl'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
          Hub Interno
        </button>

        <button
          onClick={() => setAdminActiveTab('dev_station')}
          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminActiveTab === 'dev_station'
              ? 'border-brand-primary text-brand-primary font-black bg-brand-primary/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-t-xl'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Estación IA
        </button>

        <button
          onClick={() => setAdminActiveTab('metrics')}
          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminActiveTab === 'metrics'
              ? 'border-brand-primary text-brand-primary font-black bg-brand-primary/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-t-xl'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Evolución Red
        </button>
      </div>

      {/* SWITCH VIEWS */}
      <AnimatePresence mode="wait">
        {adminActiveTab === 'advisory' && (
          <motion.div
            key="advisory_tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-left"
          >
            {/* HUB INTERNO FUTURA CONSOLE */}
            <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 via-surface-950/70 to-transparent flex flex-col md:flex-row gap-6 min-h-[620px]">
              
              {/* Left Column: Metadata & Administration Instructions */}
              <div className="md:w-72 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                      <Sparkles className="w-5 h-5 animate-pulse text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">Hub Interno FUTURA</h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Consultoría Cognitiva del Software</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Esta es tu consola de consultoría de IA privada como administrador de FUTURA. Hazle consultas para potenciar el marketing interno del sistema, redactar guías y copies para campañas de tu marca, o resolver dudas de arquitectura digital.
                  </p>

                  <div className="space-y-3 pt-2">
                    <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest pl-1">Sujerencias de Consultas</span>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminChatPrompt("Genérame una campaña de marketing directo de 3 pasos por correo para invitar a los usuarios demo a activar el plan FUTURA PRO.")}
                        className="text-left p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-primary/20 text-[10px] text-slate-400 font-sans hover:text-white transition-all cursor-pointer"
                      >
                        📬 Campaña de Email para PRO
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminChatPrompt("Redacta un anuncio en tono 'Brutalist Persuasion' para redes sociales invitando a emprendedores a sumarse a FUTURA.")}
                        className="text-left p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-primary/20 text-[10px] text-slate-400 font-sans hover:text-white transition-all cursor-pointer"
                      >
                        🔥 Anuncio Brutalista de Tráfico
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminChatPrompt("¿Cuáles son los 5 ganchos o hooks de mayor conversión comercial para videos de Reels en TikTok e Instagram actualmente?")}
                        className="text-left p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-primary/20 text-[10px] text-slate-400 font-sans hover:text-white transition-all cursor-pointer"
                      >
                        📈 Hooks de Alta Conversión
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={handleClearAdminChat}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-mono font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer border border-red-500/10"
                  >
                    Reiniciar Conversación
                  </button>
                </div>
              </div>

              {/* Right Column: Chat Stream Engine */}
              <div className="flex-1 flex flex-col justify-between min-h-[500px] md:h-[580px]">
                
                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-4 max-h-[460px] custom-scrollbar">
                  {adminChatHistory.map((item, idx) => {
                    const isModel = item.role === 'model';
                    return (
                      <motion.div
                        key={idx}
                        className={`flex gap-3 max-w-xl ${isModel ? 'mr-auto text-left' : 'ml-auto text-right flex-row-reverse'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isModel 
                            ? 'bg-brand-primary/10 border border-brand-primary/25 text-brand-primary' 
                            : 'bg-white/10 border border-white/15 text-white'
                        }`}>
                          {isModel ? <Sparkles className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </div>

                        <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                          isModel
                            ? 'bg-surface-900/40 border border-white/5 text-slate-300'
                            : 'bg-brand-primary/10 border border-brand-primary/30 text-white'
                        }`}>
                          <p className="whitespace-pre-line">{item.text}</p>
                        </div>
                      </motion.div>
                    );
                  })}

                  {isAdminChatLoading && (
                    <motion.div
                      className="flex gap-3 max-w-xl mr-auto text-left"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/25 text-brand-primary flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-900/40 border border-white/5 text-slate-500 text-xs italic">
                        FUTURA está procesando tu estrategia administrativa...
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleAdminChatSend} className="relative mt-auto border-t border-white/5 pt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pregúntale a Futura sobre marketing, administración, copias y estrategias..."
                      value={adminChatPrompt}
                      onChange={(e) => setAdminChatPrompt(e.target.value)}
                      className="flex-1 bg-black/45 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:border-brand-primary/60 outline-none font-sans"
                      disabled={isAdminChatLoading}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isAdminChatLoading || !adminChatPrompt.trim()}
                      className="px-5 bg-brand-primary hover:bg-brand-primary/95 text-white disabled:bg-slate-850 disabled:text-slate-500 rounded-xl flex items-center justify-center cursor-pointer transition-all border border-brand-primary/20 shadow-lg shadow-brand-primary/10"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {adminActiveTab === 'member_console' && (
          <motion.div
            key="member_console_tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8 animate-enter"
          >
            {/* PANEL DE CONTROL DE MEMBRESÍAS COMPLETO (OTORGAMIENTO Y CANCELACIÓN MANUAL) */}
            <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] text-left border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] via-surface-950 to-transparent">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Consola de Control Directo de Membresías</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Permite otorgar o remover privilegios de FUTURA PRO en 1 clic</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Selector */}
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest pl-1">Seleccionar Usuario de la Base de Datos</label>
                    <select
                      value={manualUserId}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setManualUserId(uid);
                        const matched = users.find(u => u.id === uid);
                        if (matched) {
                          setManualUserEmail(matched.email || '');
                        } else {
                          setManualUserEmail('');
                        }
                      }}
                      className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:border-brand-primary/60 outline-none font-sans"
                    >
                      <option value="">-- Buscar un usuario --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || 'Sin Nombre'} ({u.email || u.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">O Escribir Correo Manualmente</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico Directo</label>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={manualUserEmail}
                      onChange={(e) => {
                        const email = e.target.value;
                        setManualUserEmail(email);
                        // Try matching uid automatically
                        const matched = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase().trim());
                        if (matched) {
                          setManualUserId(matched.id);
                        }
                      }}
                      className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-brand-primary/60 outline-none font-sans"
                    />
                  </div>
                </div>

                {/* Status card & Operations */}
                <div className="glass-panel p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-between h-full min-h-[220px]">
                  {manualUserId || manualUserEmail ? (
                    (() => {
                      const matched = users.find(u => 
                        u.id === manualUserId || 
                        (u.email && u.email.toLowerCase() === manualUserEmail.toLowerCase().trim())
                      );

                      if (!matched) {
                        return (
                          <div className="text-center py-6 space-y-2 text-slate-500 flex-1 flex flex-col justify-center animate-enter">
                            <span className="text-xs font-bold font-mono">⚠️ CORREO NO REGISTRADO</span>
                            <p className="text-[10px] leading-relaxed max-w-xs mx-auto mb-4">Este correo no existe todavía en la base de datos de usuarios, pero puedes forzar su registro y otorgar membresía directamente.</p>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!manualUserEmail.trim()) {
                                  triggerToast("Ingresa un correo primero.");
                                  return;
                                }
                                try {
                                  const placeholderId = "manual_user_" + Math.random().toString(36).substring(2, 9);
                                  await setDoc(doc(db, 'users', placeholderId), {
                                    id: placeholderId,
                                    email: manualUserEmail.trim().toLowerCase(),
                                    name: manualUserEmail.split('@')[0],
                                    isPremium: true,
                                    credits: 99,
                                    createdAt: new Date().toISOString()
                                  });
                                  triggerToast("¡Membresía Creada y Otorgada con Éxito!");
                                  setManualUserEmail('');
                                  setManualUserId('');
                                } catch (err: any) {
                                  triggerToast(`Error: ${err.message}`);
                                }
                              }}
                              className="mx-auto px-4 py-2.5 bg-brand-primary text-white rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest cursor-pointer hover:bg-brand-primary/80 transition-all font-sans"
                            >
                              Generar Invitado Premium PRO
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4 text-left flex-1 flex flex-col justify-between animate-enter">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">Sincronicidad Detectada</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                                matched.isPremium 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' 
                                  : 'bg-white/5 text-slate-500 border border-white/5'
                              }`}>
                                {matched.isPremium ? 'ACTIVO PREMIUM PRO' : 'VERSIÓN DEMO STARTER'}
                              </span>
                            </div>
                            <h4 className="text-white font-bold text-sm tracking-tight">{matched.name || 'Sin Nombre'}</h4>
                            <p className="text-[10px] text-slate-400 font-mono select-all truncate">ID: {matched.id}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await setDoc(doc(db, 'users', matched.id), {
                                    ...matched,
                                    isPremium: true
                                  }, { merge: true });
                                  triggerToast(`¡Otorgada Membresía PRO a ${matched.name || matched.email}!`);
                                } catch (e: any) {
                                  triggerToast(`Error: ${e.message}`);
                                }
                              }}
                              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-mono font-black text-[9px] tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Crown className="w-3 h-3 text-white" />
                              Otorgar PRO
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await setDoc(doc(db, 'users', matched.id), {
                                    ...matched,
                                    isPremium: false
                                  }, { merge: true });
                                  triggerToast(`¡Removida Membresía PRO de ${matched.name || matched.email}!`);
                                } catch (e: any) {
                                  triggerToast(`Error: ${e.message}`);
                                }
                              }}
                              className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono font-black text-[9px] tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center border border-red-500/20"
                            >
                              Degradar/Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-10 space-y-2 text-slate-600 flex-1 flex flex-col justify-center animate-enter">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Esperando Selección...</span>
                      <p className="text-[9px] leading-normal max-w-[200px] mx-auto font-sans">Busca un usuario arriba o escribe su correo para otorgarle o eliminarle privilegios de FUTURA.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {adminActiveTab === 'payment_reports' && (
          <motion.div
            key="payment_reports_tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8 animate-enter"
          >
            {/* SOLICITUDES DE VERIFICACIÓN BINANCE PAY */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-black text-slate-400 uppercase tracking-[0.3em] text-left pl-1">Solicitudes del Canal de Venta (Binance Pay)</h4>

              {users.filter(u => u.pagoMovilRequest).length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-[2.5rem] border-white/5 bg-white/[0.01] space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-300 uppercase tracking-widest">Sin Reportes de Pago</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                  No se han registrado reportes de pago por parte de los usuarios actualmente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 text-left">
                {users
                  .filter(u => u.pagoMovilRequest)
                  .sort((a, b) => {
                    if (a.pagoMovilRequest.status === 'pending' && b.pagoMovilRequest.status !== 'pending') return -1;
                    if (a.pagoMovilRequest.status !== 'pending' && b.pagoMovilRequest.status === 'pending') return 1;
                    return 0;
                  })
                  .map((u) => {
                    const req = u.pagoMovilRequest;
                    return (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`glass-panel p-6 sm:p-8 rounded-[2.5rem] border ${
                          req.status === 'pending' 
                            ? 'border-amber-500/30 from-amber-500/5 via-surface-950 to-transparent' 
                            : req.status === 'approved' 
                              ? 'border-emerald-500/20 from-emerald-500/5 via-surface-950 to-transparent' 
                              : 'border-red-500/20 from-red-500/5 via-surface-950 to-transparent'
                        } flex flex-col md:flex-row md:items-center justify-between gap-6`}
                      >
                        {/* Left Info */}
                        <div className="space-y-4 text-left flex-1 min-w-0">
                          <div className="border-b border-white/5 pb-2 flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest block">Usuario Remitente</span>
                              <h4 className="text-base font-bold text-white truncate">{u.name || "Estratega Consola"}</h4>
                              <p className="text-[10px] text-slate-500 font-mono truncate">{u.email || `ID: ${u.id}`}</p>
                            </div>
                            
                            <div className="shrink-0 text-right">
                              <span className={`px-2.5 py-1 text-[8px] font-mono font-black uppercase tracking-wider rounded-md ${
                                req.status === 'pending' 
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                  : req.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                {req.status === 'pending' ? 'PENDIENTE VERIFICAR' : req.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Pasarela Reportada</span>
                              <span className="text-xs text-white font-sans font-black tracking-wide">{req.bank}</span>
                            </div>

                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Remitente ID / Mail</span>
                              <span className="text-xs text-white font-mono font-bold truncate block select-all">{req.id}</span>
                            </div>

                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Código Transacción</span>
                              <span className="text-xs text-brand-primary font-mono font-black uppercase select-all">{req.reference}</span>
                            </div>

                            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-mono">Fecha Reporte</span>
                              <span className="text-xs text-slate-300 font-mono text-[11px] truncate block">
                                {req.timestamp ? new Date(req.timestamp).toLocaleString() : 'N/D'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Buttons Actions */}
                        {req.status === 'pending' && (
                          <div className="flex flex-row md:flex-col gap-2.5 shrink-0 justify-end md:w-56 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                            <button
                              onClick={() => handleApprovePayment(u.id, u)}
                              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                            >
                              Aprobar y Premium ✓
                            </button>
                            <button
                              onClick={() => handleRejectPayment(u.id, u)}
                              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-500/20"
                            >
                              Rechazar Pago ✕
                            </button>
                          </div>
                        )}
                        {req.status === 'approved' && (
                          <div className="text-[10px] text-slate-500 font-mono text-center md:w-56 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-white/5 flex flex-col items-center justify-center">
                            <span className="text-emerald-500 font-bold block">✓ PROCESO COMPLETO</span>
                            <span className="text-[9px] block">Aprobado en {req.approvedAt ? new Date(req.approvedAt).toLocaleDateString() : 'N/D'}</span>
                          </div>
                        )}
                        {req.status === 'rejected' && (
                          <div className="text-[10px] text-slate-500 font-mono text-center md:w-56 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-white/5 flex flex-col items-center justify-center">
                            <span className="text-red-500 font-bold block">✕ REPORTE RECHAZADO</span>
                            <span className="text-[9px] block">Rechazado en {req.rejectedAt ? new Date(req.rejectedAt).toLocaleDateString() : 'N/D'}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            )}
            </div>
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
                {filteredCRM.map((u) => {
                  const isEditing = editingUserId === u.id;
                  return (
                    <motion.div
                      key={u.id}
                      className={`glass-panel p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                        isEditing 
                          ? 'border-brand-primary bg-brand-primary/[0.02]' 
                          : 'border-white/5 bg-white/[0.01] hover:border-brand-primary/25'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-4 text-left">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-[0.2em]">Modo Editor de Operador</span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">{u.id}</span>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                              <input
                                type="text"
                                value={editFormName}
                                onChange={(e) => setEditFormName(e.target.value)}
                                className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary/60 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                              <input
                                type="email"
                                value={editFormEmail}
                                onChange={(e) => setEditFormEmail(e.target.value)}
                                className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary/60 outline-none font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Meses Prepago contratados</label>
                              <input
                                type="number"
                                value={editFormMonths}
                                onChange={(e) => setEditFormMonths(Number(e.target.value))}
                                className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary/60 outline-none font-mono"
                              />
                            </div>

                            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">Membresía Activa (PRO)</span>
                              <input
                                type="checkbox"
                                checked={editFormIsPremium}
                                onChange={(e) => setEditFormIsPremium(e.target.checked)}
                                className="w-4 h-4 text-brand-primary focus:ring-0 rounded bg-black/50 border-white/10 cursor-pointer"
                              />
                            </div>

                            {editFormIsPremium && (
                              <div className="space-y-2">
                                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1 block">Fecha Expiración Membresía</label>
                                <input
                                  type="date"
                                  value={editFormExpiresAt}
                                  onChange={(e) => setEditFormExpiresAt(e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary/60 outline-none font-mono"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = editFormExpiresAt ? new Date(editFormExpiresAt + "T12:00:00") : new Date();
                                      cur.setDate(cur.getDate() + 7);
                                      setEditFormExpiresAt(cur.toISOString().substring(0, 10));
                                    }}
                                    className="py-1.5 bg-brand-primary/10 hover:bg-brand-primary/25 border border-brand-primary/10 text-brand-primary rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center"
                                  >
                                    +7 Días más
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = editFormExpiresAt ? new Date(editFormExpiresAt + "T12:00:00") : new Date();
                                      cur.setDate(cur.getDate() + 30);
                                      setEditFormExpiresAt(cur.toISOString().substring(0, 10));
                                    }}
                                    className="py-1.5 bg-brand-primary/10 hover:bg-brand-primary/25 border border-brand-primary/10 text-brand-primary rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center"
                                  >
                                    +30 Días más
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveUserEdit(u.id, u)}
                              className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Guardar Cambios ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-mono font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-white/5"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
                            <div className="text-left">
                              <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{u.name || "Sin nombre"}</h4>
                              <p className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">{u.email || u.id}</p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              u.isPremium
                                ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary'
                                : 'bg-white/5 text-slate-500'
                            }`}>
                              {u.isPremium ? 'PRO / ELITE' : 'DEMO USER'}
                            </span>
                          </div>

                          {/* Dynamic Subscription remaining time and status */}
                          <div className="p-3.5 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-xl text-left space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-bold text-brand-primary uppercase tracking-widest font-mono">Detalles de Suscripción</span>
                              {u.isPremium && (
                                <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary text-[7px] font-bold uppercase rounded font-mono">
                                  {u.membershipMonths || 1} {u.membershipMonths === 1 ? 'Mes' : 'Meses'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-sans space-y-0.5">
                              <p className="text-slate-300 text-[11px]">
                                <b>Membresía:</b> {u.isPremium ? 'FUTURA PRO Elite' : 'Demo Starter Libre'}
                              </p>
                              {u.isPremium && (
                                <p className="text-emerald-400 font-bold text-[10px] font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-400" />
                                  Vence: {getRemainingMembershipTime(u.membershipExpiresAt)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions panel */}
                          <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
                            {deleteConfirmUserId === u.id ? (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-left space-y-2 mt-2 animate-enter">
                                <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest block">⚠️ ¿CONFIRMAS ELIMINAR ESTA CUENTA DEFINITIVAMENTE?</span>
                                <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                                  Esta acción removerá a {u.name || u.email || 'este usuario'} y toda su base de datos de FUTURA de forma irreversible.
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await deleteDoc(doc(db, 'users', u.id));
                                        triggerToast(`FUTURA: Cuenta de ${u.name || u.email || 'usuario'} eliminada.`);
                                        setDeleteConfirmUserId(null);
                                      } catch (err: any) {
                                        console.error("Delete user account error:", err);
                                        triggerToast(`Error al eliminar: ${err.message}`);
                                      }
                                    }}
                                    className="py-2 bg-red-500 hover:bg-red-650 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer font-mono"
                                  >
                                    Sí, Eliminar
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmUserId(null)}
                                    className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[9px] font-bold uppercase transition-all cursor-pointer border border-white/5"
                                  >
                                    Volver
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => startEditingUser(u)}
                                  className="py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  ✏️ Editar Perfil
                                </button>
                                
                                <button
                                  onClick={() => setDeleteConfirmUserId(u.id)}
                                  className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 font-mono"
                                >
                                  ✕ Eliminar Cuenta
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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

        {adminActiveTab === 'dev_station' && (
          <motion.div
            key="dev_station_view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-left"
          >
            <DevStation profile={profile} onUpdateProfile={onUpdateProfile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DevPanel() {
  const [key, setKey] = React.useState(() => {
    return localStorage.getItem("user_gemini_api_key") || "";
  });
  const [statusMessage, setStatusMessage] = React.useState("");

  const handleSave = () => {
    if (!key || key.trim() === "") {
      localStorage.removeItem("user_gemini_api_key");
      setStatusMessage("Clave API eliminada. Se usará la configuración por defecto del servidor si está disponible.");
    } else {
      localStorage.setItem("user_gemini_api_key", key.trim());
      setStatusMessage("¡Clave API guardada exitosamente! Se usará para todas las consultas de FUTURA.");
    }
    setTimeout(() => {
      setStatusMessage("");
    }, 4000);
  };

  return (
    <div className="space-y-12 pb-32">
      <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-brand-primary/20 bg-surface-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Layout className="w-48 h-48 text-brand-primary" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-400 border border-white/10">
              <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">Entorno de Desarrollo y Configuración API</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">ADMINISTRA TU CONEXIÓN Y CLAVES API DE GEMINI</p>
            </div>
          </div>

          {/* CUSTOM GEMINI API KEY FIELD SECTOR */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border-brand-primary/20 bg-black/45 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" /> CLAVE API DE GEMINI PERSONAL
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Si la consola de AI Studio o el servidor no responden con el flujo neuronal, o si recibes advertencias de interrupción, puedes configurar tu propio token API de Google Gemini en este panel. Se almacenará de manera 100% segura y privada en las cookies/almacenamiento local de tu navegador para todas tus sesiones de FUTURA.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tu Clave API (GEMINI_API_KEY)</label>
                {key.trim() ? (
                  <span className="text-[9px] font-bold text-green-400 bg-green-950/50 border border-green-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">Clave Local Activa</span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Heredando del Servidor</span>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="password"
                  placeholder="Pega tu clave AIzaSy... aquí"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="flex-1 bg-surface-950 border border-white/10 text-white rounded-xl px-4 py-3 font-mono text-xs focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
                <button
                  onClick={handleSave}
                  className="bg-brand-primary hover:bg-brand-secondary text-white font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Guardar Conexión
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="p-4 rounded-xl text-xs font-bold font-mono border bg-green-950/20 text-green-400 border-green-800/30">
                {statusMessage}
              </div>
            )}

            <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 text-[10px] md:text-xs text-slate-400 space-y-2">
              <div className="font-bold text-brand-primary uppercase tracking-wider">💡 ¿Cómo conseguir tu clave?</div>
              <p className="leading-normal">
                Puedes conseguir una clave de Gemini de forma 100% gratuita y al instante ingresando a Google AI Studio en <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline hover:text-white">aistudio.google.com</a> y haciendo clic en &apos;Get API Key&apos;.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/5">
              <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4">Core de Inferencia</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">MODELO:</span>
                  <span className="text-white">Gemini 3.5-FLASH</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">TIER:</span>
                  <span className="text-white">Custom Local Overwrite</span>
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
