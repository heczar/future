/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  FileText, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles, 
  Briefcase, 
  ArrowRight,
  RefreshCw,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { chatWithAdvisor, generateSocialCopy, refineSocialCopy } from '../services/geminiService';
import { ProjectContext, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdvisoryHubProps {
  profile: UserProfile;
  projectsList: ProjectContext[];
  onUpdateProfile: (p: any) => void;
  setActiveTab: (tab: string) => void;
  setDashboardPrompt: (prompt: string) => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

export default function AdvisoryHub({
  profile,
  projectsList,
  onUpdateProfile,
  setActiveTab,
  setDashboardPrompt,
  initialPrompt,
  onPromptConsumed
}: AdvisoryHubProps) {
  const renderFormattedChatMessage = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const word = part.slice(2, -2);
        return (
          <span key={index} className="text-[#c084fc] font-bold">
            {word}
          </span>
        );
      }
      return part;
    });
  };

  const [activeSubTab, setActiveSubTab] = useState<'consultation' | 'copys'>('consultation');
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() => {
    return localStorage.getItem('activeConsultBrandId') || '';
  });

  // Get active brand from list
  const activeBrand = projectsList.find(p => p.id === selectedBrandId);

  useEffect(() => {
    if (selectedBrandId) {
      localStorage.setItem('activeConsultBrandId', selectedBrandId);
    } else {
      localStorage.removeItem('activeConsultBrandId');
    }
  }, [selectedBrandId]);

  // Handle initial prompt from dashboard
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      if (initialPrompt.toLowerCase().includes('copy') || initialPrompt.toLowerCase().includes('redact')) {
        setActiveSubTab('copys');
        setCopyTopic(initialPrompt);
      } else {
        setActiveSubTab('consultation');
        // Trigger chat message
        handleSendChatMessage(undefined, initialPrompt);
      }
      if (onPromptConsumed) onPromptConsumed();
    }
  }, [initialPrompt]);

  // ==========================================
  // CHAT / ADVISORY LOGIC
  // ==========================================
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>(() => {
    return [
      {
        role: 'model',
        text: '¡Hola! Soy tu Consultor Estratégico FUTURA. Estoy aquí para simplificar tu marketing y ayudarte a tomar mejores decisiones comerciales bajo el método SPE (Resultados sobre Estética).\n\n¿De qué negocio o idea de producto te gustaría conversar hoy?'
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleSendChatMessage = async (e?: React.FormEvent, forceText?: string) => {
    if (e) e.preventDefault();
    const promptText = (forceText || chatInput).trim();
    if (!promptText || isChatLoading) return;

    if (!forceText) setChatInput('');

    // Add user message
    const updatedMessages = [...chatMessages, { role: 'user' as const, text: promptText }];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    const brandCtx = activeBrand
      ? `MARCA ACTIVA CONECTADA: ${activeBrand.name}. ADN/DESCRIPCIÓN: ${activeBrand.description}`
      : "No hay marca conectada en esta sesión.";

    try {
      const response = await chatWithAdvisor(promptText, chatMessages, brandCtx);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, {
        role: 'model',
        text: `⚠️ Error de conexión: **${err.message || err}**. Favor de intentar de nuevo.`
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        role: 'model',
        text: 'Chat de consultoría reiniciado. Dime qué desafío de negocio o campaña comercial enfrentas hoy para darte recomendaciones pragmáticas.'
      }
    ]);
  };

  // ==========================================
  // COPY GENERATOR LOGIC
  // ==========================================
  const [copyTopic, setCopyTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedTone, setSelectedTone] = useState('Persuasivo e Directo (Vendedor)');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  
  // Refinement states
  const [refineInput, setRefineInput] = useState('');
  const [isRefiningCopy, setIsRefiningCopy] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Multimodal image upload for Copywriting
  const [copyImage, setCopyImage] = useState<string | null>(null);

  const handleCopyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional limit to 4MB for faster API transfers
    if (file.size > 4 * 1024 * 1024) {
      alert("La fotografía es demasiado pesada. Favor de subir una imagen menor a 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCopyImage(reader.result);
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
    };
  };

  const handleGenerateCopy = async () => {
    if (!copyTopic.trim() || isGeneratingCopy) return;
    setIsGeneratingCopy(true);
    setGeneratedCopy('');
    setRefineInput('');

    const brandName = activeBrand ? activeBrand.name : 'FUTURA';
    const brandDesc = activeBrand ? activeBrand.description : 'Marketing inteligente centrado en resultados.';

    try {
      const result = await generateSocialCopy({
        copyType: 'advertising',
        platform: selectedPlatform,
        tone: selectedTone,
        clientDetails: copyTopic,
        extraContext: activeBrand ? `Marca: ${activeBrand.name}. Pautas: ${activeBrand.description}` : '',
        language: 'es',
        projectName: brandName,
        projectDescription: brandDesc,
        imageUrl: copyImage || undefined // Pass image to Gemini API
      });
      setGeneratedCopy(result);
    } catch (err: any) {
      console.error("Copy generation error:", err);
      setGeneratedCopy(`⚠️ Error al generar copy: ${err.message || err}`);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleRefineCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineInput.trim() || !generatedCopy || isRefiningCopy) return;
    setIsRefiningCopy(true);
    const instruction = refineInput.trim();
    setRefineInput('');

    try {
      const refined = await refineSocialCopy(generatedCopy, instruction);
      setGeneratedCopy(refined);
    } catch (err: any) {
      console.error("Copy refinement error:", err);
      alert("Hubo un error al refinar el copy: " + (err.message || err));
    } finally {
      setIsRefiningCopy(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const platforms = ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'WhatsApp'];
  const tones = [
    'Persuasivo e Directo (Vendedor)',
    'Educativo y Profesional',
    'Casual e Informal',
    'Emocional e Inspirador'
  ];

  return (
    <div className="flex flex-col h-full space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-surface-900/40 border border-white/5 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            Asesoría & Copys
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Diseña campañas y redacta anuncios persuasivos listos para vender.
          </p>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-brand-primary/40 cursor-pointer"
          >
            <option value="">-- Sin Marca Conectada (General) --</option>
            {projectsList.map((project) => (
              <option key={project.id} value={project.id}>
                📁 {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveSubTab('consultation')}
          className={cn(
            "px-6 py-3 text-xs uppercase font-mono font-bold tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeSubTab === 'consultation'
              ? "border-brand-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Chat Consultoría IA
        </button>
        <button
          onClick={() => setActiveSubTab('copys')}
          className={cn(
            "px-6 py-3 text-xs uppercase font-mono font-bold tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeSubTab === 'copys'
              ? "border-brand-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          <FileText className="w-4 h-4" />
          Generador de Copys
        </button>
      </div>

      {/* Sub-tab Content Area */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeSubTab === 'consultation' ? (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-[calc(100vh-340px)] min-h-[300px] bg-surface-900/20 border border-white/5 rounded-2xl overflow-hidden"
            >
              {/* Chat messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin text-xs py-4"
              >
                {/* Brand status notice inside chat */}
                <div className="flex items-center gap-2.5 p-3.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 text-xs">
                  <Info className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="leading-relaxed">
                    {activeBrand ? (
                      <>Conversando usando el contexto de la marca <strong>{activeBrand.name}</strong>. Para cambiar de contexto selecciona otra marca arriba.</>
                    ) : (
                      <>Conversación general. Puedes conectar una marca en la esquina superior para adaptar las respuestas automáticamente.</>
                    )}
                  </span>
                </div>

                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-4 rounded-2xl max-w-[85%] transition-all leading-relaxed whitespace-pre-wrap text-left text-xs font-sans",
                      msg.role === 'user'
                        ? "bg-brand-primary/10 border border-brand-primary/20 text-white ml-auto rounded-tr-none"
                        : "bg-white/5 border border-white/5 text-slate-300 mr-auto rounded-tl-none"
                    )}
                  >
                    {renderFormattedChatMessage(msg.text)}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="bg-white/5 border border-white/5 text-slate-400 mr-auto rounded-tl-none p-4 rounded-2xl max-w-[70%] flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    <span className="text-[10px] text-brand-primary uppercase tracking-[0.25em] font-black">FUTURA está analizando...</span>
                  </div>
                )}
              </div>

              {/* Chat Input panel */}
              <div className="p-4 bg-[#070707] border-t border-white/5">
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Reiniciar chat"
                    className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder={activeBrand ? `Pregunta sobre ${activeBrand.name}...` : "Escribe una pregunta para la consultoría..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-5 bg-brand-primary hover:bg-brand-primary/85 disabled:opacity-40 text-white rounded-xl transition-all font-bold flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <span>Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="copys-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
              {/* Settings Panel (2 cols) */}
              <div className="lg:col-span-2 space-y-4 p-5 bg-surface-900/20 border border-white/5 rounded-2xl">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 border-b border-white/5 pb-2">
                  1. Configuración del Copy
                </h3>
                
                {/* Topic / Offer Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">¿Qué quieres publicar?</label>
                  <textarea
                    rows={2}
                    placeholder="Ejemplo: Lanzamiento de una oferta del 20% de descuento en limpiezas dentales sólo por este mes para eliminar el miedo a ir al dentista..."
                    value={copyTopic}
                    onChange={(e) => setCopyTopic(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors resize-none animate-none"
                  />
                </div>

                {/* Imagen del Copy (Fotografía de Apoyo) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Fotografía de Apoyo (Opcional)</span>
                    {copyImage && (
                      <button 
                        type="button" 
                        onClick={() => setCopyImage(null)} 
                        className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        ELIMINAR
                      </button>
                    )}
                  </label>
                  
                  {copyImage ? (
                    <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/40 aspect-video max-h-[80px] flex items-center justify-center">
                      <img src={copyImage} alt="Preview" className="h-full object-contain" />
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-white/10 hover:border-brand-primary/40 bg-white/[0.01] hover:bg-brand-primary/[0.02] rounded-xl cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-all select-none">
                      <ImageIcon className="w-4 h-4 text-brand-primary" />
                      <span>Subir foto para analizar...</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCopyImageChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Platform Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Plataforma Objetivo</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {platforms.map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setSelectedPlatform(plat)}
                        className={cn(
                          "px-3 py-2 text-[11px] font-mono font-bold rounded-lg border text-center transition-all cursor-pointer",
                          selectedPlatform === plat
                            ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                            : "bg-black/20 border-white/5 text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Tono de Comunicación</label>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary/40 cursor-pointer"
                  >
                    {tones.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleGenerateCopy}
                  disabled={!copyTopic.trim() || isGeneratingCopy}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-xs"
                >
                  {isGeneratingCopy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redactando con Inteligencia...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Copy de Alta Conversión</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Panel (3 cols) */}
              <div className="lg:col-span-3 flex flex-col h-[calc(100vh-340px)] min-h-[300px] p-5 bg-surface-900/20 border border-white/5 rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
                    2. Copy Producido
                  </h3>

                  {generatedCopy && (
                    <button
                      onClick={() => handleCopyToClipboard(generatedCopy)}
                      className="text-[10px] font-mono flex items-center gap-1 text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer bg-brand-primary/5 px-2.5 py-1 rounded-md border border-brand-primary/10"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar al portapapeles</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-[#090909] border border-white/10 rounded-xl p-4 overflow-y-auto text-left min-h-0 select-text">
                  {generatedCopy ? (
                    <div className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed prose prose-invert prose-xs">
                      {generatedCopy}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-xs">Configura los parámetros a la izquierda y presiona el botón para generar el texto comercial.</p>
                    </div>
                  )}
                </div>

                {/* Text Refinement Bar */}
                {generatedCopy && (
                  <form onSubmit={handleRefineCopy} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Pide un cambio (ej: 'Hazlo más corto', 'Usa emoticonos', 'Cambia el llamado a la acción')..."
                      value={refineInput}
                      onChange={(e) => setRefineInput(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors"
                      disabled={isRefiningCopy}
                    />
                    <button
                      type="submit"
                      disabled={!refineInput.trim() || isRefiningCopy}
                      className="px-4 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      {isRefiningCopy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Ajustar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
