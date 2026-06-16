/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Trash2, 
  Bot, 
  Calendar, 
  MessageSquare, 
  Briefcase, 
  Tag, 
  FileText, 
  CheckCircle, 
  Clock, 
  Copy, 
  Filter, 
  LayoutGrid, 
  Check, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

interface SavedAsset {
  id: string;
  imageUrl: string;
  brandName: string;
  format: string;
  style: string;
  strategy: string;
  createdAt: any;
}

interface Publication {
  id: string;
  title: string;
  copy: string;
  scheduledTime: string;
  channels: string[];
  imageUrl: string | null;
  status: 'pending' | 'published';
  createdAt?: string;
}

interface BrandVault {
  id: string;
  name: string;
  description: string;
  logos?: string[];
  methodology?: string;
}

export default function Gallery() {
  const [activeTab, setActiveTab] = useState<'visuals' | 'publications' | 'brands'>('visuals');
  
  // Database States
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [brands, setBrands] = useState<BrandVault[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Quick filters
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('todos');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('todos');

  // Real-Time Firebase Sinc
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;

    // 1. Saved Assets Query
    const assetsQuery = query(
      collection(db, 'saved_assets'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubAssets = onSnapshot(assetsQuery, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedAsset));
      setAssets(data);
      setLoading(false);
    }, (err) => {
      console.error("Error Loading Saved Assets:", err);
      // Fallback loaders avoid freezing
      setLoading(false);
    });

    // 2. Publications Query
    const pubsQuery = query(
      collection(db, 'publications'),
      where('ownerId', '==', uid)
    );

    const unsubPubs = onSnapshot(pubsQuery, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Publication));
      // Sort client-side so it handles string or timestamp gracefully
      data.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
      setPublications(data);
    }, (err) => {
      console.warn("Could not bind publications in gallery:", err);
    });

    // 3. Brand Vault Query
    const brandsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', uid)
    );

    const unsubBrands = onSnapshot(brandsQuery, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as BrandVault));
      setBrands(data);
    }, (err) => {
      console.warn("Could not bind brands in gallery:", err);
    });

    return () => {
      unsubAssets();
      unsubPubs();
      unsubBrands();
    };
  }, []);

  // Quick Action Handlers
  const handleDeleteAsset = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente este diseño de la galería?')) return;
    try {
      await deleteDoc(doc(db, 'saved_assets', id));
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al intentar eliminar el diseño.');
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!confirm('¿Deseas remover esta publicación agendada de la base de datos?')) return;
    try {
      await deleteDoc(doc(db, 'publications', id));
    } catch (err) {
      console.error(err);
      alert('Error al remover de la agenda.');
    }
  };

  const handleTogglePubStatus = async (id: string, currentStatus: 'pending' | 'published') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'published' : 'pending';
      await updateDoc(doc(db, 'publications', id), { status: newStatus });
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado de la publicación.');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter lists based on Search & Selections
  const getFilteredAssets = () => {
    return assets.filter(a => {
      const matchesSearch = 
        a.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.style.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStyle = 
        selectedStyleFilter === 'todos' || 
        a.style.toLowerCase().includes(selectedStyleFilter.toLowerCase());

      return matchesSearch && matchesStyle;
    });
  };

  const getFilteredPublications = () => {
    return publications.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.copy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.channels.join(' ').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesChannel =
        selectedChannelFilter === 'todos' ||
        p.channels.some(c => c.toLowerCase().includes(selectedChannelFilter.toLowerCase()));

      return matchesSearch && matchesChannel;
    });
  };

  const getFilteredBrands = () => {
    return brands.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.methodology || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Styles dynamically grouped for filters
  const uniqueStyles = Array.from(new Set(assets.map(a => a.style))).filter(Boolean);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left">
          <span className="text-[10px] font-black tracking-[0.3em] text-brand-primary uppercase font-mono block mb-1">
            BIBLIOTECA GENERAL FUTURA
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">Galería de Activos</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Todo tu material corporativo unificado en un solo almacén: imágenes renderizadas, textos estrategizados y pautas de marca listas para descargar y usar.
          </p>
        </div>

        {/* INPUT DE BÚSQUEDA INTEGRADO */}
        <div className="relative shrink-0 max-w-md w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar en tu inventario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-2xl py-3 pl-11 pr-5 text-xs text-white placeholder-slate-500 focus:border-brand-primary outline-none w-full transition-all"
          />
        </div>
      </div>

      {/* TABS DE FILTRO GENERAL (DISEÑOS, COPYS, MARCAS) */}
      <div className="flex flex-wrap items-center justify-start gap-2 border-b border-white/5 pb-4">
        <button
          onClick={() => { setActiveTab('visuals'); setSearchTerm(''); }}
          className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'visuals' 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' 
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Diseños y Renders ({assets.length})
        </button>

        <button
          onClick={() => { setActiveTab('publications'); setSearchTerm(''); }}
          className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'publications' 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' 
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Agenda y Copys ({publications.length})
        </button>

        <button
          onClick={() => { setActiveTab('brands'); setSearchTerm(''); }}
          className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'brands' 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' 
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Bóveda De Marcas ({brands.length})
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN TAB RESPONSIVO */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-2 border-brand-primary/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <Bot className="absolute inset-x-0 inset-y-0 m-auto w-6 h-6 text-brand-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-black text-white uppercase tracking-[0.4em]">Sincronizando Biblioteca</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Descubriendo activos del usuario...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* BARRA LATERAL FILTRADORA Y ESTADÍSTICAS */}
          <div className="lg:col-span-1 space-y-6">
            {/* PANEL DE MANDO LATERAL / ESTADÍSTICAS */}
            <div className="glass-panel p-6 rounded-3xl space-y-6 text-left border border-white/5 bg-surface-950/40">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Consola de Control</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Diseños</p>
                  <p className="text-xl font-display font-black text-white">{assets.length}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Agendas</p>
                  <p className="text-xl font-display font-black text-white">{publications.length}</p>
                </div>
              </div>

              {/* FILTROS ADICIONALES POR SECCIÓN */}
              {activeTab === 'visuals' && (
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">Filtrar por Estilo</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelectedStyleFilter('todos')}
                      className={`text-left px-3 py-2 rounded-xl text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                        selectedStyleFilter === 'todos' 
                          ? 'bg-brand-primary/10 text-brand-primary font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>Todos los Renders</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    {uniqueStyles.map(st => (
                      <button
                        key={st}
                        onClick={() => setSelectedStyleFilter(st)}
                        className={`text-left px-3 py-2 rounded-xl text-[11px] transition-all flex items-center justify-between cursor-pointer capitalize ${
                          selectedStyleFilter === st 
                            ? 'bg-brand-primary/10 text-brand-primary font-bold' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{st}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'publications' && (
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">Filtrar por Canal</span>
                  <div className="flex flex-col gap-1.5">
                    {['todos', 'Instagram', 'WhatsApp Business', 'YouTube Shorts'].map(chan => (
                      <button
                        key={chan}
                        onClick={() => setSelectedChannelFilter(chan)}
                        className={`text-left px-3 py-2 rounded-xl text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                          selectedChannelFilter === chan 
                            ? 'bg-brand-primary/10 text-brand-primary font-bold' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="capitalize">{chan === 'todos' ? 'Todos los canales' : chan}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-white/5 pt-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-mono font-black text-emerald-400">Total Sincronizado</p>
                    <p className="text-[9.5px] text-slate-300 leading-normal">
                      Tu base de datos está activa y respaldada en la nube con tecnología integrada de alta disponibilidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CUADRÍCULA DE ACTIVOS (3 COLS RESTANTES) */}
          <div className="lg:col-span-3">
            {/* TABS DE DISEÑOS / RENDERS */}
            {activeTab === 'visuals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {getFilteredAssets().map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-brand-primary/25 bg-surface-950/20 group transition-all text-left flex flex-col justify-between"
                    >
                      <div>
                        {/* Frame de la Imagen */}
                        <div className="aspect-square bg-slate-900 rounded-2xl mb-4 border border-white/5 overflow-hidden relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.brandName || "Asset"} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <a 
                              href={item.imageUrl} 
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl hover:scale-110 transition-all flex items-center gap-1 text-[11px] font-bold"
                            >
                              <ExternalLink className="w-4 h-4" /> Ampliar
                            </a>
                            <a 
                              href={item.imageUrl} 
                              download={`FUTURA_${item.brandName || 'Asset'}_${item.id}.jpg`}
                              target="_blank"
                              onClick={(e) => {
                                // Fallback download handler
                                const link = document.createElement('a');
                                link.href = item.imageUrl;
                                link.download = `FUTURA_${item.id}.jpg`;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="p-3 bg-brand-primary text-white rounded-xl hover:scale-110 transition-all flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Download className="w-4 h-4" /> Guardar
                            </a>
                          </div>
                        </div>

                        {/* Badges de Categoría */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[8.5px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded font-mono">
                            {item.format}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Guardado'}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm line-clamp-1">{item.brandName}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Estilo: <span className="capitalize font-mono text-white/80">{item.style}</span></p>
                        
                        {item.strategy && (
                          <div className="mt-2.5 p-2 rounded-lg bg-white/5 border border-white/5 text-[9.5px] text-slate-400 leading-normal line-clamp-2">
                            🔍 {item.strategy}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-5">
                        <button 
                          onClick={() => handleDeleteAsset(item.id)}
                          className="w-full py-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/10 rounded-xl text-[9px] font-mono tracking-wider font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ELIMINAR MINATURA
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {getFilteredAssets().length === 0 && (
                  <div className="col-span-2 glass-panel p-20 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center bg-transparent">
                     <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-5 text-slate-600">
                        <ImageIcon className="w-7 h-7" />
                     </div>
                     <h3 className="text-white font-bold text-base mb-1">Sin Diseños Registrados</h3>
                     <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                       No se encontraron renders de imágenes bajo tu búsqueda. Ve a la Consola Creativa para renderizar banners de alta reputación.
                     </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB DE PUBLICACIONES Y AGENDA */}
            {activeTab === 'publications' && (
              <div className="space-y-4">
                <AnimatePresence>
                  {getFilteredPublications().map((pub, i) => (
                    <motion.div
                      key={pub.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-panel p-5 rounded-3xl border border-white/5 bg-surface-950/20 text-left flex flex-col md:flex-row gap-5 hover:border-indigo-500/20 transition-all justify-between items-start md:items-center"
                    >
                      <div className="flex flex-col md:flex-row gap-5 items-start flex-1">
                        {/* Mini Image thumbnail if has one */}
                        {pub.imageUrl ? (
                          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-white/10 relative group">
                            <img src={pub.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-dashed border-white/10 text-slate-600">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">{pub.title}</h4>
                            
                            {/* Status badge */}
                            <button
                              onClick={() => handleTogglePubStatus(pub.id, pub.status)}
                              className={`text-[8.5px] font-black px-2 py-0.5 rounded font-mono uppercase border transition-all cursor-pointer ${
                                pub.status === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                              title="Haz clic para alternar el estado"
                            >
                              ● {pub.status === 'published' ? 'Publicado' : 'Pendiente / Encola'}
                            </button>
                          </div>

                          {/* Channels */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {pub.channels.map(ch => (
                              <span key={ch} className="text-[8px] font-black uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded px-2">
                                {ch}
                              </span>
                            ))}
                          </div>

                          {/* Copy snippet */}
                          <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2 max-w-2xl bg-black/20 p-2 rounded-lg border border-white/5">
                            {pub.copy}
                          </p>
                          
                          {/* Scheduled Date */}
                          <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            <span>Programado: {new Date(pub.scheduledTime).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Side Action buttons to deal with copies straightforwardly */}
                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t border-white/5 md:border-t-0">
                        <button
                          onClick={() => handleCopyText(pub.copy, pub.id)}
                          className={`flex-1 md:flex-none py-2 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            copiedId === pub.id 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-white/5 text-slate-300 hover:text-white border border-white/10 hover:bg-white/15'
                          }`}
                        >
                          {copiedId === pub.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedId === pub.id ? 'COPIADO' : 'COPIAR COPY'}
                        </button>

                        <button
                          onClick={() => handleDeletePublication(pub.id)}
                          className="flex-1 md:flex-none py-2 px-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/10 rounded-lg text-[10px] font-mono tracking-wider font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> BORRAR
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {getFilteredPublications().length === 0 && (
                  <div className="glass-panel p-20 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center bg-transparent">
                     <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-5 text-slate-600">
                        <Calendar className="w-7 h-7" />
                     </div>
                     <h3 className="text-white font-bold text-base mb-1">Sin Publicaciones Agendadas</h3>
                     <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                       No se encontraron copys ni agendas en este canal. Ve a la sección Programador o genera copys de conversión en el Motor Creativo.
                     </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB DE BÓVEDA DE MARCAS */}
            {activeTab === 'brands' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {getFilteredBrands().map((brand) => (
                    <div
                      key={brand.id}
                      className="glass-panel p-6 rounded-3xl border border-white/5 bg-surface-950/20 text-left space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono font-black text-brand-primary px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 uppercase">
                            {brand.methodology || 'ESTÁNDAR SPE'}
                          </span>
                          <h4 className="text-base font-bold text-white uppercase tracking-wide">{brand.name}</h4>
                        </div>
                        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                          <Briefcase className="w-4 h-4" />
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl line-clamp-4">
                        {brand.description}
                      </p>

                      {/* Display Logos inside Brand Vault if available */}
                      {brand.logos && brand.logos.length > 0 && (
                        <div className="space-y-1.5 border-t border-white/5 pt-3">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Logotipos / Identificadores</span>
                          <div className="flex flex-wrap gap-2">
                            {brand.logos.map((logoUrl, lIdx) => (
                              <div key={lIdx} className="w-10 h-10 bg-slate-900 rounded-lg p-1 border border-white/10 flex items-center justify-center overflow-hidden">
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </AnimatePresence>

                {getFilteredBrands().length === 0 && (
                  <div className="col-span-2 glass-panel p-20 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center bg-transparent">
                     <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-5 text-slate-600">
                        <Briefcase className="w-7 h-7" />
                     </div>
                     <h3 className="text-white font-bold text-base mb-1">Bóveda Vacía</h3>
                     <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                       No hay marcas registradas. Ve a la pestaña del Gestor del Baúl para subir tus marcas, logos y materiales corporativos.
                     </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
