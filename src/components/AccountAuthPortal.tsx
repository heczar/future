import React, { useState } from 'react';
import { useAuth } from './AuthWrapper';
import { Mail, Lock, ShieldCheck, Play, ArrowRight, Sparkles, Loader2, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInAnonymously } from '../lib/firebase';

export default function AccountAuthPortal() {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor ingresa un correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres por seguridad.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        await signUpWithEmail(email, password);
        setSuccessMsg('¡Cuenta creada con éxito! Iniciando sesión...');
      } else {
        await signInWithEmail(email, password);
        setSuccessMsg('¡Sesión iniciada con éxito! Conectando...');
      }
    } catch (err: any) {
      console.error('Account Auth Error:', err);
      // Give extremely precise and descriptive error assistance
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'El inicio de sesión por correo no está disponible en este momento. Intenta con Google o como invitado.'
        );
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Intenta iniciar sesión con él.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Credenciales inválidas. Verifica tu correo o contraseña.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('El formato del correo electrónico no es válido.');
      } else {
        setErrorMsg(err.message || 'Ocurrió un error inesperado al gestionar tu sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-primary via-indigo-500 to-emerald-400 rounded-3xl blur-xl opacity-20 animate-pulse"></div>

      <div className="relative bg-surface-950/90 backdrop-blur-3xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-3xl text-left space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-2 shadow-inner">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-2xl font-display font-black text-white tracking-tight uppercase">
            {isRegister ? 'Crear Cuenta Individual' : 'Acceso Individual'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Inicia sesión con tu correo para acceder de forma exclusiva a tus proyectos, marcas y configuraciones.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 items-start text-red-400 text-xs leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium text-[11px]">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-2.5 items-start text-emerald-400 text-xs leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-bold text-[11px]">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                PROCESANDO INGRESO...
              </>
            ) : isRegister ? (
              <>
                CREAR CUENTA NUEVA <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                INICIAR MI CUENTA <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="px-3 text-[8px] font-mono font-black text-slate-600 uppercase tracking-widest">O conéctate con</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              setLoading(true);
              setErrorMsg(null);
              setSuccessMsg(null);
              try {
                await signIn();
                setSuccessMsg('¡Sesión iniciada con éxito con Google!');
              } catch (err: any) {
                if (err && (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user'))) {
                  console.warn("Google Sign-In caught cancellation warning:", err);
                  setErrorMsg('La conexión con Google fue interrumpida. Intenta de nuevo o abre la aplicación en una pestaña nueva del navegador.');
                } else if (err.code === 'auth/popup-blocked') {
                  console.warn("Google Sign-In caught blocked popup warning:", err);
                  setErrorMsg('Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e intenta de nuevo.');
                } else {
                  console.error("Google Sign-In caught error:", err);
                  setErrorMsg(err.message || 'Error al iniciar sesión con tu cuenta de Google.');
                }
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-100 text-black rounded-xl font-mono text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.71 14.95 1 12 1 7.35 1 3.37 3.65 1.41 7.52l3.79 2.94C6.1 7.5 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.55z"
              />
              <path
                fill="#FBBC05"
                d="M5.2 14.56c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.41 7c-.91 1.81-1.41 3.84-1.41 6s.5 4.19 1.41 6l3.79-2.44z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.13 0-5.9-2.46-6.8-5.42L1.41 15.34C3.37 19.21 7.35 23 12 23z"
              />
            </svg>
            Ingresar con Google Account
          </button>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setErrorMsg(null);
              setSuccessMsg(null);
              try {
                await signInAnonymously(auth);
                setSuccessMsg('¡Ingreso como Invitado exitoso! Iniciando entorno...');
              } catch (err: any) {
                console.error("Anonymous Sign-In caught error:", err);
                setErrorMsg('El acceso de invitado no está disponible en este momento. Regístrate con tu correo o usa Google.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-3 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 hover:text-white hover:bg-indigo-900/60 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 animate-pulse" />
            Acceder como Invitado (Demo Rápida)
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[10px] font-mono font-black text-brand-primary uppercase tracking-widest hover:underline cursor-pointer"
            >
              {isRegister ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </div>

        {/* Feature info */}
        <div className="pt-2 border-t border-white/5 flex gap-2 text-[10px] text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 text-brand-primary mt-0.5 animate-pulse" />
          <p>
            Al ingresar individualmente, todas tus consultas de IA, imágenes generadas, marcas en el baúl y calendarios permanecerán seguras en tu cuenta privada.
          </p>
        </div>

      </div>
    </div>
  );
}
