/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Zap, 
  Smartphone, 
  Bell, 
  Download, 
  Sparkles, 
  Send, 
  Globe, 
  SmartphoneCharging, 
  Volume2, 
  VolumeX,
  Play,
  ArrowUpRight,
  Lock,
  Check,
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PhoneSyncProps {
  profile?: any;
}

interface NotificationItem {
  id: string;
  title: string;
  text: string;
  type: 'post' | 'alert' | 'consejo' | 'custom';
  time: string;
  avatar: string;
}

export default function PhoneSync({ profile }: PhoneSyncProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customNotificationText, setCustomNotificationText] = useState('');
  const [activeSimulatorGuide, setActiveSimulatorGuide] = useState<'pwa' | 'playstore'>('pwa');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
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

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
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
      console.warn("Web Audio API not supported/allowed yet:", e);
    }
  };

  const requestWebPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones web nativas.');
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
        console.log("No se pudo desplegar la notificación nativa debido al sandbox.", err);
      }
    }
  };

  const triggerNotification = (title: string, text: string, type: 'post' | 'alert' | 'consejo' | 'custom', avatar = '⚡') => {
    const newAlert: NotificationItem = {
      id: Date.now().toString(),
      title,
      text,
      type,
      time: 'Ahora',
      avatar
    };

    setNotificationLog(prev => [newAlert, ...prev]);
    setActiveAlert(newAlert);
    setSimulatorFlash(true);
    setTimeout(() => setSimulatorFlash(false), 800);
    playNotificationSound();
    triggerSystemPush(title, text, type);
  };

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

  const handleSendCustomPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotificationText.trim()) return;
    triggerNotification(
      "🗣️ [MENSAJE DE FUTURA CORE]",
      customNotificationText.trim(),
      'custom',
      "📲"
    );
    setCustomNotificationText('');
  };

  return (
    <div className="space-y-12 pb-32">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl w-fit mx-auto">
          <Smartphone className="w-8 h-8 text-brand-primary" />
        </div>
        <h3 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white uppercase sm:normal-case">Sincronización del Teléfono</h3>
        <p className="text-slate-400 text-xs sm:text-sm">
          Sincroniza tus páginas y recibe avisos de posts, sugerencias de copys y mentorías tácticas directo en tu móvil. <strong>¡Toda la potencia de FUTURA instalada nativamente en tu bolsillo!</strong>
        </p>
      </div>

      {/* Simulador Interactivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-6 text-left">
        
        {/* Zona de Configuración, Controles & Explicación - 7 Columnas */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 bg-surface-950/45">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-[0.25em] block">SOPORTE MULTIPLATAFORMA</span>
              <h4 className="text-xl sm:text-2xl font-bold font-display text-white">¿Cómo funciona la App en Teléfonos y Google Play Store?</h4>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="space-y-1 text-left">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase text-brand-primary">
                  <Globe className="w-4 h-4 text-brand-primary shrink-0" />
                  1. Visualización Web (Acceso Instantáneo Universal)
                </span>
                <p className="text-slate-400 pl-5">
                  Cualquier cliente puede abrir la aplicación ingresando a la URL desde Safari, Chrome o Samsung Internet. No requiere espacio de disco duro ni descargas iniciales.
                </p>
              </div>

              <div className="space-y-1 text-left">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase text-brand-primary">
                  <SmartphoneCharging className="w-4 h-4 text-brand-primary shrink-0" />
                  2. Instalación Directa PWA (Progressive Web App)
                </span>
                <p className="text-slate-400 pl-5">
                  Se puede descargar e instalar en el celular <b>con solo un clic</b> directamente desde el navegador web seleccionando "Añadir a Pantalla de Inicio". Se integra con el menú del teléfono, tiene su propio ícono libre de marcos del navegador y soporta <b>Web Push Notifications</b> en segundo plano (FCM).
                </p>
              </div>

              <div className="space-y-1 text-left">
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
                <div className="text-left">
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
                  className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-600 text-xs px-3 focus:outline-none"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-primary hover:bg-brand-primary-light text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  Enviar Push
                </button>
              </form>

              {/* Request notification permission toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-semibold text-slate-300 block">Autorizar Integración en Navegador</span>
                  <p className="text-[10px] text-slate-500">
                    Estado de permisos web del sistema: <b className="text-white font-bold">{permissionStatus.toUpperCase()}</b>
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
          <div className="glass-panel p-6 rounded-[2rem] border-white/5 text-left space-y-4 bg-surface-950/40">
            <div className="flex border-b border-white/5 pb-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveSimulatorGuide('pwa')}
                className={`pb-2 text-xs font-black uppercase tracking-widest focus:outline-none transition-all relative cursor-pointer ${
                  activeSimulatorGuide === 'pwa' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeSimulatorGuide === 'pwa' && (
                  <motion.div layoutId="guideActiveTabLine2" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                )}
                Guía Rápida: Instalar PWA
              </button>

              <button
                type="button"
                onClick={() => setActiveSimulatorGuide('playstore')}
                className={`pb-2 text-xs font-black uppercase tracking-widest focus:outline-none transition-all relative cursor-pointer ${
                  activeSimulatorGuide === 'playstore' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeSimulatorGuide === 'playstore' && (
                  <motion.div layoutId="guideActiveTabLine2" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
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
                      <span className="text-[11px] text-slate-400 animate-pulse">Ingresa a la URL desde Chrome o Safari.</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="block font-bold text-white text-base">📲 Paso 2</span>
                      <span className="text-[10px] text-slate-500 block">Instalación</span>
                      <span className="text-[11px] text-slate-400">Presiona "Agregar a Pantalla de Inicio" en tu explorador.</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="block font-bold text-white text-base">🔔 Paso 3</span>
                      <span className="text-[10px] text-slate-500 block">¡Listo!</span>
                      <span className="text-[11px] text-slate-400">Ábrela como una app nativa y aprueba notificaciones móviles.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>Para distribuir tu app en el Play Store de Google y llegar a más de 1.000 millones de usuarios activos en Android, la arquitectura es compatible para compilar de la siguiente manera:</p>
                  <ul className="space-y-2 list-disc pl-5 text-slate-400 text-left">
                    <li>Instalar CapacitorJS en el proyecto web: <code className="text-brand-primary bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono">npm i @capacitor/core @capacitor/cli</code></li>
                    <li>Inicializar Capacitor agregando la URL de este proyecto web e integrando el directorio <code className="text-brand-primary bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono">dist/</code>.</li>
                    <li>Agregar la plataforma android nativa ejecutando <code className="text-slate-300 bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono">npx cap add android</code>.</li>
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
            
            <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-primary via-indigo-605 to-emerald-500 rounded-[3rem] blur-xl opacity-35 animate-pulse pointer-events-none" />

            {/* Contenedor del Celular */}
            <div className="relative w-full h-[580px] bg-slate-950 border-[6px] border-slate-900 rounded-[2.8rem] shadow-2xl flex flex-col overflow-hidden">
              
              {/* Bocina / Isla Estilo Dinámico */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-black rounded-full z-[45] flex items-center justify-center gap-1.5 p-1">
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
                  <span>12:30</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded">5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Floating Notification Area */}
                <div className="h-28 mt-4 relative">
                  <AnimatePresence mode="wait">
                    {activeAlert && (
                      <motion.div
                        key={activeAlert.id}
                        initial={{ opacity: 0, scale: 0.85, y: -45 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -45 }}
                        className="bg-black/85 backdrop-blur-md border border-brand-primary/30 rounded-2xl p-3 shadow-xl absolute inset-x-0 top-0 z-[49] text-left space-y-1.5 cursor-pointer"
                        onClick={() => setActiveAlert(null)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-brand-primary flex items-center justify-center text-[10px]">
                              {activeAlert.avatar}
                            </span>
                            <span className="text-[8.5px] font-black text-white/90 uppercase tracking-wider truncate max-w-[130px]">
                              {activeAlert.title}
                            </span>
                          </div>
                          <span className="text-[7.5px] font-mono text-slate-500">AHORA</span>
                        </div>
                        <p className="text-[9.5px] leading-relaxed text-slate-200 line-clamp-2">
                          {activeAlert.text}
                        </p>
                        <div className="h-1 bg-brand-primary/20 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 4, ease: "linear" }}
                            onAnimationComplete={() => setActiveAlert(null)}
                            className="h-full bg-brand-primary"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Simulated Content Dashboard */}
                <div className="flex-1 bg-surface-950/20 border border-white/5 rounded-2xl p-3 flex flex-col justify-between overflow-y-auto scrollbar-none text-left">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-black tracking-widest text-slate-500 font-mono uppercase">CONEXIÓN RECEPTIVA</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>

                    <div className="space-y-1.5 border-b border-white/5 pb-2">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Centro de Notificaciones</h4>
                      <p className="text-[7.5px] text-slate-400">Historial de alertas y consejos de consultoría de las últimas 24 horas:</p>
                    </div>

                    <div className="space-y-1.5 overflow-y-auto max-h-[170px] pr-1">
                      {notificationLog.map(item => (
                        <div key={item.id} className="p-2 bg-black/45 border border-white/5 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[7px] font-mono">
                            <span className="font-bold text-brand-primary">{item.title}</span>
                            <span className="text-slate-500">{item.time}</span>
                          </div>
                          <p className="text-[8px] text-slate-300 leading-normal">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[8px] text-center text-slate-500 italic mt-2 border-t border-white/5 pt-2">
                    Futura Mobile v2.0 - Sincronizado
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-center pt-4">
                  <div className="h-1.5 w-24 bg-white/30 rounded-full" />
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
