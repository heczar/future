/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAccount } from './AccountProvider';
import { ShieldCheck, ArrowRight, Building, CheckCircle2, Sparkles, Loader2, AlertCircle, FileText, Landmark, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ConnectOnboarding() {
  const { accountId, stripeOnboardingComplete, setAccountId, setOnboardingComplete } = useAccount();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(accountId ? 2 : 1);
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('VE');
  const [website, setWebsite] = useState('');

  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate Stripe Account Creation calling mock server API or direct persistence
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const mockAcctId = `acct_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await setAccountId(mockAcctId);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // Simulate verifying onboarding criteria at stripe's redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await setOnboardingComplete(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    await setAccountId(null);
    await setOnboardingComplete(false);
    setStep(1);
  };

  if (stripeOnboardingComplete) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex gap-3.5 items-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <CheckCircle2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-display">Stripe Connect Conectado</h4>
            <p className="text-xs text-slate-400">
              ID de Cuenta Activo: <span className="font-mono text-emerald-400 font-bold select-all">{accountId}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all border border-white/5"
        >
          Desconectar Cuenta
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-950 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
      <div className="absolute top-0 right-0 w-36 h-36 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="border-b border-white/5 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-[8px] font-mono font-black uppercase rounded-md tracking-wider">
            Socio Comercial Directo
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-400 font-mono">Paso {step} de 2</span>
        </div>
        <h3 className="text-md sm:text-lg font-display font-black text-white uppercase tracking-wider">
          {step === 1 ? 'Pasarela de Cobro: Configurar Stripe Connect' : 'Pendiente: Completar el Registro Comercial'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {step === 1 
            ? 'Para lanzar tu tienda virtual y crear productos, conecta tu cuenta bancaria a través de la pasarela Stripe.'
            : 'Filtro de verificación de Stripe. Simula el llenado del perfil corporativo de tu marca o empresa para desbloquear cobros.'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleStartOnboarding}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5Col">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre Comercial de la Marca</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Futura Labs Inc."
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5Col">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">País de Facturación</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary transition-all font-sans"
                >
                  <option value="VE">Venezuela 🇻🇪</option>
                  <option value="US">Estados Unidos 🇺🇸</option>
                  <option value="ES">España 🇪🇸</option>
                  <option value="MX">México 🇲🇽</option>
                  <option value="CO">Colombia 🇨🇴</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5Col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sitio Web o Portafolio Digital</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://mitienda.futura.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary transition-all font-sans"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando Cuenta de Stripe Merchant...
                  </>
                ) : (
                  <>
                    Crear Cuenta de Stripe Connect <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-4">
              <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                CUENTA GENERADA: {accountId}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Para comenzar a recibir transferencias reales de clientes mundiales por tus productos de marca, Stripe requiere rellenar tus datos fiscales y validar tu identidad.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center gap-2.5">
                  <Landmark className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">Detalles Banco</span>
                </div>
                <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">Identificación</span>
                </div>
                <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">PCI Compliant</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    SIMULANDO VERIFICACIÓN COMPLETA...
                  </>
                ) : (
                  <>
                    COMPRETAR ONBOARDING EXCLUSIVO <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="py-3.5 px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Reiniciar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
