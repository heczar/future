/**
 * DevStation.tsx — FUTURA AI Development Station
 * Allows the admin (heczaroficial@gmail.com) to prompt Gemini to write code,
 * preview diffs, and commit them directly to GitHub to trigger Vercel redeployment.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  CheckCircle,
  AlertTriangle,
  GitCommit,
  GitBranch,
  Github,
  Key,
  Code,
  ArrowRight,
  Loader2,
  RefreshCw,
  FolderOpen,
  Eye,
  Lock,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// ─── Simple Diff Generator Algorithm ──────────────────────────────────────────

interface DiffLine {
  type: 'added' | 'removed' | 'normal';
  text: string;
  lineNum?: number;
}

function generateDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const diff: DiffLine[] = [];

  let i = 0, j = 0;
  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length && origLines[i].trim() === modLines[j].trim()) {
      diff.push({ type: 'normal', text: origLines[i], lineNum: i + 1 });
      i++;
      j++;
    } else {
      let lookAheadMatches = false;
      const limit = 8; // Look ahead limit

      for (let k = 1; k <= limit; k++) {
        if (i + k < origLines.length && origLines[i + k].trim() === modLines[j].trim()) {
          for (let m = 0; m < k; m++) {
            diff.push({ type: 'removed', text: origLines[i + m], lineNum: i + m + 1 });
          }
          i += k;
          lookAheadMatches = true;
          break;
        }
        if (j + k < modLines.length && origLines[i].trim() === modLines[j + k].trim()) {
          for (let m = 0; m < k; m++) {
            diff.push({ type: 'added', text: modLines[j + m] });
          }
          j += k;
          lookAheadMatches = true;
          break;
        }
      }

      if (!lookAheadMatches) {
        if (i < origLines.length) {
          diff.push({ type: 'removed', text: origLines[i], lineNum: i + 1 });
          i++;
        }
        if (j < modLines.length) {
          diff.push({ type: 'added', text: modLines[j] });
          j++;
        }
      }
    }
  }
  return diff;
}

interface DevStationProps {
  profile?: any;
  onUpdateProfile?: (p: any) => void;
}

export default function DevStation({ profile, onUpdateProfile }: DevStationProps) {
  const [githubPat, setGithubPat] = useState(() => {
    return profile?.githubPat || localStorage.getItem('futura_github_pat') || '';
  });
  
  useEffect(() => {
    if (profile?.githubPat) {
      setGithubPat(profile.githubPat);
    }
  }, [profile?.githubPat]);

  const [showTokenInput, setShowTokenInput] = useState(() => {
    return !(profile?.githubPat || localStorage.getItem('futura_github_pat'));
  });
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'previewing' | 'ready_to_commit' | 'committing' | 'done' | 'error'>('idle');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [suggestedFiles, setSuggestedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [diffData, setDiffData] = useState<{
    original: string;
    modified: string;
    sha: string;
    lines: DiffLine[];
  } | null>(null);

  const [commitMsg, setCommitMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [commitResult, setCommitResult] = useState<{ sha: string; url: string } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logMessages]);

  const addLog = (msg: string) => {
    setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('futura_github_pat', githubPat);
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        githubPat: githubPat
      });
    }
    setShowTokenInput(false);
    addLog("✓ Token de acceso de GitHub guardado de forma segura en tu perfil de administrador.");
  };

  // ── Step 1: Analyze instruction ──────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    if (!githubPat) {
      setShowTokenInput(true);
      return;
    }

    setStatus('analyzing');
    setLogMessages([]);
    setErrorMsg('');
    setDiffData(null);
    setCommitResult(null);

    addLog("Iniciando Agente de Programación FUTURA...");
    addLog("Leyendo estructura de árbol del repositorio de GitHub (heczar/future)...");

    try {
      const geminiKey = localStorage.getItem('user_gemini_api_key') || '';
      const res = await fetch('/api/admin/dev-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-pat': githubPat,
          'x-gemini-api-key': geminiKey
        },
        body: JSON.stringify({
          action: 'analyze',
          prompt: prompt
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fallo al analizar la instrucción.');
      }

      const data = await res.json();
      addLog(`Análisis completado: ${data.explanation}`);
      if (data.files && data.files.length > 0) {
        setSuggestedFiles(data.files);
        setSelectedFile(data.files[0]);
        addLog(`Archivos sugeridos para modificar: ${data.files.join(', ')}`);
        setStatus('previewing');
        // Auto trigger preview for the most relevant file
        await handleGeneratePreview(data.files[0]);
      } else {
        throw new Error("Gemini no pudo identificar ningún archivo relacionado con tu requerimiento.");
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Error durante el análisis.');
      setStatus('error');
      addLog(`⚠️ ERROR: ${err.message}`);
    }
  };

  // ── Step 2: Generate code preview ───────────────────────────────────────────

  const handleGeneratePreview = async (file: string) => {
    setStatus('previewing');
    setSelectedFile(file);
    addLog(`Descargando código actual de "${file}" desde GitHub...`);

    try {
      const geminiKey = localStorage.getItem('user_gemini_api_key') || '';
      const res = await fetch('/api/admin/dev-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-pat': githubPat,
          'x-gemini-api-key': geminiKey
        },
        body: JSON.stringify({
          action: 'preview',
          prompt: prompt,
          filePath: file
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fallo al generar vista previa.');
      }

      const data = await res.json();
      addLog("Código fuente actual descargado correctamente.");
      addLog("Llamando a Gemini para redactar modificaciones en el archivo...");

      const lines = generateDiff(data.originalContent, data.modifiedContent);
      setDiffData({
        original: data.originalContent,
        modified: data.modifiedContent,
        sha: data.sha,
        lines: lines
      });

      setCommitMsg(`refactor(admin): modificar ${file.split('/').pop()} segun requerimiento de diseño`);
      addLog("Vista previa del Diff generada correctamente. Lista para revisión.");
      setStatus('ready_to_commit');

    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar vista previa.');
      setStatus('error');
      addLog(`⚠️ ERROR: ${err.message}`);
    }
  };

  // ── Step 3: Commit and deploy ────────────────────────────────────────────────

  const handleCommit = async () => {
    if (!diffData || !selectedFile) return;

    setStatus('committing');
    addLog(`Creando commit y empujando cambios de "${selectedFile}" a GitHub...`);

    try {
      const geminiKey = localStorage.getItem('user_gemini_api_key') || '';
      const res = await fetch('/api/admin/dev-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-pat': githubPat,
          'x-gemini-api-key': geminiKey
        },
        body: JSON.stringify({
          action: 'commit',
          filePath: selectedFile,
          content: diffData.modified,
          sha: diffData.sha,
          commitMessage: commitMsg
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fallo al realizar el commit.');
      }

      const data = await res.json();
      setCommitResult({
        sha: data.sha,
        url: data.htmlUrl
      });
      addLog(`✓ Commit creado en GitHub con SHA: ${data.sha.slice(0, 7)}`);
      addLog("🚀 Vercel ha detectado el commit. Iniciando despliegue de producción automático...");
      setStatus('done');

    } catch (err: any) {
      setErrorMsg(err.message || 'Error durante el commit.');
      setStatus('error');
      addLog(`⚠️ ERROR: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Header ── */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 relative overflow-hidden bg-surface-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-primary" /> Estación de Desarrollo IA
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Modifica y compila la aplicación en vivo con instrucciones en lenguaje natural. Tu requerimiento será procesado por la IA, commiteado en GitHub y desplegado en Vercel.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowTokenInput(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-brand-primary" />
            Configurar GitHub Token
          </button>
        </div>
      </div>

      {/* ── Token Setup Modal ── */}
      <AnimatePresence>
        {showTokenInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-5 rounded-2xl border-brand-primary/20 bg-brand-primary/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                <Github className="w-4 h-4" /> Autenticación de GitHub (contents:write)
              </h3>
              <button onClick={() => setShowTokenInput(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveToken} className="space-y-3">
              <p className="text-[10px] text-slate-400">
                Se requiere un GitHub Personal Access Token (PAT) con alcance de escritura de contenidos para poder aplicar y subir código a la rama principal de forma remota.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={githubPat}
                  onChange={e => setGithubPat(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-black/30 border border-white/8 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-650 outline-none focus:border-brand-primary/40 transition-all font-mono"
                />
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/80 transition-all cursor-pointer">
                  Guardar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Station Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Command & Logs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Prompt Form */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-brand-primary" /> Instrucción de Desarrollo
            </h3>
            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ejemplo: 'Cambia el fondo del sidebar a violeta oscuro en Sidebar.tsx' o 'Añade una sección informativa sobre el plan PRO en la pantalla de membresías'..."
                rows={4}
                disabled={status === 'analyzing' || status === 'previewing' || status === 'committing'}
                className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-brand-primary/40 transition-all resize-none leading-relaxed"
              />
              <button
                onClick={handleAnalyze}
                disabled={!prompt.trim() || status === 'analyzing' || status === 'previewing' || status === 'committing'}
                className="w-full py-3 bg-brand-primary disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer"
              >
                {status === 'analyzing' || status === 'previewing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando Código e Inteligencia...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Analizar y Previsualizar Cambios
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Console / Log Terminal */}
          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden flex flex-col h-[280px]">
            <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" /> Terminal de Compilación IA
              </span>
              {logMessages.length > 0 && (
                <button onClick={() => setLogMessages([])} className="text-[8px] text-slate-500 hover:text-slate-300 font-mono">
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex-1 bg-black/30 p-4 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-1.5 custom-scrollbar">
              {logMessages.length === 0 ? (
                <div className="text-slate-600 italic">Esperando instrucciones para iniciar el agente de compilación...</div>
              ) : (
                logMessages.map((log, idx) => (
                  <div key={idx} className={cn(
                    "leading-relaxed whitespace-pre-wrap",
                    log.includes('⚠️ ERROR') ? 'text-red-400 font-semibold' :
                    log.includes('✓') || log.includes('🚀') ? 'text-emerald-400' : ''
                  )}>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

        {/* Right Column: Code Diff & Commit */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Picker & Diff Header */}
          <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-950/15">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-white">Archivo Objetivo:</span>
            </div>
            
            <div className="flex items-center gap-2">
              {suggestedFiles.length > 0 ? (
                <select
                  value={selectedFile}
                  onChange={e => handleGeneratePreview(e.target.value)}
                  disabled={status === 'analyzing' || status === 'previewing' || status === 'committing'}
                  className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-brand-primary/45 cursor-pointer max-w-[220px]"
                >
                  {suggestedFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-500 italic">Ningún archivo cargado</span>
              )}
            </div>
          </div>

          {/* Diff Viewer Area */}
          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden flex flex-col min-h-[350px] max-h-[500px]">
            <div className="px-4 py-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Code className="w-4 h-4 text-brand-primary" /> Visor de Cambios (Diff)
              </span>
              {diffData && (
                <span className="text-[9px] text-brand-primary font-mono font-semibold">
                  {diffData.lines.filter(l => l.type === 'added').length} additions / {diffData.lines.filter(l => l.type === 'removed').length} deletions
                </span>
              )}
            </div>

            <div className="flex-1 bg-surface-950/70 overflow-auto p-4 font-mono text-[11px] leading-relaxed custom-scrollbar max-h-[440px]">
              {!diffData ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-600">
                  <Eye className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="font-semibold text-xs">Sin cambios que previsualizar</p>
                  <p className="text-[10px] max-w-xs mt-1">Escribe tu requerimiento a la izquierda y el visor te mostrará los archivos a modificar.</p>
                </div>
              ) : (
                <div className="space-y-0.5 min-w-[500px]">
                  {diffData.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex py-0.5 px-2 rounded',
                        line.type === 'added' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' :
                        line.type === 'removed' ? 'bg-red-500/10 text-red-400 border-l-2 border-red-500' :
                        'text-slate-450 hover:bg-white/3'
                      )}
                    >
                      <span className="w-8 text-slate-650 inline-block select-none text-right pr-2">
                        {line.type === 'removed' ? line.lineNum : line.type === 'normal' ? line.lineNum : ''}
                      </span>
                      <span className="w-4 text-center inline-block select-none mr-2 font-black">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      <span className="whitespace-pre-wrap flex-1">{line.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commit & Redeploy controls */}
          <AnimatePresence>
            {status === 'ready_to_commit' && diffData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-panel p-5 rounded-2xl border-emerald-500/20 bg-emerald-500/5 space-y-4"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <GitCommit className="w-5 h-5 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Confirmar Despliegue de Cambios</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Mensaje de Commit</label>
                    <input
                      type="text"
                      value={commitMsg}
                      onChange={e => setCommitMsg(e.target.value)}
                      placeholder="Escribe una breve descripción de los cambios..."
                      className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleCommit}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <GitCommit className="w-4 h-4" />
                      Confirmar y Desplegar Cambios
                    </button>
                    <button
                      onClick={() => { setDiffData(null); setStatus('idle'); }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/8 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deploy status done */}
          <AnimatePresence>
            {status === 'done' && commitResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass-panel p-5 rounded-2xl border-emerald-500/30 bg-emerald-500/10 space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">¡Commit Empujado a Producción!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Los cambios de código se subieron con éxito a la rama principal. Vercel está reconstruyendo el proyecto ahora.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href={commitResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
                  >
                    <Github className="w-4 h-4" /> Ver Commit
                  </a>
                  <button
                    onClick={() => { setPrompt(''); setDiffData(null); setStatus('idle'); }}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Nueva Instrucción
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
