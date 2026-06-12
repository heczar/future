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

  // Pago Móvil States
  const [showPagoMovilForm, setShowPagoMovilForm] = useState(false);
  const [pM_bank, setPM_bank] = useState('Banesco');
  const [pM_phone, setPM_phone] = useState('');
  const [pM_id, setPM_id] = useState('');
  const [pM_ref, setPM_ref] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const bcvTasa = 40.0;
  const planCostUsd = 10;
  const planCostBs = planCostUsd * bcvTasa;

  const handleSubmitPagoMovil = (e: React.FormEvent) => {
    e.preventDefault();
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
          status: 'pending'
        }
      });
      setToast('✅ ¡Reporte de Pago Móvil enviado con éxito! Su cuenta está en verificación.');
      setTimeout(() => setToast(null), 5000);
      setShowPagoMovilForm(false);
      
      // Attempt to play notification sound
      playNotificationSound();
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

  // Test System Notification Permission
  const requestWebPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporte notificaciones web.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        triggerSystemPush(
          "🔔 ¡Notificaciones Habilitadas!",
          "FUTURA PRO: Has activado el canal de alertas estratégicas en tiempo real.",
          "consejo"
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSystemPush = (title: string, text: string, type: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: text,
          icon: '/logo.png',
        });
      } catch (err) {
        // Fallback for issues inside browser permissions sandbox
        console.log("No se pudo desplegar la notificación nativa debido al sandbox del navegador.", err);
      }
    }
  };

  // Trigger push alert to the simulator and/or native device push
  const triggerNotification = (title: string, text: string, type: 'post' | 'alert' | 'consejo' | 'custom', avatar = '⚡') => {
    const newAlert: NotificationItem = {
      id: Date.now().toString(),
      title,
      text,
      type,
      time: 'Ahora',
      avatar
    };

    // Update log
    setNotificationLog(prev => [newAlert, ...prev]);
    setActiveAlert(newAlert);
    
    // Toggle mobile screen flash
    setSimulatorFlash(true);
    setTimeout(() => setSimulatorFlash(false), 800);

    // Audio chime
    playNotificationSound();

    // Trigger system push if allowed
    triggerSystemPush(title, text, type);
  };

  // Preset generators
  const triggerAdvicePush = () => {
    const advices = [
      {
        title: "🎨 [ARTE] Dirección de Arte recomienda:",
        text: "La audiencia nocturna responde un 22% mejor a paletas con alto contraste tipo 'Urbanet'. Cambia el banner a estilo oscuro.",
        avatar: "🎨"
      },
      {
        title: "📈 [CRECIMIENTO] Alerta de Audiencia:",
        text: "Se detecta un pico de atención orgánica sobre 'Educación Financiera'. Publica el borrador táctico #2 de inmediato.",
        avatar: "📈"
      },
      {
        title: "⚡ [RITMO SPE] Ajuste de Horario:",
        text: "Nuestros agentes estiman que publicar a las 20:15 optimiza un +8.4% la tasa de CTR inicial. Agendado automático listo.",
        avatar: "⚡"
      }
    ];
    const item = advices[Math.floor(Math.random() * advices.length)];
    triggerNotification(item.title, item.text, 'consejo', item.avatar);
  };

  const triggerScheduleSuccessPush = () => {
    triggerNotification(
      "📢 [PUBLICACIÓN AL AIRE]",
      "Felicidades, el post 'Estrategia de Escalamiento' fue lanzado con éxito en Facebook, Twitter y LinkedIn.",
      "post",
      "🤖"
    );
  };

  const triggerActionAlert = () => {
    triggerNotification(
      "🔥 [ALERTA DE TENDENCIA DETECTADA]",
      "Estrategia Futura: El hashtag #InnovacionSPE se ha vuelto viral en tu sector comercial. ¿Deseas inyectar un post estratégico?",
      "alert",
      "🔥"
    );
  };

  // Submit custom push form
  const handleSendCustomPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotificationText.trim()) return;
    triggerNotification(
      "💬 [MENSAJE DE AGENTE FUTURA]",
      customNotificationText,
      'custom',
      '🤖'
    );
    setCustomNotificationText('');
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
          : "ACTIVAR CON PAGO MÓVIL ($10/mes)",
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
                  ⏳ ESTATUS: Verificando Pago Móvil
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Referencia Registrada: #{profile.pagoMovilRequest.reference} • Monto: {profile.pagoMovilRequest.amountBs.toFixed(2)} Bs ({profile.pagoMovilRequest.amountUsd} USD)
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
                Verificando extractos de Pago Móvil con el banco destino. Nuestro bot de acreditación SPE valida fondos en menos de 5 min.
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
              En una aplicación de producción comercial, nuestro bot o panel de administración consolida la conciliación bancaria y aprueba la membresía. Para que puedas ver el camino completo y activar tu cuenta hoy mismo, usa esta consola para simular la verificación exitosa del Pago Móvil:
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
          <div className="flex items-center justify-between border-b border-white/5 pb-5">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Canal de Activación: Pago Móvil</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Procedimiento Oficial en Bolívares (VES)</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowPagoMovilForm(false)}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> VOLVER A PLANES
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* IZQUIERDA: DATOS DESTINATARIO E INSTRUCCIONES DEL CAMINO */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">1. DATOS DE DESTINO (A DÓNDE ENVIAR)</span>
                
                <div className="bg-black/45 border border-white/5 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-slate-400 font-sans">Banco Receptor:</span>
                    <strong className="text-white font-mono">Banesco (0116)</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-slate-400 font-sans">Teléfono Destinatario:</span>
                    <strong className="text-white font-mono">0424-5551234</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-slate-400 font-sans">Documento / Rif:</span>
                    <strong className="text-white font-mono">J-401234567</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-slate-400 font-sans">Tasa de Cambio BCV:</span>
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
                  <div className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <p>Nuestro asistente SPE validará la transacción en minutos para activar tu Suite de Agentes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DERECHA: FORMULARIO DE REPORTE */}
            <form onSubmit={handleSubmitPagoMovil} className="bg-black/35 p-6 rounded-2xl border border-white/5 space-y-4 text-left font-sans">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">3. FORMULARIO DE REPORTE PAGO MÓVIL</span>

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
                  required
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
                  required
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
                  required
                />
              </div>

              <div className="pt-2 border-t border-white/5 space-y-3">
                <p className="text-[10px] text-slate-500 leading-normal font-sans">
                  Al presionar el botón de abajo, se enviarán estos datos para acoplarse con la contabilidad de FUTURA Core.
                </p>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/20 font-bold uppercase tracking-widest text-xs text-white rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> ENVIAR REPORTE DE PAGO
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

      {/* SECCIÓN INTEGRADORA PREGUNTAS DEL USUARIO: SIMULADOR DE NOTIFICACIONES Y COMPATIBILIDAD CON GOOGLE PLAY STORE / WEB */}
      <div className="space-y-10 border-t border-white/5 pt-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl w-fit mx-auto">
            <Smartphone className="w-8 h-8 text-brand-primary" />
          </div>
          <h3 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">Sincronización del Teléfono</h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            ¿Es posible lanzar avisos de post, sugerencias o mentorías directamente al móvil? <b>¡Sí, es una funcionalidad estrella de FUTURA PRO!</b> Nuestra infraestructura está diseñada para operar nativamente en celulares como una App Móvil mediante PWA o distribución directa en la Play Store.
          </p>
        </div>

        {/* Simulador Interactivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-6 text-left">
          
          {/* Zona de Configuración, Controles & Explicación - 7 Columnas */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Panel de Preguntas Expandido y Respuestas Técnicas Transparentes */}
            <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-6">
              
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-[0.25em] block">SOPORTE MULTIPLATAFORMA</span>
                <h4 className="text-xl sm:text-2xl font-bold font-display text-white">¿Cómo funciona la App en Teléfonos y Google Play Store?</h4>
              </div>

              <div className="space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <div className="space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase text-brand-primary">
                    <Globe className="w-4 h-4 text-brand-primary shrink-0" />
                    1. Visualización Web (Acceso Instantáneo Universal)
                  </span>
                  <p className="text-slate-400 pl-5">
                    Cualquier cliente puede abrir la aplicación ingresando a la URL desde Safari, Chrome o Samsung Internet. No requiere espacio de disco duro ni descargas iniciales.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase text-brand-primary">
                    <SmartphoneCharging className="w-4 h-4 text-brand-primary shrink-0" />
                    2. Instalación Directa PWA (Progressive Web App)
                  </span>
                  <p className="text-slate-400 pl-5">
                    Se puede descargar e instalar en el celular <b>con solo un clic</b> directamente desde el navegador web seleccionando "Añadir a Pantalla de Inicio". Se integra con el menú del teléfono, tiene su propio ícono libre de marcos del navegador y soporta <b>Web Push Notifications</b> en segundo plano (FCM).
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase text-brand-primary">
                    <Download className="w-4 h-4 text-brand-primary shrink-0" />
                    3. Empaquetada nativamente para el PLAY STORE
                  </span>
                  <p className="text-slate-400 pl-5">
                    Podemos empaquetar toda la base de datos y la interfaz de FUTURA en un archivo instalable <b className="text-white">.apk o .aab</b> utilizando frameworks híbridos como <b className="text-white">CapacitorJS</b> o <b className="text-white">TWA (Trusted Web Activities)</b> de Google. De este modo, se sube directamente a <b>Google Play Store</b> facilitando que los usuarios la busquen, la descarguen y la califiquen como App Nativa de Android, lista para compras internas.
                  </p>
                </div>
              </div>

              {/* Botones de control del sistema de notificaciones */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-black uppercase text-white tracking-widest font-mono">Consola de Prueba de Notificaciones</h5>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Interactúa para disparar avisos reales de prueba:</p>
                  </div>
                  
                  {/* Selector de Sonido */}
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs"
                    title={soundEnabled ? "Silenciar" : "Activar Sonido"}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4 text-brand-primary animate-pulse" />
                        <span className="font-mono text-[9px] font-bold">Chime Listo</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4 text-red-400" />
                        <span className="font-mono text-[9px]">Silenciado</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Grid de simulación */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={triggerAdvicePush}
                    className="py-3 px-4 bg-brand-primary/10 hover:bg-brand-primary/20 hover:border-brand-primary/45 border border-white/5 text-xs text-slate-200 rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 group"
                  >
                    <Sparkles className="w-4 h-4 text-brand-primary mt-0.5 shrink-0 group-hover:scale-115 transition-transform" />
                    <div>
                      <span className="block font-black text-[9px] uppercase tracking-wider text-slate-400">Consejo IA</span>
                      <span className="text-[11px] leading-snug">Disparar Dirección de Arte / CTR</span>
                    </div>
                  </button>

                  <button
                    onClick={triggerScheduleSuccessPush}
                    className="py-3 px-4 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 text-xs text-slate-200 rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 group"
                  >
                    <Bell className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 group-hover:scale-115 transition-transform" />
                    <div>
                      <span className="block font-black text-[9px] uppercase tracking-wider text-slate-400">Agenda Pro</span>
                      <span className="text-[11px] leading-snug">Disparar Alerta Post Publicado</span>
                    </div>
                  </button>

                  <button
                    onClick={triggerActionAlert}
                    className="py-3 px-4 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/5 text-xs text-slate-200 rounded-xl transition-all cursor-pointer text-left flex items-start gap-2 group"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 group-hover:scale-115 transition-transform" />
                    <div>
                      <span className="block font-black text-[9px] uppercase tracking-wider text-slate-400">SPE Monitor</span>
                      <span className="text-[11px] leading-snug">Disparar Pico Tendencia Viral</span>
                    </div>
                  </button>
                </div>

                {/* Envío de Mensaje Personalizado */}
                <form onSubmit={handleSendCustomPush} className="flex gap-2 bg-black/40 border border-white/5 p-1.5 rounded-xl">
                  <input
                    type="text"
                    value={customNotificationText}
                    onChange={(e) => setCustomNotificationText(e.target.value)}
                    placeholder="Escribe tu propio consejo o alerta para enviar push..."
                    className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-650 text-xs px-3 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 bg-brand-primary hover:bg-brand-primary-light text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    Enviar Push
                  </button>
                </form>

                {/* Request notification toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-300 block">Autorizar Integración en Navegador</span>
                    <p className="text-[10px] text-slate-500">
                      Estado actual de permisos web del sistema: <b className="text-white font-bold">{permissionStatus.toUpperCase()}</b>
                    </p>
                  </div>
                  
                  {permissionStatus !== 'granted' ? (
                    <button
                      type="button"
                      onClick={requestWebPushPermission}
                      className="px-4 py-2 bg-brand-primary/20 hover:bg-brand-primary hover:text-white border border-brand-primary/30 text-brand-primary rounded-lg font-mono text-[9px] font-black uppercase tracking-widest cursor-pointer"
                    >
                      Solicitar Permisos Reales
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold tracking-widest uppercase rounded-lg">
                      ✔ SISTEMA VINCULADO
                    </span>
                  )}
                </div>

              </div>

            </div>

            {/* Selector de Guías de Distribución en Pestañas */}
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 text-left space-y-4">
              <div className="flex border-b border-white/5 pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveSimulatorGuide('pwa')}
                  className={`pb-2 text-xs font-black uppercase tracking-widest focus:outline-none transition-all relative cursor-pointer ${
                    activeSimulatorGuide === 'pwa' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {activeSimulatorGuide === 'pwa' && (
                    <motion.div layoutId="guideActiveTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                  )}
                  Guía Rapida: Instalar PWA
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSimulatorGuide('playstore')}
                  className={`pb-2 text-xs font-black uppercase tracking-widest focus:outline-none transition-all relative cursor-pointer ${
                    activeSimulatorGuide === 'playstore' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {activeSimulatorGuide === 'playstore' && (
                    <motion.div layoutId="guideActiveTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                  )}
                  Guía Rápida: Google Play Store
                </button>
              </div>

              <div className="text-xs sm:text-sm text-slate-400 leading-relaxed space-y-2">
                {activeSimulatorGuide === 'pwa' ? (
                  <div className="space-y-4">
                    <p>La PWA es la forma más libre y rápida de distribuir tu app directamente, sin pasar por los exhaustivos procesos de aprobación y cobros de comisiones de las tiendas:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="block font-bold text-white text-base">🖥 Paso 1</span>
                        <span className="text-[10px] text-slate-500 block">Abre el sitio</span>
                        <span className="text-[11px] text-slate-400">Ingresa a la URL de Futura desde Chrome o Safari.</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="block font-bold text-white text-base">📲 Paso 2</span>
                        <span className="text-[10px] text-slate-500 block">Menú del Teléfono</span>
                        <span className="text-[11px] text-slate-400">Presiona "Agregar a Pantalla de Inicio" en tu explorador.</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="block font-bold text-white text-base">🔔 Paso 3</span>
                        <span className="text-[10px] text-slate-500 block">¡Inicia Sesión!</span>
                        <span className="text-[11px] text-slate-400">Ábrela como una app nativa y aprueba notificaciones móviles.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>Para distribuir tu app en el Play Store de Google y llegar a más de 1.000 millones de usuarios activos en Android, la arquitectura es compatible para compilar de la siguiente manera:</p>
                    <ul className="space-y-2 list-disc pl-5 text-slate-400">
                      <li>Instalar CapacitorJS en el proyecto web: <code className="text-brand-primary bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono">npm i @capacitor/core @capacitor/cli</code></li>
                      <li>Inicializar Capacitor agregando la URL de este proyecto e integrando la carpeta de salida del compilado <code className="text-brand-primary bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono">dist/</code>.</li>
                      <li>Agregar la plataforma android nativa ejecutando <code className="text-slate-300 bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono">npx cap add android</code> lo cual genera un proyecto nativo completo en menos de un minuto.</li>
                      <li>Abrir el proyecto en Android Studio, compilar el archivo <b className="text-white">Android App Bundle (.aab)</b> firmado con tu llave de desarrollador, y subir el paquete a la Google Play Console.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SIMULADOR DE SMARTPHONE FÍSICO HIGH-FIDELITY - 5 Columnas */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="sticky top-4 w-full max-w-[320px] mx-auto">
              
              <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-primary via-indigo-600 to-emerald-500 rounded-[3rem] blur-xl opacity-35 animate-pulse pointer-events-none" />

              {/* Contenedor del Celular */}
              <div className="relative w-full h-[580px] bg-slate-950 border-[6px] border-slate-900 rounded-[2.8rem] shadow-2xl flex flex-col overflow-hidden">
                
                {/* Bocina / Isla Estilo Dinámico */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-black rounded-full z-45 flex items-center justify-center gap-1.5 p-1">
                  <div className="w-10 h-1 bg-neutral-900 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-neutral-950 rounded-full border border-neutral-900 flex items-center justify-center" />
                </div>

                {/* LED Flash Light Notifier */}
                <AnimatePresence>
                  {simulatorFlash && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-brand-primary/10 backdrop-blur-[1px] z-50 pointer-events-none border-[10px] border-brand-primary"
                    />
                  )}
                </AnimatePresence>

                {/* Pantalla del teléfono */}
                <div className="flex-1 flex flex-col justify-between p-4 pt-10 pb-6 relative z-10 select-none">
                  
                  {/* Status Bar Superior */}
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 px-2">
                    <span>17:02</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded">5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Notification Floating Banner Area (Alerta Activa) */}
                  <div className="h-28 mt-4 relative">
                    <AnimatePresence>
                      {activeAlert && (
                        <motion.div
                          initial={{ opacity: 0, y: -50, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ type: 'spring', damping: 20 }}
                          className="absolute w-full bg-slate-900/95 border border-brand-primary/45 p-3 rounded-2xl shadow-xl z-50 backdrop-blur-md"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl shrink-0 mt-0.5">{activeAlert.avatar}</span>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between">
                                <h6 className="text-[10px] font-black text-brand-primary uppercase truncate tracking-wider">{activeAlert.title}</h6>
                                <span className="text-[7px] font-mono text-slate-500 shrink-0">ahora</span>
                              </div>
                              <p className="text-[10px] text-white leading-relaxed font-semibold mt-0.5 break-words line-clamp-3">
                                {activeAlert.text}
                              </p>
                            </div>
                          </div>
                          
                          {/* Pequeño pulso indicador */}
                          <div className="h-0.5 bg-brand-primary mt-2.5 w-full rounded-full animate-pulse" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {!activeAlert && (
                      <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-black/10">
                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center px-4">
                          Ningún aviso activo en el celular. Haz click en los botones de prueba.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cuerpo Interactivo / Historial de Notificaciones de FUTURA */}
                  <div className="flex-1 flex flex-col justify-end mt-4 mb-4 overflow-y-auto scrollbar-none text-left space-y-2">
                    <span className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest pl-1 block">Bandeja de Entrada Recientes:</span>
                    
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-none">
                      {notificationLog.map((log) => (
                        <div key={log.id} className="p-2 bg-slate-900/60 border border-white/5 hover:border-brand-primary/20 rounded-xl flex items-start gap-2 text-[9px] transition-all">
                          <span className="text-sm shrink-0">{log.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-300 truncate text-[8px] uppercase tracking-wider">{log.title}</span>
                              <span className="text-[7px] text-slate-600 shrink-0">{log.time}</span>
                            </div>
                            <p className="text-slate-400 mt-0.5 line-clamp-2 leading-tight break-words">{log.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Pantalla de bloqueo / Pie de App */}
                  <div className="border-t border-white/5 pt-3 text-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mx-auto mb-2 animate-ping" />
                    
                    <span className="text-[9px] font-mono text-brand-primary uppercase tracking-[0.2em] font-black block">FUTURA PRO SUITE</span>
                    <span className="text-[7px] text-slate-500 block mt-0.5">ESTADO DEL CANAL: EN LÍNEA (24/7)</span>
                    
                    {/* Botón Home Virtual */}
                    <div className="w-20 h-1 bg-white/20 rounded-full mx-auto mt-3" />
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Proporcionando confianza - Detalle de Monetización Asegurada */}
      <div className="glass-panel p-6 sm:p-12 rounded-[3rem] border-brand-primary/20 overflow-hidden relative text-left">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Users className="w-64 h-64" />
          </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white">Infraestructura <span className="text-brand-primary">Elite 4.5</span></h3>
            <p className="text-slate-400 leading-relaxed text-xs sm:text-sm md:text-base">
              Al activar el <b>Business Pro</b>, desbloqueas una unidad táctica de agentes coordinados bajo protocolos de gran valor estratégico (SPE). No estás comprando una herramienta, estás activando un <b>Departamento Creativo Avanzado</b> que además sincroniza avisos de gran valor a tu smartphone:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-5 glass-panel bg-brand-primary/5 rounded-2xl border-brand-primary/10 group hover:border-brand-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/10">
                  <Cpu className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase text-white tracking-widest">Copy Lead Elite</h5>
                  <p className="text-[10px] text-slate-500 font-mono">Psicología de Conversión Pro</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 glass-panel bg-white/5 rounded-2xl border-white/5 group hover:border-brand-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0 shadow-lg shadow-brand-secondary/10">
                  <TrendingUp className="w-6 h-6 text-brand-secondary" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase text-white tracking-widest">Growth Strategist</h5>
                  <p className="text-[10px] text-slate-500 font-mono">Arbitraje de Atención 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 glass-panel bg-white/5 rounded-2xl border-white/5 group hover:border-brand-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase text-white tracking-widest">Art Director Agent</h5>
                  <p className="text-[10px] text-slate-500 font-mono">Coherencia Nexo/Urbanet</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 glass-panel bg-green-500/5 rounded-2xl border-green-500/10 group hover:border-brand-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/10">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase text-white tracking-widest">Compliance Master</h5>
                  <p className="text-[10px] text-slate-500 font-mono">Integridad de Marca Hub</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-brand-primary/20 to-surface-950 border border-brand-primary/20 p-8 sm:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-brand-primary opacity-10 group-hover:scale-110 transition-transform">
               <ShieldCheck className="w-24 h-24" />
             </div>
             <h4 className="text-xl sm:text-2xl font-display font-bold mb-4 relative z-10 text-white">Monetización Asegurada</h4>
             <p className="text-xs sm:text-sm text-slate-400 leading-relaxed relative z-10 text-left">
               Toda estrategia desarrollada por tus agentes está protegida bajo protocolos de aislamiento avanzado. Tu ventaja competitiva en el mercado de la publicidad digital (Nexo, Dataclick, Urbanet) está garantizada. Recibe alertas y cambios de tendencia para actuar inmediatamente estén donde estén.
             </p>
             <div className="mt-8 flex items-center gap-3 relative z-10">
               <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
               <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Protocolo SPE Activo</span>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
