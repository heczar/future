/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Shield, CreditCard, Settings, LogOut, Bell, Key, Eye, EyeOff, Save, Trash, ExternalLink, Check } from 'lucide-react';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Profile() {
  const user = auth.currentUser;
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'cleared'>('idle');
  const [showKeyPanel, setShowKeyPanel] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user_gemini_api_key') || '';
    setApiKey(saved);
    if (saved) {
      setShowKeyPanel(true);
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem('user_gemini_api_key');
      setSaveStatus('cleared');
    } else {
      localStorage.setItem('user_gemini_api_key', trimmed);
      setSaveStatus('success');
    }
    
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  const handleClearKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
    setSaveStatus('cleared');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Perfil Profesional</h2>
          <p className="text-slate-400 text-sm mt-1">Configuración de cuenta y nivel de acceso FUTURA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-3xl font-bold mb-4 border-4 border-surface-900 shadow-xl overflow-hidden">
               {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : (user?.email?.[0].toUpperCase() || 'U')}
            </div>
            <h3 className="font-bold text-white text-lg truncate w-full">{user?.displayName || 'Estratega Profesional'}</h3>
            <p className="text-xs text-brand-primary font-mono font-bold mt-1 uppercase tracking-widest">Plan Pro 4.5 Activo</p>
            
            <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-4">
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" /> EDITAR PERFIL
              </button>
              <button 
                onClick={() => auth.signOut()}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> CERRAR SESIÓN
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel de Acceso</h4>
            <div className="flex items-center gap-3 p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
               <Shield className="w-5 h-5 text-brand-primary" />
               <div>
                 <p className="text-xs font-bold text-white">Identidad Corporativa</p>
                 <p className="text-[10px] text-brand-primary uppercase">Verificado</p>
               </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-3xl space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-4">Detalles de Cuenta</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Email Principal</p>
                  <p className="text-sm text-white font-mono break-all">{user?.email || 'e-correo'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">UID Sistema</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate select-all">{user?.uid}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Método de Auth</p>
                  <p className="text-sm text-white">
                    {user?.providerData?.[0]?.providerId === 'password' ? 'Email & Contraseña' : 'Google OAuth 2.0'}
                  </p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</p>
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-black rounded-lg uppercase">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                     Sincronizado
                   </span>
                </div>
             </div>

             {/* Informative individual workspace message */}
             <div className="p-5 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-6">
               <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                 <Shield className="w-5 h-5" />
               </div>
               <div className="space-y-1 text-left">
                 <h4 className="text-xs font-black text-white uppercase tracking-wider">Administración Individual de Cuentas</h4>
                 <p className="text-[11px] text-slate-400 leading-normal">
                   Tu sesión de correo actual tiene una base de datos <b>única de administración</b> en Firestore. Los proyectos de tu baúl de marcas, la galería de diseños y los calendarios programados se guardan de forma exclusiva para tu email.
                 </p>
               </div>
             </div>
          </div>

          {/* Expandable Key Settings Portal */}
          {showKeyPanel && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 rounded-3xl border border-brand-primary/20 bg-brand-primary/[0.02] space-y-6 mb-6 text-left"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Key className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Motor de IA Gemini de Respaldo</h3>
                    <p className="text-[11px] text-slate-400">Inserta tu llave de API gratuita de Google para omitir límites de cuota.</p>
                  </div>
                </div>
                
                <a 
                  href="https://aistudio.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[10px] font-bold font-mono rounded-lg transition-all flex items-center gap-1.5 uppercase border border-brand-primary/10 shrink-0"
                >
                  Obtener Llave Gratis <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-normal">
                  La API gratuita de Google Gemini (AI Studio) te otorga **15 Consultas por Minuto de forma gratuita**. Al configurar tu llave personal, las generaciones de copys, logotipos, diagnósticos y asesoramientos de FUTURA utilizarán tu cuota personal directamente, evitando los límites de cuota compartidos del servidor.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                    LLAVE DE API GEMINI PERSONAL
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-brand-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSaveKey}
                    className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary/80 text-black text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-brand-primary/15 font-sans"
                  >
                    {saveStatus === 'success' ? (
                      <>
                        <Check className="w-4 h-4" /> GUARDADO CON ÉXITO
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> GUARDAR EN NAVEGADOR
                      </>
                    )}
                  </button>

                  {localStorage.getItem('user_gemini_api_key') && (
                    <button
                      onClick={handleClearKey}
                      className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/10 font-sans"
                    >
                      <Trash className="w-4 h-4" /> ELIMINAR LLAVE
                    </button>
                  )}
                </div>

                {saveStatus === 'success' && (
                  <p className="text-[10px] text-emerald-400 font-mono text-center">
                    ✓ Sistema reconfigurado. FUTURA está operando bajo tu Llave de API Personal de forma directa.
                  </p>
                )}
                {saveStatus === 'cleared' && (
                  <p className="text-[10px] text-amber-400 font-mono text-center">
                    ✓ Llave eliminada. El sistema ha reajustado los llamados a la clave de API global del servidor o variables de Vercel.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="glass-panel p-6 rounded-3xl cursor-pointer hover:border-brand-primary/20 group text-left"
             >
                <Bell className="w-6 h-6 text-slate-500 group-hover:text-brand-primary mb-4 transition-colors" />
                <h4 className="font-bold text-white">Notificaciones</h4>
                <p className="text-xs text-slate-500 mt-1">Reportes semanales de impacto estratégico.</p>
             </motion.div>
             <motion.div 
               onClick={() => setShowKeyPanel(!showKeyPanel)}
               whileHover={{ scale: 1.02 }}
               className={`glass-panel p-6 rounded-3xl cursor-pointer hover:border-brand-primary/20 group transition-all text-left ${showKeyPanel ? 'border-brand-primary/30 bg-brand-primary/[0.02]' : ''}`}
             >
                <Key className={`w-6 h-6 mb-4 transition-colors ${showKeyPanel ? 'text-brand-primary' : 'text-slate-500 group-hover:text-brand-primary'}`} />
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  Seguridad y API
                  {localStorage.getItem('user_gemini_api_key') && (
                    <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase">Activa</span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-1">Gestión de llaves de API externas del sistema.</p>
             </motion.div>
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="glass-panel p-6 rounded-3xl cursor-pointer hover:border-brand-primary/20 group col-span-1 sm:col-span-2 text-left"
             >
                <CreditCard className="w-6 h-6 text-slate-500 group-hover:text-brand-primary mb-4 transition-colors" />
                <h4 className="font-bold text-white">Suscripción y Pagos</h4>
                <p className="text-xs text-slate-500 mt-1">Administra tu membresía Business Pro y métodos de pago.</p>
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
