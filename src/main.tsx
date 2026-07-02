import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          color: '#ef4444', 
          backgroundColor: '#09090b', 
          fontFamily: 'monospace', 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '600px', border: '1px solid #27272a', padding: '30px', borderRadius: '16px', backgroundColor: '#18181b' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Error en tiempo de ejecución</h2>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '20px' }}>
              FUTURA ha detectado una excepción no controlada en tu sesión. Comparte esta captura con soporte para solucionarlo de inmediato:
            </p>
            <div style={{ textAlign: 'left', backgroundColor: '#09090b', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #27272a' }}>
              <strong style={{ color: '#f87171' }}>{this.state.error?.toString()}</strong>
              <pre style={{ color: '#71717a', fontSize: '12px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.stack}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
