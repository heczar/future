import React from 'react';
import { 
  BarChart3, 
  Layers, 
  Calendar,
  Image as ImageIcon, 
  Settings, 
  User, 
  PlusSquare, 
  Zap,
  Layout,
  History,
  Crown,
  ShieldCheck,
  Shield,
  Rocket,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const isMaster = auth.currentUser?.email?.toLowerCase() === 'heczaroficial@gmail.com';
  const [isFallbackActive, setIsFallbackActive] = React.useState(false);

  React.useEffect(() => {
    const checkFallback = () => {
      setIsFallbackActive(localStorage.getItem('futura_api_fallback_active') === 'true');
    };
    checkFallback();
    const interval = setInterval(checkFallback, 3000);
    return () => clearInterval(interval);
  }, []);

  const menuGroups = [
    {
      title: "Núcleo de Asesoría",
      items: [
        { id: 'dashboard', label: 'Inicio y Filosofía', icon: BarChart3 },
        { id: 'futura', label: 'Consultor FUTURA', icon: MessageSquare },
      ]
    },
    {
      title: "Operaciones de Marca",
      items: [
        { id: 'ignicion', label: 'Ignición Creativa', icon: Rocket },
        { id: 'propulsion', label: 'Propulsión de Élite', icon: Layers },
      ]
    },
    {
      title: "Planificación y Cifrado",
      items: [
        { id: 'security', label: 'Seguridad y Cifrado', icon: Shield },
        { id: 'pro', label: 'Membresías', icon: Crown },
      ]
    },
    {
      title: "Consola de Sistema",
      items: [
        { id: 'admin', label: 'Administración', icon: ShieldCheck },
        ...(isMaster ? [{ id: 'dev', label: 'Desarrollo API', icon: Settings }] : []),
        { id: 'profile', label: 'Mi Perfil', icon: User },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed md:sticky md:top-0 h-screen z-[110] w-72 bg-surface-950/80 backdrop-blur-2xl flex flex-col border-r border-white/5 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left">
              <h2 className="text-2xl font-display font-bold tracking-[0.1em] text-white leading-none mb-1">FUTURE</h2>
              <div className="h-0.5 w-full bg-gradient-to-r from-brand-primary to-transparent" />
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Marketing Consult</p>
            </div>
          </div>
        </div>

        {/* Scrollable Nav with custom scrollbar hiding/styling */}
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto min-h-0 scrollbar-none hover:scrollbar-thin text-left">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <span className="px-4 text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-xs sm:text-sm font-medium",
                      activeTab === item.id 
                        ? "bg-brand-primary/10 text-brand-primary font-bold shadow-sm" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                      activeTab === item.id ? "text-brand-primary" : "text-slate-500 group-hover:text-white"
                    )} />
                    {item.label}
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="activeTabSidebar"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {isFallbackActive && (
          <div className="mx-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left space-y-1.5 animate-pulse">
            <div className="flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black font-mono uppercase tracking-wider">Modo de Respaldo Activo</span>
            </div>
            <p className="text-[9.5px] text-slate-400 leading-normal">
              La API de Gemini no responde. Para activar la IA real y generación de imágenes, configura la clave <strong className="text-white font-mono text-[9px]">GEMINI_API_KEY</strong> en las variables de entorno de tu dashboard de Vercel, o ingresa tu clave en la pestaña <button onClick={() => setActiveTab('profile')} className="text-brand-primary underline hover:text-brand-primary/80 font-bold cursor-pointer">Mi Perfil</button>.
            </p>
          </div>
        )}

        <div className="p-6 border-t border-white/5 space-y-4 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
              {auth.currentUser?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-[10px] font-bold text-white truncate">{auth.currentUser?.email}</p>
              <p className="text-[8px] font-mono">
                {auth.currentUser?.email?.toLowerCase() === 'heczaroficial@gmail.com'
                  ? <span className="text-amber-400 font-bold">👑 DUEÑO Y ADMINISTRADOR</span>
                  : <span className="text-slate-500">ESTADO: ACTIVO</span>}
              </p>
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all text-xs font-medium cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
