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
  ExternalLink
} from 'lucide-react';
import { useAuth } from './AuthWrapper';

interface MembershipPlansProps {
  profile?: any;
  onUpdateProfile?: (newProfile: any) => void;
}

export default function MembershipPlans({ profile, onUpdateProfile }: MembershipPlansProps) {
  const { user } = useAuth();
  
  // Tab Selector for manual payment methods
  const [selectedMethod, setSelectedMethod] = useState<'pago_movil' | 'binance' | 'paypal' | 'transferencia'>('pago_movil');
  
  // Form submission state
  const [senderAccount, setSenderAccount] = useState(''); // Email/ID/Phone
  const [senderCI, setSenderCI] = useState(''); // CI/ID/RIF
  const [selectedBank, setSelectedBank] = useState('Banco de Venezuela'); // Bank of origin
  const [txReference, setTxReference] = useState(''); // Transaction ID reference
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Trigger toast indicator
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Clipboard Copier
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`¡Copiado: ${label}!`);
  };

  // Send Payment Report Handler
  const handleSendPaymentReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedMethod === 'binance' || selectedMethod === 'paypal') {
      if (!senderAccount.trim() || !txReference.trim()) {
        triggerToast("⚠️ Todos los campos de validación son obligatorios.");
        return;
      }
    } else {
      if (!senderAccount.trim() || !senderCI.trim() || !txReference.trim()) {
        triggerToast("⚠️ Todos los campos de validación de pago son obligatorios.");
        return;
      }
    }

    setIsSubmittingReport(true);
    try {
      let bankName = '';
      let idValue = '';
      let paymentTypeValue: 'pago_movil' | 'binance_eth' | 'paypal' | 'transferencia' = 'pago_movil';
      let amountBsValue = 0;

      if (selectedMethod === 'binance') {
        bankName = 'Binance Pay';
        idValue = senderAccount;
        paymentTypeValue = 'binance_eth';
        amountBsValue = 0;
      } else if (selectedMethod === 'paypal') {
        bankName = 'PayPal';
        idValue = senderAccount;
        paymentTypeValue = 'paypal';
        amountBsValue = 0;
      } else if (selectedMethod === 'pago_movil') {
        bankName = `Pago Móvil (${selectedBank})`;
        idValue = `CI: ${senderCI}`;
        paymentTypeValue = 'pago_movil';
        amountBsValue = 596.78;
      } else if (selectedMethod === 'transferencia') {
        bankName = `Transferencia (${selectedBank})`;
        idValue = `CI/RIF: ${senderCI}`;
        paymentTypeValue = 'transferencia';
        amountBsValue = 596.78;
      }

      const updatedPM = {
        bank: bankName,
        phone: senderAccount,
        id: idValue,
        reference: txReference.toUpperCase(),
        amountUsd: 10,
        amountBs: amountBsValue,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        paymentType: paymentTypeValue
      };

      if (onUpdateProfile) {
        await onUpdateProfile({
          ...profile,
          pagoMovilRequest: updatedPM
        });
      }

      triggerToast("✅ ¡Reporte de pago enviado con éxito! Un administrador validará tu licencia.");
      setSenderAccount('');
      setSenderCI('');
      setTxReference('');
    } catch (err) {
      console.error(err);
      triggerToast("Ocurrió un error al cargar tu reporte de pago.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const cancelPendingReport = async () => {
    if (!user || !onUpdateProfile) return;
    if (window.confirm("¿Deseas retirar tu reporte de pago en curso?")) {
      await onUpdateProfile({
        ...profile,
        pagoMovilRequest: null
      });
      triggerToast("Reporte cancelado. Puedes registrar otro reporte ahora.");
    }
  };

  const handleResetPremiumDev = async () => {
    if (!user || !onUpdateProfile) return;
    await onUpdateProfile({
      ...profile,
      isPremium: false,
      pagoMovilRequest: null
    });
    triggerToast("Nivel reestablecido a DEMO (Modo de simulación).");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-12 px-4 sm:px-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Benefits (7 columns) */}
        <div className="lg:col-span-7 space-y-6 text-left animate-fadeIn">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest block mb-1">
                Comparación de Beneficios
              </span>
              <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                FUTURA Elite vs Starter
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Libera la potencia computacional estratégica de nuestra suite generativa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/35 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="text-slate-400 font-mono text-[10px] uppercase font-bold border-b border-white/5 pb-1">
                  Starter (Prueba Demo)
                </div>
                <ul className="space-y-1.5 text-xs text-slate-400 font-sans">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold shrink-0">✕</span> Análisis Limitados de IA
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold shrink-0">✕</span> Velocidad estándar de carga
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold shrink-0">✕</span> Sin copias de seguridad en la nube
                  </li>
                </ul>
              </div>

              <div className="bg-brand-primary/10 p-4 rounded-2xl border border-brand-primary/25 space-y-3">
                <div className="text-brand-primary font-mono text-[10px] uppercase font-black border-b border-brand-primary/10 pb-1 flex items-center justify-between">
                  <span>ELITE PRO TIER</span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                </div>
                <ul className="space-y-1.5 text-xs text-white font-medium font-sans">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Uso Ilimitado libre de topes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Máxima velocidad prioritaria
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Acceso Completo a la API Estratégica
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" /> Activación perpetua única
                  </li>
                </ul>
              </div>
            </div>

            {/* Simulated direct switch only for quick mock testing */}
            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p className="font-sans">¿Deseas probar la experiencia completa de forma inmediata?</p>
              <button
                type="button"
                onClick={async () => {
                  if (onUpdateProfile) {
                    const newMode = !profile.isPremium;
                    await onUpdateProfile({
                      ...profile,
                      isPremium: newMode,
                      pagoMovilRequest: newMode ? {
                        bank: 'Auto-Activación de Prueba',
                        phone: 'PRO_USER',
                        id: 'PRO_USER',
                        reference: 'AUTO_PRO_ACTIVATE',
                        amountUsd: 10,
                        amountBs: 0,
                        timestamp: new Date().toISOString(),
                        status: 'approved',
                        paymentType: 'binance_eth'
                      } : null
                    });
                    triggerToast(`Simulación: Cuenta cambiada a ${newMode ? 'PRO' : 'DEMO'}`);
                  }
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-mono text-[9px] uppercase tracking-wider border border-white/5 shrink-0 transition-colors cursor-pointer"
              >
                {profile.isPremium ? 'Cambiar a Demo 🔄' : 'Hacer Premium Seguro Pro ✨'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout forms (5 columns) */}
        <div className="lg:col-span-5 text-left space-y-6">
          {profile?.isPremium ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-mono tracking-widest font-black uppercase rounded-md border border-emerald-500/20">
                  SINCRO PREMIUM ACTIVO
                </span>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">
                  Membresía Elite Habilitada
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Tu perfil cuenta con el rango superior desbloqueado. Las restricciones de consulta de la IA y el generador de activos visuales han sido desactivados para tu ID único.
                </p>
              </div>
              
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={handleResetPremiumDev}
                  className="w-full py-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Desactivar PRO (Debug Mode)
                </button>
              </div>
            </div>
          ) : profile?.pagoMovilRequest?.status === 'pending' ? (
            <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-2 text-left bg-black/40 p-4 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                  Reporte de Pago Registrado
                </h4>
                <p className="text-xs text-slate-300 leading-normal font-sans pt-1">
                  Hemos recibido tu reporte de pago manual. Un miembro de la mesa de soporte verificará el número de transacción.
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] font-mono space-y-1">
                  <p className="text-slate-400 font-sans">Método: <strong className="text-white">{profile.pagoMovilRequest.bank}</strong></p>
                  <p className="text-slate-400 font-sans">Referencia: <strong className="text-brand-primary font-bold select-all">#{profile.pagoMovilRequest.reference}</strong></p>
                  <p className="text-slate-400 font-sans">ID / Celular / Mail: <span className="text-white select-all">{profile.pagoMovilRequest.id}</span></p>
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-500 text-center font-sans">
                  ¿Cometiste un error al ingresar los datos? Puedes retirar este reporte para ingresar uno nuevo.
                </p>
                <button
                  onClick={cancelPendingReport}
                  className="w-full py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar y Corregir Reporte
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-950 border border-white/10 rounded-3xl p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-primary" /> Canales de Pago Manuales
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Activa tu licencia ilimitada hoy por solo <strong>$10.00 USD</strong>. Elige tu pasarela favorita:
                </p>
              </div>

              {/* Selector Tabs: Pago Móvil, Binance, PayPal, Transferencia */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/35 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('pago_movil');
                    setSenderAccount('');
                    setTxReference('');
                  }}
                  className={`py-2 px-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 leading-none ${
                    selectedMethod === 'pago_movil'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-md'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                  title="Pago Móvil"
                >
                  Pago Móvil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('binance');
                    setSenderAccount('');
                    setTxReference('');
                  }}
                  className={`py-2 px-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 leading-none ${
                    selectedMethod === 'binance'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                  title="Binance Pay"
                >
                  Binance Pay
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('paypal');
                    setSenderAccount('');
                    setTxReference('');
                  }}
                  className={`py-2 px-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 leading-none ${
                    selectedMethod === 'paypal'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                  title="PayPal"
                >
                  PayPal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('transferencia');
                    setSenderAccount('');
                    setTxReference('');
                  }}
                  className={`py-2 px-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 leading-none ${
                    selectedMethod === 'transferencia'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-md'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                  title="Transferencia"
                >
                  Transf.
                </button>
              </div>

              {/* Method Instructions */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-[11px] space-y-3">
                
                {/* 1. Pago Móvil */}
                {selectedMethod === 'pago_movil' && (
                  <div className="space-y-2.5 text-left">
                    <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-400 text-[8px] font-mono font-black rounded uppercase tracking-wider border border-blue-500/10">
                      PAGO MÓVIL (Bs. Venezuela)
                    </span>
                    <p className="text-slate-400 leading-normal font-sans text-[10px]">
                      Realiza el Pago Móvil por el equivalente a <strong>$10.00 USD</strong> (Tasa Oficial: <strong>596,78 Bs.</strong>) con los siguientes datos:
                    </p>
                    
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2 text-[10px] font-mono">
                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">BANCO:</span>
                        <span className="text-white font-black">BANCO DE VENEZUELA</span>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">CELULAR:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black select-all">04129486239</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('04129486239', 'Teléfono Pago Móvil')}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">CÉDULA / RIF:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black select-all">V-24829302</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('24829302', 'Cédula Pago Móvil')}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">MONTO EN Bs:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-brand-primary font-black select-all">596,78 Bs.</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('596.78', 'Monto Bs.')}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Binance Pay */}
                {selectedMethod === 'binance' && (
                  <div className="space-y-4 text-left animate-fadeIn">
                    <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-500 text-[8px] font-mono font-black rounded uppercase tracking-wider border border-amber-500/10">
                      BINANCE PAY (USDT)
                    </span>
                    <p className="text-slate-400 leading-normal font-sans text-xs">
                      Envía exactamente <strong>10.00 USDT</strong> a través de Binance Pay de la forma más rápida utilizando cualquiera de estos métodos:
                    </p>

                    {/* Direct Link CTA Button */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                        Opción 1: Enlace de Pago Directo
                      </span>
                      <div className="flex gap-2">
                        <a 
                          href="https://s.binance.com/zqX4Rj6Q" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer"
                        >
                          Pagar Online <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy('https://s.binance.com/zqX4Rj6Q', 'Enlace Binance Pay')}
                          className="px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer"
                          title="Copiar Enlace de Pago"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* ID Details */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                        Opción 2: ID de Binance Pay
                      </span>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2 font-mono">
                        <div className="text-xs select-all text-white font-bold leading-none">
                          Pay ID: 39180442
                        </div>
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

                    {/* QR Code Visualization */}
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center">
                        Opción 3: Código QR Oficial
                      </span>
                      <div className="p-2 bg-slate-900 border border-white/10 rounded-xl max-w-[200px]">
                        <img 
                          src="/binance_qr.png" 
                          alt="Binance Pay QR Code" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-[8px] font-sans text-amber-400 font-bold uppercase tracking-wide text-center leading-normal">
                        Escanea con tu aplicación Binance para transferir $10 USDT
                      </span>
                    </div>

                  </div>
                )}

                {/* 3. PayPal */}
                {selectedMethod === 'paypal' && (
                  <div className="space-y-2 text-left">
                    <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[8px] font-mono font-black rounded uppercase tracking-wider border border-emerald-500/10">
                      DEPÓSITO DÓLARES PAYPAL
                    </span>
                    <p className="text-slate-400 leading-normal font-sans">
                      Envía exactamente <strong>$10.00 USD netos</strong> a nuestra cuenta de PayPal autorizada:
                    </p>
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2 font-mono">
                      <div className="text-xs select-all text-white font-bold leading-none truncate flex-1">
                        heczaroficial@gmail.com
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('heczaroficial@gmail.com', 'Correo PayPal')}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                        title="Copiar Correo PayPal"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Bank Transfer */}
                {selectedMethod === 'transferencia' && (
                  <div className="space-y-2.5 text-left">
                    <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-400 text-[8px] font-mono font-black rounded uppercase tracking-wider border border-purple-500/10">
                      TRANSFERENCIA BANCARIA (Venezuela / Bs)
                    </span>
                    <p className="text-slate-400 leading-normal font-sans text-[10px]">
                      Realiza una transferencia nacional por <strong>596,78 Bs.</strong> a la siguiente cuenta de ahorros/corriente:
                    </p>

                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2 text-[10px] font-mono">
                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">BANCO:</span>
                        <span className="text-white font-black">BANCO DE VENEZUELA</span>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">NRO DE CUENTA:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black select-all text-[9.5px]">01020412790000744654</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('01020412790000744654', 'Número de Cuenta')}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">TIPO:</span>
                        <span className="text-white font-black uppercase">Corriente (VES)</span>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">TITULAR:</span>
                        <span className="text-white font-black">Héctor Salazar</span>
                      </div>

                      <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-md">
                        <span className="text-slate-500 font-black">RIF / CÍ:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black select-all">V-24829302</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('24829302', 'Cédula/RIF')}
                            className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Payment submission form */}
              <form onSubmit={handleSendPaymentReport} className="space-y-3.5">
                {(selectedMethod === 'pago_movil' || selectedMethod === 'transferencia') && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                      Banco Emisor (Desde dónde pagaste)
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                    >
                      <option value="Banco de Venezuela">Banco de Venezuela</option>
                      <option value="Banesco">Banesco</option>
                      <option value="Mercantil">Mercantil</option>
                      <option value="Provincial">Provincial</option>
                      <option value="BNC">BNC</option>
                      <option value="Bancaribe">Bancaribe</option>
                      <option value="Banco del Tesoro">Banco del Tesoro</option>
                      <option value="Otro Banco">Otro Banco</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                    {selectedMethod === 'binance' 
                      ? 'ID / Email de tu cuenta Binance' 
                      : selectedMethod === 'paypal' 
                        ? 'Dirección Email de tu cuenta PayPal' 
                        : 'Número de Teléfono / ID del Emisor'}
                  </label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder={
                      selectedMethod === 'binance' 
                        ? "Ej. 29018442 o tu-correo@binance.com" 
                        : selectedMethod === 'paypal'
                          ? "Ej. tunombre@paypal.com"
                          : "Ej. 04241234567 o alias"
                    }
                    required
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                {(selectedMethod === 'pago_movil' || selectedMethod === 'transferencia') && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                      Cédula / ID del Titular pagador
                    </label>
                    <input
                      type="text"
                      value={senderCI}
                      onChange={(e) => setSenderCI(e.target.value)}
                      placeholder="Ej. V-24829302"
                      required
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                    {selectedMethod === 'binance' 
                      ? 'ID de Transacción / TxID Hash' 
                      : selectedMethod === 'paypal'
                        ? 'Código o ID de Referencia PayPal'
                        : 'Código de Referencia (Últimos 4, 6 o 8 números)'}
                  </label>
                  <input
                    type="text"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    placeholder={
                      selectedMethod === 'binance' 
                        ? "Ej. T9A74B2981H" 
                        : selectedMethod === 'paypal'
                          ? "Ej. PP-984F7-2"
                          : "Ej. 123456"
                    }
                    required
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/90 hover:scale-[1.01] transition-all text-white rounded-xl font-mono text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> ENVIANDO REPORTE...
                    </>
                  ) : (
                    <>
                      ENVIAR REPORTE DE PAGO <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
