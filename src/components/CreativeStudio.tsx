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
  Info,
  Download
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { fabric } from 'fabric';
import { cn } from '../lib/utils';
import { generateCreativeImage } from '../services/geminiService';
import { assertHasQuota, trackActionConsumption, getUserConsumption } from '../services/consumptionTracker';
import { ProjectContext, UserProfile } from '../types';

interface CreativeStudioProps {
  profile: UserProfile;
  projectsList: ProjectContext[];
  onUpdateProfile: (p: any) => void;
  setActiveTab: (tab: string) => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

export default function CreativeStudio({
  profile,
  projectsList,
  onUpdateProfile,
  setActiveTab,
  initialPrompt,
  onPromptConsumed
}: CreativeStudioProps) {
  const [generationType, setGenerationType] = useState<'logos' | 'flyers' | 'products'>('logos');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  // Database Sync Settings
  const activeBrand = projectsList.find(p => p.id === selectedBrandId);

  // Reference Image Upload State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Auto watermark state
  const [applyLogo, setApplyLogo] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [logoOpacity, setLogoOpacity] = useState(0.85);
  const [logoSizePercent, setLogoSizePercent] = useState(15);

  // Output State
  const [rawImageResult, setRawImageResult] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToBrand, setIsSendingToBrand] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);

  // Form State - Logos
  const [logoDescription, setLogoDescription] = useState('');
  const [logoBrandName, setLogoBrandName] = useState('');
  const [selectedLogoStyle, setSelectedLogoStyle] = useState('Simétrico y Geométrico de Lujo');

  // Form State - Flyers
  const [flyerPrompt, setFlyerPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('1:1');
  const [selectedFlyerStyle, setSelectedFlyerStyle] = useState('Moderno e Impactante (Negocios)');

  // Form State - Products
  const [productPrompt, setProductPrompt] = useState('');
  const [selectedProductStyle, setSelectedProductStyle] = useState('Estudio Fotográfico Premium');

  // Brand Creation States (post-generation)
  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  // Set default brand vault on load
  useEffect(() => {
    if (projectsList && projectsList.length > 0 && !selectedBrandId) {
      const defaultBrand = projectsList.find(p => p.id !== 'futura_brand_vault') || projectsList[0];
      if (defaultBrand && defaultBrand.id) {
        setSelectedBrandId(defaultBrand.id);
      }
    }
  }, [projectsList]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      const isLogoPrompt = initialPrompt.toLowerCase().includes("logo") || 
                           initialPrompt.toLowerCase().includes("brand") || 
                           initialPrompt.toLowerCase().includes("logotipo") || 
                           initialPrompt.toLowerCase().includes("isotipo") || 
                           initialPrompt.toLowerCase().includes("marca");
      
      if (isLogoPrompt) {
        setGenerationType('logos');
        setLogoDescription(initialPrompt);
      } else {
        const isFlyer = initialPrompt.toLowerCase().includes("flyer") || 
                        initialPrompt.toLowerCase().includes("publicidad") || 
                        initialPrompt.toLowerCase().includes("post") || 
                        initialPrompt.toLowerCase().includes("banner") || 
                        initialPrompt.toLowerCase().includes("volante");
        if (isFlyer) {
          setGenerationType('flyers');
          setFlyerPrompt(initialPrompt);
        } else {
          setGenerationType('products');
          setProductPrompt(initialPrompt);
        }
      }

      if (onPromptConsumed) {
        onPromptConsumed();
      }
    }
  }, [initialPrompt]);

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
    'Tecnológico Moderno',
    'Heráldico / Emblema Corporativo',
    'Modern Bold Streetwear (Urbano)',
    'Vintage / Industrial Rústico'
  ];

  const flyerStyles = [
    'Moderno e Impactante (Negocios)',
    'Elegante y Minimalista (Luxury)',
    'Llamativo con Neón y Contraste (Eventos)',
    'Vectorial Limpio e Ilustrado',
    'Estilo Banner Corporativo Limpio'
  ];

  const productStyles = [
    'Estudio Fotográfico Premium',
    'Estilo de Vida Urbano (Modelo)',
    'Minimalista Orgánico',
    'Primer Plano Comercial nítido',
    'Fantasía Conceptual / Sci-Fi'
  ];

  // Helper to draw watermark logo client-side
  const applyBrandLogoOverlay = (baseImageSrc: string, logoSrc: string, position: string, opacityVal: number, sizePercent: number): Promise<string> => {
    return new Promise((resolve) => {
      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";
      baseImg.onload = () => {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = baseImg.width;
          cv.height = baseImg.height;
          const ctx = cv.getContext('2d');
          if (!ctx) {
            resolve(baseImageSrc);
            return;
          }
          // Draw base image
          ctx.drawImage(baseImg, 0, 0);

          // Calculate logo dimensions
          const logoWidth = baseImg.width * (sizePercent / 100);
          const logoHeight = logoWidth * (logoImg.height / logoImg.width);

          // Padding
          const padding = baseImg.width * 0.03; // 3% padding

          // Calculate positions
          let x = baseImg.width - logoWidth - padding;
          let y = baseImg.height - logoHeight - padding;

          if (position === 'bottom-left') {
            x = padding;
            y = baseImg.height - logoHeight - padding;
          } else if (position === 'top-right') {
            x = baseImg.width - logoWidth - padding;
            y = padding;
          } else if (position === 'top-left') {
            x = padding;
            y = padding;
          }

          // Draw logo with opacity
          ctx.save();
          ctx.globalAlpha = opacityVal;
          ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
          ctx.restore();

          resolve(cv.toDataURL('image/png'));
        };
        logoImg.onerror = () => resolve(baseImageSrc);
        logoImg.src = logoSrc;
      };
      baseImg.onerror = () => resolve(baseImageSrc);
      baseImg.src = baseImageSrc;
    });
  };

  // Watermark Effect
  useEffect(() => {
    let active = true;
    if (!rawImageResult) {
      setGeneratedResult(null);
      return;
    }

    if (applyLogo && activeBrand?.logos && activeBrand.logos.length > 0) {
      const logoUrl = activeBrand.logos[0];
      applyBrandLogoOverlay(rawImageResult, logoUrl, logoPosition, logoOpacity, logoSizePercent)
        .then(composited => {
          if (active) setGeneratedResult(composited);
        });
    } else {
      setGeneratedResult(rawImageResult);
    }

    return () => {
      active = false;
    };
  }, [rawImageResult, applyLogo, logoPosition, logoOpacity, logoSizePercent, activeBrand]);

  // ==========================================
  // IA GENERATION FUNCTIONS
  // ==========================================
  const handleGenerateLogo = async () => {
    if (!logoDescription.trim() || isGenerating) return;
    setGeneratedResult(null);
    setRawImageResult(null);

    try {
      await assertHasQuota(profile.id, profile.isPremium, 'image');
      setIsGenerating(true);

      const brandName = logoBrandName.trim() || (activeBrand ? activeBrand.name : 'Mi Negocio');
      const colors = activeBrand?.brandGuidelines 
        ? [
            { hex: activeBrand.brandGuidelines.primaryColor, name: 'Primario' },
            { hex: activeBrand.brandGuidelines.secondaryColor, name: 'Secundario' }
          ]
        : undefined;

      const fullPrompt = `Crea un diseño de logotipo profesional para la marca llamada "${brandName}". Concepto y nicho: ${logoDescription}. Estilo: ${selectedLogoStyle}. Simple, limpio, fondo oscuro.`;

      const result = await generateCreativeImage(fullPrompt, '1:1', undefined, {
        brandName,
        logoStyle: selectedLogoStyle,
        niche: logoDescription,
        colors,
        referenceImage: referenceImage || undefined
      });
      
      if (result) {
        setRawImageResult(result);
      }

      await trackActionConsumption(profile.id, profile.isPremium, 'image');

      const newCons = await getUserConsumption(profile.id, profile.isPremium);
      if (onUpdateProfile) {
        onUpdateProfile({
          ...profile,
          apiConsumption: newCons
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message?.includes("CRÍTICO") 
        ? err.message 
        : 'Error al generar el logo. Favor de intentar nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAsset = async (type: 'flyers' | 'products') => {
    const promptText = type === 'flyers' ? flyerPrompt : productPrompt;
    if (!promptText.trim() || isGenerating) return;
    
    setGeneratedResult(null);
    setRawImageResult(null);

    try {
      await assertHasQuota(profile.id, profile.isPremium, 'image');
      setIsGenerating(true);

      const brandName = activeBrand ? activeBrand.name : 'Mi Negocio';
      const brandContext = activeBrand 
        ? `Mantén coherencia con la identidad de marca de ${activeBrand.name}. Guías de marca: ${activeBrand.description}.`
        : '';

      const styleName = type === 'flyers' ? selectedFlyerStyle : selectedProductStyle;
      
      let fullPrompt = "";
      if (type === 'flyers') {
        fullPrompt = `Diseño de flyer publicitario profesional y folleto de marketing digital para redes sociales. Tema: ${promptText}. Estilo visual y dirección de arte: ${styleName}. ${brandContext} Alta resolución, limpio, sin marcas de agua externas.`;
      } else {
        fullPrompt = `Fotografía comercial de producto premium y modelos profesionales. Sujeto/Concepto: ${promptText}. Estilo de render e iluminación de estudio: ${styleName}. ${brandContext} Alta resolución, enfoque nítido, sin textos escritos extraños ni marcas de agua.`;
      }

      const colors = activeBrand?.brandGuidelines 
        ? [
            { hex: activeBrand.brandGuidelines.primaryColor, name: 'Primario' },
            { hex: activeBrand.brandGuidelines.secondaryColor, name: 'Secundario' }
          ]
        : undefined;

      const result = await generateCreativeImage(fullPrompt, selectedFormat, undefined, {
        brandName,
        niche: promptText,
        colors,
        referenceImage: referenceImage || undefined
      });

      if (result) {
        setRawImageResult(result);
      }

      await trackActionConsumption(profile.id, profile.isPremium, 'image');

      const newCons = await getUserConsumption(profile.id, profile.isPremium);
      if (onUpdateProfile) {
        onUpdateProfile({
          ...profile,
          apiConsumption: newCons
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message?.includes("CRÍTICO") 
        ? err.message 
        : 'Error al generar el diseño publicitario. Favor de intentar nuevamente.');
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
      const promptText = generationType === 'logos' 
        ? logoDescription 
        : (generationType === 'flyers' ? flyerPrompt : productPrompt);
      const styleName = generationType === 'logos' 
        ? selectedLogoStyle 
        : (generationType === 'flyers' ? selectedFlyerStyle : selectedProductStyle);

      await addDoc(collection(db, 'saved_assets'), {
        ownerId: auth.currentUser.uid,
        imageUrl: generatedResult,
        strategy: generationType === 'logos' 
          ? `Logotipo generado para: ${promptText}. Estilo: ${styleName}.`
          : `Diseño publicitario (${generationType}) generado para: ${promptText}. Formato: ${selectedFormat}.`,
        format: generationType === 'logos' ? 'Logotipo' : selectedFormat,
        style: styleName,
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

  const handleSetAsOfficialLogo = async () => {
    if (!generatedResult || !selectedBrandId || isSaving) return;
    setIsSaving(true);
    try {
      const targetBrand = projectsList.find(p => p.id === selectedBrandId);
      if (!targetBrand) {
        alert('Marca seleccionada no encontrada.');
        return;
      }
      
      await updateDoc(doc(db, 'projects', selectedBrandId), {
        logos: [generatedResult]
      });
      alert(`¡Logo asignado exitosamente como logo oficial de "${targetBrand.name}"!`);
    } catch (err) {
      console.error(err);
      alert('Error al asignar el logo a la marca.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBrandAndSave = async () => {
    if (!newBrandName.trim() || !generatedResult || !auth.currentUser || isSaving) return;
    setIsSaving(true);
    try {
      const isLogoGen = generationType === 'logos';
      const newProject = {
        name: newBrandName,
        description: `Misión: Dominar el nicho de mercado con impacto y efectividad.\nVisión: Sistema de conversión SPE.\nValores: Autenticidad, Métricas Claras.\nTono: Persuasivo de alta conversión.`,
        logos: isLogoGen ? [generatedResult] : [],
        trainingMaterial: isLogoGen ? [] : [generatedResult],
        methodology: 'SPE',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      setSelectedBrandId(docRef.id);
      setNewBrandName('');
      setIsCreatingNewBrand(false);
      alert(`¡Marca "${newProject.name}" creada y diseño vinculado con éxito!`);
    } catch (err) {
      console.error("Error creating brand and saving:", err);
      alert("Error al crear la marca. Asegúrate de iniciar sesión.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToBrand = async (brandId: string) => {
    if (!generatedResult || isSendingToBrand) return;
    setIsSendingToBrand(true);

    try {
      const targetBrand = projectsList.find(p => p.id === brandId);
      if (!targetBrand) {
        alert('Marca no encontrada.');
        return;
      }

      if (generationType === 'logos') {
        const updatedLogos = [...(targetBrand.logos || []), generatedResult];
        await updateDoc(doc(db, 'projects', brandId), {
          logos: updatedLogos
        });
      } else {
        const updatedMaterial = [...(targetBrand.trainingMaterial || []), generatedResult];
        await updateDoc(doc(db, 'projects', brandId), {
          trainingMaterial: updatedMaterial
        });
      }

      alert(`¡Diseño agregado exitosamente a la marca "${targetBrand.name}"!`);
      setShowBrandSelector(false);
    } catch (err: any) {
      console.error("Error sending design to brand project:", err);
      alert('Error al enviar el diseño a la marca.');
    } finally {
      setIsSendingToBrand(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedResult) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const isSvg = generatedResult.startsWith('data:image/svg+xml');
    const extension = isSvg ? 'svg' : (generationType === 'logos' ? 'png' : 'jpg');
    const filename = `futura-${generationType === 'logos' ? 'logo' : 'diseno'}-${dateStr}.${extension}`;
    
    // For base64 data URIs, download directly
    if (generatedResult.startsWith('data:')) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = generatedResult;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    // For external URLs (e.g. Pollinations), fetch as blob then download
    try {
      const response = await fetch(generatedResult);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        // Fallback: open in new tab for manual save
        window.open(generatedResult, '_blank');
      }
    } catch {
      window.open(generatedResult, '_blank');
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
            Generador de Imágenes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crea logos vectoriales e imágenes fotorrealistas para tus campañas y personalízalas con el editor de lienzo.
          </p>
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
            {/* Type Selector - three tabs */}
            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 gap-1 select-none">
              <button
                type="button"
                onClick={() => setGenerationType('logos')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center truncate",
                  generationType === 'logos'
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                Logos
              </button>
              <button
                type="button"
                onClick={() => setGenerationType('flyers')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center truncate",
                  generationType === 'flyers'
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                Flyers & Ads
              </button>
              <button
                type="button"
                onClick={() => setGenerationType('products')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center truncate",
                  generationType === 'products'
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                Productos
              </button>
            </div>

            {generationType === 'logos' && (
              /* LOGO BUILDER FORM */
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Nombre de la Marca / Negocio</label>
                  <input
                    type="text"
                    placeholder="Ejemplo: Café Místico"
                    value={logoBrandName}
                    onChange={(e) => setLogoBrandName(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">¿De qué es tu marca o negocio?</label>
                  <textarea
                    rows={4}
                    placeholder="Ejemplo: Una cafetería gourmet de especialidad llamada 'Café Místico' enfocada en personas que buscan un ritual de café artesanal oscuro y premium..."
                    value={logoDescription}
                    onChange={(e) => setLogoDescription(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors resize-none font-sans"
                  />
                </div>

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

                {/* Reference Image upload component */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                  <label className="text-[11px] font-mono text-slate-400 block">Diseño de Referencia / Inspiración (Opcional)</label>
                  {referenceImage ? (
                    <div className="relative w-full h-20 bg-black/40 border border-white/10 rounded-xl p-2 flex items-center gap-3">
                      <img src={referenceImage} alt="Referencia" className="h-full w-16 object-contain rounded-lg bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-400 truncate">Referencia visual cargada</p>
                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="text-[9px] text-rose-400 hover:text-rose-300 font-bold mt-1 underline block cursor-pointer"
                        >
                          Eliminar referencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-14 bg-black/20 hover:bg-black/35 border border-white/5 border-dashed hover:border-white/15 text-slate-500 hover:text-slate-400 rounded-xl text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all select-none">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[9px] font-mono">Subir imagen de referencia</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setReferenceImage(reader.result as string);
                            reader.readAsDataURL(files[0]);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
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
                      <span>Diseñando tu logotipo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Crear Logotipo</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {generationType === 'flyers' && (
              /* FLYERS & ADVERTISING FORM */
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">¿Qué promociona este flyer o anuncio?</label>
                  <textarea
                    rows={4}
                    placeholder="Ejemplo: Gran apertura de nuestra nueva sucursal con 50% de descuento en la primera compra, fucsia eléctrico, aspecto de poster digital moderno..."
                    value={flyerPrompt}
                    onChange={(e) => setFlyerPrompt(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors resize-none font-sans"
                  />
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Tamaño del Flyer</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {formats.map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={cn(
                          "px-2 py-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                          selectedFormat === fmt.id
                            ? "bg-brand-primary/10 border-brand-primary text-white"
                            : "bg-black/20 border-white/5 text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <span className="text-[10px] font-bold font-mono">{fmt.label.split(' ')[0]}</span>
                        <span className="text-[7.5px] text-slate-500 truncate w-full">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Estilo del Flyer</label>
                  <select
                    value={selectedFlyerStyle}
                    onChange={(e) => setSelectedFlyerStyle(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary/40 cursor-pointer"
                  >
                    {flyerStyles.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Reference Image upload component */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                  <label className="text-[11px] font-mono text-slate-400 block">Diseño / Inspiración de Referencia (Opcional)</label>
                  {referenceImage ? (
                    <div className="relative w-full h-20 bg-black/40 border border-white/10 rounded-xl p-2 flex items-center gap-3">
                      <img src={referenceImage} alt="Referencia" className="h-full w-16 object-contain rounded-lg bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-400 truncate">Referencia visual cargada</p>
                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="text-[9px] text-rose-400 hover:text-rose-300 font-bold mt-1 underline block cursor-pointer"
                        >
                          Eliminar referencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-14 bg-black/20 hover:bg-black/35 border border-white/5 border-dashed hover:border-white/15 text-slate-500 hover:text-slate-400 rounded-xl text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all select-none">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[9px] font-mono">Subir imagen de referencia</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setReferenceImage(reader.result as string);
                            reader.readAsDataURL(files[0]);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Brand watermarking controls */}
                <div className="space-y-2 pt-2.5 border-t border-white/5">
                  <div className="flex items-center justify-between select-none">
                    <label className="text-[11px] font-mono text-slate-400 cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applyLogo}
                        onChange={(e) => setApplyLogo(e.target.checked)}
                        className="rounded border-white/10 text-brand-primary focus:ring-0 cursor-pointer accent-brand-primary"
                      />
                      <span>Aplicar Logo de Marca</span>
                    </label>
                  </div>
                  {applyLogo && (
                    <div className="bg-black/25 border border-white/5 rounded-xl p-3 space-y-3 mt-1.5">
                      {activeBrand?.logos && activeBrand.logos.length > 0 ? (
                        <>
                          <div className="flex items-center gap-3">
                            <img src={activeBrand.logos[0]} alt="Brand Logo" className="w-10 h-10 object-contain rounded bg-black/40 border border-white/10 p-1" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-mono text-slate-400 font-bold truncate">Logo de {activeBrand.name}</p>
                              <p className="text-[8px] text-slate-500">Superposición automática activada</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[8px] font-mono text-slate-500">Posición en la Imagen</label>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { id: 'top-left', label: 'Arriba Izq' },
                                { id: 'top-right', label: 'Arriba Der' },
                                { id: 'bottom-left', label: 'Abajo Izq' },
                                { id: 'bottom-right', label: 'Abajo Der' }
                              ].map(pos => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setLogoPosition(pos.id as any)}
                                  className={cn(
                                    "py-0.5 rounded text-[8px] font-mono border text-center transition-all cursor-pointer",
                                    logoPosition === pos.id
                                      ? "bg-brand-primary/10 border-brand-primary text-white"
                                      : "bg-black/10 border-white/5 text-slate-500 hover:text-slate-300"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                              <span>Opacidad del Logo</span>
                              <span>{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-brand-primary h-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                              <span>Tamaño Proporcional</span>
                              <span>{logoSizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              step="1"
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                              className="w-full accent-brand-primary h-1"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-[9px] text-amber-500/80 italic font-sans leading-relaxed">
                          ⚠️ La marca seleccionada no tiene logos. Genera un logo primero en la pestaña 'Logos' y asígnalo.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAsset('flyers')}
                  disabled={!flyerPrompt.trim() || isGenerating}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-xs"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando tu flyer...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Crear Flyer</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {generationType === 'products' && (
              /* PRODUCTS & MODELS FORM */
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">¿Qué producto o modelo deseas fotografiar?</label>
                  <textarea
                    rows={4}
                    placeholder="Ejemplo: Un frasco de sérum facial premium sobre una roca húmeda con hojas verdes tropicales alrededor, gotas de agua cristalinas, luz de sol suave..."
                    value={productPrompt}
                    onChange={(e) => setProductPrompt(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-primary/40 transition-colors resize-none font-sans"
                  />
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Tamaño de la Imagen</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {formats.map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={cn(
                          "px-2 py-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                          selectedFormat === fmt.id
                            ? "bg-brand-primary/10 border-brand-primary text-white"
                            : "bg-black/20 border-white/5 text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <span className="text-[10px] font-bold font-mono">{fmt.label.split(' ')[0]}</span>
                        <span className="text-[7.5px] text-slate-500 truncate w-full">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Estilo de la Fotografía</label>
                  <select
                    value={selectedProductStyle}
                    onChange={(e) => setSelectedProductStyle(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-brand-primary/40 cursor-pointer"
                  >
                    {productStyles.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Reference Image upload component */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                  <label className="text-[11px] font-mono text-slate-400 block">Diseño / Inspiración de Referencia (Opcional)</label>
                  {referenceImage ? (
                    <div className="relative w-full h-20 bg-black/40 border border-white/10 rounded-xl p-2 flex items-center gap-3">
                      <img src={referenceImage} alt="Referencia" className="h-full w-16 object-contain rounded-lg bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-400 truncate">Referencia visual cargada</p>
                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="text-[9px] text-rose-400 hover:text-rose-300 font-bold mt-1 underline block cursor-pointer"
                        >
                          Eliminar referencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-14 bg-black/20 hover:bg-black/35 border border-white/5 border-dashed hover:border-white/15 text-slate-500 hover:text-slate-400 rounded-xl text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all select-none">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[9px] font-mono">Subir imagen de referencia</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setReferenceImage(reader.result as string);
                            reader.readAsDataURL(files[0]);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Brand watermarking controls */}
                <div className="space-y-2 pt-2.5 border-t border-white/5">
                  <div className="flex items-center justify-between select-none">
                    <label className="text-[11px] font-mono text-slate-400 cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applyLogo}
                        onChange={(e) => setApplyLogo(e.target.checked)}
                        className="rounded border-white/10 text-brand-primary focus:ring-0 cursor-pointer accent-brand-primary"
                      />
                      <span>Aplicar Logo de Marca</span>
                    </label>
                  </div>
                  {applyLogo && (
                    <div className="bg-black/25 border border-white/5 rounded-xl p-3 space-y-3 mt-1.5">
                      {activeBrand?.logos && activeBrand.logos.length > 0 ? (
                        <>
                          <div className="flex items-center gap-3">
                            <img src={activeBrand.logos[0]} alt="Brand Logo" className="w-10 h-10 object-contain rounded bg-black/40 border border-white/10 p-1" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-mono text-slate-400 font-bold truncate">Logo de {activeBrand.name}</p>
                              <p className="text-[8px] text-slate-500">Superposición automática activada</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[8px] font-mono text-slate-500">Posición en la Imagen</label>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { id: 'top-left', label: 'Arriba Izq' },
                                { id: 'top-right', label: 'Arriba Der' },
                                { id: 'bottom-left', label: 'Abajo Izq' },
                                { id: 'bottom-right', label: 'Abajo Der' }
                              ].map(pos => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setLogoPosition(pos.id as any)}
                                  className={cn(
                                    "py-0.5 rounded text-[8px] font-mono border text-center transition-all cursor-pointer",
                                    logoPosition === pos.id
                                      ? "bg-brand-primary/10 border-brand-primary text-white"
                                      : "bg-black/10 border-white/5 text-slate-500 hover:text-slate-300"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                              <span>Opacidad del Logo</span>
                              <span>{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-brand-primary h-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                              <span>Tamaño Proporcional</span>
                              <span>{logoSizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              step="1"
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                              className="w-full accent-brand-primary h-1"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-[9px] text-amber-500/80 italic font-sans leading-relaxed">
                          ⚠️ La marca seleccionada no tiene logos. Genera un logo primero en la pestaña 'Logos' y asígnalo.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAsset('products')}
                  disabled={!productPrompt.trim() || isGenerating}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-xs"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando tu fotografía...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Crear Fotografía</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Result view panel (3 cols) */}
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-340px)] min-h-[300px] p-5 bg-surface-900/20 border border-white/5 rounded-2xl relative overflow-hidden">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 border-b border-white/5 pb-2 mb-4 shrink-0">
              Resultado
            </h3>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
                <div>
                  <p className="text-xs text-white font-mono font-bold uppercase tracking-wider">Generando tu diseño...</p>
                  <p className="text-[10px] text-slate-500 mt-1">Estamos creando tu diseño. Esto puede tomar unos segundos.</p>
                </div>
              </div>
            ) : generatedResult ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                {generatedResult.startsWith('data:image/svg+xml;base64,') && (
                  <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-[10px] text-brand-primary font-bold uppercase tracking-wider flex items-center justify-center gap-2 text-center shrink-0">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Diseño vectorial de muestra. Intenta de nuevo para renderizar versión fotorrealista.</span>
                  </div>
                )}
                {/* Image Display */}
                <div className="w-full aspect-square max-h-[350px] bg-[#090909] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-3 relative group shrink-0">
                  <img
                    src={generatedResult}
                    alt="IA Output"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                  />
                </div>

                {/* Actions Bar */}
                <div className="flex gap-2 mt-1 shrink-0 flex-wrap">
                  <button
                    onClick={() => setIsEditingInCanvas(true)}
                    className="flex-1 min-w-[90px] py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Editar</span>
                  </button>
                  
                  {generationType === 'logos' && (
                    <button
                      onClick={handleSetAsOfficialLogo}
                      disabled={isSaving}
                      className="flex-1 min-w-[110px] py-2.5 bg-[#0a0a0a] border border-brand-primary/20 hover:bg-brand-primary/10 text-brand-primary disabled:opacity-40 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Logo Oficial</span>
                    </button>
                  )}

                  <button
                    onClick={handleSaveToGallery}
                    disabled={isSaving}
                    className="flex-1 min-w-[90px] py-2.5 bg-[#0a0a0a] border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-40 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-brand-primary" />
                    )}
                    <span>A Galería</span>
                  </button>
                  
                  {/* Enviar a Marca Dropdown */}
                  <div className="relative flex-1 min-w-[90px]">
                    <button
                      onClick={() => setShowBrandSelector(!showBrandSelector)}
                      disabled={isSendingToBrand}
                      className="w-full py-2.5 bg-[#0a0a0a] border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-40 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSendingToBrand ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-brand-primary" />
                      )}
                      <span>A Bóveda</span>
                    </button>
                    
                    {showBrandSelector && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl p-2 z-50 max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider px-2 py-1 border-b border-white/5 mb-1 flex items-center justify-between">
                          <span>Selecciona Marca</span>
                          <button type="button" onClick={() => setShowBrandSelector(false)} className="text-[10px] hover:text-white font-bold cursor-pointer">×</button>
                        </div>
                        {projectsList.filter(p => p.id !== 'virtual-futura').length === 0 ? (
                          <div className="text-[10px] text-slate-500 italic p-2 text-center">
                            No tienes marcas creadas.
                          </div>
                        ) : (
                          projectsList.filter(p => p.id !== 'virtual-futura').map((brand) => (
                            <button
                              key={brand.id}
                              type="button"
                              onClick={() => handleSendToBrand(brand.id)}
                              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-brand-primary/10 hover:text-white text-[11px] font-sans truncate transition-colors cursor-pointer"
                            >
                              📁 {brand.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDownloadImage}
                    className="flex-1 min-w-[95px] py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </button>
                </div>

                {/* BRAND BINDING & CREATION BLOCK */}
                <div className="border-t border-white/5 pt-4 space-y-4 shrink-0">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                        Vincular a Bóveda de Marca
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewBrand(!isCreatingNewBrand)}
                        className="text-[10px] text-brand-primary hover:text-brand-primary/80 font-bold underline cursor-pointer"
                      >
                        {isCreatingNewBrand ? "Ver existentes" : "+ Crear Nueva Marca"}
                      </button>
                    </div>

                    {isCreatingNewBrand ? (
                      /* Create New Brand Flow */
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-500">Nombre de la Nueva Marca</label>
                          <input
                            type="text"
                            placeholder="Ej. Café Ritual"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="w-full bg-[#090909] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand-primary/40"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateBrandAndSave}
                          disabled={!newBrandName.trim() || isSaving}
                          className="w-full py-2 bg-brand-primary hover:bg-brand-primary/95 text-white disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          {isSaving ? "Creando..." : "Crear y Vincular Diseño"}
                        </button>
                      </div>
                    ) : (
                      /* Bind to Existing Brand Flow */
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-500">Seleccionar Marca Existente</label>
                          <select
                            value={selectedBrandId}
                            onChange={(e) => setSelectedBrandId(e.target.value)}
                            className="w-full bg-[#090909] border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-brand-primary/40 cursor-pointer"
                          >
                            <option value="">-- Elige una Marca --</option>
                            {projectsList.map((brand) => (
                              <option key={brand.id} value={brand.id}>📁 {brand.name}</option>
                            ))}
                          </select>
                        </div>
                        {selectedBrandId && (
                          <div className="flex gap-2">
                            {generationType === 'logos' && (
                              <button
                                type="button"
                                onClick={handleSetAsOfficialLogo}
                                disabled={isSaving}
                                className="flex-1 py-2 bg-brand-primary/10 border border-brand-primary text-brand-primary hover:bg-brand-primary/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Asignar Logo Oficial
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSendToBrand(selectedBrandId)}
                              disabled={isSaving}
                              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Guardar en Referencias
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Watermarking controls inside result block if logo available */}
                  {selectedBrandId && activeBrand?.logos && activeBrand.logos.length > 0 && (
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-3.5 space-y-3.5">
                      <div className="flex items-center justify-between select-none">
                        <label className="text-[11px] font-mono text-slate-400 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={applyLogo}
                            onChange={(e) => setApplyLogo(e.target.checked)}
                            className="rounded border-white/10 text-brand-primary focus:ring-0 cursor-pointer accent-brand-primary"
                          />
                          <span>Aplicar Logo de Marca ({activeBrand.name})</span>
                        </label>
                      </div>

                      {applyLogo && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-slate-500">Posición del Logo</label>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { id: 'top-left', label: 'Arriba Izq' },
                                { id: 'top-right', label: 'Arriba Der' },
                                { id: 'bottom-left', label: 'Abajo Izq' },
                                { id: 'bottom-right', label: 'Abajo Der' }
                              ].map(pos => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setLogoPosition(pos.id as any)}
                                  className={cn(
                                    "py-1 rounded text-[9px] font-mono border text-center transition-all cursor-pointer",
                                    logoPosition === pos.id
                                      ? "bg-brand-primary/10 border-brand-primary text-white"
                                      : "bg-black/10 border-white/5 text-slate-500 hover:text-slate-300"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Opacidad</span>
                              <span>{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-brand-primary h-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Tamaño</span>
                              <span>{logoSizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              step="1"
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                              className="w-full accent-brand-primary h-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-600 animate-pulse" />
                <p className="text-xs">Describe lo que quieres crear usando el formulario de la izquierda.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
