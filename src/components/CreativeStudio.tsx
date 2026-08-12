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
  Download,
  Palette
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { fabric } from 'fabric';
import { cn } from '../lib/utils';
import { generateCreativeImage, generateAdvancedDynamicSVG } from '../services/geminiService';
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

  // Active brand logo (either generated in-session, uploaded, or loaded from Firestore)
  const [customUploadedLogo, setCustomUploadedLogo] = useState<string | null>(null);

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
  const [selectedLogoColorPalette, setSelectedLogoColorPalette] = useState<string | null>(null);
  const [customColor1, setCustomColor1] = useState('#F43F5E');
  const [customColor2, setCustomColor2] = useState('#FBBF24');
  const [customColor3, setCustomColor3] = useState('#FFFFFF');
  const [selectedCustomColors, setSelectedCustomColors] = useState<{ hex: string; name: string }[]>([]);

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
    'Vintage / Industrial Rústico',
    'Mascota / Esports Gaming (Ilustrado)',
    'Letrero Metálico 3D / Relieve en Textura',
    'Sello Circular / Insignia de Negocio'
  ];

  const flyerStyles = [
    'Moderno e Impactante (Negocios)',
    'Elegante y Minimalista (Luxury)',
    'Llamativo con Neón y Contraste (Eventos)',
    'Vectorial Limpio e Ilustrado',
    'Estilo Banner Corporativo Limpio',
    'Maqueta de Folleto / Mockup Profesional',
    'Póster Colgante / Hanging Poster'
  ];

  const productStyles = [
    'Estudio Fotográfico Premium',
    'Estilo de Vida Urbano (Modelo)',
    'Minimalista Orgánico',
    'Primer Plano Comercial nítido',
    'Fantasía Conceptual / Sci-Fi',
    'Bodegón de Producto / Mockup Escénico',
    'Mockup de Camisetas / Ropa (Merchandising)',
    'Mockup de Vasos y Tazas de Café',
    'Mockup de Empaques y Cajas (Packaging)',
    'Mockup de Bolsas de Papel / Tela (Tote)',
    'Mockup de Valla / Letrero Comercial',
    'Mockup de Dispositivos / Pantallas (UI)'
  ];

  const quickSuggestionsLogos = [
    { text: '⚡ Rayo / Velocidad', prompt: 'Un isotipo de rayo dinámico minimalista con geometría estilizada y trazos limpios', brand: 'ELSA STREETWEAR' },
    { text: '👑 Corona Elegante', prompt: 'Una corona estilizada de líneas finas doradas y geometría de lujo', brand: 'LUXE' },
    { text: '🌿 Hoja Orgánica', prompt: 'Una hoja botánica orgánica en trazos vectoriales curvos de máxima elegancia', brand: 'VERDE' },
    { text: '🦁 Felino / Fuerza', prompt: 'Una silueta estilizada de felino en trazos rectos y corte geométrico', brand: 'APEX' },
    { text: '💎 Diamante Lujo', prompt: 'Un cristal de diamante geométrico de relieve metálico brillante', brand: 'AURA' },
    { text: '📐 Monograma', prompt: 'Un monograma geométrico de iniciales entrelazadas con estética urbana', brand: 'NEXO' }
  ];

  const quickSuggestionsFlyers = [
    { text: '🎉 Apertura 50%', prompt: 'Gran apertura de nuestra nueva sucursal con 50% de descuento en la primera compra de todos los productos' },
    { text: '🍕 Pizza 2x1', prompt: 'Jueves de pizza 2x1 en sabores seleccionados, servicio a domicilio gratis' },
    { text: '💆 Relajación Spa', prompt: 'Descuento especial de fin de semana en masajes terapéuticos y tratamientos faciales de spa' },
    { text: '🏋️ Pase Gym', prompt: 'Prueba una semana gratis en nuestras instalaciones de entrenamiento funcional y crossfit' }
  ];

  const quickSuggestionsProducts = [
    { text: '👕 Camiseta', prompt: 'Una camiseta de algodón de color negro premium' },
    { text: '☕ Vaso Café', prompt: 'Un vaso de papel kraft ecológico para café para llevar' },
    { text: '📦 Caja Empaque', prompt: 'Una caja de empaque de cartón kraft con acabado mate' },
    { text: '👜 Bolsa Kraft', prompt: 'Una bolsa de papel kraft de compras de lujo standing' },
    { text: '📱 Pantalla App', prompt: 'Una pantalla de teléfono móvil mostrando una interfaz limpia' }
  ];

  // Helper to remove solid background (white/dark) from logo image for pure PNG transparency
  const createTransparentLogoCanvas = (logoImg: HTMLImageElement): HTMLCanvasElement => {
    const lCv = document.createElement('canvas');
    lCv.width = logoImg.width;
    lCv.height = logoImg.height;
    const lCtx = lCv.getContext('2d');
    if (!lCtx) return lCv;

    lCtx.drawImage(logoImg, 0, 0);
    try {
      const imgData = lCtx.getImageData(0, 0, lCv.width, lCv.height);
      const d = imgData.data;

      // Sample 4 corner pixels to determine background color
      const corners = [
        [0, 0],
        [(lCv.width - 1) * 4, 0],
        [0, (lCv.height - 1) * 4 * lCv.width],
        [(lCv.width - 1) * 4, (lCv.height - 1) * 4 * lCv.width]
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      for (const [idx] of corners) {
        bgR += d[idx];
        bgG += d[idx + 1];
        bgB += d[idx + 2];
      }
      bgR = Math.round(bgR / 4);
      bgG = Math.round(bgG / 4);
      bgB = Math.round(bgB / 4);

      const isWhiteBg = bgR > 210 && bgG > 210 && bgB > 210;
      const isDarkBg = bgR < 40 && bgG < 40 && bgB < 40;

      if (isWhiteBg || isDarkBg) {
        const threshold = isWhiteBg ? 45 : 50;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          if (diff < threshold) {
            d[i + 3] = 0; // Make background pixel 100% transparent!
          }
        }
        lCtx.putImageData(imgData, 0, 0);
      }
    } catch (e) {
      console.warn("[FUTURA UI] Transparency extraction skipped:", e);
    }
    return lCv;
  };

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

          // Create transparent logo canvas without any background box
          const transparentLogoCv = createTransparentLogoCanvas(logoImg);

          // Draw transparent logo with opacity
          ctx.save();
          ctx.globalAlpha = opacityVal;
          ctx.drawImage(transparentLogoCv, x, y, logoWidth, logoHeight);
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

    if (applyLogo && customUploadedLogo && generationType !== 'logos') {
      applyBrandLogoOverlay(rawImageResult, customUploadedLogo, logoPosition, logoOpacity, logoSizePercent)
        .then(composited => {
          if (active) setGeneratedResult(composited);
        });
    } else {
      setGeneratedResult(rawImageResult);
    }

    return () => {
      active = false;
    };
  }, [rawImageResult, applyLogo, logoPosition, logoOpacity, logoSizePercent, customUploadedLogo, generationType]);

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
      const colors = selectedCustomColors.length > 0
        ? selectedCustomColors
        : (activeBrand?.brandGuidelines 
            ? [
                { hex: activeBrand.brandGuidelines.primaryColor, name: 'Primario' },
                { hex: activeBrand.brandGuidelines.secondaryColor, name: 'Secundario' }
              ]
            : undefined);

      const fullPrompt = `Crea un diseño de logotipo profesional de alta gama para la marca llamada "${brandName}". Concepto y nicho: ${logoDescription}. Estilo visual: ${selectedLogoStyle}. Diseño limpio, simétrico, alta resolución y máximo contraste visual.`;

      const advisoryContext = localStorage.getItem('futura_active_advisory_context') || undefined;

      const result = await generateCreativeImage(fullPrompt, '1:1', undefined, {
        brandName,
        logoStyle: selectedLogoStyle,
        niche: logoDescription,
        colors,
        referenceImage: referenceImage || undefined,
        generationType: 'logos',
        advisoryContext
      });
      
      if (result) {
        setRawImageResult(result);
        setCustomUploadedLogo(result); // Set as active session logo
        setApplyLogo(true); // Auto-enable logo overlay for subsequent flyer/product generations
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

  const handleUseLogoInFlyers = () => {
    if (!generatedResult) return;
    setCustomUploadedLogo(generatedResult);
    setApplyLogo(true);
    setGenerationType('flyers');
    alert('¡Excelente! Tu nuevo logo ha sido activado. Ahora cuando crees cualquier flyer o anuncio publicitario, tu logo se colocará sobre el diseño automáticamente.');
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
        if (styleName.includes('Mockup') || styleName.includes('Maqueta') || styleName.includes('Poster')) {
          fullPrompt = `A professional high-end graphic design flyer and advertisement mockup for ${promptText}. Art style: ${styleName}. Clean geometric grids, professional typography layout, realistic paper texture with subtle drop shadows, minimalist desk background.`;
        } else {
          fullPrompt = `Diseño de flyer publicitario profesional y folleto de marketing digital para redes sociales. Tema: ${promptText}. Estilo visual y dirección de arte: ${styleName}. ${brandContext} Alta resolución, limpio, sin marcas de agua externas.`;
        }
      } else {
        if (styleName.startsWith('Mockup de')) {
          fullPrompt = `A professional high-quality product branding mockup of ${promptText}. Visual style: ${styleName}. Clean minimalist studio background, soft realistic shadow casting, sharp focus, high-end commercial presentation, suitable for applying a logo.`;
        } else {
          fullPrompt = `Fotografía comercial de producto premium y modelos profesionales. Sujeto/Concepto: ${promptText}. Estilo de render e iluminación de estudio: ${styleName}. ${brandContext} Alta resolución, enfoque nítido, sin textos escritos extraños ni marcas de agua.`;
        }
      }

      const colors = activeBrand?.brandGuidelines 
        ? [
            { hex: activeBrand.brandGuidelines.primaryColor, name: 'Primario' },
            { hex: activeBrand.brandGuidelines.secondaryColor, name: 'Secundario' }
          ]
        : undefined;

      const advisoryContext = localStorage.getItem('futura_active_advisory_context') || undefined;

      const result = await generateCreativeImage(fullPrompt, selectedFormat, undefined, {
        brandName,
        niche: promptText,
        colors,
        referenceImage: referenceImage || undefined,
        generationType: type,
        mockupType: type === 'flyers' ? selectedFlyerStyle : selectedProductStyle,
        advisoryContext
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

          // Add active brand logo as a layer if available (only for flyers and products)
          if (customUploadedLogo && generationType !== 'logos') {
             const isBase64 = customUploadedLogo.startsWith('data:');
             fabric.Image.fromURL(customUploadedLogo, (logoImg) => {
               if (!internalCanvas) return;
               logoImg.scaleToWidth(100);
               logoImg.set({
                 left: 30,
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
           }

          // Auto-populate pre-formatted editable sharp text layers for flyers (Headline, Offer, Contact)
          if (generationType === 'flyers' && internalCanvas) {
            const brandTitle = activeBrand?.name || 'MI NEGOCIO';
            const headlineText = flyerPrompt.trim() 
              ? (flyerPrompt.length > 40 ? flyerPrompt.slice(0, 40) + '...' : flyerPrompt.toUpperCase()) 
              : 'TÍTULO DEL ANUNCIO / OFERTA';

            const headline = new fabric.IText(headlineText, {
              left: Math.round(canvasWidth * 0.08),
              top: Math.round(canvasHeight * 0.1),
              fontSize: Math.max(18, Math.round(canvasWidth * 0.05)),
              fill: '#FFFFFF',
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              stroke: '#000000',
              strokeWidth: 1.5,
              cornerColor: '#f43f5e',
              cornerSize: 8,
              transparentCorners: false
            });

            const subtext = new fabric.IText('¡OFERTA IMPERDIBLE POR TIEMPO LIMITADO!', {
              left: Math.round(canvasWidth * 0.08),
              top: Math.round(canvasHeight * 0.2),
              fontSize: Math.max(14, Math.round(canvasWidth * 0.032)),
              fill: '#FFD700',
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              stroke: '#000000',
              strokeWidth: 1,
              cornerColor: '#f43f5e',
              cornerSize: 8,
              transparentCorners: false
            });

            const contactBar = new fabric.IText(`📞 CONTACTO: +58 412 000 0000 | WWW.${brandTitle.toUpperCase().replace(/\s+/g, '')}.COM`, {
              left: Math.round(canvasWidth * 0.08),
              top: Math.round(canvasHeight * 0.86),
              fontSize: Math.max(11, Math.round(canvasWidth * 0.026)),
              fill: '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.75)',
              padding: 6,
              fontFamily: 'monospace',
              cornerColor: '#f43f5e',
              cornerSize: 8,
              transparentCorners: false
            });

            internalCanvas.add(headline, subtext, contactBar);
            internalCanvas.bringToFront(headline);
            internalCanvas.bringToFront(subtext);
            internalCanvas.bringToFront(contactBar);
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[550px] lg:min-h-[650px]">
          {/* Canvas workspace (3 cols) */}
          <div className="lg:col-span-3 flex flex-col bg-surface-950 border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
            <div className="flex items-center justify-between p-4 lg:p-5 bg-[#0a0a0a] border-b border-white/10">
              <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-primary" />
                Editor de Lienzo (Capas)
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsEditingInCanvas(false)}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs uppercase font-mono flex items-center gap-1.5 cursor-pointer transition-colors border border-white/5"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={handleApplyCanvas}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs uppercase font-mono flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-md shadow-brand-primary/20"
                >
                  <Check className="w-4 h-4" /> Aplicar Diseño
                </button>
              </div>
            </div>

            {/* Container for the canvas */}
            <div 
              ref={canvasContainerRef}
              className="flex-1 flex items-center justify-center p-6 bg-[#060606] overflow-hidden"
            >
              <canvas ref={canvasRef} className="shadow-2xl border border-white/10 rounded-lg" />
            </div>
          </div>

          {/* Sidebar Tools Panel (1 col) */}
          <div className="space-y-5 p-5 lg:p-6 bg-surface-900/30 border border-white/10 rounded-2xl overflow-y-auto">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 border-b border-white/10 pb-2.5 mb-3">
              Herramientas de Diseño
            </h3>

            {/* Mode Select */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400">Herramienta Activa</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTool('select')}
                  className={cn(
                    "px-3 py-2.5 text-xs font-mono font-bold rounded-xl border text-center transition-all cursor-pointer",
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
                    "px-3 py-2.5 text-xs font-mono font-bold rounded-xl border text-center transition-all cursor-pointer",
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
              <label className="text-xs font-mono text-slate-400">Agregar Elementos</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={addRect}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-white/5 transition-colors"
                >
                  <Square className="w-4 h-4" /> Rectángulo
                </button>
                <button
                  onClick={addText}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-white/5 transition-colors"
                >
                  <Type className="w-4 h-4" /> Texto
                </button>
              </div>
            </div>

            {/* Color selector */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-mono text-slate-400">Color de Relleno</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-full h-10 rounded-xl bg-black border border-white/10 px-1 py-1 cursor-pointer"
              />
            </div>

            {/* Object adjustments */}
            {selectedObject ? (
              <div className="space-y-3.5 pt-3 border-t border-brand-primary/20 bg-brand-primary/5 p-4 rounded-xl border border-white/5">
                <span className="text-xs font-mono font-bold text-brand-primary uppercase">Capa Seleccionada</span>
                
                {/* Size / Font adjust if text */}
                {selectedObject.type === 'i-text' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Tamaño del Texto ({fontSize}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-brand-primary h-1.5 cursor-pointer"
                    />
                  </div>
                )}

                {/* Opacity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Opacidad ({Math.round(opacity * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary h-1.5 cursor-pointer"
                  />
                </div>

                {/* Ordering */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={bringToFront}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 text-slate-200 cursor-pointer border border-white/5"
                  >
                    <ArrowUp className="w-3.5 h-3.5" /> Traer
                  </button>
                  <button
                    onClick={sendToBack}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 text-slate-200 cursor-pointer border border-white/5"
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> Fondo
                  </button>
                </div>

                {/* Duplicate / Delete */}
                <div className="flex gap-2">
                  <button
                    onClick={duplicateSelected}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 text-slate-200 cursor-pointer border border-white/5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicar
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 text-rose-400 cursor-pointer border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ) : activeTool === 'pencil' ? (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-xs font-mono text-slate-400">Grosor de Dibujo ({brushSize}px)</label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full accent-brand-primary h-1.5 cursor-pointer"
                />
              </div>
            ) : null}

            {/* Upload image to canvas */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-mono text-slate-400">Insertar Imagen Local</label>
              <label className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 cursor-pointer border border-white/5 transition-colors">
                <Upload className="w-4 h-4" />
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Settings panel (2 cols) */}
          <div className="lg:col-span-2 space-y-5 p-5 lg:p-6 bg-surface-900/30 border border-white/10 rounded-2xl shadow-xl">
            {/* Type Selector - three tabs */}
            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10 gap-1.5 select-none">
              <button
                type="button"
                onClick={() => setGenerationType('logos')}
                className={cn(
                  "flex-1 py-2.5 text-xs md:text-sm font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center truncate",
                  generationType === 'logos'
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Logos
              </button>
              <button
                type="button"
                onClick={() => setGenerationType('flyers')}
                className={cn(
                  "flex-1 py-2.5 text-xs md:text-sm font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center truncate",
                  generationType === 'flyers'
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Flyers & Ads
              </button>
              <button
                type="button"
                onClick={() => setGenerationType('products')}
                className={cn(
                  "flex-1 py-2.5 text-xs md:text-sm font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center truncate",
                  generationType === 'products'
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Productos
              </button>
            </div>

            {generationType === 'logos' && (
              /* LOGO BUILDER FORM */
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">Nombre de la Marca / Negocio</label>
                  <input
                    type="text"
                    placeholder="Ejemplo: Café Místico, Nexo, HAZARD..."
                    value={logoBrandName}
                    onChange={(e) => setLogoBrandName(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">
                      Idea, Símbolo o Inspiración para tu Logo
                    </label>
                    <span className="text-[11px] font-sans text-slate-400">
                      Describe la figura o concepto para el isotipo (ej: un rayo, monograma, corona, geometría estilizada)...
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Ejemplo: Un isotipo de rayo estilizado o monograma elegante con geometría nítida de líneas limpias..."
                    value={logoDescription}
                    onChange={(e) => setLogoDescription(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-colors resize-none font-sans placeholder:text-slate-600"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                    {quickSuggestionsLogos.map((s) => (
                      <button
                        key={s.text}
                        type="button"
                        onClick={() => {
                          setLogoDescription(s.prompt);
                          if (!logoBrandName.trim()) setLogoBrandName(s.brand);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-sans transition-all cursor-pointer"
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PREFERRED BRAND COLORS PANEL */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span>Colores Preferidos (Opcional)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-tight">
                    Elige 2 o 3 colores para que la IA aplique esa paleta a tu logotipo.
                  </p>

                  {/* Color Preset Combinations */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 select-none">
                    {[
                      { id: 'rose-gold', name: 'Rosa & Oro', colors: [{ hex: '#F43F5E', name: 'Rosa' }, { hex: '#FBBF24', name: 'Oro' }, { hex: '#FFFFFF', name: 'Blanco' }] },
                      { id: 'cyber-neon', name: 'Neón Cyber', colors: [{ hex: '#00F2FE', name: 'Cian' }, { hex: '#A855F7', name: 'Púrpura' }, { hex: '#0F172A', name: 'Oscuro' }] },
                      { id: 'luxury-gold', name: 'Oro & Negro', colors: [{ hex: '#D4AF37', name: 'Dorado' }, { hex: '#111111', name: 'Negro' }, { hex: '#FFFFFF', name: 'Blanco' }] },
                      { id: 'emerald-mint', name: 'Esmeralda', colors: [{ hex: '#10B981', name: 'Esmeralda' }, { hex: '#064E3B', name: 'Verde' }, { hex: '#F0FDF4', name: 'Menta' }] },
                      { id: 'purple-magenta', name: 'Púrpura', colors: [{ hex: '#8B5CF6', name: 'Violeta' }, { hex: '#EC4899', name: 'Magenta' }, { hex: '#FFFFFF', name: 'Blanco' }] },
                      { id: 'mono-minimal', name: 'Monocromo', colors: [{ hex: '#FFFFFF', name: 'Blanco' }, { hex: '#000000', name: 'Negro' }, { hex: '#94A3B8', name: 'Gris' }] }
                    ].map(palette => {
                      const isSelected = selectedLogoColorPalette === palette.id;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLogoColorPalette(null);
                              setSelectedCustomColors([]);
                            } else {
                              setSelectedLogoColorPalette(palette.id);
                              setSelectedCustomColors(palette.colors);
                            }
                          }}
                          className={cn(
                            "px-2 py-1.5 rounded-lg border flex items-center justify-between gap-1 transition-all cursor-pointer min-w-0 overflow-hidden",
                            isSelected
                              ? "bg-brand-primary/10 border-brand-primary shadow-sm shadow-brand-primary/20"
                              : "bg-[#090909] border-white/10 hover:border-white/20"
                          )}
                        >
                          <span className="text-[11px] font-mono text-slate-200 truncate shrink min-w-0">{palette.name}</span>
                          <div className="flex gap-0.5 shrink-0">
                            {palette.colors.map((c, idx) => (
                              <span key={idx} className="w-2.5 h-2.5 rounded-full border border-black/50 shrink-0" style={{ backgroundColor: c.hex }} />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Color Pickers */}
                  <div className="flex items-center justify-between pt-1.5 bg-[#090909] px-2.5 py-1.5 rounded-lg border border-white/10 mt-1">
                    <span className="text-[11px] font-mono text-slate-300 font-medium">Personalizado:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor1}
                        onChange={(e) => {
                          setCustomColor1(e.target.value);
                          setSelectedLogoColorPalette('custom');
                          setSelectedCustomColors([
                            { hex: e.target.value, name: 'Color 1' },
                            { hex: customColor2, name: 'Color 2' },
                            { hex: customColor3, name: 'Color 3' }
                          ]);
                        }}
                        className="w-5 h-5 rounded bg-transparent border border-white/20 cursor-pointer p-0 shrink-0"
                        title="Color 1"
                      />
                      <input
                        type="color"
                        value={customColor2}
                        onChange={(e) => {
                          setCustomColor2(e.target.value);
                          setSelectedLogoColorPalette('custom');
                          setSelectedCustomColors([
                            { hex: customColor1, name: 'Color 1' },
                            { hex: e.target.value, name: 'Color 2' },
                            { hex: customColor3, name: 'Color 3' }
                          ]);
                        }}
                        className="w-5 h-5 rounded bg-transparent border border-white/20 cursor-pointer p-0 shrink-0"
                        title="Color 2"
                      />
                      <input
                        type="color"
                        value={customColor3}
                        onChange={(e) => {
                          setCustomColor3(e.target.value);
                          setSelectedLogoColorPalette('custom');
                          setSelectedCustomColors([
                            { hex: customColor1, name: 'Color 1' },
                            { hex: customColor2, name: 'Color 2' },
                            { hex: e.target.value, name: 'Color 3' }
                          ]);
                        }}
                        className="w-5 h-5 rounded bg-transparent border border-white/20 cursor-pointer p-0 shrink-0"
                        title="Color 3"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">Estilo del Logotipo</label>
                  <select
                    value={selectedLogoStyle}
                    onChange={(e) => setSelectedLogoStyle(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 text-sm text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-primary/50 cursor-pointer"
                  >
                    {logoStyles.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Reference Image upload component */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300 block">Diseño de Referencia / Inspiración (Opcional)</label>
                  {referenceImage ? (
                    <div className="relative w-full h-22 bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center gap-3.5">
                      <img src={referenceImage} alt="Referencia" className="h-full w-20 object-contain rounded-lg bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium truncate">Referencia visual cargada</p>
                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold mt-1 underline block cursor-pointer"
                        >
                          Eliminar referencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-16 bg-black/20 hover:bg-black/35 border border-white/10 border-dashed hover:border-white/20 text-slate-400 hover:text-white rounded-xl text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all select-none">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-mono font-medium">Subir imagen de referencia</span>
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
                  className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-sm md:text-base shadow-lg shadow-brand-primary/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Diseñando tu logotipo con marca...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
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
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">¿Qué promociona este flyer o anuncio?</label>
                  <textarea
                    rows={4}
                    placeholder="Ejemplo: Gran apertura de nuestra nueva sucursal con 50% de descuento en la primera compra, fucsia eléctrico, aspecto de poster digital moderno..."
                    value={flyerPrompt}
                    onChange={(e) => setFlyerPrompt(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3.5 text-sm text-white outline-none focus:border-brand-primary/50 transition-colors resize-none font-sans placeholder:text-slate-600"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                    {quickSuggestionsFlyers.map((s) => (
                      <button
                        key={s.text}
                        type="button"
                        onClick={() => setFlyerPrompt(s.prompt)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-sans transition-all cursor-pointer"
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">Tamaño del Flyer</label>
                  <div className="grid grid-cols-3 gap-2">
                    {formats.map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={cn(
                          "px-2.5 py-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                          selectedFormat === fmt.id
                            ? "bg-brand-primary/10 border-brand-primary text-white"
                            : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        <span className="text-xs font-bold font-mono">{fmt.label.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-400 truncate w-full">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">Estilo del Flyer</label>
                  <select
                    value={selectedFlyerStyle}
                    onChange={(e) => setSelectedFlyerStyle(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 text-sm text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-primary/50 cursor-pointer"
                  >
                    {flyerStyles.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Reference Image upload component */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300 block">Diseño / Inspiración de Referencia (Opcional)</label>
                  {referenceImage ? (
                    <div className="relative w-full h-22 bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center gap-3.5">
                      <img src={referenceImage} alt="Referencia" className="h-full w-20 object-contain rounded-lg bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium truncate">Referencia visual cargada</p>
                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold mt-1 underline block cursor-pointer"
                        >
                          Eliminar referencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-16 bg-black/20 hover:bg-black/35 border border-white/10 border-dashed hover:border-white/20 text-slate-400 hover:text-white rounded-xl text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all select-none">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-mono font-medium">Subir imagen de referencia</span>
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
                    <label className="text-xs md:text-sm font-mono text-slate-300 cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applyLogo}
                        onChange={(e) => setApplyLogo(e.target.checked)}
                        className="rounded border-white/10 text-brand-primary focus:ring-0 cursor-pointer accent-brand-primary w-4 h-4"
                      />
                      <span>Aplicar Logo de Marca</span>
                    </label>
                  </div>
                  {applyLogo && (
                    <div className="bg-black/25 border border-white/10 rounded-xl p-3.5 space-y-3 mt-1.5">
                      {customUploadedLogo ? (
                        <>
                          <div className="flex items-center gap-3">
                            <img src={customUploadedLogo} alt="Brand Logo" className="w-12 h-12 object-contain rounded bg-black/40 border border-white/10 p-1" />
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-slate-300 font-bold truncate">Logotipo de Marca Activo</p>
                              <p className="text-[11px] text-slate-400">Superposición automática activada</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-mono text-slate-400">Posición en la Imagen</label>
                            <div className="grid grid-cols-2 gap-1.5">
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
                                    "py-1.5 rounded-lg text-xs font-mono border text-center transition-all cursor-pointer font-medium",
                                    logoPosition === pos.id
                                      ? "bg-brand-primary/10 border-brand-primary text-white"
                                      : "bg-black/10 border-white/5 text-slate-400 hover:text-white"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span>Opacidad del Logo</span>
                              <span className="text-white font-bold">{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-brand-primary h-1.5 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span>Tamaño Proporcional</span>
                              <span className="text-white font-bold">{logoSizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              step="1"
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                              className="w-full accent-brand-primary h-1.5 cursor-pointer"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-amber-400/90 italic font-sans leading-relaxed">
                          ⚠️ No hay ningún logotipo activo. Genera uno en 'Logos' o súbelo en el panel de arriba.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAsset('flyers')}
                  disabled={!flyerPrompt.trim() || isGenerating}
                  className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-sm md:text-base shadow-lg shadow-brand-primary/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creando tu flyer...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
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
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">¿Qué producto o modelo deseas fotografiar?</label>
                  <textarea
                    rows={4}
                    placeholder="Ejemplo: Un frasco de sérum facial premium sobre una roca húmeda con hojas verdes tropicales alrededor, gotas de agua cristalinas, luz de sol suave..."
                    value={productPrompt}
                    onChange={(e) => setProductPrompt(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 rounded-xl p-3.5 text-sm text-white outline-none focus:border-brand-primary/50 transition-colors resize-none font-sans placeholder:text-slate-600"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                    {quickSuggestionsProducts.map((s) => (
                      <button
                        key={s.text}
                        type="button"
                        onClick={() => setProductPrompt(s.prompt)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-sans transition-all cursor-pointer"
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300">Estilo de Mockup o Fotografía</label>
                  <select
                    value={selectedProductStyle}
                    onChange={(e) => setSelectedProductStyle(e.target.value)}
                    className="w-full bg-[#090909] border border-white/10 text-sm text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-primary/50 cursor-pointer"
                  >
                    {productStyles.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Reference Image upload component */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                  <label className="text-xs md:text-sm font-mono font-semibold text-slate-300 block">Diseño / Inspiración de Referencia (Opcional)</label>
                  {referenceImage ? (
                    <div className="relative w-full h-22 bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center gap-3.5">
                      <img src={referenceImage} alt="Referencia" className="h-full w-20 object-contain rounded-lg bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium truncate">Referencia visual cargada</p>
                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold mt-1 underline block cursor-pointer"
                        >
                          Eliminar referencia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-16 bg-black/20 hover:bg-black/35 border border-white/10 border-dashed hover:border-white/20 text-slate-400 hover:text-white rounded-xl text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all select-none">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-mono font-medium">Subir imagen de referencia</span>
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
                    <label className="text-xs md:text-sm font-mono text-slate-300 cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applyLogo}
                        onChange={(e) => setApplyLogo(e.target.checked)}
                        className="rounded border-white/10 text-brand-primary focus:ring-0 cursor-pointer accent-brand-primary w-4 h-4"
                      />
                      <span>Aplicar Logo de Marca</span>
                    </label>
                  </div>
                  {applyLogo && (
                    <div className="bg-black/25 border border-white/10 rounded-xl p-3.5 space-y-3 mt-1.5">
                      {customUploadedLogo ? (
                        <>
                          <div className="flex items-center gap-3">
                            <img src={customUploadedLogo} alt="Brand Logo" className="w-12 h-12 object-contain rounded bg-black/40 border border-white/10 p-1" />
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-slate-300 font-bold truncate">Logotipo de Marca Activo</p>
                              <p className="text-[11px] text-slate-400">Superposición automática activada</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-mono text-slate-400">Posición en la Imagen</label>
                            <div className="grid grid-cols-2 gap-1.5">
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
                                    "py-1.5 rounded-lg text-xs font-mono border text-center transition-all cursor-pointer font-medium",
                                    logoPosition === pos.id
                                      ? "bg-brand-primary/10 border-brand-primary text-white"
                                      : "bg-black/10 border-white/5 text-slate-400 hover:text-white"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span>Opacidad del Logo</span>
                              <span className="text-white font-bold">{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-brand-primary h-1.5 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span>Tamaño Proporcional</span>
                              <span className="text-white font-bold">{logoSizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              step="1"
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                              className="w-full accent-brand-primary h-1.5 cursor-pointer"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-amber-400/90 italic font-sans leading-relaxed">
                          ⚠️ No hay ningún logotipo activo. Genera uno en 'Logos' o súbelo en el panel de arriba.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAsset('products')}
                  disabled={!productPrompt.trim() || isGenerating}
                  className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-4 text-sm md:text-base shadow-lg shadow-brand-primary/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creando tu fotografía...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Crear Fotografía</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Result view panel (3 cols) */}
          <div className="lg:col-span-3 flex flex-col min-h-[560px] lg:min-h-[640px] p-6 lg:p-7 bg-surface-900/30 border border-white/10 rounded-2xl relative overflow-hidden shadow-xl">
            <h3 className="text-xs md:text-sm uppercase font-mono font-bold tracking-wider text-slate-300 border-b border-white/10 pb-3 mb-5 shrink-0 flex items-center justify-between">
              <span>Resultado del Diseño</span>
              {generatedResult && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Listo
                </span>
              )}
            </h3>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
                <div>
                  <p className="text-sm md:text-base text-white font-mono font-bold uppercase tracking-wider">Generando tu diseño...</p>
                  <p className="text-xs md:text-sm text-slate-400 mt-1.5">Estamos creando tu diseño con calidad profesional. Esto puede tomar unos segundos.</p>
                </div>
              </div>
            ) : generatedResult ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-5 scrollbar-thin">
                {generatedResult.startsWith('data:image/svg+xml;base64,') && (
                  <div className="p-3.5 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs text-brand-primary font-bold uppercase tracking-wider flex items-center justify-center gap-2 text-center shrink-0">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Diseño vectorial de muestra. Intenta de nuevo para renderizar versión fotorrealista.</span>
                  </div>
                )}
                {/* Image Display */}
                <div className="w-full aspect-square max-h-[420px] bg-[#121318] bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-4 relative group shrink-0 shadow-2xl">
                  <img
                    src={generatedResult}
                    alt="IA Output"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-xl"
                    onError={(e) => {
                      console.warn("[FUTURA UI] Image URL failed to render in browser, activating high-fidelity fallback...");
                      try {
                        const svgFallback = generateAdvancedDynamicSVG(
                          logoDescription || flyerPrompt || productPrompt,
                          logoBrandName || activeBrand?.name || 'MI MARCA',
                          logoDescription,
                          selectedCustomColors.length > 0 ? selectedCustomColors : undefined,
                          selectedLogoStyle
                        );
                        const b64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgFallback)))}`;
                        e.currentTarget.src = b64Svg;
                        setGeneratedResult(b64Svg);
                      } catch (err) {
                        console.error("[FUTURA UI] Fallback generation failed:", err);
                      }
                    }}
                  />
                </div>

                {/* 1-Click Action for Logos: Use in Flyers */}
                {generationType === 'logos' && (
                  <button
                    onClick={handleUseLogoInFlyers}
                    className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-primary/90 text-surface-950 font-black rounded-xl text-xs md:text-sm font-mono flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-brand-primary/20 shrink-0"
                  >
                    <Sparkles className="w-4 h-4 fill-surface-950" />
                    <span>Usar este Logo en Flyers y Avisos 🚀</span>
                  </button>
                )}

                {/* Actions Bar */}
                <div className="flex gap-2.5 mt-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => setIsEditingInCanvas(true)}
                    className="flex-1 min-w-[100px] py-3 px-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs md:text-sm font-mono font-bold flex items-center justify-center gap-2 border border-white/10 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-brand-primary" />
                    <span>Editar</span>
                  </button>
                  
                  {generationType === 'logos' && (
                    <button
                      onClick={handleSetAsOfficialLogo}
                      disabled={isSaving}
                      className="flex-1 min-w-[120px] py-3 px-3 bg-[#0a0a0a] border border-brand-primary/30 hover:bg-brand-primary/10 text-brand-primary disabled:opacity-40 rounded-xl text-xs md:text-sm font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Logo Oficial</span>
                    </button>
                  )}

                  <button
                    onClick={handleSaveToGallery}
                    disabled={isSaving}
                    className="flex-1 min-w-[100px] py-3 px-3 bg-[#0a0a0a] border border-white/10 hover:bg-white/5 text-slate-200 disabled:opacity-40 rounded-xl text-xs md:text-sm font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    ) : (
                      <Save className="w-4 h-4 text-brand-primary" />
                    )}
                    <span>A Galería</span>
                  </button>
                  
                  {/* Enviar a Marca Dropdown */}
                  <div className="relative flex-1 min-w-[100px]">
                    <button
                      onClick={() => setShowBrandSelector(!showBrandSelector)}
                      disabled={isSendingToBrand}
                      className="w-full py-3 px-3 bg-[#0a0a0a] border border-white/10 hover:bg-white/5 text-slate-200 disabled:opacity-40 rounded-xl text-xs md:text-sm font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {isSendingToBrand ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      ) : (
                        <Briefcase className="w-4 h-4 text-brand-primary" />
                      )}
                      <span>A Bóveda</span>
                    </button>
                    
                    {showBrandSelector && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#0c0c0c] border border-white/15 rounded-xl shadow-2xl p-2.5 z-50 max-h-52 overflow-y-auto space-y-1 scrollbar-thin">
                        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-white/5 mb-1 flex items-center justify-between font-bold">
                          <span>Selecciona Marca</span>
                          <button type="button" onClick={() => setShowBrandSelector(false)} className="text-sm hover:text-white font-bold cursor-pointer">×</button>
                        </div>
                        {projectsList.filter(p => p.id !== 'virtual-futura').length === 0 ? (
                          <div className="text-xs text-slate-500 italic p-3 text-center">
                            No tienes marcas creadas.
                          </div>
                        ) : (
                          projectsList.filter(p => p.id !== 'virtual-futura').map((brand) => (
                            <button
                              key={brand.id}
                              type="button"
                              onClick={() => handleSendToBrand(brand.id)}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-slate-200 hover:bg-brand-primary/10 hover:text-white text-xs md:text-sm font-sans truncate transition-colors cursor-pointer"
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
                    className="flex-1 min-w-[110px] py-3 px-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs md:text-sm font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-brand-primary/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </button>
                </div>

                {/* BRAND BINDING & CREATION BLOCK */}
                <div className="border-t border-white/10 pt-4 space-y-4 shrink-0">
                  <div className="bg-white/5 p-4 lg:p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs md:text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
                        Vincular a Bóveda de Marca
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewBrand(!isCreatingNewBrand)}
                        className="text-xs text-brand-primary hover:text-brand-primary/80 font-bold underline cursor-pointer"
                      >
                        {isCreatingNewBrand ? "Ver existentes" : "+ Crear Nueva Marca"}
                      </button>
                    </div>

                    {isCreatingNewBrand ? (
                      /* Create New Brand Flow */
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono text-slate-400">Nombre de la Nueva Marca</label>
                          <input
                            type="text"
                            placeholder="Ej. Café Ritual"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="w-full bg-[#090909] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateBrandAndSave}
                          disabled={!newBrandName.trim() || isSaving}
                          className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white disabled:opacity-40 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-md shadow-brand-primary/20"
                        >
                          {isSaving ? "Creando..." : "Crear y Vincular Diseño"}
                        </button>
                      </div>
                    ) : (
                      /* Bind to Existing Brand Flow */
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono text-slate-400">Seleccionar Marca Existente</label>
                          <select
                            value={selectedBrandId}
                            onChange={(e) => setSelectedBrandId(e.target.value)}
                            className="w-full bg-[#090909] border border-white/10 text-sm text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-primary/50 cursor-pointer"
                          >
                            <option value="">-- Elige una Marca --</option>
                            {projectsList.map((brand) => (
                              <option key={brand.id} value={brand.id}>📁 {brand.name}</option>
                            ))}
                          </select>
                        </div>
                        {selectedBrandId && (
                          <div className="flex gap-2.5 pt-1">
                            {generationType === 'logos' && (
                              <button
                                type="button"
                                onClick={handleSetAsOfficialLogo}
                                disabled={isSaving}
                                className="flex-1 py-2.5 bg-brand-primary/10 border border-brand-primary text-brand-primary hover:bg-brand-primary/20 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer"
                              >
                                Asignar Logo Oficial
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSendToBrand(selectedBrandId)}
                              disabled={isSaving}
                              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer"
                            >
                              Guardar en Bóveda
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Watermarking controls inside result block if logo available (only for flyers and products) */}
                  {customUploadedLogo && generationType !== 'logos' && (
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between select-none">
                        <label className="text-xs md:text-sm font-mono text-slate-300 cursor-pointer flex items-center gap-2 font-medium">
                          <input
                            type="checkbox"
                            checked={applyLogo}
                            onChange={(e) => setApplyLogo(e.target.checked)}
                            className="rounded border-white/10 text-brand-primary focus:ring-0 cursor-pointer accent-brand-primary w-4 h-4"
                          />
                          <span>Aplicar Logotipo Activo</span>
                        </label>
                      </div>

                      {applyLogo && (
                        <div className="space-y-3 pt-2 border-t border-white/5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-mono text-slate-400">Posición en la Imagen</label>
                            <div className="grid grid-cols-2 gap-1.5">
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
                                    "py-1.5 rounded-lg text-xs font-mono border text-center transition-all cursor-pointer",
                                    logoPosition === pos.id
                                      ? "bg-brand-primary/10 border-brand-primary text-white font-bold"
                                      : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span>Opacidad</span>
                              <span className="text-white font-bold">{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-brand-primary h-1.5 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span>Tamaño</span>
                              <span className="text-white font-bold">{logoSizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="8"
                              max="35"
                              step="1"
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                              className="w-full accent-brand-primary h-1.5 cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-3 py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm md:text-base text-slate-300 font-medium max-w-sm">Describe lo que quieres crear usando el formulario de la izquierda.</p>
                <p className="text-xs text-slate-500">Tus diseños aparecerán aquí con resolución completa y opciones de edición.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
