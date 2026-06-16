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
  Cpu
} from 'lucide-react';
import { chatWithOpenWASimulator } from '../services/geminiService';

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
                CONEXIÓN DE WHATSAPP
              </span>
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase">
              FUTURA <span className="text-brand-primary font-bold">WHATSAPP IA</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Configura tu recepcionista inteligente. Atiende a tus clientes las 24 horas del día, responde dudas frecuentes de forma fluida y agenda tus asesorías automáticamente por mensaje de texto.
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

      {/* Main layout splitting QR vs Simulator */}
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
                  <h4 className="text-white font-bold uppercase tracking-wide text-[11px]">¿Cómo inicio la sincronización?</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    1. Entra a tu aplicación de <strong>WhatsApp de siempre</strong> en tu celular telefónico.<br />
                    2. En el menú, selecciona de inmediato la opción de <strong>Dispositivos Vinculados</strong>.<br />
                    3. Presiona el botón de <strong>Vincular Dispositivo</strong>.<br />
                    4. Simplemente apunta la cámara hacia el código QR de FUTURA dispuesto a tu izquierda.
                  </p>
                </div>
                
                <div className="p-3.5 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 text-[10.5px] leading-relaxed text-slate-300">
                  ⚡ <strong>Súper beneficio:</strong> El asistente operará de forma invisible e inmediata las <strong>24 horas, los 365 días del año</strong> en la nube de fondo, sin necesidad de que dejes tu celular encendido, con pantalla activa o conectado a Internet.
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

    </div>
  );
}
