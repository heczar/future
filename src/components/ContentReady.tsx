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
  Play
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
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [scheduledTime, setScheduledTime] = useState('2026-05-28T12:00');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Instagram', 'WhatsApp Business']);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageInputUrl, setImageInputUrl] = useState('');
  
  // UI states
  const [showForm, setShowForm] = useState(false);
  const [activeDate, setActiveDate] = useState<Date>(new Date('2026-05-27T12:00:00')); // default around matching local timeline
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [selectedPubForDetail, setSelectedPubForDetail] = useState<Publication | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(27);

  // Available Channels corresponding to the requested homologation changes
  const availableChannels = [
    { name: 'Instagram', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { name: 'TikTok', color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
    { name: 'YouTube Shorts', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { name: 'WhatsApp Personal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'WhatsApp Business', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' }
  ];

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

  // Helper to resolve weekdays in May 2026 accurately (May 1st, 2026 is a Friday)
  const getWeekdayNameObj = (dayNum: number) => {
    const weekdaysLong = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weekdaysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const index = (dayNum + 4) % 7; // Friday is offset index 5: (1 + 4) % 7 = 5
    return {
      long: weekdaysLong[index],
      short: weekdaysShort[index]
    };
  };

  // Mobile horizontal day-strip slider and detailed agenda queue layout
  const renderMobileCalendar = () => {
    const daysInMonth = 31;
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
              const dateStr = `2026-05-${day < 10 ? '0' + day : day}`;
              const dailyPubs = publications.filter(p => p.scheduledTime.startsWith(dateStr));
              const isSelected = selectedDay === day;
              const { short } = getWeekdayNameObj(day);
              const hasPending = dailyPubs.some(p => p.status === 'pending');
              const hasPublished = dailyPubs.some(p => p.status === 'published');
              const isToday = day === 27;
              
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
                {getWeekdayNameObj(selectedDay).long}, {selectedDay} de Mayo
              </h4>
            </div>
            <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-xl">
              {publications.filter(p => p.scheduledTime.startsWith(`2026-05-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`)).length} Post(s)
            </span>
          </div>

          <div className="space-y-3">
            {publications.filter(p => p.scheduledTime.startsWith(`2026-05-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`)).length === 0 ? (
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
                .filter(p => p.scheduledTime.startsWith(`2026-05-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`))
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

  // Calendar logic around current selected month (e.g. May 2026)
  const renderCalendarDays = () => {
    const daysInMonth = 31; // May
    const startOffset = 4; // May 2026 starts on Friday (4 empty slots: Mon, Tue, Wed, Thu)
    const grid = [];

    // Header labels
    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Render empty spaces
    for (let i = 0; i < startOffset; i++) {
      grid.push(<div key={`empty-${i}`} className="bg-white/[0.01] border border-white/5 min-h-[90px] rounded-xl opacity-20" />);
    }

    // Render actual days of May 2026
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fullDateStr = `2026-05-${dayStr}`;
      
      // Filter publications on this day
      const dailyPubs = publications.filter(p => p.scheduledTime.startsWith(fullDateStr));
      const isToday = day === 27; // matching simulation local date
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
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Mayo 2026 — Sincronía en Vivo</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveDate(new Date('2026-04-27'))}
                  className="p-2 hover:bg-white/5 rounded-lg border border-white/5 cursor-pointer text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-white/5 rounded-lg text-white">MAYO 2026</span>
                <button 
                  onClick={() => setActiveDate(new Date('2026-06-27'))}
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
                <span>HOY (27 DE MAYO DE 2026)</span>
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
                    <div className="flex gap-4">
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
                          <span key={chan} className={cn("text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md", styleInfo?.color || "bg-white/5 text-white")}>
                            {chan}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(pub.scheduledTime).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {pub.status === 'pending' && (
                          <button
                            onClick={() => simulatePublicationPush(pub)}
                            className="p-1.5 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg border border-brand-primary/20 cursor-pointer transition-all flex items-center gap-1 text-[8px] font-black tracking-widest uppercase"
                            title="Publicar ahora con API de prueba"
                          >
                            <Play className="w-3 h-3" /> PUBLICAR YA
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(pub.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                          title="Eliminar de la cola"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                <h3 className="text-lg font-bold font-display text-white">Cargar Nueva Publicación</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Agendar distribución en paralelo</p>
              </div>
            </div>

            {/* SEPARADOR PREDISEÑO DE CARGA RÁPIDO */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> CARGA DE IDEAS AUTO-APROBADAS IA
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Selecciona una idea estratégica para cargar el panel instantáneamente:
              </p>
              <div className="space-y-2">
                {REQUISITES_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadPresetSample(sample)}
                    className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/20 transition-all rounded-xl text-[10px] text-slate-300 font-display flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate font-semibold">{sample.title}</span>
                    <span className="text-[8px] font-mono text-slate-500 font-normal uppercase bg-black/40 px-1.5 py-0.5 rounded shrink-0">
                      Usar Idea
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreatePublication} className="space-y-4">
              {/* Título de Publicación */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Título Interno de la Campaña</label>
                <input
                  type="text"
                  placeholder="Ej: Oferta de Auditoría Gratuita Mayo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors"
                  required
                />
              </div>

              {/* Copy de la Publicación */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Contenido / Copy (Persuasión de Alto Impacto)</label>
                <textarea
                  placeholder="Escribe el texto de tu publicación aquí o déjalo listo..."
                  rows={4}
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Selector de Canales Homologados (WhatsApp / WhatsApp Business) */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Canales de Distribución Unificados
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
                            ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/15" 
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
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fecha y Hora de la Cola</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors font-mono"
                  required
                />
              </div>

              {/* Imagen de Fondo URL */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enlace de Imagen de Campaña (URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... o déjala vacía"
                  value={imageInputUrl}
                  onChange={(e) => setImageInputUrl(e.target.value)}
                  className="bg-surface-950 border border-white/5 focus:border-brand-primary/50 rounded-xl px-4 py-3 text-xs text-white w-full outline-none transition-colors font-mono"
                />
                {imageUrl && !imageInputUrl && (
                  <p className="text-[9px] text-indigo-400 font-mono italic">✓ Imagen pre-guardada cargada.</p>
                )}
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
    </div>
  );
}

// CN utility locally fallback block
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
