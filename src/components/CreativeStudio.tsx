/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  Save, 
  Edit3, 
  Square, 
  Type, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  Check, 
  X, 
  Briefcase,
  Layers,
  ChevronRight,
  Maximize2,
  Info
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { fabric } from 'fabric';
import { cn } from '../lib/utils';
import { generateCreativeImage } from '../services/geminiService';
import { ProjectContext, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CreativeStudioProps {
  profile: UserProfile;
  projectsList: ProjectContext[];
  onUpdateProfile: (p: any) => void;
  setActiveTab: (tab: string) => void;
}

export default function CreativeStudio({
  profile,
  projectsList,
  onUpdateProfile,
  setActiveTab
}: CreativeStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<'logos' | 'images'>('logos');
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() => {
    return localStorage.getItem('activeConsultBrandId') || '';
  });

  // Database Sync Settings
  const activeBrand = projectsList.find(p => p.id === selectedBrandId);

  // Output State
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State - Logos
  const [logoDescription, setLogoDescription] = useState('');
  const [selectedLogoStyle, setSelectedLogoStyle] = useState('Simétrico y Geométrico de Lujo');

  // Form State - Images
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('1:1');
  const [selectedImageStyle, setSelectedImageStyle] = useState('Fotorrealista Premium');

  // ==========================================
  // CANVAS EDITOR STATES
  // ==========================================
  const [isEditingInCanvas, setIsEditingInCanvas] = useState(false);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'pencil'>('select');
  const [brushColor, setBrushColor] = useState('#FFD700');
  const [brushSize, setBrushSize] = useState(6);
  const [fontSize, setFontSize] = useState(32);
  const [opacity, setOpacity] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Formats list for images
  const formats = [
    { id: '1:1', label: 'Cuadrado (1:1)', desc: 'Posts de Feed' },
    { id: '9:16', label: 'Vertical (9:16)', desc: 'Stories y Reels' },
    { id: '16:9', label: 'Horizontal (16:9)', desc: 'Banners y Vallas' }
  ];

  const logoStyles = [
    'Simétrico y Geométrico de Lujo',
    'Monograma / Siglas Elegantes',
    'Orgánico y Natural (Botánico)',
    'Tecnológico / SaaS Moderno',
    'Heráldico / Emblema Corporativo',
    'Modern Bold Streetwear (Urbano)',
    'Vintage / Industrial Rústico'
  ];

  const imageStyles = [
    'Fotorrealista Premium',
    'Ilustración 3D Moderna',
    'Arte Abstracto de Lujo',
    'Brutalismo Obsidian y Neón',
    'Estilo Vectorial Limpio'
  ];

  // ==========================================
  // IA GENERATION FUNCTIONS
  // ==========================================
  const handleGenerateLogo = async () => {
    if (!logoDescription.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedResult(null);

    const brandName = activeBrand ? activeBrand.name : 'Mi Negocio';
    const colors = activeBrand?.brandGuidelines 
      ? [
          { hex: activeBrand.brandGuidelines.primaryColor, name: 'Primario' },
          { hex: activeBrand.brandGuidelines.secondaryColor, name: 'Secundario' }
        ]
      : undefined;

    const fullPrompt = `Crea un diseño de logotipo profesional para la marca llamada "${brandName}". Concepto y nicho: ${logoDescription}. Estilo: ${selectedLogoStyle}. Simple, limpio, fondo oscuro.`;

    try {
      const result = await generateCreativeImage(fullPrompt, '1:1', undefined, {
        brandName,
        logoStyle: selectedLogoStyle,
        niche: logoDescription,
        colors
      });
      setGeneratedResult(result);
    } catch (err: any) {
      console.error(err);
      alert('Error al generar el logo. Favor de intentar nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedResult(null);

    const brandContext = activeBrand 
      ? `Mantén coherencia con la identidad de ${activeBrand.name}. Guías de marca: ${activeBrand.description}.`
      : '';

    const fullPrompt = `${imagePrompt}. Estilo visual: ${selectedImageStyle}. ${brandContext} Alta resolución, sin textos escritos.`;

    try {
      const result = await generateCreativeImage(fullPrompt, selectedFormat);
      setGeneratedResult(result);
    } catch (err: any) {
      console.error(err);
      alert('Error al generar la imagen. Favor de intentar nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================
  // SAVE & EXPORT FUNCTIONS
  // ==========================================
  const handleSaveToGallery = async () => {
    if (!generatedResult || !auth.currentUser || isSaving) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, 'saved_assets'), {
        ownerId: auth.currentUser.uid,
        imageUrl: generatedResult,
        strategy: activeSubTab === 'logos' 
          ? `Logotipo generado para: ${logoDescription}. Estilo: ${selectedLogoStyle}.`
          : `Imagen ilustrativa generada para: ${imagePrompt}. Formato: ${selectedFormat}.`,
        format: activeSubTab === 'logos' ? 'Logotipo' : selectedFormat,
        style: activeSubTab === 'logos' ? selectedLogoStyle : selectedImageStyle,
        brandName: activeBrand?.name || 'Marca General',
        createdAt: serverTimestamp()
      });
      alert('¡Diseño guardado exitosamente en tu Galería!');
    } catch (err: any) {
      console.error("Save Error:", err);
      alert('Error al guardar en la Galería.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // CANVAS EDITOR LIFECYCLE
  // ==========================================
  useEffect(() => {
    let internalCanvas: fabric.Canvas | null = null;

    if (isEditingInCanvas && canvasRef.current && generatedResult) {
      const timer = setTimeout(() => {
        if (!canvasRef.current || !canvasContainerRef.current) return;

        // Calculate size based on container
        const containerWidth = canvasContainerRef.current.clientWidth || 500;
        const containerHeight = canvasContainerRef.current.clientHeight || 500;

        internalCanvas = new fabric.Canvas(canvasRef.current, {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: '#070707'
        });

        // Load the background image
        fabric.Image.fromURL(generatedResult, (img) => {
          if (!internalCanvas) return;
          
          const canvasWidth = internalCanvas.getWidth();
          const canvasHeight = internalCanvas.getHeight();
          const scale = Math.min(canvasWidth / (img.width || 1), canvasHeight / (img.height || 1));

          img.set({
            selectable: false,
            evented: false,
            scaleX: scale,
            scaleY: scale,
            left: (canvasWidth - (img.width || 0) * scale) / 2,
            top: (canvasHeight - (img.height || 0) * scale) / 2
          });

          internalCanvas.add(img);
          internalCanvas.sendToBack(img);

          // Add active brand logo as a layer if available
          if (activeBrand?.logos && activeBrand.logos.length > 0) {
            activeBrand.logos.forEach((logoUrl, i) => {
              const isBase64 = logoUrl.startsWith('data:');
              fabric.Image.fromURL(logoUrl, (logoImg) => {
                if (!internalCanvas) return;
                logoImg.scaleToWidth(100);
                logoImg.set({
                  left: 30 + (i * 120),
                  top: 30,
                  cornerColor: '#f43f5e',
                  cornerSize: 10,
                  transparentCorners: false,
                  padding: 4
                });
                internalCanvas.add(logoImg);
                internalCanvas.bringToFront(logoImg);
                internalCanvas.renderAll();
              }, isBase64 ? undefined : { crossOrigin: 'anonymous' });
            });
          }

          internalCanvas.renderAll();
        }, { crossOrigin: 'anonymous' });

        setCanvas(internalCanvas);

        // Object selection listeners
        internalCanvas.on('selection:created', (e) => setSelectedObject(e.target || null));
        internalCanvas.on('selection:updated', (e) => setSelectedObject(e.target || null));
        internalCanvas.on('selection:cleared', () => setSelectedObject(null));

      }, 100);

      return () => {
        clearTimeout(timer);
        if (internalCanvas) {
          try {
            internalCanvas.dispose();
          } catch (e) {
            console.warn(e);
          }
          setCanvas(null);
        }
      };
    }
  }, [isEditingInCanvas, generatedResult]);

  // Adjust tool mode
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, brushColor, brushSize, canvas]);

  // Sync brush properties to selected object
  useEffect(() => {
    if (!canvas || !selectedObject) return;

    selectedObject.set('opacity', opacity);

    if (selectedObject.type === 'i-text' || selectedObject.type === 'rect') {
      selectedObject.set('fill', brushColor);
      if (selectedObject.type === 'i-text') {
        const textObj = selectedObject as fabric.IText;
        textObj.set('fontSize', fontSize);
      }
    }
    canvas.renderAll();
  }, [canvas, selectedObject, brushColor, fontSize, opacity]);

  // Canvas Actions
  const addRect = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 120,
      top: 120,
      fill: brushColor,
      width: 150,
      height: 150,
      cornerColor: '#f43f5e',
      cornerSize: 10,
      transparentCorners: false,
      padding: 4
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveTool('select');
  };

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('DOBLE CLICK\nPARA EDITAR', {
      left: 120,
      top: 150,
      fontFamily: 'system-ui',
      fontSize: fontSize,
      fill: brushColor,
      fontWeight: 'bold',
      cornerColor: '#f43f5e',
      cornerSize: 8,
      transparentCorners: false,
      textAlign: 'center'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('select');
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    canvas.discardActiveObject();
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    setSelectedObject(null);
  };

  const duplicateSelected = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.clone((cloned: fabric.Object) => {
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const bringToFront = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringToFront(selectedObject);
    canvas.renderAll();
  };

  const sendToBack = () => {
    if (!canvas || !selectedObject) return;
    // Don't send below index 1 (which is the base image)
    const objects = canvas.getObjects();
    if (objects.indexOf(selectedObject) > 1) {
      canvas.sendBackwards(selectedObject);
    }
    canvas.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      fabric.Image.fromURL(dataUrl, (img) => {
        img.scaleToWidth(140);
        img.set({
          left: 100,
          top: 100,
          cornerColor: '#f43f5e',
          cornerSize: 10,
          transparentCorners: false,
          padding: 6
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCanvas = () => {
    if (!canvas) return;
    // Export base64 image representation
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1.0
    });
    setGeneratedResult(dataUrl);
    setIsEditingInCanvas(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-surface-900/40 border border-white/5 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            Estudio Creativo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Genera logos, visuales para tus campañas e introduce personalizaciones de diseño sin complicaciones.
          </p>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-brand-primary/40 cursor-pointer"
          >
            <option value="">-- Sin Marca Conectada (General) --</option>
            {projectsList.map((project) => (
              <option key={project.id} value={project.id}>
                📁 {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEditingInCanvas ? (
        /* CANVAS EDITOR WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-340px)] min-h-[300px]">
          {/* Canvas workspace (3 cols) */}
          <div className="lg:col-span-3 flex flex-col bg-surface-950 border border-white/5 rounded-2xl overflow-hidden relative">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-primary" />
                Editor de Lienzo (Capas)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingInCanvas(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[10px] uppercase font-mono flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  onClick={handleApplyCanvas}
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-[10px] uppercase font-mono flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Aplicar Diseño
                </button>
              </div>
            </div>

            {/* Container for the canvas */}
            <div 
              ref={canvasContainerRef}
              className="flex-1 flex items-center justify-center p-6 bg-[#060606] overflow-hidden"
            >
              <canvas ref={canvasRef} className="shadow-2xl border border-white/5" />
            </div>
          </div>

          {/* Sidebar Tools Panel (1 col) */}
          <div className="space-y-4 p-5 bg-surface-900/20 border border-white/5 rounded-2xl overflow-y-auto">
            <h3 className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 border-b border-white/5 pb-2 mb-3">
              Herramientas de Diseño
            </h3>

            {/* Mode Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-500">Herramienta Activa</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTool('select')}
                  className={cn(
                    "px-3 py-2 text-xs font-mono font-bold rounded-xl border text-center transition-all cursor-pointer",
                    activeTool === 'select'
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                  )}
                >
                  Seleccionar
                </button>
                <button
                  onClick={() => setActiveTool('pencil')}
                  className={cn(
                    "px-3 py-2 text-xs font-mono font-bold rounded-xl border text-center transition-all cursor-pointer",
                    activeTool === 'pencil'
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                  )}
                >
                  Pincel / Dibujo
                </button>
              </div>
            </div>

            {/* Vector Shapes & Text */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-[10px] font-mono text-slate-500">Agregar Elementos</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={addRect}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                >
                  <Square className="w-3.5 h-3.5" /> Rectángulo
                </button>
                <button
                  onClick={addText}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                >
                  <Type className="w-3.5 h-3.5" /> Texto
                </button>
              </div>
            </div>

            {/* Color selector */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-[10px] font-mono text-slate-500">Color de Relleno</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-full h-9 rounded-lg bg-black border border-white/10 px-1 py-1 cursor-pointer"
              />
            </div>

            {/* Object adjustments */}
            {selectedObject ? (
              <div className="space-y-3 pt-3 border-t border-brand-primary/20 bg-brand-primary/5 p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono font-bold text-brand-primary uppercase">Capa Seleccionada</span>
                
                {/* Size / Font adjust if text */}
                {selectedObject.type === 'i-text' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-400">Tamaño del Texto ({fontSize}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-brand-primary"
                    />
                  </div>
                )}

                {/* Opacity */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400">Opacidad ({Math.round(opacity * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                {/* Ordering */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={bringToFront}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-mono flex items-center justify-center gap-1 text-slate-300 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" /> Traer
                  </button>
                  <button
                    onClick={sendToBack}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-mono flex items-center justify-center gap-1 text-slate-300 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" /> Fondo
                  </button>
                </div>

                {/* Duplicate / Delete */}
                <div className="flex gap-1.5">
                  <button
                    onClick={duplicateSelected}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-mono flex items-center justify-center gap-1 text-slate-300 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicar
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-[9px] font-mono flex items-center justify-center gap-1 text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ) : activeTool === 'pencil' ? (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[10px] font-mono text-slate-500">Grosor de Dibujo ({brushSize}px)</label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full accent-brand-primary"
                />
              </div>
            ) : null}

            {/* Upload image to canvas */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-[10px] font-mono text-slate-500">Insertar Imagen Local</label>
              <label className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* CORE GENERATORS PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Settings panel (2 cols) */}
          <div className="lg:col-span-2 space-y-4 p-5 bg-surface-900/20 border border-white/5 rounded-2xl">
            {/* Sub-tab Selection */}
            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
              <button
                onClick={() => {
                  setActiveSubTab('logos');
                  setGeneratedResult(null);
                }}
                className={cn(
                  "flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer",
                  activeSubTab === 'logos'
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                1. Crear Logos
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('images');
                  setGeneratedResult(null);
                }}
                className={cn(
                  "flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer",
                  activeSubTab === 'images'
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                2. Crear Imágenes
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeSubTab === 'logos' ? (
                /* LOGO BUILDER FORM */
                <motion.div
                  key="form-logos"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 pt-2"
                >
                  {/* Brand Description */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400">¿De qué es tu marca o negocio?</label>
                    <textarea
                      rows={4}
                      placeholder="Ejemplo: Una cafetería gourmet de especialidad llamada 'Café Místico' enfocada en personas que buscan un ritual de café artesanal oscuro y premium..."
                      value={logoDescription}
                      onChange={(e) => setLogoDescription(e.target.value)}
                      className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors resize-none"
                    />
                  </div>

                  {/* Logo Style Select */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400">Estilo del Logotipo</label>
                    <select
                      value={selectedLogoStyle}
                      onChange={(e) => setSelectedLogoStyle(e.target.value)}
                      className="w-full bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary/40 cursor-pointer"
                    >
                      {logoStyles.map((style) => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateLogo}
                    disabled={!logoDescription.trim() || isGenerating}
                    className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Esbozando tu logotipo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Logotipo Vectorial</span>
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                /* IMAGE BUILDER FORM */
                <motion.div
                  key="form-images"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 pt-2"
                >
                  {/* Prompt Text */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400">¿Qué quieres ilustrar en la imagen?</label>
                    <textarea
                      rows={4}
                      placeholder="Ejemplo: Una taza de café gourmet en una mesa de obsidiana oscura con granos de café esparcidos alrededor, iluminación dorada premium..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors resize-none"
                    />
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400">Relación de Aspecto / Formato</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {formats.map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setSelectedFormat(fmt.id)}
                          className={cn(
                            "px-2.5 py-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                            selectedFormat === fmt.id
                              ? "bg-brand-primary/10 border-brand-primary text-white"
                              : "bg-black/20 border-white/5 text-slate-500 hover:text-slate-300"
                          )}
                        >
                          <span className="text-[11px] font-bold font-mono">{fmt.label.split(' ')[0]}</span>
                          <span className="text-[8px] text-slate-500">{fmt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Style */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400">Estilo Visual</label>
                    <select
                      value={selectedImageStyle}
                      onChange={(e) => setSelectedImageStyle(e.target.value)}
                      className="w-full bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary/40 cursor-pointer"
                    >
                      {imageStyles.map((style) => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={!imagePrompt.trim() || isGenerating}
                    className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Renderizando escena IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Escena de Campaña</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result view panel (3 cols) */}
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-340px)] min-h-[300px] p-5 bg-surface-900/20 border border-white/5 rounded-2xl relative overflow-hidden">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 border-b border-white/5 pb-2 mb-4 shrink-0">
              Visual Producido
            </h3>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
                <div>
                  <p className="text-xs text-white font-mono font-bold uppercase tracking-wider">Generando Activo Creativo...</p>
                  <p className="text-[10px] text-slate-500 mt-1">El motor híbrido de Gemini está procesando los vectores de tu diseño.</p>
                </div>
              </div>
            ) : generatedResult ? (
              <div className="flex-1 flex flex-col min-h-0">
                {generatedResult.startsWith('data:image/svg+xml;base64,') && (
                  <div className="mb-3 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-[10px] text-brand-primary font-bold uppercase tracking-wider flex items-center justify-center gap-2 text-center">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Clave de API sin acceso a Imagen 3.0 en Google AI Studio. Visualizando diseño de resguardo local.</span>
                  </div>
                )}
                {/* Image Display */}
                <div className="flex-1 bg-[#090909] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-3 relative group">
                  <img
                    src={generatedResult}
                    alt="IA Output"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                  />
                </div>

                {/* Actions Bar */}
                <div className="flex gap-2.5 mt-4 shrink-0">
                  <button
                    onClick={() => setIsEditingInCanvas(true)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-brand-primary" />
                    <span>Personalizar (Canvas)</span>
                  </button>
                  <button
                    onClick={handleSaveToGallery}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Guardar en Galería</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-600 animate-pulse" />
                <p className="text-xs">Usa el formulario a la izquierda para formular tu prompt.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
