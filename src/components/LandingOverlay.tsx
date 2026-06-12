import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Shield, Rocket, ArrowRight, Brain, Cpu, Target, Bot, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingOverlayProps {
  onClose: () => void;
}

export default function LandingOverlay({ onClose }: LandingOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-[#0a0a0a] overflow-y-auto custom-scrollbar flex flex-col items-center select-none w-screen h-screen"
    >
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#8B5CF622_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,#D9F99D10_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-20 flex flex-col items-center">
        {/* Futura Persona Mockup */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-16 relative"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-brand-primary/30 via-[#0a0a0a] to-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/30 shadow-[0_0_100px_rgba(139,92,246,0.25)] overflow-hidden">
             <Bot className="w-16 h-16 md:w-24 md:h-24 text-brand-primary animate-pulse" />
             {/* Glowing Rings */}
             <div className="absolute inset-0 border-2 border-brand-primary/20 rounded-full animate-[ping_4s_infinite]" />
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-6"
        >
          <div className="space-y-2">
            <h4 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.6em]">Future Marketing Consult</h4>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-none uppercase italic">Visión y Materialización</h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-slate-300 font-medium text-base md:text-lg leading-relaxed">
              <span className="text-white font-bold">Future Marketing Consult</span> no nace por azar, sino por la imperativa necesidad de dejar una huella positiva en el mundo digital. Nuestra misión es añadir <span className="text-brand-primary italic">contenido de valor real</span> a la economía, sirviendo como el canal definitivo para el crecimiento y la trascendencia de marcas con propósito.
            </p>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed italic border-l-2 border-brand-primary/30 pl-6 text-left">
              "FUTURA es la culminación de esta visión: un motor de ejecución avanzado diseñado para democratizar la excelencia estratégica y operativa."
            </p>
          </div>
        </motion.div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24 w-full">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-12 bg-white/5 rounded-[3.5rem] border border-white/5 space-y-6 group hover:bg-white/10 hover:border-brand-primary/40 transition-all"
          >
            <div className="w-14 h-14 bg-brand-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Canal de Crecimiento</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Optimizamos cada flujo de trabajo para asegurar que tu marca no solo participe en la economía, sino que la lidere a través de ejecución estratégica sistemática.
            </p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-12 bg-white/5 rounded-[3.5rem] border border-white/5 space-y-6 group hover:bg-white/10 hover:border-brand-primary/40 transition-all"
          >
            <div className="w-14 h-14 bg-surface-900 rounded-[1.5rem] flex items-center justify-center text-white border border-white/10 shadow-xl">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Valor Existencial</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cada activo generado por FUTURA está imbuido con la filosofía SPE, garantizando que el diseño y la estrategia añadan peso real a tu visión comercial.
            </p>
          </motion.div>
        </div>

        {/* Button */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 w-full flex flex-col items-center"
        >
          <button 
            onClick={onClose}
            className="px-20 py-8 bg-brand-primary text-white rounded-[3rem] font-black text-xl hover:bg-white hover:text-black hover:scale-[1.05] active:scale-95 transition-all shadow-[0_30px_60px_rgba(139,92,246,0.4)] flex items-center gap-6 group mb-16"
          >
            ACTIVAR MOTOR FUTURA
            <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
          </button>
          
          <div className="w-full h-px bg-white/10 mb-10" />
          
          <div className="space-y-4">
            <p className="text-[12px] text-center text-slate-500 font-black uppercase tracking-[0.5em]">Future Marketing Consult © 2026</p>
            <div className="space-y-2">
              <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.4em]">Derechos Reservados</p>
              <div className="flex items-center justify-center gap-3 py-3 px-6 bg-brand-primary/5 rounded-full border border-brand-primary/20">
                <Shield className="w-4 h-4 text-brand-primary" />
                <p className="text-[9px] text-center text-brand-primary font-black uppercase tracking-[0.5em]">
                   MOTOR DESARROLLADO CON ENCRIPTACIÓN DE GRADO PROFESIONAL
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

