/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  Check, 
  Clock, 
  Copy, 
  Wallet, 
  CreditCard,
  Loader2,
  Building2,
  Phone,
  User,
  Hash,
  DollarSign,
  ExternalLink,
  Activity,
  ShieldAlert,
  Sliders,
  Zap
} from 'lucide-react';
import { useAuth } from './AuthWrapper';

interface MembershipPlansProps {
  profile?: any;
  onUpdateProfile?: (newProfile: any) => void;
}

export default function MembershipPlans({ profile, onUpdateProfile }: MembershipPlansProps) {
  const { user } = useAuth();
  
  // Toast indicator state
  const [toast, setToast] = useState<string | null>(null);

  // Trigger toast indicator
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Scroll smooth to crypto wallet section
  const handleScrollToCheckout = () => {
    triggerToast("📋 Copia la dirección o ID de Binance Pay abajo para transferir.");
    setTimeout(() => {
      const element = document.getElementById("crypto-checkout-section");
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Clipboard Copier
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`¡Copiado: ${label}!`);
  };

  const handleResetPremiumDev = async () => {
    if (!user || !onUpdateProfile) return;
    await onUpdateProfile({
      ...profile,
      isPremium: false,
      activePlan: 'free'
    });
    triggerToast("Nivel reestablecido a DEMO (Modo de simulación).");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-12 px-4 sm:px-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-brand-primary/45 py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-xs font-black text-white uppercase tracking-wider">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-[9px] font-mono font-black uppercase tracking-widest text-center">
          <Crown className="w-3.5 h-3.5" />
          Membresía Futura Elite PRO
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white uppercase">
          FUTURA SOLUTIONS <span className="text-brand-primary">ELITE PRO</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm font-sans leading-relaxed">
          Adquiere tu licencia Elite Pro para análisis estratégico ilimitados, generación de activos sin límites y descargas prioritarias.
        </p>
      </div>

      {/* DASHBOARD DE CARGA DE CONSUMO EN TIEMPO REAL */}
      <div id="compute-load-dashboard" className="bg-surface-950 border border-white/10 p-6 rounded-3xl text-left relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest">SISTEMA APIS DE COCO</span>
            </div>
            <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mt-1 flex items-center gap-1.5">
              <Sliders className="w-5 h-5 text-brand-primary" /> Consola de Carga de Cómputo
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Monitoreo analítico del consumo de tokens y llamadas de IA para tu rango: <strong className="text-white uppercase">{profile?.isPremium ? 'Membresía Elite PRO' : 'Membresía Sencilla'}</strong>
            </p>
          </div>
          <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 text-[10px] font-mono whitespace-nowrap">
            Límite Diario: <strong className="text-brand-primary">{profile?.isPremium ? 'Ilimitado con SRE' : '5 Consultas / Día'}</strong>
          </div>
        </div>

        {/* Triple Progress Indicator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* DAILY QUERIES */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><Activity className="w-4 h-4 text-brand-primary" /> Consultas Diarias de IA</span>
              <span className="font-mono font-bold text-white">
                {profile?.apiConsumption?.dailyConsultsUsed ?? (profile?.isPremium ? 7 : 1)} / {profile?.apiConsumption?.dailyConsultsLimit ?? (profile?.isPremium ? 250 : 5)}
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  Math.min(100, Math.round(((profile?.apiConsumption?.dailyConsultsUsed ?? (profile?.isPremium ? 7 : 1)) / (profile?.apiConsumption?.dailyConsultsLimit ?? (profile?.isPremium ? 250 : 5))) * 100)) > 80 
                    ? 'bg-amber-500' 
                    : 'bg-brand-primary'
                }`}
                style={{ width: `${Math.min(100, Math.round(((profile?.apiConsumption?.dailyConsultsUsed ?? (profile?.isPremium ? 7 : 1)) / (profile?.apiConsumption?.dailyConsultsLimit ?? (profile?.isPremium ? 250 : 5))) * 100))}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500">
              {profile?.isPremium 
                ? 'Consultas con prioridad ultra-alta a servidores dedicados.' 
                : 'La cuota de consultas diaria se reinicia a las 00:00 UTC.'}
            </p>
          </div>

          {/* MONTHLY TOKENS */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Carga Mensual de Cómputo</span>
              <span className="font-mono font-bold text-white">
                {Math.round((profile?.apiConsumption?.monthlyTokensUsed ?? (profile?.isPremium ? 85400 : 1500)) / 1000)}k / {Math.round((profile?.apiConsumption?.monthlyTokensLimit ?? (profile?.isPremium ? 15000000 : 25000)) / 1000)}k tkn
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  Math.min(100, Math.round(((profile?.apiConsumption?.monthlyTokensUsed ?? (profile?.isPremium ? 85400 : 1500)) / (profile?.apiConsumption?.monthlyTokensLimit ?? (profile?.isPremium ? 15000000 : 25000))) * 100)) > 80 
                    ? 'bg-red-500' 
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.round(((profile?.apiConsumption?.monthlyTokensUsed ?? (profile?.isPremium ? 85400 : 1500)) / (profile?.apiConsumption?.monthlyTokensLimit ?? (profile?.isPremium ? 15000000 : 25000))) * 100))}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500">
              {profile?.isPremium 
                ? 'Acceso a contextos expandidos de manuales estratégicos y PDFs.' 
                : 'Membresía Sencilla limitada a 25k tokens para control de costos.'}
            </p>
          </div>

          {/* MONTHLY IMAGES */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-emerald-500" /> Renders de Diseño</span>
              <span className="font-mono font-bold text-white">
                {profile?.apiConsumption?.monthlyImagesUsed ?? (profile?.isPremium ? 12 : 1)} / {profile?.apiConsumption?.monthlyImagesLimit ?? (profile?.isPremium ? 500 : 3)} img
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  Math.min(100, Math.round(((profile?.apiConsumption?.monthlyImagesUsed ?? (profile?.isPremium ? 12 : 1)) / (profile?.apiConsumption?.monthlyImagesLimit ?? (profile?.isPremium ? 500 : 3))) * 100)) > 80 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.round(((profile?.apiConsumption?.monthlyImagesUsed ?? (profile?.isPremium ? 12 : 1)) / (profile?.apiConsumption?.monthlyImagesLimit ?? (profile?.isPremium ? 500 : 3))) * 100))}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500">
              {profile?.isPremium 
                ? 'Imágenes ultra-realistas Brutalist Obsidian ilimitadas.' 
                : 'Imágenes limitadas. La simulación requiere licencia real.'}
            </p>
          </div>
        </div>
      </div>

      {/* Structured 5-Tier Monthly Subscription Grid - Full Width for Perfect Dimensions */}
      <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 mb-8 text-left animate-fadeIn">
        <div>
          <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest block mb-1">
            MANIOBRA 5: SECTORIZACIÓN CORPORATIVA
          </span>
          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
            Planes de Suscripción Estratégica
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Estructura computacional y funcional de la suite. Elige un plan inicial económico de copy o escala a renders de diseño ilimitados según tus metas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
          
          {/* Copy & Chat Economy Plan */}
          <div className="bg-[#0c0d11]/90 border border-[#f59e0b]/20 hover:border-[#f59e0b]/40 rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-black text-[#f59e0b] uppercase tracking-wider block">ECONÓMICO TEXTO</span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Copy & Chat</h4>
                </div>
                <div className="text-right text-[#f59e0b]">
                  <span className="text-sm font-mono font-black">$4.99</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wide block">Al mes</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Plan súper accesible enfocado únicamente en la generación de copys y asesoría de IA.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-3 font-sans">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
                  <span><strong>100 Consultas IA / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5 text-slate-650">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-600" />
                  <span className="line-through text-slate-500">0 Renders Imagen / mes</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
                  <span>Soporta Add-ons de diseño.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleScrollToCheckout}
              className="w-full mt-4 py-2.5 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] rounded-xl text-xs font-mono uppercase font-black tracking-wider border border-[#f59e0b]/20 cursor-pointer text-center transition-all"
            >
              Adquirir $4.99
            </button>
          </div>

          {/* Pilot Plan Card (Prueba) */}
          <div className="bg-[#0c0d11]/80 border border-white/5 rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-wider block">PLAN PILOTO</span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Pilot (Prueba)</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-slate-300">$9.00</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wide block">Al mes</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Excelente micro-plan inicial para probar la potencia y velocidad de la plataforma de diseño.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-3 font-sans">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>50 Consultas IA / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>10 Renders Imagen / mes</strong>.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleScrollToCheckout}
              className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono uppercase font-black tracking-wider border border-white/5 cursor-pointer text-center transition-all"
            >
              Probar Plan Pilot
            </button>
          </div>

          {/* Starter Plan Card */}
          <div className="bg-[#0c0d11]/80 border border-white/5 rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">PLAN INICIAL</span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Starter Mensual</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-slate-300">$29.00</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wide block">Al mes</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Perfecto para emprendedores iniciando su marca. Incluye consultoría estratégica y cuotas de diseño moderadas.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-3 font-sans">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>250 Consultas IA / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>50 Renders Imagen / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span>Sincronización en la Nube.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleScrollToCheckout}
              className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono uppercase font-black tracking-wider border border-white/5 cursor-pointer text-center transition-all"
            >
              Adquirir Starter
            </button>
          </div>

          {/* Growth Plan Card */}
          <div className="bg-gradient-to-b from-[#0e1017] to-[#040508] border border-brand-primary/45 rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.02] shadow-2xl shadow-brand-primary/10 ring-1 ring-brand-primary/20 relative overflow-hidden h-full">
            <div className="absolute top-2 right-2 bg-brand-primary/20 text-brand-primary text-[6px] font-mono font-bold px-1.5 py-0.5 rounded border border-brand-primary/20">POPULAR</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-brand-primary/15 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block">CRECIMIENTO</span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Growth Mensual</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-brand-primary">$79.00</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wide block">Al mes</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                La opción ideal para marcas y negocios activos que escalan su volumen de pautas publicitarias y copys.
              </p>
              <ul className="space-y-2 text-xs text-white border-t border-brand-primary/10 pt-3 font-sans">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>1,000 Consultas IA / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>150 Renders Imagen / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span>Acceso al Estilógrafo de logos.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleScrollToCheckout}
              className="w-full mt-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-mono uppercase font-black tracking-wider cursor-pointer text-center transition-all"
            >
              Adquirir Growth
            </button>
          </div>

          {/* Scale Plan Card */}
          <div className="bg-[#0c0d11]/80 border border-white/5 rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">EMPRESARIAL</span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Scale Mensual</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-black text-slate-300">$199.00</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wide block">Al mes</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Máxima velocidad para agencias o equipos de mercadeo que administran múltiples cuentas de marca en paralelo.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-3 font-sans">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>Consultas IA ILIMITADAS</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span><strong>500 Renders Imagen / mes</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span>Soporte prioritario 24/7.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleScrollToCheckout}
              className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono uppercase font-black tracking-wider border border-white/5 cursor-pointer text-center transition-all"
            >
              Adquirir Scale
            </button>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Extra Renders & SRE Audit (7 columns) */}
        <div className="lg:col-span-7 space-y-6 text-left animate-fadeIn">
          {/* COMPRA DE RENDERS ADICIONALES (ADD-ONS) */}
          <div className="bg-[#090a0f] border border-white/5 rounded-3xl p-5 space-y-4">
            <div>
              <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest block mb-0.5">
                ADD-ONS DE COMPUTO
              </span>
              <h4 className="text-base font-display font-black text-white uppercase tracking-tight">
                Paquetes de Renders Adicionales
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                ¿Se agotaron tus créditos mensuales? Recarga saldo de renders para el motor de logos e imágenes al instante sin alterar tu suscripción actual. Tus créditos acumulados nunca vencen.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Pack 50 */}
              <div className="p-4 bg-white/[0.01] border border-white/5 hover:border-brand-primary/30 rounded-xl flex items-center justify-between transition-colors">
                <div className="text-left space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wide block">PACK STARTER</span>
                  <strong className="text-xs text-white uppercase block">50 Renders Extra</strong>
                  <span className="text-[9px] text-slate-400 font-mono">$4.99 USD</span>
                </div>
                <button
                  type="button"
                  onClick={handleScrollToCheckout}
                  className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Recargar
                </button>
              </div>

              {/* Pack 150 */}
              <div className="p-4 bg-white/[0.01] border border-brand-primary/20 hover:border-brand-primary/40 rounded-xl flex items-center justify-between relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 bg-brand-primary/10 text-brand-primary text-[6px] font-mono font-bold px-1.5 py-0.5 rounded-bl">Ahorro</div>
                <div className="text-left space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-brand-primary uppercase tracking-wide block">PACK PRO</span>
                  <strong className="text-xs text-white uppercase block">150 Renders Extra</strong>
                  <span className="text-[9px] text-brand-primary font-mono font-bold">$12.99 USD</span>
                </div>
                <button
                  type="button"
                  onClick={handleScrollToCheckout}
                  className="p-2 bg-brand-primary text-white rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Recargar
                </button>
              </div>

              {/* Pack 500 */}
              <div className="p-4 bg-white/[0.01] border border-white/5 hover:border-brand-primary/30 rounded-xl flex items-center justify-between transition-colors">
                <div className="text-left space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wide block">PACK SCALE</span>
                  <strong className="text-xs text-white uppercase block">500 Renders Extra</strong>
                  <span className="text-[9px] text-slate-400 font-mono">$34.99 USD</span>
                </div>
                <button
                  type="button"
                  onClick={handleScrollToCheckout}
                  className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Recargar
                </button>
              </div>
            </div>
          </div>

          {/* Sincere SRE and Programming Audit Diagnostic (Requested by user) */}
          <div className="bg-[#0b0c10]/40 border border-red-500/10 rounded-2xl p-5 space-y-3 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-3 text-[10px] font-mono font-black text-red-500/20">
              AUDIT_ID: SRE-55320
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-wider">
                DIAGNÓSTICO CRÍTICO DE INGENIERÍA Y SISTEMAS
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white uppercase font-sans">
                "El suicidio silencioso de la Persistencia Local"
              </p>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                Como Analista de Programación Principal de la red de desarrollo más importante del mundo, seré críticamente sincero: <strong className="text-white">La Membresía Sencilla es un sandbox inestable para producción real.</strong> Si confías la base de marca de tu negocio únicamente a la memoria volátil del navegador (localStorage), estás a un solo clic de que una limpieza automática de cookies, un reinicio de sistema o una actualización del motor de renderizado borre tu ADN comercial por completo. 
              </p>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans pt-1">
                La <strong className="text-brand-primary">Membresía Elite PRO</strong> no es sólo un conjunto de botones de colores; es un cambio de arquitectura física. Al habilitar Firebase Firestore, introducimos aislamiento de transacciones de bases de datos indexadas y sincronía multi-hilo en la nube. Desde el punto de vista de seguridad e ingeniería de software, consolidar tu marca con persistencia indestructible en la nube es la única maniobra lógica aceptable para evitar fugas de confianza y disrupciones SRE.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout forms (5 columns) */}
        <div className="lg:col-span-5 text-left space-y-6">
          {profile?.isPremium && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-mono tracking-widest font-black uppercase rounded-md border border-emerald-500/20">
                  SINCRO PREMIUM ACTIVO
                </span>
                <h3 className="text-base font-display font-black text-white uppercase tracking-wider">
                  Membresía Elite Habilitada
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Tu perfil cuenta con el rango superior desbloqueado. Las restricciones de consulta de la IA y el generador de activos visuales han sido desactivados para tu ID único.
                </p>
              </div>
              
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={handleResetPremiumDev}
                  className="w-full py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border border-white/5"
                >
                  Desactivar PRO (Debug Mode)
                </button>
              </div>
            </div>
          )}

          <div id="crypto-checkout-section" className="bg-[#090a0f] border border-white/5 rounded-3xl p-6 space-y-5 text-left">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-primary" />
                <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block">
                  PAGO DIRECTO CRIPTO
                </span>
              </div>
              <h4 className="text-base font-display font-black text-white uppercase tracking-tight">
                Billeteras de Pago Directo
              </h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Realiza tu pago directamente con el monto de la membresía o recarga que desees adquirir. Copia la dirección correspondiente y transfiere desde tu billetera favorita:
              </p>
            </div>

            {/* Billeteras de pago */}
            <div className="space-y-4 pt-2">
              {/* Binance Pay */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2 relative overflow-hidden transition-all hover:border-amber-500/20">
                <div className="flex justify-between items-center">
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[7px] font-mono font-black rounded uppercase tracking-wider border border-amber-500/20">
                    MÉTODO A: BINANCE PAY (USDT)
                  </span>
                </div>
                <p className="text-slate-500 text-[10px] font-sans">
                  Transferencia instantánea sin comisiones de red usando nuestro Pay ID oficial:
                </p>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="text-white font-bold">Pay ID: 39180442</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('39180442', 'ID de Binance Pay')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Copiar ID de Binance Pay"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bitcoin Address */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2 relative overflow-hidden transition-all hover:border-orange-500/20">
                <div className="flex justify-between items-center">
                  <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 text-[7px] font-mono font-black rounded uppercase tracking-wider border border-orange-500/20">
                    MÉTODO B: BILLETERA BITCOIN (BTC)
                  </span>
                </div>
                <p className="text-slate-500 text-[10px] font-sans">
                  Envía cualquier cantidad de BTC directamente a la red blockchain oficial:
                </p>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="text-white font-bold select-all truncate max-w-[210px]">
                    bc1q7w5n57q366rvy228d4d4gywtajexahnydgmgyx
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('bc1q7w5n57q366rvy228d4d4gywtajexahnydgmgyx', 'Dirección Bitcoin')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Copiar Dirección Bitcoin"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0c10]/40 border border-brand-primary/10 rounded-2xl p-4 text-[10px] text-slate-400 leading-normal font-sans">
              💡 **Nota de Activación**: Una vez completado tu pago, la mesa de soporte verificará la red de forma inmediata y habilitará tu plan de forma remota en tu cuenta.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}