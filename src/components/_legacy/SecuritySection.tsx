
import React from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldCheck, Lock, EyeOff, Key, Database, Server, Cpu, Bot, CheckCircle } from 'lucide-react';

export default function SecuritySection() {
  const securityFeatures = [
    {
      title: "Encriptación de Grado Bancario",
      desc: "Toda la comunicación entre tu navegador y nuestros servidores viaja por túneles SSL/TLS de 256 bits.",
      icon: Lock,
      color: "text-blue-400"
    },
    {
      title: "Aislamiento de Marca",
      desc: "Tus activos del Brand Vault están lógicamente aislados. Ningún otro usuario ni el modelo base puede acceder a ellos sin autorización.",
      icon: Database,
      color: "text-purple-400"
    },
    {
      title: "Privacidad por Diseño",
      desc: "No utilizamos tus datos privados para entrenar modelos públicos. Tu ventaja competitiva permanece privada.",
      icon: EyeOff,
      color: "text-green-400"
    },
    {
      title: "Autenticación Multi-Factor",
      desc: "Integración con proveedores de identidad líderes para asegurar que solo tú accedas a tu centro de mando.",
      icon: Key,
      color: "text-brand-primary"
    }
  ];

  const serverStats = [
    { label: "Tiempo de Actividad", value: "99.98%" },
    { label: "Latencia Media", value: "45ms" },
    { label: "Nivel de Firewall", value: "Layer 7+" },
    { label: "Backup Automático", value: "Cada 6h" }
  ];

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-32">
      <header className="flex flex-col md:flex-row items-center justify-between gap-8 bg-brand-primary/10 border border-brand-primary/20 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-brand-primary" />
        </div>
        
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="bg-brand-primary/20 p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Protocolo de Innovación Corporativa</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter">Infraestructura de Grado Corporativo</h1>
          <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
            La arquitectura de <span className="text-white font-bold">FUTURA</span> no solo protege, sino que habilita la evolución de tus procesos de imagen hacia una ejecución automatizada de alta fidelidad.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 w-full md:w-auto">
          {serverStats.map((stat) => (
            <div key={stat.label} className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
              <span className="text-lg font-display font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityFeatures.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 rounded-[2rem] border-white/5 hover:border-brand-primary/30 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
              <feature.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-surface-950 to-brand-primary/5 flex flex-col md:flex-row items-center gap-10">
        <div className="w-24 h-24 bg-brand-primary/10 rounded-3xl flex items-center justify-center shrink-0 border border-brand-primary/20">
          <Bot className="w-12 h-12 text-brand-primary animate-pulse" />
        </div>
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h3 className="text-2xl font-display font-bold text-white">Auditoría del Motor FUTURA</h3>
          <p className="text-slate-400 leading-relaxed text-base">
            Cada inferencia generada por el asistente FUTURA es procesada de forma efímera. Los datos solo persisten en tu Bóveda personal y nunca se filtran a otros procesos de inferencia de terceros.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aislado por Proyecto</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cero Entrenamiento Público</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SOC-2 Compliant Path</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
