/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Image as ImageIcon, Briefcase, FileText, Loader2, CheckCircle, Upload, X, Camera, Palette, Edit3, Trash2, Bot } from 'lucide-react';
import { ProjectContext, OperationType, UserProfile } from '../types';
import { handleFirestoreError } from '../lib/firebaseUtils';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../lib/imageUtils';
import { cn } from '../lib/utils';

const virtualFuturaBrand: ProjectContext = {
  id: 'futura_brand_vault',
  name: 'FUTURA (Auto-Marketing SPE)',
  description: 'Misión: Ser la consultora y suite de IA avanzada enfocada en "Resultados sobre Estética" que domina el mercado hispanohablante.\n\nVisión: Capturar clientes de alta rentabilidad listos para pagar reduciendo el ego visual tradicional de las agencias de marketing.\n\nValores: Autenticidad cruda, Conversión extrema, Sistema SPE.\n\nTono: Persuasivo brutal de alta conversión, de élite educadora y analítico pragmático.',
  logos: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop'],
  trainingMaterial: [
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop'
  ],
  methodology: 'SPE',
  brandGuidelines: {
    primaryColor: '#BF5AF2',
    secondaryColor: '#0A0A0C',
    tone: 'Persuasivo brutal de alta conversión, de élite educadora y analítico pragmático'
  }
};

interface ProjectManagerProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onNavigateToEngine?: () => void;
}

