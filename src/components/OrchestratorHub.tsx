/**
 * OrchestratorHub.tsx — FUTURA Central Orchestrator
 * Single-path AI-first experience. All roads lead here.
 * Supports: multi-session conversations, file vault, credit monetization.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  ChevronRight,
  Sparkles,
  Loader2,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Folder,
  X,
  Crown,
  Zap,
  Brain,
  Target,
  ArrowRight,
  Download,
  MoreVertical,
  Edit3,
  ChevronDown,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  Coins,
  Clock,
  AlertTriangle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw
} from 'lucide-react';
import { chatWithAdvisor } from '../services/geminiService';
import { ProjectContext } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  tokens?: number;
}

interface Conversation {
  id: string;
  title: string;
  topic: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  color?: string;
}

interface VaultFile {
  id: string;
  name: string;
  type: 'text' | 'image' | 'pdf' | 'note';
  content: string;
  size?: number;
  createdAt: number;
  conversationId?: string;
}

interface OrchestratorHubProps {
  profile: any;
  projectsList?: ProjectContext[];
  onUpdateProfile?: (p: any) => void;
  setActiveTab: (tab: string) => void;
  setDashboardPrompt?: (prompt: string) => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPIC_COLORS = [
  'from-violet-500/20 to-purple-600/20',
  'from-cyan-500/20 to-blue-600/20',
  'from-emerald-500/20 to-teal-600/20',
  'from-orange-500/20 to-rose-600/20',
  'from-yellow-500/20 to-amber-600/20',
  'from-pink-500/20 to-fuchsia-600/20',
];

const QUICK_ACTIONS = [
  { icon: Target, label: 'Análisis de Marca', prompt: 'Realiza un análisis completo de mi marca actual: fortalezas, debilidades y oportunidades de crecimiento inmediato bajo la metodología SPE.', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: TrendingUp, label: 'Estrategia de Ventas', prompt: 'Diseña una estrategia de captación de clientes de alto ticket para mi negocio usando el Sistema Pentagonal de Ejecución.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { icon: Zap, label: 'Copy Persuasivo', prompt: 'Crea un copy de alta conversión para mis redes sociales. Necesito un gancho poderoso, desarrollo del dolor y llamado a la acción directo.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: Brain, label: 'Blueprint Estratégico', prompt: 'Genera un Blueprint Estratégico completo para mi negocio: ADN de marca, perfil de cliente ideal, propuesta de valor y plan de acción 30-60-90 días.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Star, label: 'Plan de Contenido', prompt: 'Crea un plan de contenido mensual para mis redes sociales con temas, formatos y copywriting de cada publicación para generar autoridad y ventas.', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { icon: Coins, label: 'Monetización Express', prompt: 'Ayúdame a diseñar un sistema de monetización para mi negocio: paquetes de servicios, precios estratégicos y un embudo de ventas automatizado.', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
];

const CREDIT_COSTS = {
  message: 1,
  imageGen: 5,
  blueprint: 10,
  analysis: 3,
};

// ─── Storage helpers ───────────────────────────────────────────────────────────

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem('futura_conversations');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem('futura_conversations', JSON.stringify(convs));
  } catch { /* quota */ }
}

