import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Headphones, 
  Search, 
  CheckCircle2, 
  MessageSquare, 
  Loader2, 
  Sparkles, 
  Clock, 
  User, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

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

const QUICK_ADMIN_RESPONSES = [
  "¡Hola! Con gusto te ayudo. Cuéntame los detalles para darte solución de inmediato.",
  "Hemos procesado tu solicitud exitosamente. Por favor verifica en tu panel.",
  "Muchas gracias por tu sugerencia para FUTURE, la hemos compartido con nuestro equipo de desarrollo.",
  "Hemos actualizado tus límites de cuota. Ya puedes continuar generando sin problemas."
];

export default function AdminSupportConsole() {
  const [tickets, setTickets] = useState<SupportTicketData[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'open' | 'resolved'>('all');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  // Escuchar todos los tickets de soporte en tiempo real desde Servidor API y Firestore
  useEffect(() => {
    let isMounted = true;

    // 1. Polling continuo a la API del servidor
    const fetchServerTickets = async () => {
      try {
        const res = await fetch('/api/support/tickets?action=list');
        if (res.ok) {
          const data = await res.json();
          if (data?.tickets && Array.isArray(data.tickets) && isMounted) {
            setTickets((prev) => {
              // Combinar o actualizar tickets
              const map = new Map<string, SupportTicketData>();
              for (const t of prev) map.set(t.id, t);
              for (const t of data.tickets) {
                const existing = map.get(t.id);
                if (!existing || (t.messages && t.messages.length >= (existing.messages?.length || 0))) {
                  map.set(t.id, t);
                }
              }
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
              
              if (merged.length > 0 && !selectedTicketId) {
                setSelectedTicketId(merged[0].id);
              }
              return merged;
            });
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn("[ADMIN SUPPORT] Server tickets sync warning:", err);
      }
    };

    fetchServerTickets();
    const interval = setInterval(fetchServerTickets, 3000);

    // 2. Suscripción a Firestore
    const q = collection(db, 'support_tickets');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList: SupportTicketData[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as SupportTicketData));

      if (ticketList.length > 0 && isMounted) {
        setTickets((prev) => {
          const map = new Map<string, SupportTicketData>();
          for (const t of prev) map.set(t.id, t);
          for (const t of ticketList) map.set(t.id, t);
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
          
          if (merged.length > 0 && !selectedTicketId) {
            setSelectedTicketId(merged[0].id);
          }
          return merged;
        });
      }
      if (isMounted) setLoading(false);
    }, (err) => {
      console.warn("[ADMIN SUPPORT] Firestore listener warning (using Server API fallback):", err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Auto-scroll interno SOLO dentro del chat seleccionado (sin mover la ventana)
  useEffect(() => {
    const currentCount = selectedTicket?.messages?.length || 0;
    if (currentCount > prevMsgCountRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    prevMsgCountRef.current = currentCount;
  }, [selectedTicket?.messages]);

  // Al seleccionar un ticket, marcarlo como leído por el Admin
  useEffect(() => {
    if (selectedTicket && selectedTicket.unreadByAdmin) {
      // 1. En servidor
      fetch('/api/support/tickets?action=update_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, unreadByAdmin: false })
      }).catch(console.warn);

      // 2. En Firestore
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      setDoc(ticketRef, { unreadByAdmin: false }, { merge: true }).catch(console.warn);
    }
  }, [selectedTicketId]);

  const handleAdminReply = async (replyText?: string) => {
    const finalReply = (replyText || inputText).trim();
    if (!finalReply || !selectedTicket || isSending) return;

    setIsSending(true);

    const nowISO = new Date().toISOString();
    const newMsg: MessageItem = {
      id: `msg_admin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender: 'admin',
      senderEmail: 'heczaroficial@gmail.com',
      text: finalReply,
      createdAt: nowISO,
    };

    const updatedMessages = [...(selectedTicket.messages || []), newMsg];

    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              lastMessage: finalReply,
              lastMessageAt: nowISO,
              unreadByAdmin: false,
              unreadByUser: true,
              messages: updatedMessages,
            }
          : t
      )
    );

    setInputText('');

    // 1. Enviar a Servidor API
    try {
      await fetch('/api/support/tickets?action=admin_reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          text: finalReply,
          adminEmail: 'heczaroficial@gmail.com'
        })
      });
    } catch (apiErr) {
      console.warn("[ADMIN SUPPORT] Error replying via server API:", apiErr);
    }

    // 2. Enviar a Firestore
    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      await setDoc(ticketRef, {
        lastMessage: finalReply,
        lastMessageAt: nowISO,
        unreadByAdmin: false,
        unreadByUser: true,
        status: 'open',
        messages: updatedMessages,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn("[ADMIN SUPPORT] Error replying in Firestore (using Server API):", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTicket) return;
    const newStatus = selectedTicket.status === 'resolved' ? 'open' : 'resolved';
    
    // UI update
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
    );

    // Servidor API
    fetch('/api/support/tickets?action=update_state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: selectedTicket.id, status: newStatus })
    }).catch(console.warn);

    // Firestore
    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      await setDoc(ticketRef, { status: newStatus }, { merge: true });
    } catch (err) {
      console.warn("Error cambiando estado:", err);
    }
  };

  // Filtrado de tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'unread') return t.unreadByAdmin;
    if (filterStatus === 'open') return t.status === 'open';
    if (filterStatus === 'resolved') return t.status === 'resolved';
    return true;
  });

  const unreadTotal = tickets.filter(t => t.unreadByAdmin).length;

  return (
    <div className="space-y-6 text-left">
      {/* Admin Support Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-950/80 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary font-mono text-[10px] font-bold uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" />
            Consola de Administración de Soporte
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Atención a Clientes en Tiempo Real
          </h2>
          <p className="text-xs text-slate-400">
            Responde las dudas, solicitudes y sugerencias de tus usuarios directamente desde esta consola.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300 font-bold">
              {tickets.length} Tickets Totales
            </span>
          </div>
          {unreadTotal > 0 && (
            <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl flex items-center gap-2 animate-bounce">
              <span className="text-xs font-mono font-bold">
                {unreadTotal} No Leídos
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets Directory Sidebar */}
        <div className="lg:col-span-4 bg-surface-950/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col h-[700px]">
          {/* Search & Filter Controls */}
          <div className="p-4 bg-white/[0.02] border-b border-white/10 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por usuario o correo..."
                className="w-full bg-white/5 border border-white/10 focus:border-brand-primary/50 text-xs text-white placeholder:text-slate-500 pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-xl text-[10px] font-mono font-bold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`py-1.5 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('unread')}
                className={`py-1.5 rounded-lg transition-all ${filterStatus === 'unread' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Sin Leer
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`py-1.5 rounded-lg transition-all ${filterStatus === 'open' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Abiertos
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`py-1.5 rounded-lg transition-all ${filterStatus === 'resolved' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Resueltos
              </button>
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-none">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-mono">No hay tickets en esta categoría.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-4 transition-all cursor-pointer block relative ${
                      isSelected 
                        ? 'bg-brand-primary/10 border-l-4 border-l-brand-primary' 
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {t.unreadByAdmin && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-white truncate max-w-[180px]">
                        {t.userName || t.userEmail}
                      </p>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">
                        {t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mb-2">
                      {t.lastMessage}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-500 uppercase">{t.category || 'General'}</span>
                      {t.status === 'resolved' ? (
                        <span className="text-emerald-400 font-bold">✓ Resuelto</span>
                      ) : (
                        <span className="text-brand-primary font-bold">En atención</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Interface & Client Details */}
        <div className="lg:col-span-8 bg-surface-950/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col h-[700px]">
          {selectedTicket ? (
            <>
              {/* Selected Ticket Top Toolbar */}
              <div className="p-5 bg-white/[0.02] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-white font-bold uppercase">
                    {selectedTicket.userName[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedTicket.userName}
                      <span className="text-xs font-mono text-slate-400 font-normal">({selectedTicket.userEmail})</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      ID Usuario: {selectedTicket.userId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedTicket.status === 'resolved'
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedTicket.status === 'resolved' ? 'Marcar como Pendiente' : 'Marcar como Resuelto'}
                  </button>
                </div>
              </div>

              {/* Quick Preset Admin Responses */}
              <div className="px-5 py-2.5 bg-white/[0.01] border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 uppercase">Respuestas Rápidas:</span>
                {QUICK_ADMIN_RESPONSES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAdminReply(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-brand-primary/20 border border-white/10 text-[10px] text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {preset.substring(0, 35)}...
                  </button>
                ))}
              </div>

              {/* Conversation Messages */}
              <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
                {selectedTicket.messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          {isAdmin ? '🛡️ Administrador (Tú)' : selectedTicket.userName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-brand-primary text-white rounded-tr-sm shadow-md'
                            : 'bg-white/10 border border-white/10 text-white rounded-tl-sm shadow-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply Input Form */}
              <div className="p-4 bg-white/[0.02] border-t border-white/10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdminReply();
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Responder a ${selectedTicket.userName}...`}
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
                        Responder
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Headphones className="w-12 h-12 opacity-30" />
              <p className="text-xs font-mono">Selecciona una conversación a la izquierda para responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
