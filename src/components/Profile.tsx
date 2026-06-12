/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Shield, CreditCard, Settings, LogOut, Bell, Key } from 'lucide-react';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Profile() {
  const user = auth.currentUser;

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
             <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Email Principal</p>
                  <p className="text-sm text-white font-mono">{user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">UID Sistema</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{user?.uid}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Método de Auth</p>
                  <p className="text-sm text-white">Google OAuth 2.0</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</p>
                   <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase">Activo</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="glass-panel p-6 rounded-3xl cursor-pointer hover:border-brand-primary/20 group"
             >
                <Bell className="w-6 h-6 text-slate-500 group-hover:text-brand-primary mb-4 transition-colors" />
                <h4 className="font-bold text-white">Notificaciones</h4>
                <p className="text-xs text-slate-500 mt-1">Reportes semanales de impacto estratégico.</p>
             </motion.div>
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="glass-panel p-6 rounded-3xl cursor-pointer hover:border-brand-primary/20 group"
             >
                <Key className="w-6 h-6 text-slate-500 group-hover:text-brand-primary mb-4 transition-colors" />
                <h4 className="font-bold text-white">Seguridad</h4>
                <p className="text-xs text-slate-500 mt-1">Gestión de llaves de API externas.</p>
             </motion.div>
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="glass-panel p-6 rounded-3xl cursor-pointer hover:border-brand-primary/20 group col-span-1 sm:col-span-2"
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
