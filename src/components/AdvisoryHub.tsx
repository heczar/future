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
import { assertHasQuota, trackActionConsumption, getUserConsumption } from '../services/consumptionTracker';
import { ProjectContext, UserProfile } from '../types';

interface AdvisoryHubProps {
  profile: UserProfile;
  projectsList: ProjectContext[];
  onUpdateProfile: (p: any) => void;
  setActiveTab: (tab: string) => void;
  setDashboardPrompt: (prompt: string) => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
  mode: 'consultation' | 'copys';
}

export default function AdvisoryHub({
  profile,
  projectsList,
  onUpdateProfile,
  setActiveTab,
  setDashboardPrompt,
  initialPrompt,
  onPromptConsumed,
  mode
}: AdvisoryHubProps) {
  const renderTextWithNavigationLinks = (inputText: string, includeLinks: boolean) => {
    if (!inputText) return "";
    if (!includeLinks) return inputText;
    
    // Ordered longest-to-shortest matches to avoid matching prefixes first
    const regex = /(FUTURA Hub|Semillero de Marca|Blueprints|Blueprint|Asesorías Estratégicas|Asesoría Estratégica|Asesorías|Asesoría|Consultores|Consultor|Generador de Copys|Copywriting|Copys|Textos Publicitarios|Texto Publicitario|Motores Creativos|Motor Creativo|Estudios Creativos|Estudio Creativo|Fábrica de Conversión|Imágenes|Galerías de Activos|Galería de Activos|Baúles de Marca|Baúl de Marca|Vaults|Vault|Membresías|Membresía|Suscripciones|Suscripción|Planes de Suscripción|Planes|Mi Perfil|Perfiles|Perfil)/gi;
    const tokens = inputText.split(regex);
    
    return tokens.map((token, tIdx) => {
      const lower = token.toLowerCase();
      let tabTarget: string | null = null;
      let displayLabel = token;
      
      if (lower.includes("hub") || lower.includes("semillero") || lower.includes("blueprint")) {
        tabTarget = 'dashboard';
        displayLabel = `📁 ${token}`;
      } else if (lower.includes("asesoría") || lower.includes("asesoria") || lower.includes("consultor")) {
        tabTarget = 'advisory';
        displayLabel = `💬 ${token}`;
      } else if (lower.includes("copys") || lower.includes("copywriting") || lower.includes("texto publicitario")) {
        tabTarget = 'copys';
        displayLabel = `✍️ ${token}`;
      } else if (lower.includes("motor") || lower.includes("estudio") || lower.includes("conversión") || lower.includes("conversion") || lower.includes("imágenes") || lower.includes("imagenes")) {
        tabTarget = 'images';
        displayLabel = `🎨 ${token}`;
      } else if (lower.includes("baúl") || lower.includes("baul") || lower.includes("vault") || lower.includes("galería") || lower.includes("galeria")) {
        tabTarget = 'brands';
        displayLabel = `💼 ${token}`;
      } else if (lower.includes("membresía") || lower.includes("membresia") || lower.includes("suscripción") || lower.includes("suscripcion") || lower.includes("planes")) {
        tabTarget = 'pro';
        displayLabel = `👑 ${token}`;
      } else if (lower.includes("perfil")) {
        tabTarget = 'profile';
        displayLabel = `👤 ${token}`;
      }
      
      if (tabTarget) {
        return (
          <button
            key={tIdx}
            type="button"
            onClick={() => {
              setActiveTab(tabTarget!);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary/20 active:scale-95 transition-all text-[10px] cursor-pointer"
          >
            {displayLabel}
          </button>
        );
      }
      
      return token;
    });
  };

  const renderFormattedChatMessage = (text: string, includeLinks = true) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          const isBold = index % 2 === 1;
          const content = renderTextWithNavigationLinks(part, includeLinks);
          
          if (isBold) {
            return (
              <strong key={index} className="font-bold text-white bg-white/5 px-1 py-0.5 rounded border border-white/5 mx-0.5">
                {content}
              </strong>
            );
          }
          return <React.Fragment key={index}>{content}</React.Fragment>;
        })}
      </span>
    );
  };

  // Mode is now controlled by the parent via props — no more internal sub-tab state
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
      if (mode === 'copys') {
        setCopyTopic(initialPrompt);
      } else {
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
        text: '¡Hola! Soy tu Consultor Estratégico FUTURA. Estoy aquí para simplificar tu marketing y ayudarte a tomar mejores decisiones comerciales bajo el método SPE (Resultados y Estética).\n\n¿De qué negocio o idea de producto te gustaría conversar hoy?'
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

    setIsChatLoading(true);

    try {
      // Validate quota before calling the Gemini AI models
      await assertHasQuota(profile.id, profile.isPremium, 'consult');

      // Add user message to history
      const updatedMessages = [...chatMessages, { role: 'user' as const, text: promptText }];
      setChatMessages(updatedMessages);

      const brandCtx = activeBrand
        ? `MARCA ACTIVA CONECTADA: ${activeBrand.name}. ADN/DESCRIPCIÓN: ${activeBrand.description}`
        : "No hay marca conectada en esta sesión.";

      const response = await chatWithAdvisor(promptText, chatMessages, brandCtx);
      const safeResponse = typeof response === 'string' ? response : (response?.response || String(response || "Respuesta recibida correctamente."));
      setChatMessages(prev => [...prev, { role: 'model', text: safeResponse }]);

      // Record consumption on database
      await trackActionConsumption(profile.id, profile.isPremium, 'consult');

      // Sync local profile state to update dashboard progress bars
      const newCons = await getUserConsumption(profile.id, profile.isPremium);
      if (onUpdateProfile) {
        onUpdateProfile({
          ...profile,
          apiConsumption: newCons
        });
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      const rawErrorMsg = typeof err === 'string' ? err : String(err?.message || err || 'Error desconocido');
      const isCritical = typeof rawErrorMsg === 'string' && rawErrorMsg.includes("CRÍTICO");
      
      setChatMessages(prev => [...prev, {
        role: 'model',
        text: isCritical 
          ? `⚠️ **Límite Alcanzado:** ${rawErrorMsg}`
          : `⚠️ **Error de conexión:** No se pudo completar la respuesta (${rawErrorMsg}). Por favor reintenta.`
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
      // Validate quota before calling the Gemini AI models
      await assertHasQuota(profile.id, profile.isPremium, 'consult');

      const result = await generateSocialCopy({
        copyType: 'advertising',
        platform: 'Instagram y Redes Sociales',
        tone: 'Persuasivo y directo',
        clientDetails: copyTopic,
        extraContext: activeBrand ? `Marca: ${activeBrand.name}. Pautas: ${activeBrand.description}` : '',
        language: 'es',
        projectName: brandName,
        projectDescription: brandDesc,
        imageUrl: copyImage || undefined
      });
      setGeneratedCopy(result);

      // Record consumption on database
      await trackActionConsumption(profile.id, profile.isPremium, 'consult');

      // Sync local profile state to update dashboard progress bars
      const newCons = await getUserConsumption(profile.id, profile.isPremium);
      if (onUpdateProfile) {
        onUpdateProfile({
          ...profile,
          apiConsumption: newCons
        });
      }
    } catch (err: any) {
      console.error("Copy generation error:", err);
      setGeneratedCopy(err.message?.includes("CRÍTICO")
        ? `⚠️ **Límite Alcanzado:** ${err.message}`
        : `⚠️ **Error al generar copy:** ${err.message || err}`);
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
      // Validate quota before calling the Gemini AI models
      await assertHasQuota(profile.id, profile.isPremium, 'consult');

      const refined = await refineSocialCopy(generatedCopy, instruction);
      setGeneratedCopy(refined);

      // Record consumption on database
      await trackActionConsumption(profile.id, profile.isPremium, 'consult');

      // Sync local profile state to update dashboard progress bars
      const newCons = await getUserConsumption(profile.id, profile.isPremium);
      if (onUpdateProfile) {
        onUpdateProfile({
          ...profile,
          apiConsumption: newCons
        });
      }
    } catch (err: any) {
      console.error("Copy refinement error:", err);
      alert(err.message?.includes("CRÍTICO") 
        ? err.message 
        : "Hubo un error al refinar el copy: " + (err.message || err));
    } finally {
      setIsRefiningCopy(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };



  return (
    <div className="flex flex-col h-full space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-surface-900/40 border border-white/5 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
            {mode === 'consultation' ? (
              <><MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" /> Asesoría Estratégica</>
            ) : (
              <><FileText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" /> Generador de Copys</>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'consultation'
              ? 'Tu consultor estratégico de IA. Pregunta lo que sea sobre tu negocio, marketing o campañas.'
              : 'Redacta anuncios persuasivos para redes sociales listos para vender.'}
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

      {/* Content Area */}
      <div className="flex-1 min-h-0">
          {mode === 'consultation' ? (
            <div
              key="chat-panel"
              className="flex flex-col h-[calc(100vh-280px)] min-h-[300px] bg-surface-900/20 border border-white/5 rounded-2xl overflow-hidden"
            >
              {/* Chat messages */}
              <div 
                ref={chatContainerRef}
                translate="no"
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin text-xs py-4 notranslate"
              >
                {/* Brand status notice inside chat */}
                <div className="flex items-center gap-2.5 p-3.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 text-xs">
                  <Info className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="leading-relaxed">
                    {activeBrand 
                      ? `Conversando usando el contexto de la marca: ${activeBrand.name}. Para cambiar de contexto selecciona otra marca arriba.`
                      : "Conversación general. Puedes conectar una marca en la esquina superior para adaptar las respuestas automáticamente."}
                  </span>
                </div>

                <div className="space-y-4 flex flex-col w-full min-h-0">
                  {chatMessages.map((msg, idx) => (
                    <div 
                      key={`msg-${idx}-${msg.role}`}
                      translate="no"
                      className={cn(
                        "p-4 rounded-2xl max-w-[85%] transition-all leading-relaxed whitespace-pre-wrap text-left text-xs font-sans notranslate",
                        msg.role === 'user'
                          ? "bg-brand-primary/10 border border-brand-primary/20 text-white ml-auto rounded-tr-none"
                          : "bg-white/5 border border-white/5 text-slate-300 mr-auto rounded-tl-none"
                      )}
                    >
                      {renderFormattedChatMessage(msg.text)}
                    </div>
                  ))}
                </div>

                <div className={cn(
                  "w-full flex justify-start transition-all duration-300 overflow-hidden",
                  isChatLoading ? "opacity-100 h-auto py-2" : "opacity-0 h-0 pointer-events-none"
                )}>
                  <div className="bg-white/5 border border-white/5 text-slate-400 mr-auto rounded-tl-none p-4 rounded-2xl max-w-[70%] flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    <span className="text-[10px] text-brand-primary uppercase tracking-[0.25em] font-black">FUTURA está analizando...</span>
                  </div>
                </div>
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
            </div>
          ) : (
            <div
              className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
              {/* Settings Panel (2 cols) */}
              <div className="lg:col-span-2 space-y-4 p-5 bg-surface-900/20 border border-white/5 rounded-2xl">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 border-b border-white/5 pb-2">
                  1. Configura tu anuncio
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
                      <span>Generar Texto Publicitario</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Panel (3 cols) */}
              <div className="lg:col-span-3 flex flex-col h-[calc(100vh-280px)] min-h-[300px] p-5 bg-surface-900/20 border border-white/5 rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
                    2. Texto Generado
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
                      {renderFormattedChatMessage(generatedCopy, false)}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-xs">Configura las opciones a la izquierda y presiona el botón para crear tu texto publicitario.</p>
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
            </div>
          )}
      </div>
    </div>
  );
}
