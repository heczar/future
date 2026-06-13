/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Zap, 
  Shield, 
  Crown, 
  Users, 
  TrendingUp, 
  Cpu, 
  Palette, 
  ShieldCheck, 
  Smartphone, 
  Bell, 
  Download, 
  Sparkles, 
  Send, 
  Globe, 
  SmartphoneCharging, 
  MessageSquare,
  HelpCircle,
  Share2,
  Lock,
  Volume2,
  VolumeX,
  Smartphone as PhoneIcon,
  CreditCard,
  DollarSign,
  ArrowLeft,
  Check,
  Building,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MembershipPlansProps {
  profile?: any;
  onUpdateProfile?: (newProfile: any) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  text: string;
  type: 'post' | 'alert' | 'consejo' | 'custom';
  time: string;
  avatar: string;
}

export default function MembershipPlans({ profile, onUpdateProfile }: MembershipPlansProps) {
  const isPremiumActive = profile?.isPremium || false;

  // Scroll to top when view mounts
  useEffect(() => {
    const forceScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo({ top: 0 });
      document.body.scrollTo({ top: 0 });
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0 });
      }
    };
    forceScroll();
    const t1 = setTimeout(forceScroll, 50);
    const t2 = setTimeout(forceScroll, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Pago Móvil States
  const [showPagoMovilForm, setShowPagoMovilForm] = useState(false);
  const [pM_bank, setPM_bank] = useState('Banesco');
  const [pM_phone, setPM_phone] = useState('');
  const [pM_id, setPM_id] = useState('');
  const [pM_ref, setPM_ref] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Binance & ETH / PayPal & Bank Transfer States
  const [paymentMethod, setPaymentMethod] = useState<'pago_movil' | 'binance_eth' | 'paypal' | 'bank_transfer'>('pago_movil');
  const [binanceMethod, setBinanceMethod] = useState('Binance Pay / Binance Direct');
  const [binanceWallet, setBinanceWallet] = useState('');
  const [binanceHash, setBinanceHash] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalTxId, setPaypalTxId] = useState('');
  const [bankTransferSender, setBankTransferSender] = useState('');
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const userWalletDest = "0x9C84AdFD95062d5ECED4068b3a190912DdB3f841";

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(userWalletDest);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const bcvTasa = 582.68;
  const planCostUsd = 10;
  const planCostBs = planCostUsd * bcvTasa;

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'pago_movil') {
      if (!pM_phone || !pM_id || !pM_ref) {
        setToast('⚠️ Por favor completa todos los campos del Pago Móvil.');
        setTimeout(() => setToast(null), 3000);
        return;
      }
      
      if (onUpdateProfile && profile) {
        onUpdateProfile({
          ...profile,
          pagoMovilRequest: {
            bank: pM_bank,
            phone: pM_phone,
            id: pM_id,
            reference: pM_ref,
            amountUsd: planCostUsd,
            amountBs: planCostBs,
            timestamp: new Date().toISOString(),
            status: 'pending',
            paymentType: 'pago_movil'
          }
        });
        setToast('✅ ¡Reporte de Pago Móvil enviado con éxito! Su cuenta está en verificación.');
        setTimeout(() => setToast(null), 5000);
        setShowPagoMovilForm(false);
        
        // Attempt to play notification sound
        playNotificationSound();
      }
    } else if (paymentMethod === 'binance_eth') {
      // Binance ETH L2 Base
      if (!binanceWallet || !binanceHash) {
        setToast('⚠️ Por favor completa los campos del reporte para verificar su pago en Crypto.');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      if (onUpdateProfile && profile) {
        onUpdateProfile({
          ...profile,
          pagoMovilRequest: {
            bank: `Binance ETH Base (${binanceMethod})`,
            phone: binanceWallet,
            id: 'Web3 Wallet L2 Base Direct',
            reference: binanceHash,
            amountUsd: planCostUsd,
            amountBs: 0,
            timestamp: new Date().toISOString(),
            status: 'pending',
            paymentType: 'binance_eth'
          }
        });
        setToast('✅ ¡Reporte de Pago Crypto enviado con éxito! Su cuenta está en verificación.');
        setTimeout(() => setToast(null), 5000);
        setShowPagoMovilForm(false);
        
        // Attempt to play notification sound
        playNotificationSound();
      }
    } else if (paymentMethod === 'paypal') {
      if (!paypalEmail || !paypalTxId) {
        setToast('⚠️ Por favor completa los campos del reporte para verificar su pago en PayPal.');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      if (onUpdateProfile && profile) {
        onUpdateProfile({
          ...profile,
          pagoMovilRequest: {
            bank: 'PayPal Direct Gateway',
            phone: paypalEmail,
            id: 'PayPal Verified Transaction',
            reference: paypalTxId,
            amountUsd: planCostUsd,
            amountBs: 0,
            timestamp: new Date().toISOString(),
            status: 'pending',
            paymentType: 'paypal'
          }
        });
        setToast('✅ ¡Reporte de Pago PayPal enviado con éxito! Su cuenta está en verificación.');
        setTimeout(() => setToast(null), 5000);
        setShowPagoMovilForm(false);
        playNotificationSound();
      }
    } else if (paymentMethod === 'bank_transfer') {
      if (!bankTransferSender || !bankTransferRef) {
        setToast('⚠️ Por favor completa los campos del reporte de transferencia bancaria.');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      if (onUpdateProfile && profile) {
        onUpdateProfile({
          ...profile,
          pagoMovilRequest: {
            bank: 'Banco de Venezuela Direct',
            phone: bankTransferSender,
            id: 'Transf. Directa VES',
            reference: bankTransferRef,
            amountUsd: planCostUsd,
            amountBs: planCostBs,
            timestamp: new Date().toISOString(),
            status: 'pending',
            paymentType: 'bank_transfer'
          }
        });
        setToast('✅ ¡Reporte de Transferencia Bancaria enviado con éxito! Su cuenta está en verificación.');
        setTimeout(() => setToast(null), 5000);
        setShowPagoMovilForm(false);
        playNotificationSound();
      }
    }
  };

  const handleSimulateApproval = () => {
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        isPremium: true,
        pagoMovilRequest: {
          ...(profile.pagoMovilRequest || {}),
          status: 'approved',
          approvedAt: new Date().toISOString()
        }
      });
      setToast('🎉 ¡Membresía FUTURA PRO Activada satisfactoriamente!');
      setTimeout(() => setToast(null), 5000);
      playNotificationSound();
    }
  };

  const handleSimulateRejection = () => {
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        isPremium: false,
        pagoMovilRequest: {
          ...(profile.pagoMovilRequest || {}),
          status: 'rejected',
          rejectedAt: new Date().toISOString()
        }
      });
      setToast('❌ Transacción No Encontrada o Rechazada.');
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleClearRequest = () => {
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        pagoMovilRequest: null
      });
    }
  };

  // Notification simulator states
  const [phoneNotificationsEnabled, setPhoneNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customNotificationText, setCustomNotificationText] = useState('');
  const [activeSimulatorGuide, setActiveSimulatorGuide] = useState<'pwa' | 'playstore'>('pwa');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  
  // Flash light effect whenever cell phone receives alert
  const [simulatorFlash, setSimulatorFlash] = useState(false);
  const [activeAlert, setActiveAlert] = useState<NotificationItem | null>(null);

  const [notificationLog, setNotificationLog] = useState<NotificationItem[]>([
    {
      id: '1',
      title: '💡 [CONSEJO TÁCTICO SPE]',
      text: 'Growth Strategist: Hoy la retención orgánica nocturna ha subido un 14%. Se recomienda publicar tu Carrusel en 1h.',
      type: 'consejo',
      time: 'Hace 5m',
      avatar: '📈'
    },
    {
      id: '2',
      title: '📢 [AGENDADOR FUTURA PRO]',
      text: 'Tu post "Nexo Estético" fue inyectado con éxito en el canal con 3 canales de distribución activos.',
      type: 'post',
      time: 'Hace 15m',
      avatar: '🤖'
    }
  ]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleTogglePremium = (targetPremium: boolean) => {
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        isPremium: targetPremium
      });
    }
  };

  // Sound generator using Web Audio API to prevent missing audio asset errors
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Synthesize a sci-fi elegant double chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
      
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Web Audio API not allowed or supported yet:", e);
    }
  };

  const plans = [
    {
      name: "Sencillo / Starter (Gratis)",
      price: "$0",
      period: "/ siempre",
      description: "Prueba de potencia básica para validar la estrategia de marcas con una sola identidad asimilada.",
      features: [
        "Brand Vault (1 Marca Activa)",
        "Motor Creativo Básico (Créditos limitados)",
        "Análisis de Producto Básico",
        "Resultados sobre Estética — Protocolo Futura",
        "Soporte comunitario estándar",
        "❌ Sin Agendación Directa en Calendario",
        "❌ Sin Red de Agentes Coordinados (SPE Pro)",
        "❌ Sin Extracción Avanzada de Documentos",
      ],
      cta: isPremiumActive ? "Degradar a Gratis" : "Tu Plan Actual",
      action: () => {
        handleTogglePremium(false);
        handleClearRequest();
      },
      disabled: !isPremiumActive,
      pro: false
    },
    {
      name: "Futura Pro / Elite",
      price: "$10",
      period: "/ mes",
      description: "Despliegue empresarial ilimitado y automatizado. Acceso total a la infraestructura estratégica de agentes de FUTURA.",
      features: [
        "Brand Vault (Múltiples Identidades Activas)",
        "Generación Ilimitada en Motor Creativo",
        "Inyección y Publicación Directa al Calendario",
        "Elite Agent Network (Copy Lead, Growth & Art)",
        "Extracción Profunda e Ilimitada de Drive",
        "Asesor Estratégico Premium (Chat SPE 24/7)",
        "Prioridad de Procesamiento Máxima en Nube",
        "Licencia de Uso Comercial Total de Activos"
      ],
      cta: isPremiumActive 
        ? "SUSCRIPCIÓN PRO ACTIVA" 
        : profile?.pagoMovilRequest?.status === 'pending'
          ? "📱 PAGO EN VERIFICACIÓN (VER)"
          : "ADQUIRIR PLAN PRO ($10/mes)",
      action: () => {
        setShowPagoMovilForm(true);
      },
      disabled: false,
      pro: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-12 px-4 sm:px-6">
      {/* Toast Notification Floating Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-brand-primary/40 py-3.5 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-xs font-black text-white uppercase tracking-wider">{toast}</span>
        </div>
      )}

      {/* SECCIÓN 1: PAGO MÓVIL BAJO VERIFICACIÓN (Camino a seguir / Cola de reportes) */}
      {profile?.pagoMovilRequest?.status === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-amber-500/5 border border-amber-500/25 p-6 sm:p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h3 className="text-md font-black text-amber-400 uppercase tracking-wider font-display">
                  ⏳ ESTATUS: Verificando {
                    profile.pagoMovilRequest.paymentType === 'pago_movil' ? 'Pago Móvil' :
                    profile.pagoMovilRequest.paymentType === 'binance_eth' ? 'Pago Crypto (Binance/ETH)' :
                    profile.pagoMovilRequest.paymentType === 'paypal' ? 'Pago PayPal' :
                    profile.pagoMovilRequest.paymentType === 'bank_transfer' ? 'Transferencia Directa VES' :
                    'Transacción de Pago'
                  }
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Referencia Registrada: #{profile.pagoMovilRequest.reference} • Monto: {profile.pagoMovilRequest.amountBs > 0 ? `${profile.pagoMovilRequest.amountBs.toFixed(2)} Bs / ` : ''}{profile.pagoMovilRequest.amountUsd} USD
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[9px] font-mono uppercase tracking-widest">
                Ref: {profile.pagoMovilRequest.reference}
              </span>
              <button 
                onClick={handleClearRequest}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-mono uppercase cursor-pointer"
              >
                Cancelar Reporte
              </button>
            </div>
          </div>

          {/* El Camino a Seguir / Pipeline Visual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-2">
            <div className="bg-black/35 p-4 rounded-xl border border-white/5 space-y-2 relative">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Paso 1: Reportado</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-normal font-sans">
                Pago enviado vía {profile.pagoMovilRequest.bank}. Banco emisor y referencia registrados en la base de datos de FUTURA.
              </p>
              <span className="text-[8px] text-slate-500 font-mono block pt-1">Hora: {new Date(profile.pagoMovilRequest.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 space-y-2 relative">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Clock className="w-4 h-4 shrink-0 animate-spin" />
                <span>Paso 2: Conciliación</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-normal font-sans">
                Verificando detalles de la transacción con el banco o pasarela destino. Nuestro bot de acreditación SPE valida fondos en menos de 5 min.
              </p>
              <span className="text-[8px] text-amber-400 font-mono block pt-1 animate-pulse">Esperando conciliación...</span>
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/5 opacity-50 space-y-2 relative">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <Crown className="w-4 h-4 shrink-0" />
                <span>Paso 3: Activación</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                Expansión de la Bóveda de Marca, créditos ilimitados en el Motor Creativo y activación automática en el dashboard.
              </p>
              <span className="text-[8px] text-slate-600 font-mono block pt-1">Pendiente de acreditación</span>
            </div>
          </div>

          {/* SIMULADOR ADMINISTRATIVO (ADMIN OVERRIDE DETAILED PATHWAY) */}
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-5 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest">
              <Cpu className="w-4 h-4 text-brand-primary" />
              <span>🤖 SIMULADOR ADMINISTRATIVO (Flujo de Activación)</span>
            </div>
            
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
              En una aplicación de producción comercial, nuestro bot o panel de administración consolida la conciliación bancaria y aprueba la membresía. Para que puedas ver el camino completo y activar tu cuenta hoy mismo, usa esta consola para simular la verificación exitosa de tu reporte:
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleSimulateApproval}
                type="button"
                className="px-4 py-2 bg-brand-primary text-white hover:bg-brand-primary/80 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10"
              >
                <Check className="w-3.5 h-3.5" />
                Aprobar Pago (Simular Depósito Exitoso)
              </button>
              <button
                onClick={handleSimulateRejection}
                type="button"
                className="px-4 py-2 bg-red-500/25 border border-red-500/30 text-white hover:bg-red-500/40 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 cursor-pointer"
              >
                Rechazar Reporte (Simular Error de Fondos)
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECCIÓN 2: FORMULARIO WIZARD PAGO MÓVIL vs. LISTA DE PLANES */}
      {showPagoMovilForm ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto bg-surface-950 p-6 sm:p-10 rounded-[3rem] border border-brand-primary/20 shadow-2xl space-y-8 text-left relative"
          id="conector-pago-movil"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <CreditCard className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Canal de Activación Plan PRO</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Selecciona tu método de pago preferido</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowPagoMovilForm(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" /> VOLVER A PLANES
            </button>
          </div>

          {/* Selector de Método de Pago */}
          <div className="grid grid-cols-2 lg:grid-cols-4 bg-black/40 p-1.5 rounded-[1.5rem] border border-white/5 w-full gap-1 font-sans">
            <button
              type="button"
              onClick={() => setPaymentMethod('pago_movil')}
              className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'pago_movil'
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Pago Móvil</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('binance_eth')}
              className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'binance_eth'
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Binance ETH</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'paypal'
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <DollarSign className="w-4 h-4 text-sky-400" />
              <span>PayPal</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'bank_transfer'
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Transf. Bancaria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* IZQUIERDA: DATOS DESTINATARIO E INSTRUCCIONES DEL CAMINO */}
            {paymentMethod === 'pago_movil' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">1. DATOS DE DESTINO (PAGO MÓVIL)</span>
                  
                  <div className="bg-black/45 border border-white/5 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Banco Receptor:</span>
                      <strong className="text-white font-mono">Banco de Venezuela 0102</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Teléfono Destinatario:</span>
                      <strong className="text-white font-mono">0412-948.62.39</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Cédula:</span>
                      <strong className="text-white font-mono">V-24.829.302</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Tasa de Cambio Oficial:</span>
                      <strong className="text-amber-400 font-mono">{bcvTasa.toFixed(2)} Ves / Usd</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-slate-200 font-bold uppercase text-[10px] tracking-wider font-sans">Monto Exacto a Transferir:</span>
                      <strong className="text-brand-primary font-display text-base tracking-tight font-sans">{planCostBs.toFixed(2)} Bs. <span className="text-xs text-slate-500">(${planCostUsd} USD)</span></strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">2. EL CAMINO A SEGUIR PARA LA ACTIVACIÓN</span>
                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/5 text-left font-sans">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Realiza tu Pago Móvil desde la aplicación de tu banco nacional por el monto completo de <strong>{planCostBs.toFixed(2)} Bs</strong>.</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>Copia el **Número de Referencia** único de la transacción emitida por tu banco.</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p>Llena el formulario de reporte de Pago Móvil de la derecha y haz clic en <strong>"Enviar Reporte de Pago"</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : paymentMethod === 'binance_eth' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block font-mono">1. DATOS DE DESTINO (CRIPTOMONEDAS)</span>
                  
                  <div className="bg-black/45 border border-amber-500/10 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Red de Destino:</span>
                      <strong className="text-amber-400 font-mono">BASE (Ethereum L2) o Binance Pay</strong>
                    </div>

                    <div className="border-b border-white/5 pb-2 space-y-1.5 text-left">
                      <span className="text-slate-400 text-xs font-sans block">Dirección de Billetera Oficial:</span>
                      <div className="flex items-center gap-2 bg-slate-900/90 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white font-mono text-[10.5px] truncate select-all">{userWalletDest}</span>
                        <button
                          type="button"
                          onClick={handleCopyWallet}
                          className="px-2.5 py-1 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          {copiedWallet ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-slate-200 font-bold uppercase text-[10px] tracking-wider font-sans">Monto a Transferir:</span>
                      <strong className="text-brand-primary font-display text-base tracking-tight font-sans">$10.00 USD <span className="text-xs text-slate-500">(en ETH o Stablecoin)</span></strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">2. EL CAMINO DE ACTIVACIÓN CON CRIPTO</span>
                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/5 text-left font-sans">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Envía <strong>$10 USD</strong> en Ethereum (ETH) utilizando la red <strong>Base</strong>, o vía Binance Pay directo a la wallet.</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>Copia el <strong>Hash de la Transacción (Tx Hash)</strong> o ID de transferencia de Binance.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : paymentMethod === 'paypal' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block font-mono">1. DATOS DE DESTINO (PAYPAL)</span>
                  
                  <div className="bg-black/45 border border-sky-500/10 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Método de Envío:</span>
                      <strong className="text-sky-400 font-mono">Amigos y Familiares (Sin comisión)</strong>
                    </div>

                    <div className="border-b border-white/5 pb-2 space-y-1.5 text-left">
                      <span className="text-slate-400 text-xs font-sans block">Correo PayPal Oficial:</span>
                      <div className="flex items-center gap-2 bg-slate-900/90 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white font-mono text-[11px] truncate select-all">heczaroficial@gmail.com</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("heczaroficial@gmail.com");
                            alert("📋 Correo PayPal copiado: heczaroficial@gmail.com");
                          }}
                          className="px-2.5 py-1 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          Copiar Correo
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-slate-200 font-bold uppercase text-[10px] tracking-wider font-sans">Monto a Transferir:</span>
                      <strong className="text-brand-primary font-display text-base tracking-tight font-sans">$10.00 USD</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">2. INSTRUCCIONES PARA PAYPAL</span>
                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/5 text-left font-sans font-sans">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Entra a tu cuenta en <strong>PayPal.com</strong> y haz un envío de <strong>$10.00 USD</strong> al correo de arriba.</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>Copia el <strong>ID de transacción</strong> de tu recibo que genera PayPal automáticamente.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-mono">1. DATOS DE DESTINO (TRANSFERENCIA VES)</span>
                  
                  <div className="bg-black/45 border border-emerald-500/10 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Banco Destinatario:</span>
                      <strong className="text-white font-mono uppercase text-emerald-400">Banco de Venezuela</strong>
                    </div>

                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-400 font-sans">Cédula del Titular:</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-mono select-all">V-24829302</strong>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("V24829302");
                            alert("📋 Cédula copiada: V-24829302");
                          }}
                          className="px-1.5 py-0.5 bg-white/5 text-slate-400 hover:text-white rounded text-[9px] uppercase cursor-pointer"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    <div className="border-b border-white/5 pb-2 space-y-1.5 text-left">
                      <span className="text-slate-400 text-xs font-sans block">Número de Cuenta VES:</span>
                      <div className="flex items-center justify-between gap-2 bg-slate-900/90 rounded-xl p-2.5 border border-white/10">
                        <span className="text-white font-mono text-[11.5px] truncate select-all tracking-wider">01020412790000744654</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("01020412790000744654");
                            alert("📋 Número de cuenta copiado: 01020412790000744654");
                          }}
                          className="px-2.5 py-1 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          Copiar Cuenta
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-200 font-bold uppercase text-[10px] tracking-wider font-sans">Tasa BCV Referencia:</span>
                      <strong className="text-slate-400 font-mono text-xs">{bcvTasa} Bs/USD</strong>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2">
                      <span className="text-slate-200 font-bold uppercase text-[10px] tracking-wider font-sans">Monto VES a Transferir:</span>
                      <strong className="text-brand-primary font-display text-base tracking-tight font-sans">
                        {planCostBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">2. INSTRUCCIONES DE TRANSFERENCIA</span>
                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/5 text-left font-sans font-sans">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Inicia sesión en tu banco emisor y efectúa una transferencia directa por el monto exacto en Bolívares (VES).</p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>Asegúrate de guardar el recibo y copiar el <strong>Número de Referencia</strong> de la operación bancaria para rellenar el formulario de la derecha.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DERECHA: FORMULARIO DE REPORTE DINÁMICO */}
            <form onSubmit={handleSubmitPayment} className="bg-black/35 p-6 rounded-2xl border border-white/5 space-y-4 text-left font-sans">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                {paymentMethod === 'pago_movil' 
                  ? '3. FORMULARIO REPORTE PAGO MÓVIL' 
                  : paymentMethod === 'binance_eth'
                  ? '3. REPORTE DE DEPÓSITO CRYPTO'
                  : paymentMethod === 'paypal'
                  ? '3. REPORTE DE PAGO PAYPAL'
                  : '3. REPORTE DE TRANSFERENCIA BANCARIA'}
              </span>

              {paymentMethod === 'pago_movil' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Banco Emisor desde donde pagaste:</label>
                    <select
                      value={pM_bank}
                      onChange={(e) => setPM_bank(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none cursor-pointer"
                    >
                      <option value="Banesco">Banesco</option>
                      <option value="Banco de Venezuela">Banco de Venezuela (BDV)</option>
                      <option value="Mercantil">Mercantil</option>
                      <option value="Provincial">BBVA Provincial</option>
                      <option value="BNC">Banco Nacional de Crédito (BNC)</option>
                      <option value="Bancaribe">Bancaribe</option>
                      <option value="BOD">BOD / Banco Occidental de Descuento</option>
                      <option value="Otro">Otro Banco Nacional</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Número de Teléfono Emisor:</label>
                    <input
                      type="tel"
                      placeholder="Ej: 0412-1234567"
                      value={pM_phone}
                      onChange={(e) => setPM_phone(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'pago_movil'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">ID / Cédula del Pagador:</label>
                    <input
                      type="text"
                      placeholder="Ej: V-12345678"
                      value={pM_id}
                      onChange={(e) => setPM_id(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'pago_movil'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Número de Referencia (Últimos 4-6 dígitos):</label>
                    <input
                      type="text"
                      placeholder="Ej: 981245"
                      value={pM_ref}
                      onChange={(e) => setPM_ref(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'pago_movil'}
                    />
                  </div>
                </>
              ) : paymentMethod === 'binance_eth' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Canal Utilizado:</label>
                    <select
                      value={binanceMethod}
                      onChange={(e) => setBinanceMethod(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none cursor-pointer"
                    >
                      <option value="Binance Pay / Binance Direct">Binance Pay / Binance Direct</option>
                      <option value="Web3 Wallet direct ETH (Base Network)">Metamask / TrustWallet direct ETH L2</option>
                      <option value="Coinbase Direct Transfer">Coinbase Direct Transfer</option>
                      <option value="Otro Proveedor / Red Base L2">Otro Proveedor / Red Base L2</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tu Billetera o ID de Envío (Para verificar origen):</label>
                    <input
                      type="text"
                      placeholder="Tu wallet: 0x... o ID de cuenta Binance"
                      value={binanceWallet}
                      onChange={(e) => setBinanceWallet(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'binance_eth'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Hash de Transacción / ID de Pago (Tx ID / Tx Hash):</label>
                    <input
                      type="text"
                      placeholder="Ej: 0xc182bd... o Binance TxID"
                      value={binanceHash}
                      onChange={(e) => setBinanceHash(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'binance_eth'}
                    />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <p className="text-[9.5px] text-amber-300 leading-normal font-sans text-left">
                      ⚠️ Asegúrese de enviar su transacción en la red **Base** (L2) para evitar pérdida de fondos.
                    </p>
                  </div>
                </>
              ) : paymentMethod === 'paypal' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tu Correo Electrónico de PayPal:</label>
                    <input
                      type="email"
                      placeholder="Ej: mi_correo@ejemplo.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'paypal'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">ID de Transacción PayPal (Recibo de Pago):</label>
                    <input
                      type="text"
                      placeholder="Ej: 8HG719273A..."
                      value={paypalTxId}
                      onChange={(e) => setPaypalTxId(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'paypal'}
                    />
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl">
                    <p className="text-[9.5px] text-sky-300 leading-normal font-sans text-left">
                      📌 El robot de FUTURA verificará que el ID corresponda al cobro de $10 USD para acreditar tu cuenta.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Nombre del Titular que Transfiere (Emisor):</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={bankTransferSender}
                      onChange={(e) => setBankTransferSender(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'bank_transfer'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Número de Referencia de Transferencia (Últimos 4 a 6 dígitos):</label>
                    <input
                      type="text"
                      placeholder="Ej: 7465"
                      value={bankTransferRef}
                      onChange={(e) => setBankTransferRef(e.target.value)}
                      className="w-full bg-surface-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-brand-primary outline-none"
                      required={paymentMethod === 'bank_transfer'}
                    />
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <p className="text-[9.5px] text-emerald-300 leading-normal font-sans text-left">
                      📌 Al enviar el reporte de transferencia directa, nuestro equipo concilia y activa tu cuenta premium de forma prioritaria.
                    </p>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-white/5 space-y-3">
                <p className="text-[10px] text-slate-500 leading-normal font-sans">
                  Al presionar el botón de abajo, se enviará el reporte del depósito para su validación inmediata por nuestro robot administrador.
                </p>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/20 font-bold uppercase tracking-widest text-xs text-white rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> REPORTAR DEPÓSITO PRO
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter text-white">Escala tu <span className="text-brand-primary">Producción</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm font-sans">
              De una idea solitaria a una potencia empresarial. Selecciona el nivel de potencia que tu visión exige. En FUTURA PRO habilitamos el motor de notificaciones y la integración de Pago Móvil.
            </p>
          </div>

          {/* Planes Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-4">
            {plans.map((plan, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-panel p-6 sm:p-10 rounded-[3rem] border transition-all ${
                  plan.pro ? 'border-brand-primary/45 bg-brand-primary/5 ring-1 ring-brand-primary/20' : 'border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className={`p-4 rounded-2xl ${plan.pro ? 'bg-brand-primary/20' : 'bg-white/5'}`}>
                    {plan.pro ? <Crown className="w-8 h-8 text-brand-primary animate-pulse" /> : <Zap className="w-8 h-8 text-slate-400" />}
                  </div>
                  {plan.pro && (
                    <span className="px-4 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest animate-pulse">
                      Executive Tier
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-left">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4 text-left">
                  <span className="text-4xl font-bold font-display">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 font-medium font-sans">{plan.period}</span>}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mb-10 leading-relaxed text-left font-sans">{plan.description}</p>

                <ul className="space-y-4 mb-10 text-left font-sans">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-xs sm:text-sm">
                      <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${plan.pro ? 'text-brand-primary' : 'text-slate-500'}`} />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={plan.action}
                  className={`w-full py-4 rounded-xl sm:rounded-2xl font-bold transition-all cursor-pointer text-sm sm:text-base ${
                    plan.pro 
                      ? isPremiumActive
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 text-lg'
                        : profile?.pagoMovilRequest?.status === 'pending'
                          ? 'bg-amber-500/20 border border-amber-500 text-amber-400 hover:bg-amber-500/30 font-extrabold text-base'
                          : 'bg-brand-primary text-white hover:shadow-2xl hover:shadow-brand-primary/40 text-lg hover:scale-[1.01]' 
                      : isPremiumActive
                        ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                        : 'bg-white/12 text-slate-200 border border-brand-primary/20 cursor-default'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
