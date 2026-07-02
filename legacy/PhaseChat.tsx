import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Bot, User, ArrowLeft, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatAboutPhase } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface PhaseChatProps {
  phase: string;
  onClose: () => void;
}

export default function PhaseChat({ phase, onClose }: PhaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isNearBottom = useRef(true);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (container) {
      const threshold = 150;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
      isNearBottom.current = isAtBottom;
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const trigger = () => {
      const container = scrollRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior
        });
      }
    };
    trigger();
    setTimeout(trigger, 50);
    setTimeout(trigger, 150);
    setTimeout(trigger, 300);
    setTimeout(trigger, 500);
  };

  useEffect(() => {
    if (isNearBottom.current) {
      scrollToBottom('smooth');
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', parts: [{ text: userMessage }] }];
    setMessages(newMessages);
    setLoading(true);
    isNearBottom.current = true; // Force scroll on user send
    
    // Smooth scroll immediately on send so user sees their message
    scrollToBottom('smooth');

    try {
      const response = await chatAboutPhase(phase, messages, userMessage);
      setMessages([...newMessages, { role: 'model', parts: [{ text: response }] }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', parts: [{ text: "Error de conexión. Reintenta." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-surface-950 border-l border-white/5 shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" /> Asesor Premium
            </h4>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Fase: {phase}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <Bot className="w-12 h-12 text-brand-primary mb-4" />
            <p className="text-sm text-slate-400 font-medium">¿En qué puedo ayudarte con la fase de {phase}?</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
               {['¿Cuales son los objetivos?', 'Dame un checklist', 'Sugerencia Premium'].map(hint => (
                 <button 
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                 >
                   {hint}
                 </button>
               ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-4 max-w-[85%]",
            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg",
              msg.role === 'user' ? "bg-white/10" : "bg-brand-primary/20"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-brand-primary" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' ? "bg-white/5 text-white" : "bg-surface-900 border border-white/5 text-slate-300"
            )}>
              <div className="prose prose-invert prose-xs">
                <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 mr-auto">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="p-4 bg-surface-900 border border-white/5 rounded-2xl">
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/5 bg-surface-950">
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mensaje al motor estratégico..."
            className="w-full bg-surface-900 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2.5 bg-brand-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[8px] text-center text-slate-600 mt-4 font-mono">MODO: ASESORÍA ESTRATÉGICA PREMIUM</p>
      </div>
    </motion.div>
  );
}
