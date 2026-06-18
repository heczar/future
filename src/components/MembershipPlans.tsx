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
  
  // Form submission state
  const [senderAccount, setSenderAccount] = useState(''); // Email/ID/Phone
  const [txReference, setTxReference] = useState(''); // Transaction ID reference
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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

    if (!senderAccount.trim() || !txReference.trim()) {
      triggerToast("⚠️ Todos los campos de validación son obligatorios.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const updatedPM = {
        bank: 'Binance Pay',
        phone: senderAccount,
        id: senderAccount,
        reference: txReference.toUpperCase(),
        amountUsd: 10,
        amountBs: 0,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        paymentType: 'binance_eth' as const
      };

      if (onUpdateProfile) {
        await onUpdateProfile({
          ...profile,
          pagoMovilRequest: updatedPM
        });
      }

      triggerToast("✅ ¡Reporte de pago enviado con éxito! Un administrador validará tu licencia.");
      setSenderAccount('');
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
    await onUpdateProfile({
      ...profile,
      pagoMovilRequest: null
    });
    triggerToast("Reporte cancelado. Puedes registrar otro reporte ahora.");
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
                {showCancelConfirm ? (
                  <div className="space-y-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                    <p className="text-[10px] text-red-400 font-bold font-mono text-center">¿Confirmas retirar tu reporte de pago?</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={async () => {
                          await cancelPendingReport();
                          setShowCancelConfirm(false);
                        }}
                        className="py-2 bg-red-500 hover:bg-red-650 text-white rounded-xl text-[9px] font-bold uppercase transition-all cursor-pointer font-mono text-center"
                      >
                        Sí, retirar
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[9px] font-bold uppercase transition-all cursor-pointer font-mono text-center border border-white/5"
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancelar y Corregir Reporte
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-950 border border-white/10 rounded-3xl p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5 align-middle">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Canal de Pago Único (Binance Pay)
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Activa tu licencia ilimitada hoy de forma segura e instantánea por solo <strong>$10.00 USDT</strong> con Binance:
                </p>
              </div>

              {/* Method Instructions */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-[11px] space-y-3">
                <div className="space-y-4 text-left animate-fadeIn">
                  <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-500 text-[8px] font-mono font-black rounded uppercase tracking-wider border border-amber-500/10">
                    BINANCE PAY (USDT)
                  </span>
                  <p className="text-slate-400 leading-normal font-sans text-xs">
                    Envía exactamente <strong>10.00 USDT</strong> a través de Binance Pay utilizando cualquiera de estas opciones:
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
                </div>
              </div>

              {/* Payment submission form */}
              <form onSubmit={handleSendPaymentReport} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                    ID / Email de tu cuenta Binance
                  </label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="Ej. 29018442 o tu-correo@binance.com"
                    required
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                    ID de Transacción / TxID Hash
                  </label>
                  <input
                    type="text"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    placeholder="Ej. T9A74B2981H"
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
