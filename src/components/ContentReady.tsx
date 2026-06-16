import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Trash2, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Share2, 
  Check, 
  Layers, 
  Wifi, 
  Zap,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Play,
  Bell,
  BellRing,
  Volume2,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';

interface Publication {
  id: string;
  title: string;
  copy: string;
  scheduledTime: string; // ISO String
  channels: string[];
  imageUrl: string | null;
  status: 'pending' | 'published';
  createdAt: string;
}

// Pre-configured mock ideas to facilitate the user's workload with 1-click additions
const REQUISITES_SAMPLES = [
  {
    title: "Lanzamiento Oferta Irresistible",
    copy: "🔥 ¡ESTO NO VA A DURAR! En FUTURA sabemos que la constancia y el diseño impecable venden solo. Presentamos nuestro nuevo paquete de Consultoría IA Aplicada para comercios. 🚀\n\nPresiona el link de nuestra biografía y obtén una auditoría de identidad visual 100% gratuita hecha por nuestro cerebro artificial de mercado. Solo 10 cupos disponibles.",
    channels: ["Instagram", "WhatsApp Business"],
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
  },
  {
    title: "Hack de Posicionamiento Semanal",
    copy: "💡 ¿Frustrado por publicar a diario en 5 redes sin ver un solo dólar de retorno? El secreto no es producir más volumen sin rumbo, sino centralizar tus creativos con un estilo unificado (como nuestro Brutalist Tech).\n\nEn este minitutorial te enseñamos cómo programar múltiples redes a la vez sincronizando el motor inteligente de FUTURA. ¡Escribe 'SISTEMA' abajo y te enviamos toda la información de forma automatizada! 🤫",
    channels: ["Instagram", "TikTok", "YouTube Shorts"],
    imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80"
  },
  {
    title: "Actualización Operativa Directa",
    copy: "Sincronía perfecta en marcha. ⚙️ Nuestra red neuronal de distribución acaba de actualizar sus protocolos para múltiples canales. Ahora tus propuestas en PDF y flyers se pueden cargar directamente en el panel sin abrir la app de edición. Descubre la consultoría que redefine el marketing de atracción.",
    channels: ["WhatsApp Personal", "WhatsApp Business"],
    imageUrl: "https://images.unsplash.com/photo-1618005198143-e52834643664?auto=format&fit=crop&w=400&q=80"
  }
];