function loadVault(): VaultFile[] {
  try {
    const raw = localStorage.getItem('futura_vault');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVault(files: VaultFile[]) {
  try {
    localStorage.setItem('futura_vault', JSON.stringify(files));
  } catch { /* quota */ }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, isPremium }: { msg: ChatMessage; isPremium: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group flex gap-3 w-full',
        msg.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {msg.role === 'model' && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-brand-primary/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 relative',
        msg.role === 'user'
          ? 'bg-brand-primary/20 border border-brand-primary/30 text-white ml-10'
          : 'bg-surface-900/80 border border-white/5 text-slate-200'
      )}>
        {msg.role === 'model' ? (
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 text-sm leading-relaxed [&_strong]:text-white [&_h3]:text-white [&_h4]:text-white [&_ul]:space-y-1 [&_li]:text-slate-300">
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-white leading-relaxed">{msg.text}</p>
        )}

        <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5">
          <span className="text-[9px] text-slate-500 font-mono">
            {new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.role === 'model' && (
            <button
              onClick={handleCopy}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-500 hover:text-slate-300"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {msg.role === 'user' && (
        <div className="w-8 h-8 rounded-xl bg-surface-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-black text-slate-300">T</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── ConversationItem ──────────────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onClick, onDelete, onRename }: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    onRename(editVal.trim() || conv.title);
    setEditing(false);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left w-full',
        isActive
          ? 'bg-brand-primary/15 border border-brand-primary/25 text-white'
          : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
      )}
      onClick={onClick}
    >
      <div className={cn(
        'w-1.5 h-1.5 rounded-full flex-shrink-0',
        isActive ? 'bg-brand-primary' : 'bg-slate-600'
      )} />

      {editing ? (
        <input
          ref={inputRef}
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => e.key === 'Enter' && handleRename()}
          className="flex-1 bg-transparent text-xs text-white border-none outline-none min-w-0"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{conv.title}</p>
          <p className="text-[9px] text-slate-500 truncate">{conv.messages.length} mensajes</p>
        </div>
      )}

      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(m => !m); }}
          className="p-1 hover:text-white text-slate-500 transition-colors"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface-900 border border-white/10 rounded-xl overflow-hidden shadow-xl shadow-black/40 w-32">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
              onClick={e => { e.stopPropagation(); setShowMenu(false); setEditing(true); }}
            >
              <Edit3 className="w-3 h-3" /> Renombrar
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={e => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
            >
              <Trash2 className="w-3 h-3" /> Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CreditsBar ────────────────────────────────────────────────────────────────

function CreditsBar({ credits, isPremium, onUpgrade }: { credits: number; isPremium: boolean; onUpgrade: () => void }) {
  const max = isPremium ? 500 : 30;
  const pct = Math.max(0, Math.min(100, (credits / max) * 100));
  const isLow = credits <= 5 && !isPremium;

  return (
    <div className={cn(
      'mx-3 mb-3 p-3 rounded-xl border transition-all',
      isPremium
        ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20'
        : isLow
          ? 'bg-red-500/10 border-red-500/30 animate-pulse'
          : 'bg-white/3 border-white/8'
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Coins className={cn('w-3 h-3', isPremium ? 'text-yellow-400' : isLow ? 'text-red-400' : 'text-slate-400')} />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            {isPremium ? 'PRO' : 'Créditos'}
          </span>
        </div>
        <span className={cn(
          'text-xs font-black',
          isPremium ? 'text-yellow-400' : isLow ? 'text-red-400' : 'text-white'
        )}>
          {credits}<span className="text-slate-500 font-normal text-[9px]">/{max}</span>
        </span>
      </div>
      <div className="h-1 bg-black/30 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            isPremium ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
              isLow ? 'bg-red-500' : 'bg-brand-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!isPremium && (
        <button
          onClick={onUpgrade}
          className="mt-2 w-full text-[9px] font-black uppercase tracking-wider text-yellow-400 hover:text-yellow-300 flex items-center justify-center gap-1 transition-colors"
        >
          <Crown className="w-2.5 h-2.5" />
          Actualizar a PRO
        </button>
      )}
    </div>
  );
}

// ─── VaultPanel ────────────────────────────────────────────────────────────────

function VaultPanel({ files, onAddNote, onDelete }: {
  files: VaultFile[];
  onAddNote: (note: Omit<VaultFile, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteName, setNoteName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote({
      name: noteName.trim() || `Nota ${new Date().toLocaleDateString('es-VE')}`,
      type: 'note',
      content: noteText.trim(),
    });
    setNoteText('');
    setNoteName('');
    setShowAdd(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAddNote({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'text',
        content: reader.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const icons: Record<string, React.ElementType> = {
    text: FileText,
    image: ImageIcon,
    note: Edit3,
    pdf: FileText,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-1.5">
          <Folder className="w-3 h-3" /> Archivo de Trabajo
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Subir archivo"
          >
            <Download className="w-3 h-3 rotate-180" />
          </button>
          <button
            onClick={() => setShowAdd(s => !s)}
            className="p-1 text-slate-500 hover:text-brand-primary transition-colors"
            title="Nueva nota"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.txt,.pdf" className="hidden" onChange={handleFileUpload} />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <input
              value={noteName}
              onChange={e => setNoteName(e.target.value)}
              placeholder="Nombre de la nota..."
              className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-brand-primary/40 transition-colors"
            />
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Escribe tu nota, contexto o referencia..."
              rows={3}
              className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-brand-primary/40 transition-colors resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveNote} className="flex-1 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-primary/80 transition-colors">
                Guardar
              </button>
              <button onClick={() => setShowAdd(false)} className="py-1.5 px-3 bg-white/5 text-slate-400 rounded-lg text-xs hover:bg-white/10 transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length === 0 ? (
        <div className="text-center py-6">
          <Folder className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-[9px] text-slate-600">Tu archivo de trabajo está vacío</p>
          <p className="text-[9px] text-slate-700 mt-1">Sube archivos o crea notas</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map(file => {
            const Icon = icons[file.type] || FileText;
            return (
              <div
                key={file.id}
                className="group flex items-center gap-2 p-2.5 bg-white/3 border border-white/5 rounded-xl hover:border-white/10 transition-all"
              >
                <div className="w-6 h-6 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-300 truncate">{file.name}</p>
                  <p className="text-[8px] text-slate-600">
                    {new Date(file.createdAt).toLocaleDateString('es-VE')}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(file.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-600 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OrchestratorHub({
  profile,
  projectsList,
  onUpdateProfile,
  setActiveTab,
  setDashboardPrompt,
  initialPrompt,
  onPromptConsumed,
}: OrchestratorHubProps) {

  const isPremium = profile?.isPremium || false;
  const [credits, setCredits] = useState<number>(() => {
    const stored = localStorage.getItem('futura_session_credits');
    return stored ? parseInt(stored, 10) : (isPremium ? 500 : 30);
  });

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const saved = loadConversations();
    return saved.length > 0 ? saved[0].id : null;
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vault, setVault] = useState<VaultFile[]>(() => loadVault());
  const [showWelcome, setShowWelcome] = useState(() => loadConversations().length === 0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active conversation
  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  // Persist conversations
  useEffect(() => { saveConversations(conversations); }, [conversations]);
  useEffect(() => { saveVault(vault); }, [vault]);
  useEffect(() => { localStorage.setItem('futura_session_credits', String(credits)); }, [credits]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [activeConv?.messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(undefined, initialPrompt);
      if (onPromptConsumed) onPromptConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // ── Conversation management ──────────────────────────────────────────────────

  const createConversation = useCallback((firstMessage?: string): Conversation => {
    const id = uid();
    const conv: Conversation = {
      id,
      title: firstMessage ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '…' : '') : 'Nueva Conversación',
      topic: 'Consulta General',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: TOPIC_COLORS[Math.floor(Math.random() * TOPIC_COLORS.length)],
    };
    return conv;
  }, []);

  const handleNewConversation = () => {
    const conv = createConversation();
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setShowWelcome(false);
    setInputText('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeConvId === id) {
        setActiveConvId(next.length > 0 ? next[0].id : null);
        if (next.length === 0) setShowWelcome(true);
      }
      return next;
    });
  };

  const handleRenameConversation = (id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  // ── Send message ─────────────────────────────────────────────────────────────

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText || inputText).trim();
    if (!text || isLoading) return;

    // Credit check for free users
    if (!isPremium && credits < CREDIT_COSTS.message) {
      setActiveTab('membership');
      return;
    }

    setInputText('');

    // Determine or create conversation
    let convId = activeConvId;
    let isNew = false;

    if (!convId || !conversations.find(c => c.id === convId)) {
      const newConv = createConversation(text);
      setConversations(prev => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConvId(convId);
      isNew = true;
    }

    setShowWelcome(false);

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setConversations(prev => prev.map(c =>
      c.id === convId
        ? {
          ...c,
          messages: [...c.messages, userMsg],
          updatedAt: Date.now(),
          title: c.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? '…' : '') : c.title,
        }
        : c
    ));

    setIsLoading(true);

    // Build history for AI
    const history = (conversations.find(c => c.id === convId)?.messages || []).map(m => ({
      role: m.role,
      text: m.text,
    }));

    const brandCtx = `FUTURA - Suite de Marketing de Nivel Élite bajo la metodología SPE (Sistema Pentagonal de Ejecución). El usuario está consultando a través del Orquestador Central.`;

    try {
      if (!isPremium) {
        setCredits(prev => Math.max(0, prev - CREDIT_COSTS.message));
      }

      const response = await chatWithAdvisor(
        text,
        history,
        brandCtx,
        ['brainstorming', 'creative-director'],
        'FUTURA Institucional'
      );

      const modelMsg: ChatMessage = {
        id: uid(),
        role: 'model',
        text: response,
        timestamp: Date.now(),
      };

      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, modelMsg], updatedAt: Date.now() }
          : c
      ));

    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: 'model',
        text: `⚠️ Error de conexión: **${err.message || 'Fallo al contactar el servidor'}**. Verifica tu conexión e intenta de nuevo.`,
        timestamp: Date.now(),
      };
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() }
          : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Vault management ─────────────────────────────────────────────────────────

  const handleAddToVault = (note: Omit<VaultFile, 'id' | 'createdAt'>) => {
    const file: VaultFile = { ...note, id: uid(), createdAt: Date.now() };
    setVault(prev => [file, ...prev]);
  };

  const handleDeleteVault = (id: string) => {
    setVault(prev => prev.filter(f => f.id !== id));
  };

  // ── Save last message to vault ────────────────────────────────────────────────

  const handleSaveToVault = () => {
    if (!activeConv || activeConv.messages.length === 0) return;
    const last = [...activeConv.messages].reverse().find(m => m.role === 'model');
    if (!last) return;
    handleAddToVault({
      name: `Respuesta: ${activeConv.title}`,
      type: 'note',
      content: last.text,
      conversationId: activeConv.id,
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const messages = activeConv?.messages || [];

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-2xl border border-white/5 bg-surface-950/40 shadow-2xl shadow-black/40">

      {/* ── Left Sidebar: Conversations ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-shrink-0 overflow-hidden border-r border-white/5 bg-surface-950/60 flex flex-col"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-primary to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Consultor FUTURA
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New conversation button */}
            <div className="p-3">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-brand-primary/15 hover:bg-brand-primary/25 border border-brand-primary/30 rounded-xl text-brand-primary text-xs font-bold transition-all group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Nueva Conversación
              </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-2 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-[9px] text-slate-600">Sin conversaciones</p>
                </div>
              ) : (
                conversations
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeConvId}
                      onClick={() => { setActiveConvId(conv.id); setShowWelcome(false); }}
                      onDelete={() => handleDeleteConversation(conv.id)}
                      onRename={title => handleRenameConversation(conv.id, title)}
                    />
                  ))
              )}
            </div>

            {/* Credits bar */}
            <CreditsBar
              credits={credits}
              isPremium={isPremium}
              onUpgrade={() => setActiveTab('membership')}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-950/30 flex-shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            {activeConv ? (
              <>
                <h2 className="text-sm font-bold text-white truncate">{activeConv.title}</h2>
                <p className="text-[9px] text-slate-500">
                  {activeConv.messages.length} mensajes · actualizado {new Date(activeConv.updatedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </>
            ) : (
              <h2 className="text-sm font-bold text-slate-400">Selecciona o crea una conversación</h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeConv && activeConv.messages.length > 0 && (
              <button
                onClick={handleSaveToVault}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-white/3 hover:bg-white/8 border border-white/5 rounded-lg transition-all"
                title="Guardar en archivo"
              >
                <Folder className="w-3 h-3" /> Guardar
              </button>
            )}
            <button
              onClick={() => setVaultOpen(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider border rounded-lg transition-all',
                vaultOpen
                  ? 'text-brand-primary bg-brand-primary/10 border-brand-primary/30'
                  : 'text-slate-400 hover:text-white bg-white/3 hover:bg-white/8 border-white/5'
              )}
            >
              <Folder className="w-3 h-3" />
              Archivos
              {vault.length > 0 && (
                <span className="w-4 h-4 bg-brand-primary rounded-full text-[8px] text-white flex items-center justify-center">
                  {vault.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-6">

            {/* Welcome state */}
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8"
              >
                <div>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-primary via-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-brand-primary/30 mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-white mb-2">
                    Consultor <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-violet-400">FUTURA</span>
                  </h1>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Tu estratega personal de alto calibre. Pregúntame cualquier cosa sobre tu negocio, marketing, ventas o estrategia comercial.
                  </p>
                </div>

                {!isPremium && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-300">
                      Modo Free · <strong>{credits}</strong> créditos disponibles
                    </span>
                    <button onClick={() => setActiveTab('membership')} className="text-xs text-yellow-400 underline hover:text-yellow-300">
                      Actualizar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(undefined, action.prompt)}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-xl border transition-all hover:scale-[1.02] text-left group',
                        action.bg
                      )}
                    >
                      <action.icon className={cn('w-5 h-5', action.color)} />
                      <span className="text-xs font-bold text-white group-hover:text-white">{action.label}</span>
                      <span className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">{action.prompt.slice(0, 60)}…</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty conversation state */}
            {!showWelcome && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-semibold">Conversación vacía</p>
                <p className="text-xs text-slate-600 mt-1">Escribe tu primera consulta abajo</p>
              </motion.div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isPremium={isPremium} />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-primary/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-surface-900/80 border border-white/5 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
                      <span className="text-xs text-slate-400">FUTURA está procesando tu consulta…</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 bg-brand-primary rounded-full"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-white/5 bg-surface-950/50 p-4">
          {!isPremium && credits <= 5 && credits > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <span className="text-[10px] text-yellow-300">Solo te quedan <strong>{credits} créditos</strong>.</span>
              <button onClick={() => setActiveTab('membership')} className="ml-auto text-[10px] text-yellow-400 font-bold underline hover:text-yellow-300">
                Actualizar a PRO
              </button>
            </motion.div>
          )}

          {!isPremium && credits <= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <Lock className="w-6 h-6 text-red-400" />
              <p className="text-xs text-red-300 text-center font-bold">Sin créditos disponibles</p>
              <button
                onClick={() => setActiveTab('membership')}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-black rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" /> Actualizar a PRO — Acceso Ilimitado
              </button>
            </motion.div>
          )}

          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  !isPremium && credits <= 0
                    ? 'Actualiza tu plan para continuar…'
                    : 'Consulta a FUTURA sobre estrategia, copy, ventas, branding… (Enter para enviar)'
                }
                disabled={!isPremium && credits <= 0}
                rows={1}
                className="w-full bg-surface-900/80 border border-white/10 focus:border-brand-primary/40 rounded-2xl px-4 py-3.5 pr-14 text-sm text-white placeholder:text-slate-600 outline-none resize-none transition-all leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed custom-scrollbar"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || (!isPremium && credits <= 0)}
                className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[9px] text-slate-600">
                <kbd className="text-slate-700 font-mono">Shift+Enter</kbd> para nueva línea
              </p>
              {!isPremium && (
                <p className="text-[9px] text-slate-600">
                  {CREDIT_COSTS.message} crédito por mensaje · <span className="text-brand-primary">{credits} restantes</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Vault ── */}
      <AnimatePresence initial={false}>
        {vaultOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-shrink-0 overflow-hidden border-l border-white/5 bg-surface-950/60 flex flex-col"
          >
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-brand-primary" /> Archivo de Trabajo
              </span>
              <button onClick={() => setVaultOpen(false)} className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <VaultPanel files={vault} onAddNote={handleAddToVault} onDelete={handleDeleteVault} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
