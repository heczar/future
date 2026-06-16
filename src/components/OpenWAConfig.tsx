import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Check, 
  Power, 
  QrCode, 
  CheckCircle2, 
  Smartphone, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  Cpu,
  Code,
  Copy,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { chatWithOpenWASimulator } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface OpenWAConfigProps {
  profile: any;
  onUpdateProfile: (newProfile: any) => void;
}

export default function OpenWAConfig({ profile, onUpdateProfile }: OpenWAConfigProps) {
  // Config state
  const config = profile?.openwaConfig || {
    isEnabled: true,
    sessionName: "FuturaBot",
    aiPromptRules: "Eres la asistente amable de WhatsApp de FUTURA. Responde siempre de forma corta, servicial y amigable. Ofrece ayuda con los servicios de marketing y guía al cliente a dejar su correo para agendar una consultoría."
  };

  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [botName, setBotName] = useState(config.sessionName || "FUTURA Asistente");
  const [aiPromptRules, setAiPromptRules] = useState(config.aiPromptRules);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const [activeTab, setActiveTab] = useState<'simulator' | 'realCode'>('simulator');
  const [isCopied, setIsCopied] = useState(false);

  // Connection Simulator States
  const [connectionStatus, setConnectionStatus] = useState<'scan' | 'linking' | 'connected'>('connected');

  // Sandbox simulated chat screen
  const [simulatedMessages, setSimulatedMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; timestamp: string }>>([
    { 
      sender: 'bot', 
      text: `👋 ¡Hola! Soy ${botName}, tu asistente inteligente autónomo para WhatsApp. Escríbeme cualquier pregunta para ver cómo respondo de inmediato de forma automatizada.`, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [clientMessageInput, setClientMessageInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [simulatedMessages, isBotTyping]);

  // Handle Save
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveToast('');
    const updatedProfile = {
      ...profile,
      openwaConfig: {
        ...config,
        sessionName: botName,
        isEnabled,
        aiPromptRules
      }
    };

    try {
      await onUpdateProfile(updatedProfile);
      setSaveToast('🎉 ¡Ajustes guardados e integrados correctamente!');
      setTimeout(() => setSaveToast(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveToast('❌ Error al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Chat Simulation
  const handleSendSimulatedMessage = async () => {
    if (!clientMessageInput.trim()) return;
    const userMsgText = clientMessageInput.trim();
    setClientMessageInput('');

    // Add user message
    setSimulatedMessages(prev => [...prev, {
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsBotTyping(true);

    setTimeout(async () => {
      let botResponse = '';
      
      if (connectionStatus !== 'connected') {
        botResponse = "⚠️ El teléfono de WhatsApp se encuentra desconectado. Por favor, escanea el código QR de arriba para reanudar la conexión.";
      } else if (!isEnabled) {
        botResponse = "🔴 El Asistente de FUTURA se encuentra apagado para mantenimiento de respuestas.";
      } else {
        // Run Gemini
        const historyForGemini = simulatedMessages
          .filter(m => !m.text.startsWith('👋'))
          .slice(-3)
          .map(m => ({
            role: m.sender === 'user' ? 'user' as const : 'model' as const,
            text: m.text
          }));

        try {
          botResponse = await chatWithOpenWASimulator(userMsgText, aiPromptRules, historyForGemini);
        } catch (err) {
          botResponse = "Hola. He recibido tu mensaje, pero mi módulo de inteligencia se encuentra ocupado. ¡Pronto te responderé!";
        }
      }

      setSimulatedMessages(prev => [...prev, {
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setIsBotTyping(false);
    }, 1000);
  };

  // Simulate scanning code QR
  const handleSimulateScan = () => {
    setConnectionStatus('linking');
    setTimeout(() => {
      setConnectionStatus('connected');
      setSimulatedMessages(prev => [...prev, {
        sender: 'bot',
        text: `🟢 ¡Dispositivo Vinculado con éxito! Se ha activado la sesión "${botName}". Estoy listo para recibir mensajes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnectionStatus('scan');
  };

  // Generate the customized actual Node.js script dynamically
  const generatedRealCode = `/**
 * Código de Automatización de WhatsApp con IA (FUTURA)
 * Sigue los 3 simples pasos debajo del panel para correrlo gratis en tu PC.
 */
const { create } = require('@open-wa/wa-automate');
const { GoogleGenAI } = require('@google/genai');

// 1. Inicializa la Inteligencia Artificial de Google (Gemini)
// Nota: Consigue tu API Key gratuita en https://aistudio.google.com/
const ai = new GoogleGenAI({ apiKey: "TU_API_KEY_DE_GEMINI_AQUI" });

// Reglas personalizadas desde tu panel de FUTURA
const INSTRUCCIONES_IA = \`${aiPromptRules}\`;

console.log("🚀 Iniciando servicio de WhatsApp para: ${botName}...");

create({
  sessionId: "${botName.replace(/\s+/g, '_')}",
  useChrome: true,  // Auto-detecta Google Chrome en tu Windows de forma nativa
  multiDevice: true,
  authTimeout: 0,   // Sin límites de tiempo
  qrTimeout: 0,     // El código QR no caduca de prisa
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,   // Ejecuta en segundo plano (silencioso) para que no choque con tus pestañas de Chrome abiertas
}).then(client => start(client));

function start(client) {
  client.onMessage(async message => {
    // Evitar responder a grupos o a mensajes propios
    if (message.isGroupMsg || message.fromMe) return;

    console.log(\`📩 Mensaje recibido de \${message.sender.pushname || 'Cliente'}: "\${message.body}"\`);

    try {
      // 2. Indicar que el asistente está escribiendo en el chat real
      await client.simulateTyping(message.from, true);

      // 3. Consultar la Inteligencia Artificial con el contexto comercial personalizado
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: \`Instrucciones de comportamiento a seguir estrictamente:\\n\${INSTRUCCIONES_IA}\\n\\nMensaje del cliente:\\n\${message.body}\` }] }
        ]
      });

      const respuestaTexto = response.text || "Disculpa, ¿me podrías repetir la pregunta?";

      // 4. Enviar la respuesta directamente a su WhatsApp final
      await client.sendText(message.from, respuestaTexto);
      
    } catch (error) {
      console.error("❌ Error al procesar:", error.message);
    } finally {
      await client.simulateTyping(message.from, false);
    }
  });
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedRealCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-8 pb-24 text-left">
      {/* Visual Header */}
      <div className="relative overflow-hidden glass-panel p-8 sm:p-10 rounded-[3rem] border-brand-primary/20 bg-gradient-to-r from-surface-950 via-surface-950 to-brand-primary/5">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <MessageSquare className="w-56 h-56 text-brand-primary" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[8px] font-mono font-black text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full uppercase tracking-widest">
                AUTOMATIZACIÓN SIN ESFUERZO
              </span>
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase">
              FUTURA <span className="text-brand-primary font-bold">WHATSAPP IA</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              El asistente virtual de WhatsApp definitivo. Responde dudas de clientes, agenda citas de consultoría y atiende tu negocio de forma 100% humanizada las 24 horas del día.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEnabled(!isEnabled)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-mono text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
                isEnabled 
                  ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' 
                  : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'
              }`}
            >
              <Power className="w-4 h-4 animate-pulse" />
              {isEnabled ? 'Servicio Activo' : 'Servicio Apagado'}
            </button>
          </div>
        </div>
      </div>

      {saveToast && (
        <div id="toast-notif" className="fixed bottom-6 right-6 z-[200] max-w-md glass-panel p-4 rounded-2xl border-brand-primary/30 shadow-2xl flex items-center gap-3 bg-surface-950 text-xs font-bold text-white uppercase tracking-wider animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-brand-primary" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Navigation Tabs - Extremely easy selection for non-tech users */}
      <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 max-w-md">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-brand-primary text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          1. Configurar y Probar
        </button>
        <button
          onClick={() => setActiveTab('realCode')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'realCode'
              ? 'bg-brand-primary text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code className="w-4 h-4" />
          2. Mi Código Real
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'simulator' ? (
          /* TAB 1: EMULATOR AND CONFIGURATION PANEL */
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Left Side: QR scan & Personalization (3 Columns) */}
            <div className="xl:col-span-3 space-y-8">
              
              {/* Box 1: QR Linking Area */}
              <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-surface-950 via-surface-950 to-brand-primary/5 space-y-6">
                <div className="flex items-center gap-3 w-full border-b border-white/5 pb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-brand-primary">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-white">Vincular mi Línea</h3>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">Escanea el código QR de seguridad para que FUTURA IA responda tus mensajes reales.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                  
                  {/* Simulated QR Graphic Card */}
                  <div className="relative p-5 bg-white rounded-3xl border border-white/10 flex flex-col items-center justify-center shrink-0 shadow-lg group">
                    {connectionStatus === 'connected' ? (
                      <div className="w-44 h-44 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center p-3 relative">
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <Smartphone className="w-12 h-12 text-slate-800 animate-bounce" />
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest pt-2 block">Línea Lista</span>
                        <span className="text-[8px] text-slate-500 font-mono italic">Establecido +58412</span>
                      </div>
                    ) : connectionStatus === 'linking' ? (
                      <div className="w-44 h-44 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-brand-primary rounded-full animate-spin" />
                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider pt-3">Vinculando Canal...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Simulated Abstract Grid representing QR */}
                        <div className="w-44 h-44 bg-slate-50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                          <div className="grid grid-cols-5 gap-1.5 opacity-90">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-6 w-full rounded ${
                                  (i % 3 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24)
                                    ? 'bg-black' 
                                    : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="px-2.5 py-1 text-[8px] font-mono font-black tracking-widest text-white bg-slate-900/90 rounded-md">
                              FUTURA SCAN QR
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* QR scanning status overlay button for presentation */}
                    <div className="mt-4 w-full">
                      {connectionStatus === 'connected' ? (
                        <button 
                          onClick={handleDisconnect}
                          className="w-full text-center text-[9px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider cursor-pointer py-1"
                        >
                          Desconectar Teléfono
                        </button>
                      ) : connectionStatus === 'linking' ? (
                        <span className="w-full text-center text-[9px] text-slate-400 uppercase font-mono tracking-widest block py-1">
                          Conectando...
                        </span>
                      ) : (
                        <button 
                          onClick={handleSimulateScan}
                          className="w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all cursor-pointer shadow"
                        >
                          Simular Escaneo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Steps Area */}
                  <div className="space-y-4 text-xs font-sans text-left">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">¿Cómo inicio la sincronización de prueba?</h4>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        1. Haz clic abajo del recuadro blanco donde dice "<strong>Simular Escaneo</strong>".<br />
                        2. El simulador vinculará tu sesión de prueba al instante.<br />
                        3. Pruébalo en la sección derecha escribiendo como si fueras uno de tus clientes.
                      </p>
                    </div>
                
                    <div className="p-3.5 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 text-[10.5px] leading-relaxed text-slate-300">
                      💡 <strong>Dato importante:</strong> Para vincular tu WhatsApp físico de verdad sin códigos ficticios ni emuladores, ve a la pestaña de <strong>"2. Mi Código Real"</strong> arriba, donde preparamos tu script personalizado para correr en solo 3 clics en tu computadora de forma gratuita.
                    </div>
                  </div>

                </div>

              </div>

              {/* Box 2: Configuration & Personality Details */}
              <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-surface-950 via-surface-950 to-brand-primary/5 space-y-6">
                <div className="flex items-center gap-3.5 border-b border-white/5 pb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-brand-primary">
                    <Cpu className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-white">⚙️ Personalidad del Asistente</h3>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">Controla la voz y las directrices principales de tu recepcionista inteligente.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">Nombre del Asistente:</label>
                    <input 
                      type="text" 
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Ej: Natalia Ventas" 
                      className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-primary transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                        ¿Qué quieres que responda? (Escribe en lenguaje normal):
                      </label>
                    </div>
                
                    <textarea 
                      value={aiPromptRules}
                      onChange={(e) => setAiPromptRules(e.target.value)}
                      rows={4}
                      placeholder="Ej: Sé muy amigable, ofrece nuestros servicios de marketing y trata de captar su correo corporativo para agendar..."
                      className="w-full bg-black/45 border border-white/10 rounded-2xl p-4 text-xs font-sans text-slate-300 leading-relaxed outline-none focus:border-brand-primary transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-5">
                  <span className="text-[10px] text-slate-500 font-sans">Guarda los ajustes para calibrar las respuestas de la IA.</span>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-brand-primary/10"
                  >
                    {isSaving ? 'Guardando Ajustes...' : 'Aplicar mi Personalidad'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Side: Simple Interactive Chat Mockup (2 Columns) */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* WhatsApp Simulator Frame conforming strictly to FUTURA clean theme */}
              <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col bg-[#0b141a] shadow-inner relative min-h-[500px]">
                
                {/* Header Simulator */}
                <div className="bg-[#111b21] px-5 py-4 border-b border-white/5 flex items-center justify-between text-left shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black uppercase">
                        {botName.slice(0, 2)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#111b21] ${
                        connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide">{botName}</h4>
                      <p className="text-[9px] text-slate-400 font-mono tracking-wider">
                        {connectionStatus === 'connected' 
                          ? '🟢 ASISTENTE INTELIGENTE ACTIVO' 
                          : connectionStatus === 'linking' 
                          ? '🟡 SINCRONIZANDO CON CELULAR' 
                          : '🔴 TELÉFONO DESCONECTADO'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-[8px] font-mono text-slate-500 uppercase">
                      SIMULADOR DE RESPUESTAS
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 bg-[#0b141a]/95 min-h-[300px] max-h-[380px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5 flex flex-col pt-6 font-sans text-xs"
                >
                  <div className="mx-auto my-2 px-3 py-1 bg-[#182229] border border-white/5 text-[9px] text-slate-400 rounded-lg text-center font-sans max-w-[85%] select-none">
                    🔒 Chatea aquí para probar cómo reaccionará tu robot virtual inteligente ante los clientes de verdad.
                  </div>

                  {simulatedMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className={`p-3.5 rounded-2xl text-[11px] leading-relaxed text-left relative ${
                        msg.sender === 'user' 
                          ? 'bg-[#005c4b] text-white rounded-tr-none' 
                          : 'bg-[#202c33] text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                        
                        <div className="flex items-center justify-end gap-1 text-[8px] text-slate-400 mt-1 font-mono">
                          <span>{msg.timestamp}</span>
                          {msg.sender === 'user' && (
                            <span className="text-sky-400 font-bold">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isBotTyping && (
                    <div className="mr-auto items-start max-w-[85%] flex flex-col">
                      <div className="p-3 bg-[#202c33] text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-2 text-[10px]">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                        <span>Bot analizando respuesta...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Input */}
                <div className="bg-[#1f2c34] p-3 border-t border-white/5 flex items-center justify-between gap-2.5 text-left shrink-0">
                  <input 
                    type="text" 
                    value={clientMessageInput}
                    onChange={(e) => setClientMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendSimulatedMessage();
                    }}
                    disabled={isBotTyping}
                    placeholder="Escribe como si fueras un cliente tuyo..." 
                    className="flex-1 bg-[#2a3942] border-none rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 outline-none"
                  />
                  <button 
                    onClick={handleSendSimulatedMessage}
                    disabled={isBotTyping || !clientMessageInput.trim()}
                    className="p-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simple benefit guide card */}
              <div className="glass-panel p-6 rounded-[2.5rem] bg-[#050505] border-white/5 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-primary" />
                  Ventajas Comerciales Clave
                </h4>
                <div className="space-y-2.5 text-[10.5px] leading-relaxed text-slate-400 text-sans text-left">
                  <p>🟢 <strong>Respuestas al instante:</strong> Tu público no espera. Responde en menos de 2 segundos generando confianza comercial inmediata.</p>
                  <p>🟢 <strong>Ahorro del 90% de tiempo:</strong> El robot virtual se encarga de recibir, calificar interesados y solicitar sus correos para las citas de venta.</p>
                  <p>🟢 <strong>Sin descuidos:</strong> Sigue operando aunque estés descansando, de vacaciones o comiendo.</p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* TAB 2: EXPLAINER FOR REAL DEPLOYMENT + GENERATED DYNAMIC SCRIPT */
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Guide Steps (3 Columns) */}
            <div className="xl:col-span-3 space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-surface-950 via-surface-950 to-brand-primary/5 space-y-6">
                
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">¿Por qué no se vincula directamente aquí?</h3>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">Una aclaración amigable y transparente para no programadores.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed text-left">
                  <p>
                    Para que tu WhatsApp funcione con Inteligencia Artificial, se necesita levantar un navegador de Chrome interno (un proceso virtual o "Bot") que esté constantemente conectado y leyendo los mensajes en tiempo real. 
                  </p>
                  <p>
                    Las páginas de internet de prueba (como esta ventana del chat donde estás actualmente) se <strong>apagan o suspenden de inmediato</strong> si cierras la pestaña en tu computadora o pasas unos minutos sin hacer clic. Si pusiéramos el código QR de verdad aquí y te fueras a dormir, el asistente dejaría de contestar instantáneamente.
                  </p>
                  <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-[11px] text-brand-primary font-bold">
                    💡 ¡Pero la buena noticia es que ejecutarlo en tu computadora o local es gratis, 100% seguro, toma 2 minutos y no requiere saber programar! 
                  </div>
                </div>
              </div>

              {/* Interactive 3-Step Guide */}
              <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-surface-950 via-surface-950 to-brand-primary/5 space-y-6">
                
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="p-2.5 rounded-xl bg-white/5 text-brand-primary">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Guía de 3 pasos para encenderlo</h3>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">Sigue estos pasos simples y tendrás al robot contestando llamadas reales hoy mismo.</p>
                  </div>
                </div>

                <div className="space-y-6 text-xs text-left">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary font-black flex items-center justify-center">1</span>
                    <div className="space-y-1">
                      <h4 className="text-white font-bold uppercase text-[10.5px] tracking-wider">Paso 1: Descarga Node.js</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Node es la herramienta gratuita que permite correr programas en tu PC. Descárgalo y presiona "Siguiente &gt; Siguiente" instalándolo desde su página oficial: <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold underline">nodejs.org</a>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary font-black flex items-center justify-center">2</span>
                    <div className="space-y-1">
                      <h4 className="text-white font-bold uppercase text-[10.5px] tracking-wider">Paso 2: Prepara el programa</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Crea una carpeta en tu escritorio, abre el block de notas, pega el código listo de la derecha, y guárdalo como un archivo llamado <code className="bg-white/5 p-1 rounded font-mono text-white text-[10px]">asistente.js</code>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary font-black flex items-center justify-center">3</span>
                    <div className="space-y-1">
                      <h4 className="text-white font-bold uppercase text-[10.5px] tracking-wider">Paso 3: Instala y enciende</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Abre la consola de tu computadora (buscando <code className="bg-white/5 p-1 rounded font-mono text-white text-[10px]">cmd</code> o Terminal en Windows/Mac) dentro de tu carpeta y ejecuta estos dos simples comandos para instalar las librerías necesarias y arrancar el programa:
                      </p>
                      <pre className="mt-2 p-3 bg-black/60 rounded-xl font-mono text-[10px] text-emerald-400 leading-relaxed overflow-x-auto border border-white/5">
                        npm install @open-wa/wa-automate @google/genai<br />
                        node asistente.js
                      </pre>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        ¡Al hacer eso, la pantalla te arrojará un <strong>Código QR Real</strong>! Lo escaneas con tu celular en tu WhatsApp de siempre, y listo. El asistente inteligente estará completamente en línea respondiendo de inmediato.
                      </p>

                      {/* Error Troubleshooting Box */}
                      <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] leading-relaxed text-slate-300 space-y-4">
                        <div>
                          <p className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                            ⚠️ SOLUCIÓN AL ERROR: "Target closed", "Connection closed" o "TimeoutError"
                          </p>
                          <p className="mb-2">
                            Esto ocurre porque al usar el modo visual (<code className="bg-white/5 font-mono text-white text-[9.5px]">headless: false</code>), como ya tienes Google Chrome abierto para tu uso cotidiano en la PC, Windows bloquea tu perfil personal de Chrome y Puppeteer se cae inmediatamente. La solución definitiva y súper estable es:
                          </p>
                          <ul className="list-disc pl-4 space-y-1.5 text-slate-350 text-[10px]">
                            <li>
                              <strong>Hemos activado el Modo Silencioso en Segundo Plano ({`headless: true`}):</strong> Así, el bot carga Chrome de manera discreta e interna en su propia carpeta limpia, evitando cualquier conflicto con tus pestañas abiertas.
                            </li>
                            <li>
                              <strong>Escaneo en Consola Directo:</strong> Al arrancar <code className="bg-white/5 px-1 py-0.5 rounded text-white font-mono">node asistente.js</code>, el código QR se dibujará hecho con caracteres directamente en tu terminal/consola negra. ¡Solo tienes que apuntarle con tu celular, escanearlo, y listo para responder ventas!
                            </li>
                            <li>
                              <strong>Desactivamos Tiempos límite ({`authTimeout: 0, qrTimeout: 0`}):</strong> El código QR en tu pantalla ya no vencerá rápido.
                            </li>
                          </ul>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl space-y-2.5">
                          <p className="font-bold text-amber-300 text-[9.5px] uppercase">
                            🔧 PASOS PARA LIMPIAR ARCHIVOS BLOQUEADOS POR EL ERROR PASADO:
                          </p>
                          <p className="text-[10px]">
                            Para eliminar el bloqueo residual que causó el error anterior, ejecuta este comando en tu terminal de Windows dentro de tu carpeta <code className="text-amber-300 font-mono">bot-futura</code>:
                          </p>
                          <pre className="p-2.5 bg-black/50 rounded-lg text-emerald-400 font-mono overflow-x-auto text-[9.5px]">
                            rmdir /s /q _IGNORE_FUTURA_Asistente
                          </pre>
                          <p className="text-[10px] text-slate-400">
                            (Esto vacía la sesión corrupta anterior para que inicie 100% limpia).
                          </p>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl space-y-2.5">
                          <p className="font-bold text-amber-300 text-[9.5px] uppercase">
                            ❌ ¿AÚN ASÍ DA OTRO ERROR DE NAVEGADOR ("Browser was not found")?
                          </p>
                          <p className="text-[10px]">
                            Si tu motor Puppeteer se dañó, limpia el caché de descargas corruptas y bájalo de nuevo en 5 segundos ejecutando estos dos comandos en orden:
                          </p>
                          <pre className="p-2.5 bg-black/50 rounded-lg text-amber-300 font-mono overflow-x-auto text-[9.5px] space-y-1">
                            rmdir /s /q "%USERPROFILE%\.cache\puppeteer"<br />
                            npx puppeteer browsers install chrome
                          </pre>
                        </div>

                        <p className="text-[10px] text-emerald-400 font-medium">
                          💡 <strong>¡ÚLTIMO PASO!</strong> Copia nuevamente el código actualizado de la derecha, pégalo en tu <code className="bg-white/5 px-1 rounded font-mono text-white">asistente.js</code>, ejecuta tu comando de limpieza para borrar la sesión anterior, escribe <code className="bg-white/5 px-1 rounded font-mono text-white">node asistente.js</code>, ¡y verás dibujarse el código QR de texto gigante directo en tu terminal listo para que lo escanees al instante! 🎉
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Dynamic Generated Code (2 Columns) */}
            <div className="xl:col-span-2 space-y-4">
              <div className="glass-panel p-6 rounded-[2.5rem] bg-surface-950 border-white/5 flex flex-col h-full space-y-4 relative">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4.5 h-4.5 text-brand-primary" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">Tu Archivo Listo para Copiar</span>
                  </div>
                  
                  <button 
                    onClick={handleCopyCode}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCopied 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Script
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 min-h-[380px] bg-black/60 rounded-2xl p-4 overflow-y-auto border border-white/5 font-mono text-[11px] text-slate-300 relative text-left whitespace-preScroll shadow-inner">
                  <span className="absolute top-2 right-2 text-[8px] text-slate-600 uppercase font-mono tracking-widest select-none">JavaScript Autocreado</span>
                  <pre className="whitespace-pre overflow-x-auto selection:bg-brand-primary/30">
                    {generatedRealCode}
                  </pre>
                </div>

                <p className="text-[10px] text-slate-500 font-sans leading-relaxed text-left">
                  💡 Este código ya incluye de forma automatizada e interna el nombre de tu asistente (<strong>{botName}</strong>) y las directrices de personalidad que guardaste en el panel.
                </p>

              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