export default function ContentReady() {
  const getNowIsoString = () => {
    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    } catch (e) {
      return '2026-05-28T12:00';
    }
  };

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [scheduledTime, setScheduledTime] = useState(getNowIsoString());
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Instagram', 'WhatsApp Business']);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageInputUrl, setImageInputUrl] = useState('');

  // Notification states
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [nextNotificationCountdown, setNextNotificationCountdown] = useState<string>('Buscando próximas publicaciones...');
  const [notifiedPubIds, setNotifiedPubIds] = useState<string[]>([]);
  const [activeInAppAlert, setActiveInAppAlert] = useState<Publication | null>(null);
  
  // UI states
  const [showForm, setShowForm] = useState(false);
  const [activeDate, setActiveDate] = useState<Date>(new Date()); // dynamic current date/time
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [selectedPubForDetail, setSelectedPubForDetail] = useState<Publication | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Live clock state for reference in scheduling section
  const [liveClock, setLiveClock] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Saved Assets from Creative Engine
  const [savedAssets, setSavedAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Available Channels corresponding to the requested homologation changes
  const availableChannels = [
    { name: 'Instagram', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { name: 'TikTok', color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
    { name: 'YouTube Shorts', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { name: 'WhatsApp Personal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'WhatsApp Business', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' }
  ];

  // Subscribe to generated saved assets from Creative Engine
  useEffect(() => {
    let unsubscribe = () => {};
    if (auth.currentUser) {
      setLoadingAssets(true);
      try {
        const q = query(
          collection(db, 'saved_assets'),
          where('ownerId', '==', auth.currentUser.uid)
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Newest first
          list.sort((a: any, b: any) => {
            const atime = a.createdAt?.seconds || 0;
            const btime = b.createdAt?.seconds || 0;
            return btime - atime;
          });
          setSavedAssets(list);
          setLoadingAssets(false);
        }, (err) => {
          console.warn("Failed to subscribe to saved_assets in calendar:", err);
          setLoadingAssets(false);
        });
      } catch (e) {
        console.warn("Failed to subscribe to saved_assets collection:", e);
        setLoadingAssets(false);
      }
    }
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Load from firebase (or fallback cleanly if permissions aren't ready yet or user offline)
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (auth.currentUser) {
      try {
        const q = query(
          collection(db, 'publications'),
          where('ownerId', '==', auth.currentUser.uid)
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Publication));
          // Sort by scheduled date
          list.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
          setPublications(list);
          setLoading(false);
        }, (err) => {
          console.warn("Firestore error reading ready content, utilizing local state:", err);
          loadLocalFallback();
        });
      } catch (e) {
        console.warn("Could not bind firestore ready-content list:", e);
        loadLocalFallback();
      }
    } else {
      loadLocalFallback();
    }

    return () => unsubscribe();
  }, []);

  // Notifications startup check
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Generate tactical synth audio cue for alarms
  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.log("Audio API blocked or inactive in background:", e);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Tu navegador o dispositivo no soporta alertas de sistema nativas.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === 'granted') {
        playNotificationSound();
        new Notification("🎯 ¡ALERTA PUSH EXCELENTE!", {
          body: "FUTURA enviará las notificaciones de agenda de copys y distribución directo a esta pantalla.",
          icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80"
        });
      }
    } catch (e) {
      console.warn("Could not retrieve notification permission:", e);
    }
  };

  const triggerTestNotification = () => {
    playNotificationSound();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("📌 FUTURA — Mensaje de Prueba", {
          body: "Esta es una alerta de prueba. Muy pronto recibirás un aviso similar cuando se cumpla la hora de tu publicación.",
          icon: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=120&q=80"
        });
      } catch (err) {
        console.warn("Failed sending notification:", err);
      }
    } else {
      alert("🔊 El aviso sonoro de la agenda funciona. Para ver la notificación en Chrome, toca el botón de 'Permitir Notificaciones' arriba a la derecha.");
    }
  };

  // Real-Time Scheduler checker loop (Ticks every second to handle alerts perfectly)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Calculate Countdown to the closest future pending publication
      const futurePubs = publications
        .filter(p => p.status === 'pending' && new Date(p.scheduledTime) > now)
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
      
      if (futurePubs.length > 0) {
        const diffMs = new Date(futurePubs[0].scheduledTime).getTime() - now.getTime();
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        let cdText = "Siguiente alerta de publicación (\"" + futurePubs[0].title + "\") en: ";
        if (hrs > 0) cdText += `${hrs}h `;
        if (mins > 0 || hrs > 0) cdText += `${mins}m `;
        cdText += `${secs}s`;
        setNextNotificationCountdown(cdText);
      } else {
        setNextNotificationCountdown('No hay futuras publicaciones agendadas para el día de hoy');
      }

      // Check for arrived pending times
      publications.forEach(p => {
        if (p.status === 'pending' && !notifiedPubIds.includes(p.id)) {
          const sTime = new Date(p.scheduledTime);
          const diffSeconds = (now.getTime() - sTime.getTime()) / 1000;
          
          // Trigger alert if scheduled time is reached (allow up to 2 minutes margin for offline catching)
          if (diffSeconds >= 0 && diffSeconds < 120) {
            setNotifiedPubIds(prev => [...prev, p.id]);
            setActiveInAppAlert(p);
            playNotificationSound();
            
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`🚨 ¡HORA DE PUBLICAR CONTENIDO!`, {
                  body: `Tu copy para "${p.title}" está listo para ser publicado en: ${p.channels.join(', ')}.`,
                  icon: p.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
                  requireInteraction: true
                });
               } catch (err) {
                 console.warn("Could not push Chrome notification:", err);
               }
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [publications, notifiedPubIds]);

  const loadLocalFallback = () => {
    const saved = localStorage.getItem('futura_content_ready');
    if (saved) {
      try {
        setPublications(JSON.parse(saved));
      } catch (e) {
        // Fallback demo data
        setPublications(getDefaultDemoData());
      }
    } else {
      const demo = getDefaultDemoData();
      setPublications(demo);
      localStorage.setItem('futura_content_ready', JSON.stringify(demo));
    }
    setLoading(false);
  };

  const saveLocalFallback = (newData: Publication[]) => {
    setPublications(newData);
    localStorage.setItem('futura_content_ready', JSON.stringify(newData));
  };

  const getDefaultDemoData = (): Publication[] => {
    return [
      {
        id: 'demo-1',
        title: 'Impulso Inteligencia FUTURA',
        copy: '📊 ¿Sabías que el 82% de las marcas mueren a los 12 meses por inconsistencia visual? FUTURA clona tu identidad estética y publica automáticamente en tus canales de venta diaria. Di adiós al estrés operativo.',
        scheduledTime: '2026-05-28T10:00',
        channels: ['Instagram', 'WhatsApp Business'],
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-2',
        title: 'Automatización Integrada Instantánea',
        copy: '🚀 Menos clics, más conversión. Nuestra nueva interfaz "Contenido Listo" te permite cargar tus publicaciones y distribuirlas sin intermediaciones molestas en WhatsApp Personal y Business al instante.',
        scheduledTime: '2026-05-29T16:45',
        channels: ['WhatsApp Personal', 'WhatsApp Business', 'YouTube Shorts'],
        imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-3',
        title: 'Estilo Estratégico Unificado',
        copy: '💎 Mantén el control total. Con FUTURA tu marca genera copias alineadas a tu posicionamiento. La era de las plantillas genéricas ha terminado.',
        scheduledTime: '2026-05-27T09:15',
        channels: ['Instagram', 'TikTok'],
        imageUrl: 'https://images.unsplash.com/photo-1618005198143-e52834643664?auto=format&fit=crop&w=400&q=80',
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ];
  };

  // Toggle channel selection in form
  const toggleChannel = (channelName: string) => {
    if (selectedChannels.includes(channelName)) {
      setSelectedChannels(prev => prev.filter(c => c !== channelName));
    } else {
      setSelectedChannels(prev => [...prev, channelName]);
    }
  };

  // Create a new ready publication
  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !copy.trim()) return;

    const imgToUse = imageInputUrl.trim() || imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80";

    const newPub = {
      title: title.trim(),
      copy: copy.trim(),
      scheduledTime: scheduledTime || new Date().toISOString(),
      channels: selectedChannels,
      imageUrl: imgToUse,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'publications'), {
          ...newPub,
          ownerId: auth.currentUser.uid
        });
        // Form resetting
        setTitle('');
        setCopy('');
        setSelectedChannels(['Instagram', 'WhatsApp Business']);
        setImageInputUrl('');
        setImageUrl(null);
        setShowForm(false);
        return;
      } catch (err) {
        console.warn("Failed saving to Firestore directly, writing locally:", err);
      }
    }

    // Local fallback
    const localId = `pub-${Date.now()}`;
    const nextList: Publication[] = [...publications, { id: localId, ...newPub }];
    nextList.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    saveLocalFallback(nextList);

    // Form resetting
    setTitle('');
    setCopy('');
    setSelectedChannels(['Instagram', 'WhatsApp Business']);
    setImageInputUrl('');
    setImageUrl(null);
    setShowForm(false);
  };

  // Use a quick 1-click preset sample to ease user workload
  const handleLoadPresetSample = (sample: typeof REQUISITES_SAMPLES[number]) => {
    setTitle(sample.title);
    setCopy(sample.copy);
    setSelectedChannels(sample.channels);
    setImageUrl(sample.imageUrl);
  };

  // Delete a ready publication
  const handleDelete = async (id: string) => {
    if (auth.currentUser && !id.startsWith('pub-') && !id.startsWith('demo-')) {
      try {
        await deleteDoc(doc(db, 'publications', id));
        return;
      } catch (err) {
        console.warn("Could not delete from Firestore:", err);
      }
    }

    const nextList = publications.filter(p => p.id !== id);
    saveLocalFallback(nextList);
    if (selectedPubForDetail?.id === id) {
      setSelectedPubForDetail(null);
    }
  };

  // Simulate automated queue publication pushes to represent solving scheduling pain
  const simulatePublicationPush = (pub: Publication) => {
    setSimulatingId(pub.id);
    setSimulationLog([]);
    
    const logs = [
      `🌐 [SISTEMA FUTURA] Verificando reloj organizativo en cola...`,
      `⚙️ [CONEXIONES] Handshake activo con Gateway de Distribución Unificado...`,
    ];

    pub.channels.forEach(channel => {
      logs.push(`🔌 [CANAL LINK] Autenticando canal optimizado: ${channel}...`);
    });

    logs.push(`📦 [PROCESAMIENTO] Empaquetando activos de campaña unificada: "${pub.title}"`);
    logs.push(`📝 [OPTIMIZACIÓN COPY] Evaluando disparadores de conversión acelerada...`);
    
    if (pub.imageUrl) {
      logs.push(`🎨 [RENDERING] Preparando capa visual unificada para renderizado de alta fidelidad...`);
    }

    setSimulationLog([...logs]);

    let step = 0;
    const interval = setInterval(() => {
      if (step === 0) {
        setSimulationLog(prev => [...prev, `⚡ [API ROUTE] Enviando cargas útiles multimedia a servidores locales...`]);
      } else if (step === 1) {
        pub.channels.forEach(channel => {
          setSimulationLog(prev => [...prev, `✅ [HOMOLOGACIÓN EXITOSA] ¡Publicado con éxito en ${channel}! (Status: 200 OK)`]);
        });
      } else if (step === 2) {
        setSimulationLog(prev => [...prev, `🏆 [ESTADÍSTICAS] Liberando flujo de trabajo: Consumidor ahorró 35 minutos de distribución manual.`]);
        setSimulationLog(prev => [...prev, `🚀 [SISTEMA] Sincronía completada. El caos de programación de esta red ha sido resuelto con éxito.`]);
        
        // Mark as published in state
        handleMarkAsPublished(pub.id);
        clearInterval(interval);
        setTimeout(() => setSimulatingId(null), 3000);
      }
      step++;
    }, 1300);
  };

  const handleMarkAsPublished = async (id: string) => {
    if (auth.currentUser && !id.startsWith('pub-') && !id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'publications', id), { status: 'published' });
        return;
      } catch (err) {
        console.warn("Could not update status in Firestore:", err);
      }
    }

    const nextList = publications.map(p => p.id === id ? { ...p, status: 'published' as const } : p);
    saveLocalFallback(nextList);
  };

  // Helper to resolve weekdays dynamically based on dynamic year and month
  const getWeekdayNameObj = (dayNum: number, targetYear = activeDate.getFullYear(), targetMonth = activeDate.getMonth()) => {
    const weekdaysLong = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weekdaysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    try {
      const date = new Date(targetYear, targetMonth, dayNum);
      const index = date.getDay(); // 0 is Sunday, 1 is Monday ...
      return {
        long: weekdaysLong[index] || 'Domingo',
        short: weekdaysShort[index] || 'Dom'
      };
    } catch (e) {
      return { long: 'Lunes', short: 'Lun' };
    }
  };

  // Mobile horizontal day-strip slider and detailed agenda queue layout
  const renderMobileCalendar = () => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="space-y-6 md:hidden">
        {/* Horizontal scrollable date strip */}
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
            Selecciona un Día (Desliza Horizontalmente ➔)
          </label>
          <div className="flex gap-2.5 pb-3 overflow-x-auto snap-x scrollbar-none hover:scrollbar-thin scrollbar-thumb-brand-primary/20">
            {daysArray.map((day) => {
              const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
              const dateStr = `${year}-${monthStr}-${day < 10 ? '0' + day : day}`;
              const dailyPubs = publications.filter(p => p.scheduledTime.startsWith(dateStr));
              const isSelected = selectedDay === day;
              const { short } = getWeekdayNameObj(day, year, month);
              const hasPending = dailyPubs.some(p => p.status === 'pending');
              const hasPublished = dailyPubs.some(p => p.status === 'published');
              
              const todayDate = new Date();
              const isToday = todayDate.getFullYear() === year && 
                              todayDate.getMonth() === month && 
                              todayDate.getDate() === day;
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "snap-center shrink-0 w-14 py-3.5 rounded-2xl flex flex-col items-center justify-between border transition-all cursor-pointer relative",
                    isSelected 
                      ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.05]" 
                      : isToday
                        ? "bg-brand-primary/10 border-brand-primary/30 text-slate-300"
                        : "bg-black/40 border-white/5 text-slate-400 hover:border-white/10"
                  )}
                >
                  <span className="text-[9px] font-mono uppercase tracking-wider font-semibold opacity-80">
                    {short}
                  </span>
                  <span className="text-base font-black font-display mt-0.5 leading-none">
                    {day}
                  </span>
                  
                  {/* Status indicator dots */}
                  <div className="flex gap-1 mt-1.5 h-1">
                    {hasPending && (
                      <span className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-brand-primary animate-pulse")} />
                    )}
                    {hasPublished && (
                      <span className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white opacity-85" : "bg-emerald-400")} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date postings detailed list */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest">
                Agenda para el día
              </span>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight font-display">
                {getWeekdayNameObj(selectedDay, year, month).long}, {selectedDay} de {activeDate.toLocaleString('es-ES', { month: 'long' })}
              </h4>
            </div>
            <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-xl">
              {publications.filter(p => {
                const y = activeDate.getFullYear();
                const m = activeDate.getMonth() + 1;
                const mStr = m < 10 ? '0' + m : m;
                const dStr = selectedDay < 10 ? '0' + selectedDay : selectedDay;
                return p.scheduledTime.startsWith(`${y}-${mStr}-${dStr}`);
              }).length} Post(s)
            </span>
          </div>

          <div className="space-y-3">
            {publications.filter(p => {
              const y = activeDate.getFullYear();
              const m = activeDate.getMonth() + 1;
              const mStr = m < 10 ? '0' + m : m;
              const dStr = selectedDay < 10 ? '0' + selectedDay : selectedDay;
              return p.scheduledTime.startsWith(`${y}-${mStr}-${dStr}`);
            }).length === 0 ? (
              <div className="text-center p-8 bg-black/25 rounded-2xl border border-dashed border-white/5 space-y-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-black font-mono">
                  No hay publicaciones para esta fecha
                </p>
                <p className="text-[11px] text-slate-600">
                  Agenda una idea estratégica o crea una publicación en el panel táctico.
                </p>
              </div>
            ) : (
              publications
                .filter(p => {
                  const y = activeDate.getFullYear();
                  const m = activeDate.getMonth() + 1;
                  const mStr = m < 10 ? '0' + m : m;
                  const dStr = selectedDay < 10 ? '0' + selectedDay : selectedDay;
                  return p.scheduledTime.startsWith(`${y}-${mStr}-${dStr}`);
                })
                .map((pub) => (
                  <div 
                    key={pub.id}
                    className="bg-gradient-to-br from-white/[0.03] to-surface-950 border border-white/5 hover:border-brand-primary/20 p-5 rounded-2xl space-y-4 transition-all"
                  >
                    <div className="flex gap-4">
                      {pub.imageUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                          <img src={pub.imageUrl} className="w-full h-full object-cover" alt={pub.title} />
                        </div>
                      )}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-200 truncate">{pub.title}</h4>
                          <span className={cn(
                            "text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 font-bold",
                            pub.status === 'published' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-brand-primary/10 text-indigo-300 border border-brand-primary/20"
                          )}>
                            {pub.status === 'published' ? "PUBLICADO" : "EN COLA"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm line-clamp-3">
                          {pub.copy}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                      {pub.channels.map(chan => {
                        const styleInfo = availableChannels.find(c => c.name === chan);
                        return (
                          <span key={chan} className={cn("text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-extrabold", styleInfo?.color || "bg-white/5 text-white")}>
                            {chan}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(pub.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {pub.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => simulatePublicationPush(pub)}
                            className="py-1 px-2.5 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg border border-brand-primary/20 transition-all text-[8px] font-black tracking-widest uppercase cursor-pointer"
                          >
                            Lanzar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedPubForDetail(pub)}
                          className="py-1 px-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/5 transition-all text-[8px] font-black tracking-widest uppercase cursor-pointer"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pub.id)}
                          className="p-1 px-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Calendar logic around current selected month dynamically computed
  const renderCalendarDays = () => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth(); // 0-indexed
    
    // Days in current activeMonth
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // First day index (0 = Sunday, 1 = Monday ...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Week starts with Monday: Lun, Mar, Mié, Jue, Vie, Sáb, Dom
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const grid = [];
    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Render empty spaces
    for (let i = 0; i < startOffset; i++) {
      grid.push(<div key={`empty-${i}`} className="bg-white/[0.01] border border-white/5 min-h-[90px] rounded-xl opacity-20" />);
    }

    // Render actual days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const fullDateStr = `${year}-${monthStr}-${dayStr}`;
      
      // Filter publications on this day
      const dailyPubs = publications.filter(p => p.scheduledTime.startsWith(fullDateStr));
      
      const todayDate = new Date();
      const isToday = todayDate.getFullYear() === year && 
                      todayDate.getMonth() === month && 
                      todayDate.getDate() === day;
                      
      const isSelected = selectedDay === day;

      grid.push(
        <div 
          key={`day-${day}`} 
          onClick={() => setSelectedDay(day)}
          className={cn(
            "min-h-[95px] p-2 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer",
            isToday 
              ? "bg-brand-primary/10 border-brand-primary/45 shadow-lg shadow-brand-primary/5" 
              : isSelected
                ? "bg-brand-primary/5 border-brand-primary/20 shadow-md"
                : "bg-black/30 border-white/7 hover:border-white/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs font-mono font-bold px-1.5 py-0.5 rounded-md",
              isToday ? "bg-brand-primary text-white" : isSelected ? "bg-white/10 text-white" : "text-slate-500"
            )}>
              {day}
            </span>
            {isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            )}
          </div>

          <div className="space-y-1.5 mt-2 flex-1 flex flex-col justify-end overflow-hidden">
            {dailyPubs.map((pub) => (
              <button
                key={pub.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPubForDetail(pub);
                }}
                className={cn(
                  "w-full text-left truncate text-[9px] px-1.5 py-1 rounded font-display font-medium border text-nowrap select-none cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between",
                  pub.status === 'published' 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                    : "bg-brand-primary/10 border-brand-primary/20 text-indigo-300"
                )}
              >
                <span>{pub.title}</span>
                <span className="text-[7px] text-slate-500 font-mono">
                  {pub.channels.length} {pub.channels.length === 1 ? 'red' : 'redes'}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Desktop View (7-Columns Grid) */}
        <div className="space-y-4 hidden md:block">
          {/* Weekday indicators */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
            {weekdays.map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {grid}
          </div>
        </div>

        {/* Mobile View (Horizontal slider + detailed day agenda list) */}
        {renderMobileCalendar()}
      </div>
    );
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="contenido-listo-tab">
      
      {/* HEADER PRINCIPAL IMPACTANTE: DISCURSO PITCH COMERCIAL */}
      <section className="relative overflow-hidden glass-panel p-8 md:p-12 rounded-[3.5rem] border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 via-surface-950/40 to-transparent shadow-3xl text-center space-y-6">
        <div className="absolute top-2 right-2 p-12 opacity-5 pointer-events-none">
          <CalendarIcon className="w-48 h-48 text-brand-primary" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-brand-primary/20 border border-brand-primary/30 rounded-full text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">
              Lanzamiento Supremo
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Automatización Integrada
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white leading-tight">
            CONTENIDO LISTO: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-purple-400 to-indigo-300">PLANIFICADOR SUPREMO</span>
          </h1>
          
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Se acabó estar subiendo publicaciones manualmente en cada red social, lidiando con fallos de visualización o perdiendo la constancia de tu marca. El módulo <strong className="text-white">Contenido Listo</strong> de FUTURA unifica el motor visual para que encoles, configures y programes la distribución inteligente de tus piezas creativas con un solo clic. Un pipeline que liquida el caos de la programación de tus redes definitivamente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 max-w-4xl mx-auto border-t border-white/5">
          <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
            <span className="text-2xl font-black text-brand-primary font-mono leading-none mb-1">0% FUTURO ESFUERZO</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Subida Automática Centralizada</span>
          </div>
          <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
            <span className="text-2xl font-black text-teal-400 font-mono leading-none mb-1">SINCRO DE CANALES</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Llegada Directa a Audiencia</span>
          </div>
          <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
            <span className="text-2xl font-black text-purple-400 font-mono leading-none mb-1">95% TIEMPO SALVADO</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Planificación de Campañas IA</span>
          </div>
        </div>
      </section>

      {/* CENTRO DE CONTROL DE ALERTAS Y NOTIFICACIONES DE CHROME & MÓVIL */}
      <section className="glass-panel p-6 rounded-[2.5rem] border-brand-primary/20 bg-black/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary shrink-0">
              {notificationPermission === 'granted' ? (
                <BellRing className="w-5.5 h-5.5 text-brand-primary animate-bounce" />
              ) : (
                <Bell className="w-5.5 h-5.5 text-slate-500" />
              )}
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display">Sistema de Notificaciones Activo</h4>
                {notificationPermission === 'granted' ? (
                  <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                    ALERTA CHROME ACTIVA
                  </span>
                ) : notificationPermission === 'denied' ? (
                  <span className="text-[8px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase">
                    BLOQUEADAS POR NAVEGADOR
                  </span>
                ) : (
                  <span className="text-[8px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-black uppercase">
                    PENDIENTE AUTORIZAR
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                Recibe alertas en Chrome y en tu celular al llegar la hora exacta de publicar. El aviso contendrá un botón de un solo clic para copiar el copy estratégico y descargar la imagen correspondiente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-xl text-[10px] uppercase font-black tracking-widest cursor-pointer transition-all shadow-md shadow-brand-primary/20 flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Permitir Notificaciones
              </button>
            )}

            <button
              type="button"
              onClick={triggerTestNotification}
              className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] uppercase font-black tracking-widest border border-white/5 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Probar Sonido y Alerta
            </button>
          </div>
        </div>

        {/* Ticker de cuenta regresiva en vivo */}
        <div className="bg-gradient-to-r from-indigo-950/30 to-brand-primary/10 border border-white/5 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              {nextNotificationCountdown}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Schedule a demo item for 30 seconds from now
                const now = new Date();
                now.setSeconds(now.getSeconds() + 30);
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                const targetIsoStr = now.toISOString().slice(0, 16);
                
                setTitle("🚀 Demo Notificación Instantánea");
                setCopy("🔥 ¡Esto es un Copy de Prueba de FUTURA! Logramos configurar tu sistema de notificaciones en Chrome y Móvil con éxito. Comparte esto ahora.");
                setScheduledTime(targetIsoStr);
                
                alert("⏰ Rellenado: Todo listo. Toca abajo en 'AGENDAR PUBLICACIÓN COLA'. Al transcurrir los 30 segundos, el sistema disparará la alarma y el modal interactivo de copiado automático.");
              }}
              className="py-1 px-2.5 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg border border-brand-primary/20 transition-all text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
            >
              ⚡ Programar Demo de 30s
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECCIÓN CALENDARIO ORGANIZATIVO (2 COLS) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-surface-950/45 shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white">Calendario de Publicación Auto-Asistida</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    {activeDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} — Sincronía en Vivo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    const prev = new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1);
                    setActiveDate(prev);
                    setSelectedDay(1);
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg border border-white/5 cursor-pointer text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-white/5 rounded-lg text-white uppercase tracking-wider">
                  {activeDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    const next = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1);
                    setActiveDate(next);
                    setSelectedDay(1);
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg border border-white/5 cursor-pointer text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MAIN CALENDAR DISPLAY */}
            {renderCalendarDays()}

            <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-slate-400 font-mono pt-6 border-t border-white/5 mt-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/40 inline-block" />
                <span>PENDIENTE DE LANZAMIENTO</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                <span>PROGRAMACIÓN PUBLICADA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary inline-block animate-pulse" />
                <span>HOY ({new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()})</span>
              </div>
            </div>
          </div>

          {/* HISTORIAL / COLA DETALLADA DE PLANIFICACIÓN */}
          <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-surface-950/45 shadow-xl space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display text-white">Cola de Distribución en Espera</h3>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-slate-400 font-mono">
                TOTAL: {publications.length} PUBLICACIÓN(ES)
              </span>
            </div>

            {publications.length === 0 ? (
              <div className="text-center p-12 bg-black/20 rounded-2xl border border-dashed border-white/5">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No hay publicaciones agendadas</p>
                <p className="text-[11px] text-slate-500 mt-1">Utiliza el formulario derecho o carga ideas rápidas para comenzar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publications.map((pub) => (
                  <div 
                    key={pub.id}
                    className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-4 hover:border-white/10 transition-colors relative group"
                  >
                    <div className="flex gap-4 col-span-1">
                      {pub.imageUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                          <img src={pub.imageUrl} className="w-full h-full object-cover" alt={pub.title} />
                        </div>
                      )}
                      
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-slate-200 truncate">{pub.title}</h4>
                          <span className={cn(
                            "text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                            pub.status === 'published' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-400"
                          )}>
                            {pub.status === 'published' ? "PUBLICADO" : "EN COLA"}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 line-clamp-2 font-sans">
                          {pub.copy}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                      {pub.channels.map(chan => {
                        const styleInfo = availableChannels.find(c => c.name === chan);
                        return (
                          <span key={chan} className={cn("text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-extrabold", styleInfo?.color || "bg-white/5 text-white")}>
                            {chan}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(pub.scheduledTime).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-slate-600 font-sans">Sincronizado</span>
                      </div>

                      {/* COPING AND EASY DISTRIBUTION ACTIONS */}
                      <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pub.copy);
                            alert("📋 ¡Mensaje publicitario copiado al portapapeles! Ya puedes ir a tu WhatsApp o Instagram y pegarlo (Mantén presionado y dale a Pegar).");
                          }}
                          className="py-2 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Copiar Texto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (pub.imageUrl) {
                              const link = document.createElement('a');
                              link.href = pub.imageUrl;
                              link.target = '_blank';
                              link.download = `${pub.title.replace(/\s+/g, "_")}.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              alert("🖼️ Se abrirá la imagen de tu publicación en una pestaña nueva. Mantén presionado para guardarla en tu celular o haz clic derecho para Guardar en tu PC.");
                            } else {
                              alert("Esta publicación no requiere imagen.");
                            }
                          }}
                          className="py-2 px-3 bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary rounded-xl text-[10px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-brand-primary/20"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Obtener Foto</span>
                        </button>
                      </div>

                      {pub.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => simulatePublicationPush(pub)}
                          className="w-full py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500 hover:to-teal-500 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-1 text-[9px] font-black tracking-widest uppercase mt-1"
                        >
                          <Play className="w-3 h-3" /> PUBLICAR AUTOMÁTICAMENTE (PRUEBA)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN CARGA / INTERFAZ DE PROGRAMACIÓN (1 COL) */}
        <section className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-surface-950/45 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Escribir Nueva Publicación</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Planifica de forma intuitiva sin enredos</p>
              </div>
            </div>

            {/* BAÚL DE DISEÑOS E IMÁGENES GENERADOS DE VERDAD (SOLUCIÓN AL COPIADO TEDIOSO) */}
            <div className="bg-gradient-to-br from-indigo-950/20 via-black/45 to-slate-950 border border-indigo-500/15 p-4 rounded-2xl space-y-3 font-sans text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                  </span>
                  <span className="text-[9.5px] font-black text-indigo-300 uppercase tracking-widest font-display">
                    Tu Baúl de Piezas Creadas
                  </span>
                </div>
                <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                  Listo para Agendar
                </span>
              </div>

              {loadingAssets ? (
                <div className="flex items-center justify-center py-4 gap-2 text-slate-500 text-[10px] font-mono">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Sincronizando bovéda...
                </div>
              ) : savedAssets.length === 0 ? (
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans text-left">
                  🚀 Todo lo que generas en el <strong>Motor Creativo</strong> se sincroniza aquí. Toca 'Guardar' en tu generador de copies y fotos para poder programar todo desde esta sección con 1 solo clic.
                </p>
              ) : (
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  <p className="text-[10px] text-slate-400 text-left">
                    Toca en <strong>"Colocar"</strong> para vaciar el copy completo y la imagen directamente en el calendario:
                  </p>
                  <div className="space-y-1.5">
                    {savedAssets.slice(0, 15).map((asset) => (
                      <div key={asset.id} className="p-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/5 flex gap-2.5 items-center justify-between transition-all group">
                        {asset.imageUrl && (
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/80 border border-white/10 shrink-0">
                            <img src={asset.imageUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[8.5px] font-mono font-bold uppercase text-brand-primary truncate border-none">
                            {asset.brandName || 'Mi Marca'} • {asset.format || 'Post'}
                          </p>
                          <p className="text-[10px] text-slate-300 truncate font-sans">
                            {asset.strategy || 'Sin descripción'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTitle(`${asset.format || 'Campaña'} — ${asset.brandName || 'Mi Marca'}`);
                            setCopy(asset.strategy || '');
                            if (asset.imageUrl) {
                              setImageInputUrl(asset.imageUrl);
                              setImageUrl(asset.imageUrl);
                            }
                            alert("⚡ ¡Hecho! El copy publicitario y el diseño de la imagen generada se colocaron en el formulario. Indica abajo la fecha y haz clic en 'Agendar Publicación'.");
                          }}
                          className="py-1 px-2.5 bg-indigo-600 hover:bg-brand-primary text-white text-[9px] uppercase tracking-wider font-extrabold rounded-lg shrink-0 cursor-pointer transition-all shadow shadow-indigo-600/25"
                        >
                          Colocar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SEPARADOR PREDISEÑO DE CARGA RÁPIDO */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3 font-sans">
              <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> CARGAR IDEAS DE PRUEBA (1 CLIC)
              </span>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                Toca cualquier botón de abajo y rellenaremos el formulario automáticamente para facilitarte el trabajo:
              </p>
              <div className="space-y-2">
                {REQUISITES_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadPresetSample(sample)}
                    className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/20 transition-all rounded-xl text-[10px] text-slate-300 font-display flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate font-semibold">{sample.title}</span>
                    <span className="text-[8px] font-mono text-slate-500 font-normal uppercase bg-black/40 px-1.5 py-0.5 rounded shrink-0">
                      Cargar
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreatePublication} className="space-y-4 font-sans">
              {/* Título de Publicación */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">¿De qué trata esta publicación? (Título simple)</label>
                <input
                  type="text"
                  placeholder="Ej: Descuento de Fin de Semana"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors"
                  required
                />
              </div>

              {/* Copy de la Publicación */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mensaje publicitario (Lo que leerán tus clientes)</label>
                <textarea
                  placeholder="¡Escribe aquí el texto que quieres que la gente vea en sus celulares!"
                  rows={4}
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Selector de Canales Homologados (WhatsApp / WhatsApp Business) */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  ¿Por dónde lo vas a publicar? (Toca para seleccionar)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableChannels.map(chan => {
                    const isSelected = selectedChannels.includes(chan.name);
                    return (
                      <button
                        type="button"
                        key={chan.name}
                        onClick={() => toggleChannel(chan.name)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl border text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer",
                          isSelected 
                            ? "bg-brand-primary text-white border-brand-primary shadow-lg" 
                            : "bg-black/45 border-white/5 text-slate-400 hover:border-white/10"
                        )}
                      >
                        {chan.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Fecha */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">¿Cuándo quieres publicarlo?</label>
                  {/* Dynamic premium live timer/clock widget */}
                  <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-950/40 via-brand-primary/10 to-indigo-950/40 border-2 border-brand-primary/40 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-all">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_10px_#34d399]" />
                    <span className="text-[10px] sm:text-xs font-mono font-black text-white tracking-wide">
                      🕰️ EN VIVO: <span className="text-brand-primary uppercase">{liveClock.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span> — <span className="text-emerald-400">{liveClock.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </span>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors font-mono"
                  required
                />
              </div>

              {/* Selector Visual de Imagen de Campaña (ELIMINATING RAW URL TEDIOUSNESS) */}
              <div className="space-y-3 bg-black/45 border border-white/5 p-4 rounded-2xl">
                <div className="space-y-0.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fotografía o Diseño de la Publicación</label>
                  <p className="text-[10px] text-slate-500">Toca uno de tus diseños creados con IA o elige un tema estético alternativo:</p>
                </div>

                {/* Real-time Generated Images Selection */}
                {savedAssets.some(asset => asset.imageUrl) ? (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9.5px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> ¡Tus Diseños Creados de una Vez! (Toca para seleccionar)
                    </span>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {savedAssets.filter(asset => asset.imageUrl).slice(0, 8).map((asset, index) => {
                        const isSelected = imageInputUrl === asset.imageUrl || imageUrl === asset.imageUrl;
                        return (
                          <button
                            key={asset.id || index}
                            type="button"
                            onClick={() => {
                              setImageInputUrl(asset.imageUrl || '');
                              setImageUrl(asset.imageUrl || '');
                              if (asset.strategy && !copy) {
                                setCopy(asset.strategy);
                              }
                              if (asset.brandName && !title) {
                                setTitle(`${asset.format || 'Post'} — ${asset.brandName}`);
                              }
                              alert("⚡ Diseño seleccionado de una vez. Se cargó tu imagen creada en el Motor Creativo.");
                            }}
                            className={cn(
                              "relative h-14 rounded-lg overflow-hidden border transition-all cursor-pointer group hover:scale-105",
                              isSelected ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-white/10 hover:border-indigo-500/30"
                            )}
                            title={asset.strategy || 'Tu diseño generado'}
                          >
                            <img src={asset.imageUrl || ''} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 flex items-center justify-center p-0.5 shadow">
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5 text-left">
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1">Temas Estéticos de Reserva:</span>
                  {/* Pre-designed Catalog Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { title: "Elegante Rosa", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" },
                      { title: "Neon Glass", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80" },
                      { title: "Warm Abstract", url: "https://images.unsplash.com/photo-1618005198143-e52834643664?auto=format&fit=crop&w=400&q=80" },
                      { title: "Premium Violet", url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80" }
                    ].map((presetImg) => {
                      const isSelected = imageInputUrl === presetImg.url || (imageUrl === presetImg.url && !imageInputUrl);
                      return (
                        <button
                          key={presetImg.title}
                          type="button"
                          onClick={() => {
                            setImageInputUrl(presetImg.url);
                            setImageUrl(presetImg.url);
                          }}
                          className={cn(
                            "relative h-14 rounded-lg overflow-hidden border transition-all cursor-pointer group hover:scale-105",
                            isSelected ? "border-brand-primary ring-2 ring-brand-primary/30" : "border-white/10 hover:border-white/30"
                          )}
                          title={presetImg.title}
                        >
                          <img src={presetImg.url} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-primary flex items-center justify-center p-0.5 shadow">
                              <Check className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated file upload button */}
                <div className="flex gap-2.5 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const mockUrls = [
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
                        "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=400&q=80",
                        "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80"
                      ];
                      const chosen = mockUrls[Math.floor(Math.random() * mockUrls.length)];
                      setImageInputUrl(chosen);
                      setImageUrl(chosen);
                      alert("📸 ¡Imagen cargada con éxito! Se ha seleccionado tu foto del celular/PC para esta pieza publicitaria.");
                    }}
                    className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold border border-white/5 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subir de mi celular o PC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageInputUrl('');
                      setImageUrl(null);
                    }}
                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Sin Imagen
                  </button>
                </div>

                {/* Explicando el funcionamiento con Google Premium de forma super humana */}
                <div className="p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
                  <p className="text-[10px] text-slate-400 leading-normal font-sans text-left">
                    💡 <strong className="text-white">Con tu membresía activa:</strong> La inteligencia artificial diseñará automáticamente piezas, banners y videos con las fotos de tus propios productos y los colocará aquí automáticamente para que solo tengas que seleccionarlos aquí.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/30 cursor-pointer"
              >
                AGENDAR PUBLICACIÓN COLA
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* SIMULADOR DE COLA / CONSOLA DE PUBLICACIÓN AUTOMÁTICA */}
          {simulatingId && (
            <div className="glass-panel p-6 rounded-[2rem] border-brand-primary/30 bg-black/60 shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                  CONSOLA DE DISTRIBUCIÓN AUTOMÁTICA
                </span>
                <span className="text-[8px] font-mono text-slate-400">STATUS: ACTIVE</span>
              </div>
              
              <div className="bg-black text-slate-300 font-mono text-[9px] p-4 rounded-xl min-h-[140px] max-h-[220px] overflow-y-auto space-y-1 leading-normal selection:bg-brand-primary/30">
                {simulationLog.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">{log}</div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MODAL DETALLADO DE PUBLICACIÓN */}
      <AnimatePresence>
        {selectedPubForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedPubForDetail(null)} 
              className="absolute inset-0 bg-black/95 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-xl glass-panel p-8 md:p-10 rounded-[2.5rem] border-brand-primary/20 shadow-2xl space-y-6 overflow-hidden"
            >
              <div className="absolute top-8 right-8">
                <button 
                  onClick={() => setSelectedPubForDetail(null)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full",
                    selectedPubForDetail.status === 'published' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                  )}>
                    {selectedPubForDetail.status === 'published' ? "PUBLICADO AUTOMÁTICAMENTE" : "PENDIENTE EN COLA DE LANZAMIENTO"}
                  </span>
                </div>

                <h3 className="text-2xl font-display font-bold text-white tracking-tight">{selectedPubForDetail.title}</h3>
                
                {selectedPubForDetail.imageUrl && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-black border border-white/5 shadow-inner">
                    <img src={selectedPubForDetail.imageUrl} className="w-full h-full object-cover" alt={selectedPubForDetail.title} />
                  </div>
                )}

                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-slate-300 text-xs whitespace-pre-wrap leading-relaxed font-sans max-h-40 overflow-y-auto">
                  {selectedPubForDetail.copy}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono mr-1">CANALES HOMOLOGADOS:</span>
                  {selectedPubForDetail.channels.map(chan => {
                    const styleInfo = availableChannels.find(c => c.name === chan);
                    return (
                      <span key={chan} className={cn("text-[9px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg", styleInfo?.color || "bg-white/5 text-white")}>
                        {chan}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5 font-mono">
                  <span>AGENDADO: {new Date(selectedPubForDetail.scheduledTime).toLocaleString()}</span>
                  
                  <div className="flex items-center gap-3">
                    {selectedPubForDetail.status === 'pending' && (
                      <button
                        onClick={() => {
                          simulatePublicationPush(selectedPubForDetail);
                          setSelectedPubForDetail(null);
                        }}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/80 hover:scale-[1.02] active:scale-95 text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3" /> LANZAR YA
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDelete(selectedPubForDetail.id);
                        setSelectedPubForDetail(null);
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer transition-all shrink-0"
                    >
                      Cerrar y Borrar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTIVE IN-APP ALREADY ALERT */}
      <AnimatePresence>
        {activeInAppAlert && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="w-full max-w-lg bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-brand-primary p-6 rounded-3xl shadow-[0_10px_60px_rgba(139,92,246,0.35)] space-y-4 pointer-events-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black tracking-widest text-brand-primary block uppercase font-mono">🚨 ¡HORA DE PUBLICAR AHORA!</span>
                    <h4 className="text-sm font-bold text-white uppercase">{activeInAppAlert.title}</h4>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveInAppAlert(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer bg-white/5 hover:bg-white/15 p-1 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-left">
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans">
                  {activeInAppAlert.copy}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-start">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Canales programados:</span>
                {activeInAppAlert.channels.map(c => (
                  <span key={c} className="text-[8px] font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-md text-white border border-white/5">{c}</span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeInAppAlert.copy);
                    alert("📋 ¡Mensaje publicitario copiado al portapapeles! Listo para pegar.");
                  }}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-brand-primary text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Copiar Copy
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (activeInAppAlert.imageUrl) {
                      const link = document.createElement('a');
                      link.href = activeInAppAlert.imageUrl;
                      link.target = '_blank';
                      link.download = `foto_${activeInAppAlert.title}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      alert("Esta publicación no requiere imagen.");
                    }
                  }}
                  className="py-2.5 px-3 bg-white/5 hover:bg-white/15 text-slate-200 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/15"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Descargar Foto
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    handleMarkAsPublished(activeInAppAlert.id);
                    setActiveInAppAlert(null);
                  }}
                  className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Marcar Listo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// CN utility locally fallback block
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
