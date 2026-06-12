/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Rocket, 
  Globe, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  Share2, 
  Play,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Sparkles,
  MessageSquare,
  Copy,
  Calendar,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LaunchGuide() {
  const [activeTab, setActiveTab] = useState<'subdomain' | 'whatsapp' | 'packages' | 'action_plan'>('subdomain');
  
  // States for WhatsApp Generator
  const [phone, setPhone] = useState('+584120000000');
  const [selectedPack, setSelectedPack] = useState<'starter' | 'pro' | 'elite'>('pro');
  const [customText, setCustomText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // States for Subdomain Check
  const [subdomainName, setSubdomainName] = useState('futurapp');
  const [copiedCmd, setCopiedCmd] = useState('');

  // States for Interactive Calculator
  const [clientsCount, setClientsCount] = useState(10);

  // Pack Details
  const packs = {
    starter: {
      name: 'FUTURA Starter',
      price: '$15/Mes',
      val: 15,
      desc: 'Ideal para 1 marca pequeña o emprendedor local.',
      bullets: [
        'Calendario Inteligente Semanal',
        'Hasta 15 ideas de copy con IA por mes',
        'Configuración de 1 marca activa',
        'Canal de soporte vía WhatsApp'
      ],
      whatsappMsg: '¡Hola! Me interesa activar el plan FUTURA Starter de $15/Mes para potenciar mi negocio local.'
    },
    pro: {
      name: 'FUTURA PRO Sincro',
      price: '$29/Mes',
      val: 29,
      desc: 'Acceso corporativo para tiendas, marcas recurrentes y community managers.',
      bullets: [
        'Calendario Mensual Infinito',
        'Generador ilimitado de copies de conversión',
        'Diseño visual continuo con ImageGen',
        'Configuración de múltiples marcas (Bóveda activa)',
        'Soporte estratégico premium 24/7'
      ],
      whatsappMsg: '¡Hola! Deseo iniciar con el plan FUTURA PRO de $29/Mes para delegar mi redacción y diseño con la IA.'
    },
    elite: {
      name: 'FUTURA Elite Agency',
      price: '$49/Mes',
      val: 49,
      desc: 'El poder absoluto. Creado para agencias, consultoras y marcas consolidadas.',
      bullets: [
        'Gestión de hasta 10 marcas de forma simultánea',
        'Acceso preferencial sin límites y máxima velocidad',
        'Descarga directa de renders optimizados en alta definición',
        'Asesoría técnica y spe phase auditoría de por vida',
        'Entrenamiento de marca personalizado en el Baúl'
      ],
      whatsappMsg: '¡Hola! Quiero activar la licencia FUTURA Enterprise de $49/Mes para manejar todas mis cuentas de agencia de inmediato.'
    }
  };

  const getWhatsAppLink = () => {
    const baseMsg = packs[selectedPack].whatsappMsg;
    const finalMsg = customText.trim() ? customText : baseMsg;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;
  };

  const copyToClipboard = (text: string, type: 'link' | 'cmd') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCmd(text);
      setTimeout(() => setCopiedCmd(''), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10 px-4 sm:px-6 text-left">
      
      {/* Encabezado Simplificado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
              <Rocket className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-[0.3em]">MÉTODO COMERCIAL ULTRA-RÁPIDO</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tighter">
            LANZAMIENTO <span className="text-rose-500">EXPRESS</span> FUTURA
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-3xl">
            Sáltate las complicaciones técnicas de las APIs complejas y los pagos corporativos. El dinero real está en ofrecer contenido de calidad y planeación inmediata. Despliega gratis, cobra por WhatsApp y quédate con el 100% de la ganancia.
          </p>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex flex-wrap gap-1 border-b border-white/5">
        {[
          { id: 'subdomain', label: '1. Despliegue Gratis', icon: Globe },
          { id: 'packages', label: '2. Estructura de Paquetes', icon: DollarSign },
          { id: 'whatsapp', label: '3. Enlace Directo WhatsApp', icon: MessageSquare },
          { id: 'action_plan', label: '4. Manual en 5 Días', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all focus:outline-none relative cursor-pointer ${
                activeTab === tab.id 
                  ? 'text-rose-400 bg-rose-500/5' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="expressActiveTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel de Contenidos Activo */}
      <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-white/5 relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-950/90 to-transparent">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DESPLIEGUE EN SUBDOMINIO GRATUITO */}
          {activeTab === 'subdomain' && (
            <motion.div
              key="subdomain-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <Globe className="w-5 h-5" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider">Subdominio Gratis sin costo de VPS</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Desplegar en Vercel gratis en 5 minutos</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-4xl">
                  No necesitas comprar un dominio propio ni configurar servidores Linux pesados. Puedes alojar la aplicación entera en un subdominio gratuito de Vercel (<code className="text-rose-400 font-mono bg-rose-500/5 px-1 py-0.5 rounded">tuproyecto.vercel.app</code>) y funcionará perfectamente a alta velocidad y con SSL activo por defecto.
                </p>
              </div>

              {/* Caja interactiva de subdominio */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">Asigna un nombre a tu subdominio de prueba:</span>
                <div className="flex gap-2 max-w-md bg-white/[0.02] border border-white/10 p-1.5 rounded-lg">
                  <input 
                    type="text" 
                    value={subdomainName} 
                    onChange={(e) => setSubdomainName(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="futurapp"
                    className="flex-1 bg-transparent border-none text-slate-200 text-xs sm:text-sm font-mono focus:outline-none px-2"
                  />
                  <div className="bg-white/5 px-3 py-1.5 rounded text-xs text-slate-400 font-mono flex items-center shrink-0">
                    .vercel.app
                  </div>
                </div>
                {subdomainName && (
                  <p className="text-[11px] text-teal-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tu enlace de venta será: <span className="font-bold underline">{subdomainName}.vercel.app</span>
                  </p>
                )}
              </div>

              {/* Checklist Simplificado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-mono text-[10px] font-black">1</span>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Crear la Compilación</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Compila tu proyecto escribiendo en terminal:
                  </p>
                  <div className="flex items-center justify-between bg-black/60 px-3 py-2 rounded-lg font-mono text-[10px] text-slate-300">
                    <code>npm run build</code>
                    <button 
                      onClick={() => copyToClipboard('npm run build', 'cmd')}
                      className="text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedCmd === 'npm run build' ? 'Copiado!' : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-mono text-[10px] font-black">2</span>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Autorizar en Firebase</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Para que tus usuarios puedan loguearse desde el subdominio gratuito, ingresa a tu **Consola de Firebase &gt; Authentication &gt; Ajustes &gt; Dominios Autorizados** y agrega tu subdominio:
                  </p>
                  <div className="bg-teal-500/5 border border-teal-500/20 px-3 py-1 rounded-lg font-mono text-[10px] text-teal-400">
                    {subdomainName ? `${subdomainName}.vercel.app` : 'tudominio.vercel.app'}
                  </div>
                </div>

              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-amber-400 block mb-0.5">Nota Importante sobre Variables de Entorno:</strong>
                  No olvides copiar todas las variables de tu <code className="text-slate-300 font-mono bg-black/40 px-1 py-0.2 rounded">.env</code> (las claves de Firebase y de Google Gemini) y pegarlas en el dashboard de Vercel en la pestaña <strong>Environment Variables</strong> de tu proyecto para que la IA funcione en línea.
                </p>
              </div>

            </motion.div>
          )}

          {/* TAB 2: ESTRUCTURA DE PAQUETES DE PRECIOS */}
          {activeTab === 'packages' && (
            <motion.div
              key="packages-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider">Estrategia de Monetización Local</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Preservar valor contra el tedio técnico</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-4xl">
                  Los clientes locales no están buscando integraciones complejas; buscan **soluciones prácticas** para ahorrar tiempo. Te recomendamos ofrecer estos 3 paquetes listos de membresía recurrente.
                </p>
              </div>

              {/* Tarjetas de Paquetes recomendados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Starter */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">PACK BÁSICO</span>
                    <h4 className="text-lg font-bold text-white">{packs.starter.name}</h4>
                    <span className="text-2xl font-display font-black text-rose-400 block">{packs.starter.price}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{packs.starter.desc}</p>
                  </div>
                  <ul className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-white/5 flex-1">
                    {packs.starter.bullets.map((b, i) => <li key={i}>✔ {b}</li>)}
                  </ul>
                  <button 
                    onClick={() => { setSelectedPack('starter'); setActiveTab('whatsapp'); }} 
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono uppercase font-black tracking-widest rounded-lg transition-all cursor-pointer"
                  >
                    Generar Enlace
                  </button>
                </div>

                {/* Pro */}
                <div className="p-5 rounded-2xl bg-rose-500/[0.02] border border-rose-500/20 flex flex-col justify-between text-left space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl font-mono">RECOMENDADO</div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest block">MÁXIMO VALOR</span>
                    <h4 className="text-lg font-bold text-white">{packs.pro.name}</h4>
                    <span className="text-2xl font-display font-black text-rose-400 block">{packs.pro.price}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{packs.pro.desc}</p>
                  </div>
                  <ul className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-white/5 flex-1">
                    {packs.pro.bullets.map((b, i) => <li key={i}>✔ {b}</li>)}
                  </ul>
                  <button 
                    onClick={() => { setSelectedPack('pro'); setActiveTab('whatsapp'); }} 
                    className="w-full py-2 bg-rose-500 text-white text-[10px] font-mono uppercase font-black tracking-widest rounded-lg transition-all shadow-lg shadow-rose-500/10 cursor-pointer hover:bg-rose-600"
                  >
                    Generar Enlace
                  </button>
                </div>

                {/* Elite Agency */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">PREMIUM ELITE</span>
                    <h4 className="text-lg font-bold text-white">{packs.elite.name}</h4>
                    <span className="text-2xl font-display font-black text-rose-400 block">{packs.elite.price}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{packs.elite.desc}</p>
                  </div>
                  <ul className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-white/5 flex-1">
                    {packs.elite.bullets.map((b, i) => <li key={i}>✔ {b}</li>)}
                  </ul>
                  <button 
                    onClick={() => { setSelectedPack('elite'); setActiveTab('whatsapp'); }} 
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono uppercase font-black tracking-widest rounded-lg transition-all cursor-pointer"
                  >
                    Generar Enlace
                  </button>
                </div>

              </div>

              {/* Calculadora Interactiva de Potencial */}
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">Proyección Financiera Rápida:</span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs text-bold">Tus Suscriptores Activos (Plan PRO de $29):</span>
                      <strong className="text-white font-mono text-sm">{clientsCount} marcas</strong>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={clientsCount} 
                      onChange={(e) => setClientsCount(parseInt(e.target.value))}
                      className="w-64 accent-rose-500 py-1"
                    />
                  </div>
                  <div className="p-4 bg-black/40 rounded-xl space-y-0.5 font-mono text-right shrink-0">
                    <span className="text-slate-500 text-[10px] block uppercase">Ganancia Mensual Recurrente (MRR)</span>
                    <strong className="text-emerald-400 font-display text-xl sm:text-2xl block">${clientsCount * 29} USD / Mes</strong>
                    <span className="text-[8px] text-slate-400 block">Cobrado directo por WhatsApp (Costo de mantenimiento: $0)</span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 3: GENERADOR DE ENLACES DE WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <motion.div
              key="whatsapp-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider">Túnel de Cierre Directo</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Cerrar ventas por WhatsApp (Canal Directo)</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-4xl">
                  Sáltate el tedio de programar pasarelas de pago automáticas. Genera un enlace inteligente que asocie el paquete de interés de tu cliente directo a tu móvil. Al ver el comprobante, puedes activarlos de forma manual en tu consola de Firebase en segundos.
                </p>
              </div>

              {/* Formulario de Enlace Inteligente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-6 rounded-2xl border border-white/5">
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">1. Configura tus datos</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tu Teléfono (Con Código de País, Ej: +584120000000):</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+584120000000"
                      className="w-full bg-white/[0.02] border border-white/10 p-3 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-rose-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Selecciona el Plan Sugerido:</label>
                    <select 
                      value={selectedPack}
                      onChange={(e) => setSelectedPack(e.target.value as any)}
                      className="w-full bg-surface-950 border border-white/10 p-3 rounded-xl text-xs sm:text-sm text-slate-400 focus:text-white outline-none focus:border-rose-500/50 cursor-pointer"
                    >
                      <option value="starter">Starter Plan ($15/Mes)</option>
                      <option value="pro">PRO Sincro Plan ($29/Mes)</option>
                      <option value="elite">Elite Agency Plan ($49/Mes)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Texto Personalizado del Mensaje (Opcional):</label>
                    <textarea 
                      value={customText} 
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder={packs[selectedPack].whatsappMsg}
                      rows={3}
                      className="w-full bg-white/[0.02] border border-white/10 p-3 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-rose-500/50 resize-none font-mono"
                    />
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-4 sm:p-6 rounded-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">2. Visualizador del Enlace</h5>
                    
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                      <span className="text-[9px] font-mono font-black text-emerald-400 block uppercase">El mensaje que te llegará a tu chat:</span>
                      <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                        "{customText.trim() ? customText : packs[selectedPack].whatsappMsg}"
                      </p>
                    </div>

                    <div className="p-3 bg-black/60 rounded-xl space-y-1 border border-white/5">
                      <span className="text-[8px] font-mono text-slate-500 uppercase block">Enlace Final Generado:</span>
                      <span className="text-[10px] font-mono text-rose-400 block truncate select-all">
                        {getWhatsAppLink()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <button 
                      onClick={() => copyToClipboard(getWhatsAppLink(), 'link')}
                      className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-mono uppercase font-black tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                    </button>
                    <button 
                      onClick={() => window.open(getWhatsAppLink(), '_blank')}
                      className="py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase font-black tracking-widest rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Probar Enlace
                    </button>
                  </div>
                </div>

              </div>

              {/* Guía de activación */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">El ciclo completo de compra rápida:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px] text-slate-400 leading-normal">
                  <div className="space-y-1.5 text-left">
                    <span className="text-white font-bold block">1. Envías la Demo</span>
                    <p>El cliente prueba el potencial del Motor Creativo y tu calendario de planificación de forma gratuita.</p>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <span className="text-white font-bold block">2. Cierre por WhatsApp</span>
                    <p>Al querer expandirse al plan completo, presiona pagar, abriendo tu WhatsApp con el mensaje pre-redactado y te transfiere directo.</p>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <span className="text-white font-bold block">3. Activación Manual</span>
                    <p>Vas a tu Firestore Database, buscas si existía el usuario y cambias su parámetro <code className="text-teal-400">isPremium</code> a <code className="text-teal-400">true</code>. Listo.</p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: MANUAL SÓLIDO EN 5 DIAS */}
          {activeTab === 'action_plan' && (
            <motion.div
              key="action-plan-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider">Hoja de Ruta Comercial Express</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Manual paso a paso en 5 días</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-4xl">
                  Sigue este cronograma depurado para salir a la venta sin demoras de manera comercial y sin complicaciones:
                </p>
              </div>

              {/* Línea de tiempo interactiva */}
              <div className="relative border-l border-white/10 pl-6 space-y-6 ml-2 text-left">
                
                {/* Día 1 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[31px] w-4.5 h-4.5 rounded-full bg-rose-500 border-4 border-surface-950" />
                  <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block font-bold">Día 1: Identificación Inteligente</span>
                  <p className="text-slate-300 text-xs font-bold leading-relaxed">Ubica 15 restaurantes, tiendas o profesionales de tu localidad con redes flojas.</p>
                  <p className="text-[11px] text-slate-400">
                    Anota cuáles muestran baja constancia o carruseles mal redactados. Conócelos sin hablarles aún.
                  </p>
                </div>

                {/* Día 2 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[31px] w-4.5 h-4.5 rounded-full bg-rose-500 border-4 border-surface-950" />
                  <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block font-bold">Día 2: Generación en Futura</span>
                  <p className="text-slate-300 text-xs font-bold leading-relaxed">Produce los copies persuasivos y conceptos visuales rápidos con tu motor de IA.</p>
                  <p className="text-[11px] text-slate-400">
                    Usa el **Motor Creativo** e introduce el rubro del comercio. Diseña 3 publicaciones de contenido impecable listas para postear.
                  </p>
                </div>

                {/* Día 3 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[31px] w-4.5 h-4.5 rounded-full bg-rose-500 border-4 border-surface-950" />
                  <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block font-bold">Día 3: El Contacto Directo</span>
                  <p className="text-slate-300 text-xs font-bold leading-relaxed">Mándales la propuesta de valor sin costo comercial por Mensaje Directo o WhatsApp.</p>
                  <p className="text-[11px] text-slate-400 italic">
                    "¡Hola! Vi tus redes y sé que te quitan mucho tiempo. Te creé estas 3 publicaciones demo con mi nueva plataforma Futura de forma totalmente gratuita para que las uses hoy mismo. ¡Pruébalas!"
                  </p>
                </div>

                {/* Día 4 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[31px] w-4.5 h-4.5 rounded-full bg-rose-500 border-4 border-surface-950" />
                  <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block font-bold">Día 4: Acceso Temporal Gratis</span>
                  <p className="text-slate-300 text-xs font-bold leading-relaxed">Ofréceles probar la aplicación de forma limitada.</p>
                  <p className="text-[11px] text-slate-400">
                    Invítalos a ingresar a la aplicación subida en tu subdominio gratis para que jueguen con el calendario estratégico y planifiquen su semana completa en un suspiro.
                  </p>
                </div>

                {/* Día 5 */}
                <div className="relative space-y-1.5">
                  <div className="absolute -left-[31px] w-4.5 h-4.5 rounded-full bg-rose-500 border-4 border-surface-950" />
                  <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block font-bold">Día 5: Cierre & Cobro Recurrente</span>
                  <p className="text-slate-300 text-xs font-bold leading-relaxed">Usa tu enlace directo de WhatsApp para cobrar el plan PRO de $29 mensual.</p>
                  <p className="text-[11px] text-slate-400">
                    Al terminar su prueba, el cliente que entienda cuánto tiempo ahorra y el valor real que aporta pagará gustosamente su mensualidad. Actívalo en 1 segundo y repite el proceso.
                  </p>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}
