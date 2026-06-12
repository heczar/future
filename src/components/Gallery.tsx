/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download, ExternalLink, Trash2, Loader2, Image as ImageIcon, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

interface SavedAsset {
  id: string;
  imageUrl: string;
  brandName: string;
  format: string;
  style: string;
  strategy: string;
  createdAt: any;
}

export default function Gallery() {
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'saved_assets'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedAsset));
      setAssets(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este activo?')) return;
    try {
      await deleteDoc(doc(db, 'saved_assets', id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const filteredAssets = assets.filter(a => 
    a.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.style.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Galería de Activos</h2>
          <p className="text-slate-400 text-sm mt-1">Historial de generaciones y versiones finales de tus proyectos.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar activos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-white focus:border-brand-primary outline-none w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-2 border-brand-primary/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <Bot className="absolute inset-x-0 inset-y-0 m-auto w-6 h-6 text-brand-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-black text-white uppercase tracking-[0.4em]">Sincronizando Bóveda</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Protocolo de Recuperación Activo</p>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-primary"
              animate={{ x: [-200, 200] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 glass-panel p-6 rounded-3xl h-fit space-y-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estadísticas Rápidas</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Total Activos</p>
                <p className="text-2xl font-display font-bold text-white">{assets.length}</p>
              </div>
              <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                <p className="text-[10px] text-brand-primary uppercase mb-1">Proyectos Activos</p>
                <p className="text-2xl font-display font-bold text-white">
                  {new Set(assets.map(a => a.brandName)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {filteredAssets.map((item, i) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-brand-primary/20 group transition-all"
                  >
                    <div className="aspect-square bg-surface-900 rounded-2xl mb-4 border border-white/5 overflow-hidden relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.brandName} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                         <a 
                          href={item.imageUrl} 
                          download={`FUTURA_${item.brandName}_${item.id}.png`}
                          className="p-3 bg-brand-primary text-white rounded-xl hover:scale-110 transition-all"
                         >
                           <Download className="w-5 h-5" />
                         </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded">
                        {item.format}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase line-clamp-1">
                        {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Reciente'}
                      </span>
                    </div>

                    <h4 className="font-bold text-white mb-1">{item.brandName}</h4>
                    <p className="text-[10px] text-slate-500 mb-6 truncate">{item.style}</p>
                    
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2"
                      >
                         <Trash2 className="w-3 h-3" /> ELIMINAR
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredAssets.length === 0 && (
                <div className="col-span-2 glass-panel p-24 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-slate-700">
                      <History className="w-8 h-8" />
                   </div>
                   <h3 className="text-white font-bold mb-2">Sin Activos Disponibles</h3>
                   <p className="text-xs text-slate-500 max-w-xs">Genera y guarda diseños en el Motor Creativo para verlos reflejados aquí.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
