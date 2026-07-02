import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isScriptError = error?.message === 'Script error.' || error?.message?.includes('Script error');
    if (isScriptError) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isScriptError = error?.message === 'Script error.' || error?.message?.includes('Script error');
    if (isScriptError) return;
    console.error('Uncaught error inside Futura:', error, errorInfo);
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalRejection);
  }

  private handleGlobalError = (event: ErrorEvent) => {
    if (event.message === 'Script error.' || event.message?.includes('Script error')) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[FUTURA INTEGRATION] Incidente de canal externo (Script error) subsanado de forma segura.');
    }
  };

  private handleGlobalRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.message || String(event.reason);
    if (reason === 'Script error.' || reason?.includes('Script error')) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[FUTURA INTEGRATION] Incidente de promesa externa (Script error) subsanado de forma segura.');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-surface-950 border border-red-500/20 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-500 to-amber-500"></div>
            
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">Interrupción de Sincronización</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              FUTURA ha experimentado un fallo inesperado en su núcleo de interfaz. Esto puede deberse a un conflicto de recursos del navegador.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 text-left">
              <span className="text-[10px] font-mono font-bold text-red-400 block mb-1 uppercase tracking-wider">Detalle del Error:</span>
              <p className="font-mono text-[11px] text-slate-300 break-all select-all leading-normal">
                {this.state.error?.message || 'Script error.'}
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-2.5 bg-gradient-to-r from-brand-primary to-purple-600 hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-brand-primary/10"
            >
              <RefreshCw className="w-4 h-4" /> Recargar FUTURA
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