export default function ProjectManager({ profile, onUpdateProfile, onNavigateToEngine }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('selectedBrandVaultId') || null;
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'brand' | 'user'>('brand');
  
  // Form state for Brand
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logos, setLogos] = useState<string[]>([]);
  const [trainingMaterial, setTrainingMaterial] = useState<string[]>([]);
  
  // Form state for User Profile
  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profileBio, setProfileBio] = useState(profile?.bio || '');
  const [profilePhilosophy, setProfilePhilosophy] = useState(profile?.philosophy || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setProfileName(profile?.name || '');
    setProfileBio(profile?.bio || '');
    setProfilePhilosophy(profile?.philosophy || '');
  }, [profile]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selectedBrandVaultId', selectedProjectId);
    }
  }, [selectedProjectId]);

  // Prevent loading locks / short-circuit loading status
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[Brand Vault] Firestore synchronization timed out - loading fallback to prevent UI freeze');
        setLoading(false);
        if (!project || projects.length === 0) {
          const fallbackProj: ProjectContext = {
            id: 'default-local-vault-brand',
            name: 'Mi Bóveda Corporativa',
            description: 'Misión: Ser la referencia líder en nuestro nicho comercial.\nVisión: Multiplicar el alcance mediante canales inteligentes y contenidos automatizados.\nValores: Innovación, Calidad, Enfoque Centrado en Resultados.\nTono: Cercano, Directo, de Alto Impacto.',
            logos: [],
            trainingMaterial: [],
            methodology: 'SPE'
          };
          setProjects([fallbackProj]);
          setProject(fallbackProj);
          setName(fallbackProj.name);
          setDescription(fallbackProj.description);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [loading, project, projects]);

  useEffect(() => {
    let safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 600);

    if (!auth.currentUser) {
      setProjects([virtualFuturaBrand]);
      const currentId = 'futura_brand_vault';
      setSelectedProjectId(currentId);
      setProject(virtualFuturaBrand);
      setName(virtualFuturaBrand.name);
      setDescription(virtualFuturaBrand.description);
      setLogos(virtualFuturaBrand.logos || []);
      setTrainingMaterial(virtualFuturaBrand.trainingMaterial || []);
      
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    }

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(safetyTimer);
      if (snapshot.empty) {
        // Automatically create a default high-performance brand project to enable instant file uploading/saving
        const defaultProject = {
          name: 'Mi Leyenda Corporativa',
          description: 'Misión: Dominio absoluto de nuestro nicho de marketing.\nVisión: Sistema automatizado de conversión e impacto multicanal.\nValores: Autenticidad, Métricas Claras, Enfoque SPE.',
          logos: [],
          trainingMaterial: [],
          methodology: 'SPE',
          ownerId: auth.currentUser!.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        // Set loading as false immediately so it doesn't freeze under slow networks
        setLoading(false);
        addDoc(collection(db, 'projects'), defaultProject).catch(err => {
          console.error('[Brand Vault] Failed to initialize default brand workspace:', err);
        });
        return;
      }

      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectContext));
      const fullList = [virtualFuturaBrand, ...projs];
      setProjects(fullList);

      let currentId = selectedProjectId;
      if (!currentId || !fullList.some(p => p.id === currentId)) {
        currentId = fullList[0].id!;
        setSelectedProjectId(currentId);
      }

      const p = fullList.find(pr => pr.id === currentId) || fullList[0];
      setProject(p);
      setName(p.name);
      setDescription(p.description);
      setLogos(p.logos || []);
      setTrainingMaterial(p.trainingMaterial || []);
      setLoading(false);
      setErrorMsg(null);
    }, (error) => {
      console.error('[Brand Vault] Snapshot subscription error:', error);
      setErrorMsg('Error de sincronización con Firestore. Si estás fuera de Google AI Studio, asegúrate de configurar tu proyecto de Firebase autorizado.');
      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [auth.currentUser, selectedProjectId]);

  const handleAddNewBrand = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    setSaveStatus('saving');
    try {
      const defaultProject = {
        name: 'Nueva Marca ' + (projects.length + 1),
        description: 'Misión: Conectar con audiencias con alto valor.\nVisión: Ser líderes indiscutibles del nicho.\nValores: Autenticidad, Calidad, Innovación.\nTono: Cercano e Instructivo',
        logos: [],
        trainingMaterial: [],
        methodology: 'SPE',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'projects'), defaultProject);
      setSelectedProjectId(docRef.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error adding new brand:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (projId: string) => {
    try {
      setDeletingId(null);
      setLoading(true);
      await deleteDoc(doc(db, 'projects', projId));
    } catch (err) {
      console.error('Error deleting brand project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logos' | 'training') => {
    const files = e.target.files;
    if (!files) return;

    setSaveStatus('saving');
    setErrorMsg(null);
    
    const filePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          try {
            // Highly optimized dimensions and quality to fit comfortably within Firestore limits (max 1MB document storage)
            const compressed = await compressImage(base64String, target === 'logos' ? 250 : 600, 0.5);
            resolve(compressed);
          } catch (err) {
            console.error('Error compressing image:', err);
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    });

    const results = (await Promise.all(filePromises)).filter(r => r !== '');
    if (results.length === 0) {
      setSaveStatus('idle');
      return;
    }
    
    let updatedLogos = [...logos];
    let updatedTraining = [...trainingMaterial];

    if (target === 'logos') {
      updatedLogos = [...logos, ...results].slice(0, 5);
      setLogos(updatedLogos);
    } else {
      updatedTraining = [...trainingMaterial, ...results].slice(0, 10);
      setTrainingMaterial(updatedTraining);
    }

    if (project?.id === 'futura_brand_vault') {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    // Auto-save immediately to Firestore if a project is loaded
    if (auth.currentUser && project?.id) {
      try {
        const docRef = doc(db, 'projects', project.id);
        await updateDoc(docRef, {
          logos: updatedLogos,
          trainingMaterial: updatedTraining,
          updatedAt: serverTimestamp()
        });
        setSaveStatus('saved');
      } catch (err: any) {
        console.error('Autosaving uploaded files failed:', err);
        if (err?.message?.includes('too large') || err?.code === 'resource-exhausted') {
          setErrorMsg('Error: El tamaño total de las imágenes del Baúl excede el límite de Firestore. Intenta subir imágenes más pequeñas.');
        } else {
          setErrorMsg('Error al guardar imágenes en Firestore: ' + (err?.message || err));
        }
        setSaveStatus('idle');
        return;
      }
    } else {
      setSaveStatus('saved');
    }

    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const removeFile = async (index: number, target: 'logos' | 'training') => {
    let updatedLogos = [...logos];
    let updatedTraining = [...trainingMaterial];

    if (target === 'logos') {
      updatedLogos = logos.filter((_, i) => i !== index);
      setLogos(updatedLogos);
    } else {
      updatedTraining = trainingMaterial.filter((_, i) => i !== index);
      setTrainingMaterial(updatedTraining);
    }

    if (project?.id === 'futura_brand_vault') {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    // Auto-save immediately to Firestore if a project is loaded
    if (auth.currentUser && project?.id) {
      try {
        setSaveStatus('saving');
        const docRef = doc(db, 'projects', project.id);
        await updateDoc(docRef, {
          logos: updatedLogos,
          trainingMaterial: updatedTraining,
          updatedAt: serverTimestamp()
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosaving removed file failed:', err);
        setSaveStatus('idle');
      }
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (project?.id === 'futura_brand_vault') {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!auth.currentUser) {
      setIsSubmitting(false);
      return;
    }

    try {
      const projectData = {
        name,
        description,
        logos,
        trainingMaterial,
        methodology: 'SPE',
        ownerId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      } as any;

      if (project?.id) {
        await updateDoc(doc(db, 'projects', project.id), projectData);
      } else {
        projectData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'projects'), projectData);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      handleFirestoreError(error, project?.id ? OperationType.UPDATE : OperationType.CREATE, 'projects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: profileName,
      bio: profileBio,
      philosophy: profilePhilosophy
    });
  };

  if (loading && !project) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
        <div className="flex items-center gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit">
          <div className="w-32 h-10 bg-white/5 rounded-xl" />
          <div className="w-32 h-10 bg-white/5 rounded-xl" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl" />
          <div className="space-y-2">
            <div className="w-48 h-8 bg-white/5 rounded-lg" />
            <div className="w-96 h-4 bg-white/5 rounded-lg" />
          </div>
        </div>
        <div className="glass-panel p-12 rounded-[3.5rem] bg-white/5 border-white/5 h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit">
        <button 
          onClick={() => setActiveSubTab('brand')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeSubTab === 'brand' ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-500 hover:text-white"
          )}
        >
          Bóveda de Marca
        </button>
        <button 
          onClick={() => setActiveSubTab('user')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeSubTab === 'user' ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-500 hover:text-white"
          )}
        >
          Configuración Personal
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'brand' ? (
          <motion.div 
            key="brand-vault"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold">Bóveda de Marca</h2>
                  <p className="text-slate-400 text-sm">Define el ADN estratégico de tus múltiples identidades para el entrenamiento del sistema.</p>
                </div>
              </div>

              {saveStatus === 'saved' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest"
                >
                  <CheckCircle className="w-3 h-3" />
                  Sincronizado
                </motion.div>
              )}
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold tracking-wide flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="px-2 text-[10px] uppercase underline cursor-pointer">Descartar</button>
              </div>
            )}

            {/* Selector de Identidades de Marca */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black font-display text-white uppercase tracking-wider">Identidades de Marca Activas</h3>
                  <p className="text-xs text-slate-500">Maneja diferentes marcas y experimenta con distintos enfoques.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  const isDeleting = deletingId === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => !isDeleting && setSelectedProjectId(proj.id)}
                      className={cn(
                        "p-5 rounded-3xl border text-left transition-all relative group flex flex-col justify-between overflow-hidden cursor-pointer min-h-[140px]",
                        isSelected 
                          ? "bg-gradient-to-br from-brand-primary/15 via-surface-950 to-transparent border-brand-primary/45 shadow-lg shadow-brand-primary/10 scale-[1.01]" 
                          : "bg-black/35 border-white/5 hover:border-white/10 hover:bg-black/45"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-brand-primary/25 rounded-full blur-2xl pointer-events-none animate-pulse" />
                      )}

                      <div className="space-y-2 relative z-10 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {proj.logos && proj.logos.length > 0 ? (
                              <img src={proj.logos[0]} className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 shrink-0" alt="Logo" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-brand-primary uppercase shrink-0">
                                {proj.name ? proj.name[0] : 'B'}
                              </div>
                            )}
                            <h4 className="font-bold text-sm text-white truncate max-w-[150px]">{proj.name || 'Sin nombre'}</h4>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse shadow-md mt-1.5" />
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {proj.description || "Sin descripción estratégica."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">
                          {proj.logos?.length || 0} Logos • {proj.trainingMaterial?.length || 0} Mood
                        </span>

                        <div className="flex items-center gap-2">
                          {isDeleting ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteBrand(proj.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-mono uppercase font-black"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[9px] font-mono uppercase"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(proj.id)}
                              className="p-1 px-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              title="Eliminar Identidad"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div
                  onClick={handleAddNewBrand}
                  className="p-5 rounded-3xl border border-dashed border-white/10 hover:border-brand-primary/45 bg-white/[0.01] hover:bg-brand-primary/[0.02] transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer min-h-[140px] group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover:bg-brand-primary/15 border border-white/10 group-hover:border-brand-primary/30 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-all">
                    <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">Crear Nueva Marca</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Configura un nuevo enfoque o proyecto.</p>
                  </div>
                </div>
              </div>
            </div>

            <motion.div 
              className="glass-panel p-8 md:p-12 rounded-[4rem] border-brand-primary/15 bg-surface-950/20 shadow-3xl overflow-hidden relative"
            >
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="mb-6 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl text-left">
                <span className="text-[9px] font-mono font-black text-brand-primary uppercase tracking-widest block">Editando Identidad Seleccionada</span>
                <p className="text-sm font-bold text-white uppercase tracking-tight font-display mt-0.5">{name || "Nueva Marca"}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* ... rest of brand form ... */}
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-1">Identidad de Marca</label>
                      <input 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-surface-900/50 border border-white/10 rounded-2xl p-5 text-white focus:border-brand-primary/50 outline-none transition-all placeholder:text-slate-700"
                        placeholder="Nombre de la marca o institución..."
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-1">ADN Estratégico & Tono</label>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!description) {
                              setDescription("Misión: [Tu Misión]\nVisión: [Tu Visión]\nValores: [Tus Valores]\nTono: [Profesional / Cercano / Líder]");
                            }
                          }}
                          className="text-[9px] font-bold text-slate-500 hover:text-brand-primary transition-colors flex items-center gap-1"
                        >
                          <Bot className="w-3 h-3" />
                          USAR PLANTILLA
                        </button>
                      </div>
                      <textarea 
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-surface-900/50 border border-white/10 rounded-2xl p-5 text-white focus:border-brand-primary/50 outline-none min-h-[200px] transition-all placeholder:text-slate-700 resize-none text-sm leading-relaxed"
                        placeholder="Describe el propósito, voz de marca y valores clave..."
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Logos del Sistema</label>
                          <span className="text-[9px] font-bold text-slate-600 uppercase italic">Límite: 5/5</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                        {logos.length < 5 && (
                          <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all text-slate-500 hover:text-brand-primary group">
                            <Plus className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Añadir</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logos')} multiple />
                          </label>
                        )}
                        {logos.map((src, i) => (
                          <div key={i} className="aspect-square bg-white rounded-2xl border border-white/10 relative group shadow-xl transition-all hover:scale-105">
                            <img src={src} className="w-full h-full object-contain p-3" />
                            <button 
                              type="button"
                              onClick={() => removeFile(i, 'logos')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Referencia de Estilo (Moodboard)</label>
                        <span className="text-[9px] font-bold text-slate-600 uppercase italic">Límite: 10/10</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                        {trainingMaterial.length < 10 && (
                          <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all text-slate-500 hover:text-brand-primary group">
                            <Camera className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Ejemplo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'training')} multiple />
                          </label>
                        )}
                        {trainingMaterial.map((src, i) => (
                          <div key={i} className="aspect-square bg-surface-900 rounded-2xl border border-white/10 relative group overflow-hidden shadow-xl transition-all hover:scale-105">
                            <img src={src} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeFile(i, 'training')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                  <button 
                    type="submit"
                    disabled={isSubmitting || !name || !description}
                    className="w-full py-6 bg-brand-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-4 hover:scale-[1.01] shadow-2xl shadow-brand-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <Briefcase className="w-6 h-6" />
                        Actualizar Bóveda Central
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="user-profile"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Personalidad del Liderazgo</h2>
                <p className="text-slate-400 text-sm">Configura tu perfil de usuario para que el Asesor de FUTURA entienda tu voz.</p>
              </div>
            </div>

            <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-white/5 bg-surface-950/20 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Palette className="w-64 h-64" />
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-1">Tu Nombre o Alias</label>
                      <input 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-surface-900/50 border border-white/10 rounded-2xl p-5 text-white focus:border-brand-primary/50 outline-none transition-all"
                        placeholder="Ej: Heczar"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-1">Biografía Profesional</label>
                      <textarea 
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full bg-surface-900/50 border border-white/10 rounded-2xl p-5 text-white focus:border-brand-primary/50 outline-none min-h-[150px] transition-all resize-none"
                        placeholder="Define quién eres y tu experiencia..."
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-1">Filosofía de Trabajo</label>
                    <textarea 
                      value={profilePhilosophy}
                      onChange={(e) => setProfilePhilosophy(e.target.value)}
                      className="w-full bg-surface-900/50 border border-white/10 rounded-2xl p-5 text-white focus:border-brand-primary/50 outline-none min-h-[268px] transition-all resize-none"
                      placeholder="¿Qué valores rigen tu ejecución? Ej: Resultados sobre estética..."
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <button 
                    className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] shadow-xl shadow-white/5"
                  >
                    <CheckCircle className="w-6 h-6" />
                    Consolidar Perfil de Usuario
                  </button>
                  <p className="text-center text-[8px] text-slate-600 font-black uppercase tracking-[0.4em] mt-6">Estos datos alimentan la voz del Asesor Premium</p>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
