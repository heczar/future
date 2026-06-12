/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthWrapper';
import { listDriveFiles, getFileContent, DriveFile } from '../lib/driveUtils';
import { HardDrive, FileText, CheckCircle, Loader2, Link2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DrivePickerProps {
  onFilesSelected: (files: { name: string; content: string }[]) => void;
}

export default function DrivePicker({ onFilesSelected }: DrivePickerProps) {
  const { accessToken, signIn, logout } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadFiles();
    }
  }, [accessToken]);

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const driveFiles = await listDriveFiles(accessToken!);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Drive load error:', err);
      setError(err.message || 'Error al cargar archivos');
      if (err.message?.includes('401') || err.message?.includes('403')) {
        // Token invalid or scope missing - we need the user to re-sign in
      }
    } finally {
      setLoading(false);
    }
  }

  const toggleFile = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSync = async () => {
    if (selectedIds.size === 0) return;
    setExtracting(true);
    try {
      const selectedFiles = files.filter(f => selectedIds.has(f.id));
      const contents = await Promise.all(
        selectedFiles.map(async (f) => ({
          name: f.name,
          content: await getFileContent(accessToken!, f)
        }))
      );
      onFilesSelected(contents);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Drive extract error:', err);
    } finally {
      setExtracting(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
        <HardDrive className="w-12 h-12 text-slate-700 mb-4" />
        <h4 className="font-bold mb-2">Conectar Google Drive</h4>
        <p className="text-xs text-slate-500 mb-6">Autoriza el acceso para analizar tus documentos estratégicos.</p>
        <button 
          onClick={signIn}
          className="px-6 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:scale-105 transition-all"
        >
          Autorizar Acceso
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <HardDrive className="w-4 h-4 text-brand-primary" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Google Drive Context</span>
        </div>
        <button 
          onClick={loadFiles}
          className="text-[10px] font-bold text-brand-primary hover:underline uppercase"
        >
          Actualizar
        </button>
      </div>

      <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-xs text-red-400 font-medium">{error}</p>
            <button 
              onClick={() => {
                logout();
                signIn();
              }}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white uppercase hover:bg-white/10 transition-all"
            >
              Re-autorizar Acceso
            </button>
          </div>
        ) : (
          files.map(file => (
            <div 
              key={file.id}
              onClick={() => toggleFile(file.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                selectedIds.has(file.id) 
                ? 'bg-brand-primary/10 border-brand-primary/50' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                file.mimeType.includes('document') ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{file.name}</p>
              </div>
              {selectedIds.has(file.id) && <CheckCircle className="w-4 h-4 text-brand-primary" />}
            </div>
          ))
        )}
      </div>

      <button 
        disabled={selectedIds.size === 0 || extracting}
        onClick={handleSync}
        className="w-full py-3 bg-brand-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-primary/80 transition-all"
      >
        {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4" /> Vincular {selectedIds.size} Documentos</>}
      </button>
    </div>
  );
}
