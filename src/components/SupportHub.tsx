import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Headphones, 
  HelpCircle, 
  Lightbulb, 
  ShieldAlert, 
  CreditCard, 
  CheckCircle2, 
  MessageSquare, 
  Loader2, 
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'admin';
  senderEmail: string;
  text: string;
  category?: string;
  createdAt: string;
}

interface SupportTicketData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  status: 'open' | 'resolved';
  category: string;
  messages: MessageItem[];
}

interface SupportHubProps {
  profile: UserProfile;
}

const CATEGORIES = [
  { id: 'duda', label: 'Duda General', icon: HelpCircle, color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400' },
  { id: 'sugerencia', label: 'Sugerencia', icon: Lightbulb, color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400' },
  { id: 'tecnico', label: 'Falla Técnica', icon: ShieldAlert, color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400' },
  { id: 'facturacion', label: 'Membresías & Pagos', icon: CreditCard, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' },
];

const QUICK_SUGGESTIONS = [
  "¿Cómo puedo aumentar mis límites mensuales de generación?",
  "Tengo una sugerencia para mejorar la plataforma de FUTURE.",
  "Necesito ayuda personalizada con mi marca.",
  "¿Cómo funciona la integración de API de NVIDIA y Gemini?"
];

export default function SupportHub({ profile }: SupportHubProps) {
  const [ticket, setTicket] = useState<SupportTicketData | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('duda');
  const [isSending, setIsSending] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;
  const userId = currentUser?.uid || profile.id || 'anonymous';
  const userEmail = currentUser?.email || profile.email || 'usuario@futura.ai';
  const userName = profile.name || userEmail.split('@')[0];

  // Suscripción en tiempo real a Firestore para el ticket del usuario
  useEffect(() => {
    if (!userId || userId === 'anonymous') {
      setLoadingTicket(false);
      return;
    }

    const ticketRef = doc(db, 'support_tickets', userId);
    
    const unsubscribe = onSnapshot(ticketRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SupportTicketData;
        setTicket(data);

        // Si hay mensajes no leídos por el usuario, marcarlos como leídos al abrir la pantalla
        if (data.unreadByUser) {
          setDoc(ticketRef, { unreadByUser: false }, { merge: true }).catch(console.error);
        }
      } else {
        // Cargar fallback local o dejar como nulo (se creará al enviar el primer mensaje)
        const localData = localStorage.getItem(`futura_support_${userId}`);
        if (localData) {
          try {
            setTicket(JSON.parse(localData));
          } catch (e) {
            setTicket(null);
          }
        } else {
          setTicket(null);
        }
      }
      setLoadingTicket(false);
    }, (error) => {
      console.warn("Firestore support ticket read warning:", error);
      // Fallback a localStorage
      const localData = localStorage.getItem(`futura_support_${userId}`);
      if (localData) {
        try { setTicket(JSON.parse(localData)); } catch (e) {}
      }
      setLoadingTicket(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Auto scroll al final de la conversación
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = (textToSend || inputText).trim();
    if (!finalMsg || isSending) return;

    setIsSending(true);

    const nowISO = new Date().toISOString();
    const newMsg: MessageItem = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user',
      senderEmail: userEmail,
      text: finalMsg,
      category: selectedCategory,
      createdAt: nowISO,
    };

    const existingMessages = ticket?.messages || [];
    const updatedMessages = [...existingMessages, newMsg];

    const updatedTicket: SupportTicketData = {
      id: userId,
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      lastMessage: finalMsg,
      lastMessageAt: nowISO,
      unreadByAdmin: true,
      unreadByUser: false,
      status: 'open',
      category: selectedCategory,
      messages: updatedMessages,
    };

    // 1. Guardar localmente
    setTicket(updatedTicket);
    localStorage.setItem(`futura_support_${userId}`, JSON.stringify(updatedTicket));
    setInputText('');

    // 2. Guardar en Firestore para que el admin lo reciba en tiempo real
    try {
      const ticketRef = doc(db, 'support_tickets', userId);
      await setDoc(ticketRef, {
        ...updatedTicket,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("Error guardando mensaje en Firestore:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-surface-950/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary font-mono text-[10px] font-bold uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              Atención Directa & Soporte VIP
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-wide">
              Soporte y Atención al Cliente
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Envía tus dudas, solicitudes o sugerencias. Tu mensaje llega directamente al equipo de administración y recibirás respuesta en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-left">
              <p className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Estado del Servicio</p>
              <p className="text-xs font-bold text-white">Canal Directo Activo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quick Options & Category Selector */}
        <div className="lg:col-span-4 space-y-6 text-left">
          {/* Category Selector */}
          <div className="bg-surface-950/80 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              Tipo de Consulta
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? `bg-gradient-to-r ${cat.color} font-bold shadow-lg` 
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isSelected ? '' : 'text-slate-500'}`} />
                    <div className="flex-1">
                      <p className="text-xs font-bold">{cat.label}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Inspirations */}
          <div className="bg-surface-950/80 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-primary" />
              Consultas Rápidas
            </h3>

            <div className="space-y-2">
              {QUICK_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug)}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-2 pr-2">{sug}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Support Chat */}
        <div className="lg:col-span-8 bg-surface-950/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Atención Directa al Cliente
                  {ticket?.status === 'resolved' ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold rounded-full">
                      Resuelto
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-brand-primary/20 border border-brand-primary/30 text-brand-primary font-mono text-[9px] font-bold rounded-full">
                      En Atención
                    </span>
                  )}
                </h3>
                <p className="text-[10px] font-mono text-slate-400">
                  {userEmail} • {ticket?.messages?.length || 0} mensajes
                </p>
              </div>
            </div>

            {ticket?.unreadByUser && (
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[10px] font-bold rounded-full animate-pulse">
                Respuesta Nueva de Admin
              </span>
            )}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-left scrollbar-none">
            {loadingTicket ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <p className="text-xs font-mono">Conectando con el canal de soporte...</p>
              </div>
            ) : !ticket || ticket.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h4 className="text-sm font-bold text-white">¿En qué podemos ayudarte hoy?</h4>
                  <p className="text-xs text-slate-400">
                    Escribe tu mensaje a continuación. Te responderemos directamente en esta misma pantalla.
                  </p>
                </div>
              </div>
            ) : (
              ticket.messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {isAdmin ? '🛡️ Administrador FUTURE' : userName}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-gradient-to-r from-brand-primary/20 to-purple-600/20 border border-brand-primary/30 text-white rounded-tl-sm'
                          : 'bg-white/10 border border-white/10 text-white rounded-tr-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer / Input */}
          <div className="p-4 bg-white/[0.02] border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu duda, sugerencia o consulta para el administrador..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-brand-primary/50 text-xs sm:text-sm text-white placeholder:text-slate-500 px-4 py-3 rounded-xl outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-5 py-3 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-brand-primary/20"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
