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
  Rocket
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
  const menuGroups = [
    {
      title: "Núcleo Estratégico",
      items: [
        { id: 'dashboard', label: 'Panel Principal', icon: BarChart3 },
        { id: 'epicenter', label: 'Epicentro Control', icon: Layout },
      ]
    },
    {
      title: "Fábrica Creativa",
      items: [
        { id: 'vault', label: 'Baúl de Marca', icon: Layers },
        { id: 'engine', label: 'Motor Creativo', icon: Zap },
        { id: 'gallery', label: 'Galería de Activos', icon: History },
      ]
    },
    {
      title: "Planificación y Datos",
      items: [
        { id: 'content', label: 'Contenido Listo', icon: Calendar },
        { id: 'security', label: 'Seguridad y Cifrado', icon: Shield },
      ]
    },
    {
      title: "Lanzamiento y Venta",
      items: [
        { id: 'pro', label: 'Membresías', icon: Crown },
      ]
    },
    {
      title: "Consola de Sistema",
      items: [
        { id: 'admin', label: 'Administración', icon: ShieldCheck },
        { id: 'dev', label: 'Desarrollo API', icon: Settings },
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
        "fixed md:relative z-[110] w-72 h-full bg-surface-950/80 backdrop-blur-2xl flex flex-col border-r border-white/5 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
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

        <div className="p-6 border-t border-white/5 space-y-4 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
              {auth.currentUser?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-[10px] font-bold text-white truncate">{auth.currentUser?.email}</p>
              <p className="text-[8px] text-slate-500 font-mono">ESTADO: ACTIVO</p>
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
