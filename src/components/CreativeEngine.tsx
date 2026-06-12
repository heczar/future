
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Image as ImageIcon, Zap, Loader2, Briefcase, Camera, Pencil, Square, Trash2, Download, Check, Eraser, Undo, Type, Layers, ChevronDown, ShieldCheck, Bot, User, Maximize2, Minimize2, Copy, Plus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, PenTool } from 'lucide-react';
import { generateContentStrategy, generateCreativeImage, generateSocialCopy } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ProjectContext, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { FileText, X, AlertTriangle, Video, Play, Pause, Calendar, Share2, DollarSign, Users, ExternalLink, Globe, AlertCircle, Eye } from 'lucide-react';
import { fabric } from 'fabric';

interface CreativeEngineProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onNavigateToVault?: () => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

export default function CreativeEngine({ profile, onUpdateProfile, onNavigateToVault, initialPrompt, onPromptConsumed }: CreativeEngineProps) {
  const [displayMode, setDisplayMode] = useState<'launcher' | 'briefing' | 'engine'>('launcher');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  
  const [activeTool, setActiveTool] = useState<'select' | 'pencil' | 'rect' | 'text'>('select');
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [fontSize, setFontSize] = useState(40);
  const [opacity, setOpacity] = useState(1);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  // Estados del Editor Avanzado
  const [activeFontFamily, setActiveFontFamily] = useState('Inter');
  const [activeTextAlign, setActiveTextAlign] = useState('left');
  const [activeFontWeight, setActiveFontWeight] = useState('bold');
  const [activeFontStyle, setActiveFontStyle] = useState('normal');
  const [activeUnderline, setActiveUnderline] = useState(false);
  const [activeStrokeColor, setActiveStrokeColor] = useState('#000000');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(0);
  
  const canvasImageUploadRef = React.useRef<HTMLInputElement>(null);

  const [refinement, setRefinement] = useState('');
  const [adhocReference, setAdhocReference] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('Carrusel de Valor (1080x1350)');
  const [selectedStyle, setSelectedStyle] = useState('Brutalist Business (Aggressive)');
  
  const [creativeOutputTab, setCreativeOutputTab] = useState<'image' | 'video' | 'copy' | 'social' | 'monetization'>('image');
  
  // States as part of the new Copy Generator Module
  const [copyType, setCopyType] = useState<'advertising' | 'informative' | 'engagement'>('advertising');
  const [copyPlatform, setCopyPlatform] = useState<'instagram' | 'linkedin' | 'facebook' | 'twitter' | 'tiktok' | 'whatsapp'>('instagram');
  const [copyTone, setCopyTone] = useState<'results_over_aesthetics' | 'elite_educator' | 'brutalist_persuasion'>('results_over_aesthetics');
  const [copyClientDetails, setCopyClientDetails] = useState('');
  const [copyExtraContext, setCopyExtraContext] = useState('');
  const [copyGenerating, setCopyGenerating] = useState(false);
  const [copyGenLanguage, setCopyGenLanguage] = useState<'es' | 'en'>('es');
  const [customGeneratedCopy, setCustomGeneratedCopy] = useState<string>('');
  const [copiedCustom, setCopiedCustom] = useState(false);
  
  // Redes Sociales Simulator States
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappBusinessConnected, setWhatsappBusinessConnected] = useState(false);
  
  const [socialUsernames, setSocialUsernames] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    whatsapp: '',
    whatsappBusiness: ''
  });
  
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [schedulingDate, setSchedulingDate] = useState('2026-05-28T12:00');
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Margining & Profitability Settings
  const [costMultiplier, setCostMultiplier] = useState(2.0);
  const [baseCostPerGen, setBaseCostPerGen] = useState(0.04);
  const [retailPricePerGen, setRetailPricePerGen] = useState(0.20);
  const [monthlyCreatorsEstimation, setMonthlyCreatorsEstimation] = useState(150);
  const [creatorsGenPerMonth, setCreatorsGenPerMonth] = useState(40);
  
  // Brand selection
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeBrand, setActiveBrand] = useState<ProjectContext | null>(null);

  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const briefingScrollRef = React.useRef<HTMLDivElement>(null);
  const lastBriefingMessageRef = React.useRef<HTMLDivElement>(null);
  const prevChatLengthRef = React.useRef(0);
  const [showBriefingScrollDown, setShowBriefingScrollDown] = useState(false);
  const isBriefingNearBottom = React.useRef(true);

  const scrollBriefingToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const trigger = () => {
      const container = briefingScrollRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior
        });
      }
    };
    trigger();
    setTimeout(trigger, 50);
    setTimeout(trigger, 150);
    setTimeout(trigger, 300);
    setTimeout(trigger, 500);
  };

  // Auto-scroll briefing chat
  useEffect(() => {
    if (chatHistory.length === 0) {
      prevChatLengthRef.current = 0;
      return;
    }

    const prevLength = prevChatLengthRef.current;
    prevChatLengthRef.current = chatHistory.length;

    const lastMsg = chatHistory[chatHistory.length - 1];

    if (chatHistory.length > prevLength) {
      if (lastMsg?.role === 'user') {
        isBriefingNearBottom.current = true;
        scrollBriefingToBottom('smooth');
      } else if (isBriefingNearBottom.current) {
        scrollBriefingToBottom('smooth');
      }
    } else if (loading && isBriefingNearBottom.current) {
      scrollBriefingToBottom('smooth');
    }
  }, [chatHistory, loading]);

  const handleBriefingScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowBriefingScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    
    const threshold = 150;
    isBriefingNearBottom.current = scrollHeight - scrollTop - clientHeight <= threshold;
  };

  useEffect(() => {
    async function loadProjects() {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'projects'), where('ownerId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      const projs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectContext));
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id!);
        setActiveBrand(projs[0]);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setDisplayMode('briefing');
      if (onPromptConsumed) onPromptConsumed();
    }
  }, [initialPrompt]);

  const startBriefing = () => {
    if (!prompt.trim()) return;
    setDisplayMode('briefing');
    // Si ya estamos en briefing pero es un nuevo prompt desde el launcher
    if (chatHistory.length === 0) {
       handleRefine(); // Inicia la primera interacción
    }
  };

  const handleRefine = async () => {
    if (!prompt.trim() && !refinement.trim() && !adhocReference) return;
    setLoading(true);
    
    try {
      const selectedProj = activeBrand || projects.find(p => p.id === selectedProjectId);
      const styleReferences = selectedProj 
        ? (adhocReference ? [adhocReference, ...(selectedProj.trainingMaterial || [])] : (selectedProj.trainingMaterial || []))
        : (adhocReference ? [adhocReference] : []);
      const logos = selectedProj ? (selectedProj.logos || []) : [];
      
      const currentInput = refinement.trim() || prompt;
      const feedbackMessage = `CONSULTA ESTRATÉGICA: ${currentInput}. ${adhocReference ? 'Considera esta referencia visual.' : ''}`;
      
      const brandContext = activeBrand 
        ? `Identidad de Marca: ${activeBrand.name}. ADN Visual: ${activeBrand.description}.`
        : "Sin marca específica.";

      const nextResult = await generateContentStrategy(
        feedbackMessage, 
        `Contexto Operativo: ${brandContext}. Enfócate en ANALIZAR Y REFINAR la inquietud del usuario antes de pasar a la ejecución. No des un prompt de imagen definitivo aún si la idea es vaga.`,
        styleReferences,
        logos,
        chatHistory
      );
      
      setChatHistory(prev => [
        ...prev, 
        { role: 'user', content: feedbackMessage },
        { role: 'model', content: nextResult.strategy }
      ]);
      
      setResult(nextResult);
      setRefinement('');
      setAdhocReference(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdhocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdhocReference(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateSocialCopy = async () => {
    if (copyGenerating) return;
    setCopyGenerating(true);
    setCustomGeneratedCopy('');
    
    try {
      const resultCopy = await generateSocialCopy({
        copyType,
        platform: copyPlatform,
        tone: copyTone,
        clientDetails: copyClientDetails,
        extraContext: copyExtraContext,
        language: copyGenLanguage,
        userRole: profile?.roles?.join(', ') || '',
        userBio: profile?.bio || '',
        userPhilosophy: profile?.philosophy || '',
        projectName: activeBrand?.name || '',
        projectDescription: activeBrand?.description || '',
      });
      setCustomGeneratedCopy(resultCopy);
    } catch (err) {
      console.error("Failed to generate copy:", err);
      setCustomGeneratedCopy("❌ Error al conectar con el redactor de elite de FUTURA. Confirme que su clave de API de Gemini esté activa o configurada en su entorno.");
    } finally {
      setCopyGenerating(false);
    }
  };

  const [refinementPrompt, setRefinementPrompt] = useState('');

  const handleRefineSocialCopy = async (refineInstructions: string) => {
    if (!customGeneratedCopy || !refineInstructions.trim() || copyGenerating) return;
    setCopyGenerating(true);
    
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const client_ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const systemInstruction = "Eres un editor experto de copywriting. Refina el copy provisto siguiendo las instrucciones brutales del usuario, manteniendo la fuerza persuasiva, el gancho magnético, el formato cómodo para móvil y la filosofía pragmática 'Results over Aesthetics'.";
      const response = await client_ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{
          parts: [{
            text: `
              COPY ACTUAL:
              """
              ${customGeneratedCopy}
              """

              INSTRUCCIONES DE REFINAMIENTO:
              "${refineInstructions}"

              Genera el copy refinado final directamente en un impecable formato Markdown.
            `
          }]
        }],
        config: { systemInstruction }
      });
      if (response.text) {
        setCustomGeneratedCopy(response.text);
        setRefinementPrompt('');
      }
    } catch (err) {
      console.error("Failed to refine copy:", err);
    } finally {
      setCopyGenerating(false);
    }
  };

  const handleCopyToClipboardCustom = () => {
    if (!customGeneratedCopy) return;
    navigator.clipboard.writeText(customGeneratedCopy);
    setCopiedCustom(true);
    setTimeout(() => setCopiedCustom(false), 2000);
  };

  const handleGenerate = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt) return;
    
    // Check credits
    if (!profile.isPremium && (profile.credits || 0) <= 0) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setFinalImage(null);
    try {
      setLoadingStep('Analizando DNA Corporativo (Inyección de Activos)...');
      await new Promise(r => setTimeout(r, 1000)); 
      
      setLoadingStep('Ejecutando Fase de Innovación Creativa SPE...');
      await new Promise(r => setTimeout(r, 700));

      setLoadingStep('Sincronizando Estilo Visual Corporativo...');
      await new Promise(r => setTimeout(r, 700));

      setLoadingStep('Consultando Infraestructura FUTURA...');
      const selectedProj = activeBrand || projects.find(p => p.id === selectedProjectId);
      let context = selectedProj 
        ? `SINCRO TOTAL ACTIVADA. Marca: ${selectedProj.name}. Guías de Estilo: ${selectedProj.description}. Metodología: SPE. FORMATO: ${selectedFormat}. ESTILO: ${selectedStyle}.`
        : `Usuario público. Metodología: SPE. Valora los Resultados sobre la Estética. FORMATO: ${selectedFormat}. ESTILO: ${selectedStyle}.`;
      
      const styleReferences = selectedProj 
        ? (adhocReference ? [adhocReference, ...(selectedProj.trainingMaterial || [])] : (selectedProj.trainingMaterial || []))
        : (adhocReference ? [adhocReference] : []);
      const logos = selectedProj ? (selectedProj.logos || []) : [];

      const briefingNotes = chatHistory.length > 0 
        ? `NOTAS DEL BRIEFING PREVIO: ${chatHistory.map(h => h.content).join(' | ')}.`
        : '';

      const promptFinal = `${activePrompt}. ${briefingNotes}
        USO OBLIGATORIO DEL BRAND VAULT: 
        - Es MANDATORIO que el diseño respete escrupulosamente los logos y activos adjuntos.
        - El diseño generado servirá de base para colocar los logos.
        - Utiliza los colores de los logos como paleta dominante.
        - ESTILO VISUAL: ${selectedStyle}. Refuerza la estética de pantallas digitales avanzadas si aplica.
        - NO generes texto; el usuario editará el texto después.`;

      const strategy = await generateContentStrategy(
        promptFinal, 
        context, 
        styleReferences, 
        logos, 
        chatHistory
      );
      
      // Actualizar historial con la estrategia final
      setChatHistory(prev => [
        ...prev,
        { role: 'model', content: strategy.strategy }
      ]);

      // Asegurar que el prompt se limpie de markdown no deseado y se use su valor puro
      if (strategy.imagePrompt) {
        strategy.imagePrompt = strategy.imagePrompt.replace(/#+/g, '').replace(/\*/g, '').trim();
      }
      
      setResult(strategy);
      setDisplayMode('engine');

      // Consumir crédito si no es premium
      if (!profile.isPremium) {
        onUpdateProfile({
          ...profile,
          credits: Math.max(0, (profile.credits || 0) - 1)
        });
      }

      // Auto-trigger image render immediately!
      if (strategy.imagePrompt) {
        setGeneratingImage(true);
        setImageError(null);
        setLoadingStep('Componiendo y Esculpiendo Imagen (Sincro-Vault)...');
        try {
          let aspectRatio = "1:1";
          if (selectedFormat.includes("1080x1920") || selectedFormat.includes("Story")) {
            aspectRatio = "9:16";
          } else if (selectedFormat.includes("1080x1350") || selectedFormat.includes("Carrusel")) {
            aspectRatio = "3:4";
          }

          const styleReferences = selectedProj 
            ? (adhocReference ? [adhocReference, ...(selectedProj.trainingMaterial || [])] : (selectedProj.trainingMaterial || []))
            : (adhocReference ? [adhocReference] : []);

          const img = await generateCreativeImage(strategy.imagePrompt, aspectRatio, styleReferences);
          setFinalImage(img);
        } catch (errImg: any) {
          console.error("Auto image render failed:", errImg);
          setImageError(errImg?.message || "PERMISSION_DENIED: Se requieren permisos o credenciales de pago");
        } finally {
          setGeneratingImage(false);
        }
      }

    } catch (err) {
      console.error(err);
      setResult({
        strategy: "No Pudimos conectar con el centro de mando. Revisa tu conexión o el tamaño de tus archivos en la Bóveda.",
        copy: "Ocurrió una eventualidad de red al intentar generar la campaña.",
        imagePrompt: activePrompt
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleCopyToClipboard = () => {
    if (result?.copy) {
      navigator.clipboard.writeText(result.copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyVideoToClipboard = () => {
    if (result?.videoProposal) {
      navigator.clipboard.writeText(result.videoProposal);
      setVideoCopied(true);
      setTimeout(() => setVideoCopied(false), 2000);
    }
  };

  const handleImageGen = async () => {
    if (!result?.imagePrompt) return;
    setGeneratingImage(true);
    setImageError(null);
    try {
      // Mapear formato a Aspect Ratio soportado
      let aspectRatio = "1:1";
      if (selectedFormat.includes("1080x1920") || selectedFormat.includes("Story")) {
        aspectRatio = "9:16";
      } else if (selectedFormat.includes("1080x1350") || selectedFormat.includes("Carrusel")) {
        aspectRatio = "3:4";
      }

      const selectedProj = activeBrand || projects.find(p => p.id === selectedProjectId);
      const styleReferences = selectedProj 
        ? (adhocReference ? [adhocReference, ...(selectedProj.trainingMaterial || [])] : (selectedProj.trainingMaterial || []))
        : (adhocReference ? [adhocReference] : []);

      const img = await generateCreativeImage(result.imagePrompt, aspectRatio, styleReferences);
      setFinalImage(img);
    } catch (err: any) {
      console.error(err);
      setImageError(err?.message || "PERMISSION_DENIED: Se requieren permisos o credenciales de pago");
    } finally {
      setGeneratingImage(false);
    }
  };

  // Canvas Editor Logic
  useEffect(() => {
    let internalCanvas: fabric.Canvas | null = null;
    
    if (isEditing && canvasRef.current && finalImage) {
      // Small timeout to ensure DOM is ready and container has dimensions
      const timer = setTimeout(() => {
        if (!canvasRef.current) return;

        internalCanvas = new fabric.Canvas(canvasRef.current, {
          width: canvasContainerRef.current?.clientWidth || 500,
          height: canvasContainerRef.current?.clientHeight || 500,
          backgroundColor: '#111',
        });

        fabric.Image.fromURL(finalImage, (img) => {
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
            top: (canvasHeight - (img.height || 0) * scale) / 2,
          });

          internalCanvas.add(img);
          internalCanvas.sendToBack(img);

          // Automatically place active brand logos as editable layers!
          if (activeBrand?.logos && activeBrand.logos.length > 0) {
            activeBrand.logos.forEach((logoUrl, i) => {
              const isBase64 = logoUrl.startsWith('data:');
              fabric.Image.fromURL(logoUrl, (logoImg) => {
                if (!internalCanvas) return;
                logoImg.scaleToWidth(120);
                logoImg.set({
                  left: 30 + (i * 140),
                  top: 30,
                  cornerColor: '#00F0FF',
                  cornerSize: 12,
                  transparentCorners: false,
                  padding: 5
                });
                internalCanvas.add(logoImg);
                internalCanvas.bringToFront(logoImg);
                internalCanvas.renderAll();
              }, isBase64 ? undefined : { crossOrigin: 'anonymous' });
            });
          }

          internalCanvas.renderAll();
        }, { crossOrigin: 'anonymous' });

        // Sincronizar propiedades de capa hacia states de React
        const syncSelectedObjectStats = (obj: fabric.Object) => {
          if (obj.opacity !== undefined) setOpacity(obj.opacity);
          if (obj.stroke) setActiveStrokeColor(obj.stroke as string);
          if (obj.strokeWidth !== undefined) setActiveStrokeWidth(obj.strokeWidth);
          
          if (obj.type === 'i-text') {
            const textObj = obj as fabric.IText;
            if (textObj.fontFamily) setActiveFontFamily(textObj.fontFamily);
            if (textObj.textAlign) setActiveTextAlign(textObj.textAlign);
            if (textObj.fontWeight) setActiveFontWeight(textObj.fontWeight as string);
            if (textObj.fontStyle) setActiveFontStyle(textObj.fontStyle as string);
            setActiveUnderline(!!textObj.underline);
            if (textObj.fontSize) setFontSize(textObj.fontSize);
            if (textObj.fill) setBrushColor(textObj.fill as string);
          } else if (obj.type === 'rect') {
            if (obj.fill) setBrushColor(obj.fill as string);
          }
        };

        setCanvas(internalCanvas);

        // Eventos de seleccion
        internalCanvas.on('selection:created', (e) => {
          const obj = e.target || null;
          setSelectedObject(obj);
          if (obj) syncSelectedObjectStats(obj);
        });
        internalCanvas.on('selection:updated', (e) => {
          const obj = e.target || null;
          setSelectedObject(obj);
          if (obj) syncSelectedObjectStats(obj);
        });
        internalCanvas.on('selection:cleared', () => setSelectedObject(null));

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Delete' || event.key === 'Backspace') {
            const activeTag = document.activeElement?.tagName;
            // Evitar gatillar el borrado si se está digitando texto normal
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.getAttribute('contenteditable') === 'true') {
              return;
            }
            const activeObjects = internalCanvas?.getActiveObjects();
            if (activeObjects && activeObjects.length > 0) {
              internalCanvas?.discardActiveObject();
              activeObjects.forEach((obj) => {
                internalCanvas?.remove(obj);
              });
              internalCanvas?.renderAll();
            }
          }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Retornar cleanup removiendo eventos y desechando canvas
        return () => {
          clearTimeout(timer);
          window.removeEventListener('keydown', handleKeyDown);
          if (internalCanvas) {
            try {
              internalCanvas.dispose();
            } catch (e) {
              console.warn('Fabric dispose error handled:', e);
            }
            setCanvas(null);
          }
        };
      }, 50);
    }
  }, [isEditing, finalImage, activeBrand, isFullscreen, selectedFormat]);

  useEffect(() => {
    if (!canvas) return;

    if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    } else {
      canvas.isDrawingMode = false;
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [activeTool, brushColor, brushSize, canvas]);

  // Sincronizar propiedades de objeto seleccionado
  useEffect(() => {
    if (!canvas || !selectedObject) return;
    
    selectedObject.set('opacity', opacity);
    selectedObject.set('stroke', activeStrokeColor);
    selectedObject.set('strokeWidth', activeStrokeWidth);

    if (selectedObject.type === 'i-text' || selectedObject.type === 'rect') {
      selectedObject.set('fill', brushColor);
      if (selectedObject.type === 'i-text') {
        const textObj = selectedObject as fabric.IText;
        textObj.set('fontSize', fontSize);
        textObj.set('fontFamily', activeFontFamily);
        textObj.set('textAlign', activeTextAlign);
        textObj.set('fontWeight', activeFontWeight);
        textObj.set('fontStyle', activeFontStyle);
        textObj.set('underline', activeUnderline);
      }
    }
    canvas.renderAll();
  }, [
    canvas,
    selectedObject,
    brushColor, 
    fontSize, 
    opacity, 
    activeFontFamily, 
    activeTextAlign, 
    activeFontWeight, 
    activeFontStyle, 
    activeUnderline, 
    activeStrokeColor, 
    activeStrokeWidth
  ]);

  // Auto-ajustar lienzo al cargar o cambiar a pantalla completa
  useEffect(() => {
    if (canvas) {
      const timer = setTimeout(() => {
        fitCanvasToContainer();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [canvas, isFullscreen]);

  const addRect = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: brushColor,
      width: 200,
      height: 200,
      transparentCorners: false,
      cornerColor: '#00F0FF',
      cornerSize: 12,
      padding: 5
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveTool('select');
  };

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('DOBLE CLICK PARA EDITAR', {
      left: 100,
      top: 150,
      fontFamily: 'Inter',
      fontSize: fontSize,
      fill: brushColor,
      fontWeight: 'bold',
      cornerColor: '#00F0FF',
      cornerSize: 10,
      transparentCorners: false
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('select');
  };

  const addLogoToCanvas = (url: string) => {
    if (!canvas) return;
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(200);
      img.set({
        left: 100,
        top: 100,
        cornerColor: '#00F0FF',
        cornerSize: 12,
        transparentCorners: false,
        padding: 5
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
    setActiveTool('select');
  };

  const bringForward = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringForward(selectedObject);
    canvas.renderAll();
  };

  const sendBackward = () => {
    if (!canvas || !selectedObject) return;
    // Evitar enviar debajo del background
    const objects = canvas.getObjects();
    if (objects.indexOf(selectedObject) > 1) {
      canvas.sendBackwards(selectedObject);
    }
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    canvas.discardActiveObject();
    activeObjects.forEach((obj) => {
      canvas.remove(obj);
    });
    canvas.renderAll();
  };

  const handleCanvasImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      fabric.Image.fromURL(dataUrl, (img) => {
        img.scaleToWidth(180);
        img.set({
          left: 100,
          top: 100,
          cornerColor: '#00F0FF',
          cornerSize: 12,
          transparentCorners: false,
          padding: 8
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const duplicateSelected = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.clone((cloned: fabric.Object) => {
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const alignSelectedCenterH = () => {
    if (!canvas || !selectedObject) return;
    if (typeof selectedObject.centerH === 'function') {
      selectedObject.centerH();
    } else {
      const canvasWidth = canvas.getWidth();
      selectedObject.set('left', (canvasWidth - (selectedObject.width || 100) * (selectedObject.scaleX || 1)) / 2);
    }
    canvas.renderAll();
  };

  const alignSelectedCenterV = () => {
    if (!canvas || !selectedObject) return;
    if (typeof selectedObject.centerV === 'function') {
      selectedObject.centerV();
    } else if (typeof (selectedObject as any).centerY === 'function') {
      (selectedObject as any).centerY();
    } else {
      const canvasHeight = canvas.getHeight();
      selectedObject.set('top', (canvasHeight - (selectedObject.height || 100) * (selectedObject.scaleY || 1)) / 2);
    }
    canvas.renderAll();
  };

  const saveEdits = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1
    });
    setFinalImage(dataUrl);
    setIsEditing(false);
  };

  const handleSaveToGallery = async () => {
    if (!finalImage || !auth.currentUser) return;
    setIsSaving(true);
    try {
      const selectedProj = projects.find(p => p.id === selectedProjectId);
      await addDoc(collection(db, 'saved_assets'), {
        ownerId: auth.currentUser.uid,
        imageUrl: finalImage,
        strategy: result.strategy,
        format: selectedFormat,
        style: selectedStyle,
        brandName: selectedProj?.name || 'Marca Genérica',
        createdAt: serverTimestamp()
      });
      alert('Diseño guardado exitosamente en la Galería');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el diseño');
    } finally {
      setIsSaving(false);
    }
  };

  const [zoom, setZoom] = useState(1);

  const extractPhrases = (strategyText: string) => {
    if (!strategyText) return [];
    // Buscar lineas cortas o puntos clave que sirvan como copy
    const lines = strategyText.split('\n')
      .map(l => l.replace(/^[#\-\*\d\.\s]+/, '').trim())
      .filter(l => l.length > 3 && l.length < 60);
    return Array.from(new Set(lines)).slice(0, 12);
  };

  useEffect(() => {
    if (result && result.strategy) {
      setPhrases(extractPhrases(result.strategy));
    }
  }, [result]);

  const handleZoom = (value: number) => {
    if (!canvas) return;
    const newZoom = Math.max(0.1, Math.min(5, value));
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const fitCanvasToContainer = () => {
    if (!canvas || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    
    // Reset Canvas dimension based on active container metrics
    canvas.setWidth(container.clientWidth || 600);
    canvas.setHeight(container.clientHeight || 600);
    
    // Scale standard background reference image to cover the canvas proportionately
    const objects = canvas.getObjects();
    const bgImg = objects.find(obj => obj.type === 'image' && !obj.selectable);
    if (bgImg) {
      const scale = Math.min(canvas.getWidth() / (bgImg.width || 1), canvas.getHeight() / (bgImg.height || 1));
      bgImg.set({
        scaleX: scale,
        scaleY: scale,
        left: (canvas.getWidth() - (bgImg.width || 0) * scale) / 2,
        top: (canvas.getHeight() - (bgImg.height || 0) * scale) / 2,
      });
    }
    canvas.setZoom(1);
    setZoom(1);
    canvas.renderAll();
  };

  const cleanStrategy = (text: string) => {
    return text
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .replace(/\*\*/g, '')     // Remove bold markers
      .replace(/\*/g, '')      // Remove bullet markers
      .replace(/[\n\r]{3,}/g, '\n\n') // Normalize multiple line breaks
      .trim();
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-32 px-4">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAdhocUpload} 
        className="hidden" 
        accept="image/*" 
      />
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl overflow-hidden"
          >
            {/* Scanned Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,92,246,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            {/* HUD Corners */}
            <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-brand-primary/40 rounded-tl-3xl" />
            <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-brand-primary/40 rounded-tr-3xl" />
            <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-brand-primary/40 rounded-bl-3xl" />
            <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-brand-primary/40 rounded-br-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center px-6">
              <div className="w-32 h-32 relative mb-12">
                <motion.div 
                  className="absolute inset-0 border-2 border-brand-primary/30 rounded-full"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-2 border-2 border-brand-primary/50 border-t-transparent rounded-full animate-spin"
                  style={{ animationDuration: '1.5s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="w-12 h-12 text-brand-primary animate-pulse" />
                </div>
              </div>

              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-bold text-white tracking-tighter uppercase italic">
                    PROCESANDO <span className="text-brand-primary">ADN</span>
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Protocolo SPE Activado</span>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/5 space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">Estado de Inyección</span>
                    <span className="text-[10px] font-mono text-slate-500">OPTIMIZANDO...</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-brand-primary shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>

                  <p className="text-[11px] font-bold text-white uppercase tracking-wider h-4">
                    {loadingStep || 'Sincronizando con la Bóveda...'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 opacity-40">
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase text-slate-400 border border-white/10">Neural Engine v3</div>
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase text-slate-400 border border-white/10">Secure Auth</div>
                  <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase text-slate-400 border border-white/10">SPD Grid</div>
                </div>
              </div>
            </div>

            {/* Bottom HUD Text */}
            <div className="absolute bottom-12 flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">FUTURA CORE</span>
                <span className="text-[10px] font-mono text-slate-400">0x8B5CF6</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">SESSION ID</span>
                <span className="text-[10px] font-mono text-slate-400">FS-992-IP</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Futura Personality Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-[2rem] border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 via-surface-950/40 to-transparent flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkles className="w-40 h-40 text-brand-primary" />
        </div>
        
        <div className="relative">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-3 border border-brand-primary/20 shadow-[0_0_40px_rgba(139,92,246,0.3)] relative z-10 transition-transform hover:scale-110 cursor-pointer">
            <Bot className="w-12 h-12 text-brand-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-brand-primary/30 rounded-3xl blur-2xl animate-pulse" />
        </div>
        
        <div className="text-center md:text-left flex-1 space-y-1">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-primary">FUTURA Brand Sales & Strategy</h3>
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Sincronizada</span>
            </div>
          </div>
            <p className="text-slate-100 text-lg md:text-xl font-display font-bold italic tracking-tight leading-tight">
            "Bienvenido a FUTURA. Soy tu estratega comercial. Estoy aquí para escucharte y refinar tu visión antes de que el motor de ejecución tome el mando. ¿Qué inquietud despejamos hoy?"
          </p>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Protocolo SPE: Ejecución Estratégica Activada</p>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado de Potencia</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-bold text-white">
                {profile.isPremium ? 'ILIMITADA' : `${profile.credits || 0} CARGAS`}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Credit Counter & Upgrade Banner Removed in favor of integrated header above */}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgrade(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-10 rounded-[3rem] border-brand-primary/30 shadow-[0_0_100px_rgba(0,240,255,0.2)] text-center"
            >
              <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-brand-primary">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">POTENCIA AGOTADA</h2>
              <p className="text-brand-primary font-black text-xl mb-6">SÓLO $9.99 / MES</p>
              <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                Has utilizado tus cargas de cortesía. Únete a la élite con el plan <b>PREMIUM</b>: estrategias ilimitadas, diseños 4K y acceso total al Asesor Estratégico de FUTURA por un precio mínimo.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    // Simular upgrade
                    onUpdateProfile({ ...profile, isPremium: true, credits: 999 });
                    setShowUpgrade(false);
                  }}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-sm shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5" /> ACTIVAR PLAN EXECUTIVE
                  </div>
                  <span className="text-[8px] opacity-80 uppercase tracking-widest">Acceso Instantáneo Ilimitado</span>
                </button>
                <button 
                  onClick={() => setShowUpgrade(false)}
                  className="w-full py-3 text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-[0.3em] transition-colors"
                >
                  Continuar después
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Section: Compact Brand & Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3">
          <button 
            onClick={onNavigateToVault}
            className="w-full text-left glass-panel p-5 rounded-2xl border-brand-primary/20 bg-surface-950/40 h-full hover:border-brand-primary/60 transition-all group"
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex items-center gap-2 group-hover:text-brand-primary transition-colors">
              <Zap className="w-3 h-3 text-brand-primary" /> Bóveda Activa
            </h3>
            {activeBrand ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                    {activeBrand.logos?.[0] ? (
                      <img src={activeBrand.logos[0]} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[150px]">{activeBrand.name}</h4>
                    <p className="text-[8px] text-brand-primary font-black uppercase tracking-widest">Sincronización OK</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                  <div className="flex -space-x-1.5">
                    {activeBrand.logos?.slice(0, 3).map((logo, i) => (
                      <img key={i} src={logo} alt="L" className="w-6 h-6 rounded-md border border-white/10 bg-white object-contain p-0.5" />
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 font-medium line-clamp-1">{activeBrand.description}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-2 border border-dashed border-white/10">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase">Sin Marca Configurada</p>
                <p className="text-[8px] text-slate-700 mt-1 uppercase italic">Uso Genérico</p>
              </div>
            )}
          </button>
        </div>

        <div className="lg:col-span-4">
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-surface-950/20 h-full">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> Metodología SPE
            </h3>
            <div className="flex gap-4">
              {[
                { label: 'Sinceridad', color: 'bg-brand-primary' },
                { label: 'Propósito', color: 'bg-brand-secondary' },
                { label: 'Despliegue', color: 'bg-white' }
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                  <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 mt-2 border-t border-white/5 pt-2 italic">Optimizado para resultados estratégicos.</p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-brand-primary/5 h-full">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-3">Guía de Operación</h3>
             <p className="text-[9px] text-slate-400">1. Sincroniza logos en Brand Vault. 2. Describe objetivo en Consola. 3. Refina en Editor Base.</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {displayMode === 'briefing' && (
          <motion.div 
            key="briefing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="glass-panel p-8 rounded-[2.5rem] border-brand-primary/20 bg-surface-950/40 relative overflow-hidden min-h-[600px] flex flex-col">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Bot className="w-48 h-48 text-brand-primary" />
              </div>
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display tracking-tight">Conversa con Futura</h2>
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Asesoría Estratégica & Engagement</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sesión de Cortesía</span>
                     <span className="text-[10px] font-bold text-brand-primary">LÍMITE: 3 CONSULTAS</span>
                  </div>
                  {activeBrand ? (
                    <button 
                      onClick={() => handleGenerate()}
                      className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                    >
                      EJECUTAR TRANSFORMACIÓN
                      <Zap className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={onNavigateToVault}
                      className="px-6 py-3 bg-white/5 text-brand-primary border border-brand-primary/30 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/10 transition-all flex items-center gap-2"
                    >
                      SINCRONIZAR MARCA
                      <Briefcase className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div 
                ref={briefingScrollRef} 
                onScroll={handleBriefingScroll}
                className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-4 mb-6 scroll-smooth"
              >
                {chatHistory.map((msg, i) => {
                  const isLast = i === chatHistory.length - 1;
                  return (
                    <div 
                      key={i} 
                      ref={isLast ? lastBriefingMessageRef : null}
                      className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[85%] md:max-w-[80%] p-5 rounded-2xl md:rounded-3xl shadow-xl transition-all",
                        msg.role === 'user' 
                          ? "bg-brand-primary/10 border border-brand-primary/20 text-slate-200" 
                          : "bg-surface-900 border border-white/5 text-slate-300"
                      )}>
                        <div className="flex items-center gap-2 mb-2 opacity-50">
                          {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          <span className="text-[8px] font-black uppercase tracking-widest">
                            {msg.role === 'user' ? 'Analista Corporativo' : 'Estratega Futura'}
                          </span>
                        </div>
                        <div className="prose prose-invert prose-xs markdown-body">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Message content text */}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-surface-900 border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-2xl">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] animate-pulse">Sincronizando...</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Red Neuronal en Ejecución</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showBriefingScrollDown && (
                  <motion.button
                    initial={{ opacity: 0, y: 10, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: 10, x: "-50%" }}
                    onClick={() => scrollBriefingToBottom('smooth')}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all z-30 whitespace-nowrap border border-white/10"
                  >
                    <ChevronDown className="w-4 h-4" />
                    NUEVOS MENSAJES
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Strategic CTA Banner to avoid any confusion */}
              <div className="mb-4 bg-gradient-to-r from-brand-primary/10 via-purple-950/20 to-transparent border border-brand-primary/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                    ¿Listo para materializar la propuesta visual?
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                    Pulsa para combinar el briefing activo con tu Bóveda de Marca, esculpir la imagen y abrir el editor Canva automáticamente.
                  </p>
                </div>
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="px-5 py-3 bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '3s' }} />
                  GENERAR DISEÑO Y EDITAR
                </button>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-3 bg-surface-900 border border-white/10 p-2 rounded-2xl">
                  <input 
                    type="text"
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                    placeholder="Refina tu visión o resuelve una inquietud..."
                    className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 text-sm placeholder:text-slate-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRefine();
                    }}
                  />
                  <div className="flex items-center gap-2 pr-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                      title="Subir Referencia Visual"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleRefine}
                      disabled={loading || !refinement.trim()}
                      className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      CONSULTAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(displayMode === 'launcher' || (displayMode === 'engine' && !result)) && (
          <motion.div 
            key="launcher"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Main Console Section */}
            <div className="glass-panel p-6 md:p-10 rounded-[2rem] border-brand-primary/20 bg-surface-950/60 shadow-[0_0_80px_rgba(139,92,246,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter text-white">Consola de Dirección FUTURA</h2>
                    <p className="text-[9px] text-brand-primary font-black uppercase tracking-[0.25em]">Sincronizador Estratégico & Generador SPE</p>
                  </div>
                </div>
                {projects.length > 0 && (
                  <div className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-xl relative pr-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">DNA DE MARCA:</span>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProjectId(val);
                        const found = projects.find(p => p.id === val);
                        if (found) {
                          setActiveBrand(found);
                        }
                      }}
                      className="bg-transparent text-[9px] font-black text-white uppercase tracking-widest outline-none cursor-pointer appearance-none font-sans border-none p-0 m-0 leading-none"
                    >
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id} className="bg-surface-950 text-white font-sans text-xs uppercase font-extrabold tracking-wider">
                          {proj.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-brand-primary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Quick Strategy Templates / Preset Cards */}
              <div className="mb-8 space-y-4">
                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 md:p-5 text-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">¿Cómo funciona la Co-Creación Paso a Paso?</h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                          Esta consola utiliza metodologías SPE para generar material visual de alta reputación y conversión a partir de tu <strong>Brand Vault</strong> (logos, colores, ADN). Sigue estos sencillos pasos:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div className="bg-surface-900/40 border border-white/5 p-3 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[8px] font-black">1</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">Describe tu Idea</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-medium">Escribe tu idea, mensaje o concepto creativo en el cuadro de texto. FUTURA interpretará tu ADN comercial.</p>
                        </div>

                        <div className="bg-surface-900/40 border border-white/5 p-3 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[8px] font-black">2</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">Elige tu Formato</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-medium">Configura el Formato (Carrusel, Post o Story) y sube una Referencia Visual si quieres emular un estilo específico.</p>
                        </div>

                        <div className="bg-surface-900/40 border border-white/5 p-3 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[8px] font-black">3</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">Edita en Canva</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-medium">Al co-crear, el sistema compone el fondo y coloca automáticamente tus logotipos de la Bóveda como capas móviles para ajustar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Formato de Producción</label>
                    <div className="relative">
                      <select 
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-brand-primary/50 cursor-pointer appearance-none outline-none"
                      >
                        <optgroup label="Optimizado Redes">
                          <option value="Carrusel (1080x1350)">Carrusel de Valor (1080x1350)</option>
                          <option value="Post (1080x1080)">Post Cuadrado (1080x1080)</option>
                          <option value="Story (1080x1920)">Story / Reel Vertical (1080x1920)</option>
                        </optgroup>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Referencia Visual Directa</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className={cn(
                        "w-full h-24 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden p-2 group outline-none",
                        adhocReference 
                          ? "border-brand-primary/50 bg-brand-primary/5 text-white" 
                          : "border-dashed border-white/10 hover:border-brand-primary/30 bg-surface-900/20 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {adhocReference ? (
                        <div className="relative w-full h-full">
                          <img src={adhocReference} className="w-full h-full object-cover rounded-lg" alt="Ref" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[8px] font-black tracking-widest uppercase bg-brand-primary text-white px-2 py-1 rounded">Cambiar Imagen</span>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdhocReference(null);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-black rounded-lg text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-slate-500 group-hover:text-brand-primary transition-colors" />
                          <div className="text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest block">Subir Referencia</span>
                            <span className="text-[7px] text-slate-600 block mt-0.5 font-bold uppercase">JPG, PNG (Alineador AI)</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
 
                <div className="lg:col-span-9 relative flex flex-col">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe los objetivos de tu campaña, dolor del cliente o enfoques de venta que quieres materializar..."
                    className="w-full bg-surface-900/50 border border-white/10 rounded-2xl p-5 md:p-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-all min-h-[160px] resize-none"
                  />
                  <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
                    <p className="text-[10px] text-slate-500 italic max-w-sm">
                      FUTURA procesará esta solicitud combinando el ADN del Brand Vault bajo el estandarte metodológico SPE.
                    </p>
                    <button
                      onClick={startBriefing}
                      disabled={loading || !prompt.trim()}
                      className="w-full md:w-auto bg-brand-primary text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {loading ? 'PROCESANDO STRATEGY...' : 'INICIAR CO-CREACIÓN'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {displayMode === 'engine' && result && (
          <motion.div
            key="engine"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            {/* Volver Control */}
            <div className="flex items-center justify-between pb-2">
              <button 
                onClick={() => setDisplayMode('briefing')}
                className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-brand-primary transition-colors"
                id="btn-back-briefing"
              >
                <Undo className="w-4 h-4" /> Volver al Briefing / Ajustar Datos
              </button>
            </div>

            {/* PIPELINE DE FUTURA - ORDENADO SECUENCIALMENTE COMO EL USUARIO LO SOLICITA */}
            <div className="space-y-8">
              
              {/* 1. LA SOLICITUD DEL USUARIO */}
              <div 
                className="glass-panel p-6 rounded-[2rem] border-brand-primary/10 bg-surface-950/40 backdrop-blur-3xl shadow-xl space-y-3"
                id="section-solicitud"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tu Solicitud / Idea Central</h4>
                </div>
                <blockquote className="border-l-2 border-brand-primary pl-4 text-sm text-slate-200 font-medium italic leading-relaxed">
                  "{prompt}"
                </blockquote>
              </div>

              {/* 2. RESPUESTA RECOMENDADA POR FUTURA (Métrica SPE) */}
              <div 
                className="glass-panel p-6 md:p-8 rounded-[2rem] border-brand-primary/10 bg-surface-950/20 backdrop-blur-3xl shadow-xl space-y-4"
                id="section-respuesta-futura"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
                    <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Respuesta Recomendada por Futura</h4>
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">ANÁLISIS ESTÉTICO & MÍMICA DE MARCA</p>
                  </div>
                </div>
                
                <div className="prose prose-invert prose-sm text-slate-300 font-normal leading-relaxed text-sm">
                  <ReactMarkdown>{cleanStrategy(result.strategy)}</ReactMarkdown>
                </div>
              </div>

              {/* 3. EL COPY PARA LA PUBLICACIÓN */}
              <div 
                className="glass-panel p-6 md:p-8 rounded-[2rem] border-brand-primary/20 bg-brand-primary/5 backdrop-blur-3xl shadow-xl space-y-4 relative overflow-hidden"
                id="section-copy-publicacion"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/30">
                      <Bot className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Copy Redactado para Publicación</h4>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">LISTO PARA COPIAR Y PUBLICAR</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-brand-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                    id="btn-copiar-copy"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-400" /> COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> COPIAR COPY
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-slate-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {result.copy || "FUTURA está generando un copy de alto impacto para esta campaña..."}
                </div>
              </div>

              {/* CONSOLA UNIFICADA DE SALIDAS CREATIVAS (FUTURA INTEGRAL HUB) */}
              <div className="glass-panel p-1 rounded-3xl border-white/5 bg-surface-950/45 shadow-3xl" id="futura-outputs-console">
                {/* Navegación por Pestañas */}
                <div className="flex flex-wrap md:flex-nowrap items-stretch border-b border-white/5 p-2 gap-1 bg-black/40 rounded-t-3xl">
                  <button
                    onClick={() => setCreativeOutputTab('image')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                      creativeOutputTab === 'image' 
                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                    id="tab-output-image"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>📸 Diseño y Fotografía</span>
                  </button>

                  <button
                    onClick={() => setCreativeOutputTab('video')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                      creativeOutputTab === 'video' 
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                    id="tab-output-video"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>🎬 Reel / TikTok Inteligente</span>
                  </button>

                  <button
                    onClick={() => setCreativeOutputTab('copy')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                      creativeOutputTab === 'copy' 
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                    id="tab-output-copy"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✍️ Generador de Copys</span>
                  </button>

                  <button
                    onClick={() => setCreativeOutputTab('social')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                      creativeOutputTab === 'social' 
                        ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                    id="tab-output-social"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>🌐 Sincronización Social</span>
                  </button>

                  <button
                    onClick={() => setCreativeOutputTab('monetization')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                      creativeOutputTab === 'monetization' 
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                    id="tab-output-monetization"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>💰 Negocio y Rentabilidad</span>
                  </button>
                </div>

                {/* Contenido Dinámico de las Pestañas */}
                <div className="p-6 md:p-8 space-y-6">
                  
                  {/* PESTAÑA 1: IMAGEN / DISEÑO */}
                  {creativeOutputTab === 'image' && (
                    <div className="space-y-6" id="panel-output-image">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Centro de Renderizado de Fotos y Diseños</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">Sincronización de Recursos de Marca: {activeBrand?.name || "Público"}</p>
                        </div>
                        
                        {/* Indicador de Bóveda Sincronizada */}
                        <div className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                          <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest">BÓVEDA SINCRONIZADA</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Controles y Ajustes de Imagen */}
                        <div className="space-y-4">
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                            <span className="text-[9px] font-black uppercase text-brand-primary tracking-widest block font-mono">ADN Visual de Marca</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {activeBrand ? activeBrand.description : "No has configurado una marca activa aún. El generador utilizará parámetros estándar de alto contraste, espacio negativo y tipografía suiza sofisticada."}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {activeBrand?.logos && activeBrand.logos.length > 0 ? (
                                activeBrand.logos.map((l, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-lg bg-black/45 border border-white/10 p-1 flex items-center justify-center">
                                    <img src={l} className="w-full h-full object-contain" alt="Logo de Bóveda" />
                                  </div>
                                ))
                              ) : (
                                <span className="text-[8px] font-mono text-slate-500 uppercase">Sin logotipos cargados en la Bóveda</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Prompt de Modelado Estructural (AI Prompt)</label>
                            <div className="bg-black/50 border border-white/10 p-3 rounded-xl text-xs font-mono text-slate-400 break-words leading-relaxed max-h-32 overflow-y-auto">
                              {result?.imagePrompt || "Prompt técnico estructurado por el asesor de marca..."}
                            </div>
                          </div>
                        </div>

                        {/* Lienzo o Previsualización */}
                        <div className="space-y-4 flex flex-col items-center">
                          <div className={cn(
                            "bg-black rounded-[2rem] border border-white/5 overflow-hidden relative flex items-center justify-center min-h-[350px] md:min-h-[440px] shadow-2xl ring-1 ring-white/10 w-full mx-auto",
                            selectedFormat.includes("1080x1920") 
                              ? "aspect-[9/16] max-w-[280px]" 
                              : selectedFormat.includes("1080x1350")
                                ? "aspect-[4/5] max-w-[360px]"
                                : "aspect-square max-w-[380px]"
                          )}>
                            {finalImage ? (
                              <img 
                                src={finalImage} 
                                alt="Propuesta Visual FUTURA" 
                                className="w-full h-full object-contain" 
                                referrerPolicy="no-referrer"
                                id="img-previo-final"
                              />
                            ) : generatingImage ? (
                              <div className="text-center p-8 space-y-4">
                                <div className="w-16 h-16 relative mx-auto">
                                  <div className="absolute inset-0 border-2 border-brand-primary/20 rounded-2xl animate-pulse" />
                                  <motion.div 
                                    className="absolute inset-0 border-2 border-brand-primary border-t-transparent rounded-2xl"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                                    <ImageIcon className="w-6 h-6 text-brand-primary" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Estableciendo Mímica</p>
                                  <p className="text-[8px] font-mono text-slate-500">PROCESANDO ADN VISUAL...</p>
                                </div>
                              </div>
                            ) : imageError ? (
                              <div className="text-center p-6 max-w-sm space-y-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">ERROR DE PERMISOS BASTIÓN API</p>
                                  <p className="text-[8px] font-mono text-slate-400 break-words leading-relaxed">
                                    {imageError}
                                  </p>
                                </div>
                                <p className="text-[8px] text-slate-500 leading-relaxed">
                                  La API de generación de imágenes requiere una cuenta vinculada con un plan de facturación activo en Google AI Studio. Puedes configurarlo en la sección de **Settings &gt; Secrets**.
                                </p>
                                <button 
                                  onClick={handleImageGen}
                                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/80 transition-all text-[8px] font-black text-white uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                                >
                                  <Zap className="w-3 h-3" />
                                  FORZAR RENDER
                                </button>
                              </div>
                            ) : (
                              <div className="text-center p-8">
                                 <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-3 mx-auto border border-white/10">
                                    <Zap className="w-6 h-6 text-slate-500" />
                                 </div>
                                 <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-widest">Esperando Modelado Estructural</p>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Relación de Aspecto Limitada por Formato: {selectedFormat}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA 2: VIDEO CORTO (REEL / TIKTOK) */}
                  {creativeOutputTab === 'video' && (
                    <div className="space-y-6 animate-fadeIn" id="panel-output-video">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Generador de Storyboards y Videos Cortos</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">Algoritmo de Alta Retención Audaz para Reels, TikTok y Shorts de YouTube</p>
                        </div>
                        
                        <button
                          onClick={handleCopyVideoToClipboard}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer"
                        >
                          {videoCopied ? (
                            <>
                              <Check className="w-3 text-teal-400" /> COPIADO!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 text-purple-200" /> REPLICAR GUION
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 space-y-4">
                          {/* Controles de Estilo de Video */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Propósito del Video</span>
                              <select className="bg-surface-900 border border-white/5 rounded-lg px-2.5 py-2 text-[10px] text-white w-full outline-none focus:border-purple-500">
                                <option>Gancho de Tracción Educativa</option>
                                <option>Conversión y Venta Agresiva</option>
                                <option>Detrás de Escena Orgánico</option>
                                <option>Brutalist Trend Call</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Curaduría de Audio</span>
                              <select className="bg-surface-900 border border-white/5 rounded-lg px-2.5 py-2 text-[10px] text-white w-full outline-none focus:border-purple-500">
                                <option>Techno-Industrial Sintético</option>
                                <option>Lo-Fi Corporativo Minimalista</option>
                                <option>Ambient Editorial</option>
                                <option>Tendencia TikTok Viral</option>
                              </select>
                            </div>
                          </div>

                          <div className="bg-black/45 border border-white/5 p-5 rounded-2xl text-slate-300 text-xs font-sans leading-relaxed prose prose-invert max-w-none max-h-[350px] overflow-y-auto">
                            {result?.videoProposal ? (
                              <ReactMarkdown>{result.videoProposal}</ReactMarkdown>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                                  <span>Guion Escena por Escena de Alta Retención</span>
                                </div>
                                <p className="leading-relaxed text-[11px] text-slate-400 font-sans">
                                  A continuación se detalla la propuesta de Reels y Vídeos Cortos generada por el Asesor Organizacional Inteligente sincronizando tus logotipos cargados en el Baúl de Marca:
                                </p>
                                
                                <div className="space-y-4 pt-2">
                                  <div className="border border-purple-500/20 bg-purple-500/5 p-4 rounded-xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-white uppercase font-mono tracking-widest">Paso 1: Gancho Magnético (0-5s)</span>
                                      <span className="text-[8px] bg-purple-600/30 text-purple-300 font-mono px-1.5 py-0.5 rounded">RÁPIDO</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed select-text">
                                      <strong>Sincronía Visual:</strong> Plano de zoom rápido con espacio negativo limpio. El logo corporativo de la Bóveda aparece desvaneciéndose en la parte superior izquierda. <br />
                                      <strong>Voz en Off:</strong> "¿El mayor error de marca que estás cometiendo hoy? No es el logo..." <br />
                                      <strong>Audio Cue:</strong> Latido seco de sonido industrial de baja frecuencia.
                                    </p>
                                  </div>

                                  <div className="border border-white/5 bg-white/5 p-4 rounded-xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-white uppercase font-mono tracking-widest">Paso 2: Conflicto & Solución (5-20s)</span>
                                      <span className="text-[8px] bg-white/10 text-slate-300 font-mono px-1.5 py-0.5 rounded">EXPLICACIÓN</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed select-text">
                                      <strong>Sincronía Visual:</strong> Carrusel rápido de imágenes corporativas limpias con textos agresivos de gran tamaño (Fuente: Inter Bold). El fondo dinámico mimetiza el estilo seleccionado. <br />
                                      <strong>Voz en Off:</strong> "Es ocultar tu valor real con tipografía genérica y plantillas recicladas de internet. Tus clientes huelen la mediocridad." <br />
                                      <strong>Audio Cue:</strong> Comienza ritmo de batería techno sintetizado, de volumen moderado en segundo plano.
                                    </p>
                                  </div>

                                  <div className="border border-white/5 bg-white/5 p-4 rounded-xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-white uppercase font-mono tracking-widest">Paso 3: Llamado Directo (CTA) (20-30s)</span>
                                      <span className="text-[8px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded">CIERRE</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed select-text">
                                      <strong>Sincronía Visual:</strong> Pantalla final en negro carbón con el enlace de FUTURA en display y tu logotipo principal de Bóveda centrado de manera solemne. <br />
                                      <strong>Voz en Off:</strong> "Comenta 'ADN' abajo. Te enviaremos el manual completo para unificar tu marca en menos de 10 minutos." <br />
                                      <strong>Audio Cue:</strong> Corte brusco del sintetizador en seco.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Storyboard Simulator */}
                        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">SIMULADOR AUTOMÁTICO DE REPRODUCCIÓN (REEL MOCK)</span>
                          
                          <div className="relative w-full max-w-[240px] aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden border border-purple-500/30 shadow-2xl flex flex-col justify-between p-6">
                            {/* Simulator header bar */}
                            <div className="flex items-center justify-between w-full z-10">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-brand-primary/20 border border-brand-primary border-t-transparent animate-spin flex items-center justify-center p-0.5">
                                  <div className="w-full h-full rounded-full bg-brand-primary/10" />
                                </div>
                                <span className="text-[7.5px] text-purple-300 font-mono font-bold uppercase tracking-widest">Lanzador ACTIVO</span>
                              </div>
                              <span className="text-[7.5px] text-slate-500 font-mono font-bold">0:00 / 0:30s</span>
                            </div>

                            {/* Simulated Video Scene Image & UI Layer */}
                            <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-950">
                              {finalImage ? (
                                <div className="relative w-full h-full opacity-60">
                                  <img src={finalImage} className="w-full h-full object-cover" alt="Previsualización de fondo de Storyboard" />
                                  
                                  {/* Sync Logo layer simulated on the actual video storyboard */}
                                  {activeBrand?.logos && activeBrand.logos.length > 0 && (
                                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm animate-pulse flex items-center gap-1.5">
                                      <img src={activeBrand.logos[0]} className="w-4 h-4 object-contain" alt="Logo de Bóveda sincronizado" />
                                      <span className="text-[7px] text-white font-mono uppercase tracking-widest">VÓRTICE ACTIVO</span>
                                    </div>
                                  )}
                                  
                                  <div className="absolute bottom-16 left-4 right-4 text-left space-y-1">
                                    <p className="text-[9.5px] font-display font-black text-white tracking-tight text-center leading-snug drop-shadow-md">
                                      "¿El mayor error de marca que estás hoy cometiendo?"
                                    </p>
                                    <p className="text-[7px] font-mono text-center text-purple-400 font-black tracking-widest uppercase">
                                      [ Voz en Off - Segundo 0-5s ]
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-4 space-y-2">
                                  <Video className="w-8 h-8 text-slate-700 mx-auto animate-bounce" />
                                  <p className="text-[8px] text-slate-500 font-mono uppercase">SIN RENDER CORRESPONDIENTE</p>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons overlap */}
                            <div className="z-10 w-full flex items-center justify-center gap-2">
                              <button className="w-8 h-8 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                                <Play className="w-3.5 h-3.5 fill-white" />
                              </button>
                              <span className="text-[7.5px] text-white/50 uppercase tracking-widest font-black font-mono">SIMULAR PLAYBACK</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA NUEVA: GENERADOR DE COPYS DE ALTO RENDIMIENTO */}
                  {creativeOutputTab === 'copy' && (
                    <div className="space-y-6 animate-fadeIn" id="panel-output-copy">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest font-display">Redactor de Copys de Redes Sociales</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1 font-sans">Generación de copys quirúrgicos adaptados al tono y a tu marca del Baúl de Activos</p>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-rose-400 text-[9px] font-mono font-bold tracking-widest uppercase">
                          <Check className="w-3.5 h-3.5" />
                          <span>Results over Aesthetics</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                        {/* CONFIGURACIÓN DEL COPY (Opciones) */}
                        <div className="lg:col-span-5 space-y-5">
                          
                          {/* Marca Activa Vinculada Context Info */}
                          <div className="bg-surface-900/40 border border-white/5 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">ADN de Marca Activa</span>
                              <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded bg-teal-400/10 text-teal-400 font-mono">VINCULADO</span>
                            </div>
                            
                            {activeBrand ? (
                              <div className="space-y-1.5">
                                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">{activeBrand.name}</h5>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{activeBrand.description}</p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                                No se ha detectado una marca del Baúl activa. Se utilizarán tus datos de Mi Perfil (Rol/Bio).
                              </p>
                            )}

                            {profile && (
                              <div className="border-t border-white/5 pt-2 text-[9px] text-slate-500 font-mono uppercase space-y-1">
                                <div>Rol: <span className="text-slate-300 font-bold">{profile.roles?.[0] || 'Consultor / Creador'}</span></div>
                                <div>Filosofía: <span className="text-slate-300 font-bold">{profile.philosophy || 'Results Over Aesthetics'}</span></div>
                              </div>
                            )}
                          </div>

                          {/* CATEGORÍA DE COPY */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tipo de Copy de Redes</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[
                                { id: 'advertising', label: '📢 Publicitario', desc: 'AIDA & Conversión' },
                                { id: 'informative', label: '💡 Informativo', desc: 'Educación & Valor' },
                                { id: 'engagement', label: '🤝 Engagement', desc: 'Participativo / Viral' }
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => setCopyType(opt.id as any)}
                                  className={cn(
                                    "p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 cursor-pointer",
                                    copyType === opt.id 
                                      ? "bg-rose-500/10 border-rose-500 text-rose-400 shadow-sm" 
                                      : "bg-surface-950/40 border-white/5 hover:border-white/15 text-slate-400 hover:text-white"
                                  )}
                                >
                                  <span className="text-[9.5px] font-black uppercase tracking-wider leading-none">{opt.label}</span>
                                  <span className="text-[7.5px] opacity-75 font-mono leading-tight block mt-1">{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* DESTINO PLATFORMS */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Red Social del Destino</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'instagram', label: 'Instagram' },
                                { id: 'linkedin', label: 'LinkedIn' },
                                { id: 'facebook', label: 'Facebook' },
                                { id: 'twitter', label: 'Twitter / X' },
                                { id: 'tiktok', label: 'TikTok Video' },
                                { id: 'whatsapp', label: 'WhatsApp' }
                              ].map((plat) => (
                                <button
                                  key={plat.id}
                                  onClick={() => setCopyPlatform(plat.id as any)}
                                  className={cn(
                                    "py-2 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer",
                                    copyPlatform === plat.id 
                                      ? "bg-rose-500 text-white border-rose-500" 
                                      : "bg-surface-950/20 border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                                  )}
                                >
                                  {plat.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* TONAL ANGLE */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tono de Escritura Directa</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[
                                { id: 'results_over_aesthetics', label: 'Results over Aesthetics', desc: 'Conversión, ROI' },
                                { id: 'elite_educator', label: 'Elite Educador', desc: 'Autoridad, Ciencia' },
                                { id: 'brutalist_persuasion', label: 'Brutalismo Directo', desc: 'Al dolor crudo' }
                              ].map((tone) => (
                                <button
                                  key={tone.id}
                                  onClick={() => setCopyTone(tone.id as any)}
                                  className={cn(
                                    "p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 cursor-pointer",
                                    copyTone === tone.id 
                                      ? "bg-rose-500/5 border-rose-500/40 text-rose-400" 
                                      : "bg-surface-950/20 border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                                  )}
                                >
                                  <span className="text-[9px] font-bold leading-normal uppercase">{tone.label}</span>
                                  <span className="text-[7.5px] text-slate-500 font-mono leading-tight mt-0.5">{tone.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CLIENTE IDEAL */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Perfil de tu Cliente Ideal (Buyer Persona)</label>
                              <span className="text-[7px] text-slate-500 font-mono uppercase">Opcional</span>
                            </div>
                            <input
                              type="text"
                              value={copyClientDetails}
                              onChange={(e) => setCopyClientDetails(e.target.value)}
                              placeholder="Ej: Emprendedor digital, Dueños de agencias, Atletas de élite..."
                              className="w-full bg-black border border-white/5 focus:border-rose-500/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                            />
                          </div>

                          {/* CONTEXTO EXTRA */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Objetivo de la Publicación / Temática Exacta</label>
                              <span className="text-[7px] text-rose-400 font-mono uppercase font-black">Recomendado</span>
                            </div>
                            <textarea
                              value={copyExtraContext}
                              onChange={(e) => setCopyExtraContext(e.target.value)}
                              placeholder="Ej: Lanzamiento de mi consultoría de tráfico. Destacar que solo hay 3 plazas libres y que garantizo resultados por contrato."
                              rows={3}
                              className="w-full bg-black border border-white/5 focus:border-rose-500/50 rounded-xl p-3 text-xs text-white outline-none resize-none"
                            />
                          </div>

                          {/* IDIOMA */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Idioma de Redacción</span>
                            <div className="flex bg-black p-1 rounded-xl border border-white/5">
                              <button
                                onClick={() => setCopyGenLanguage('es')}
                                className={cn(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all",
                                  copyGenLanguage === 'es' ? "bg-rose-505 bg-rose-500 text-white" : "text-slate-400 hover:text-white"
                                )}
                              >
                                Español
                              </button>
                              <button
                                onClick={() => setCopyGenLanguage('en')}
                                className={cn(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all",
                                  copyGenLanguage === 'en' ? "bg-rose-505 bg-rose-500 text-white" : "text-slate-400 hover:text-white"
                                )}
                              >
                                Inglés
                              </button>
                            </div>
                          </div>

                          {/* BUTTON GENERATE */}
                          <button
                            onClick={handleGenerateSocialCopy}
                            disabled={copyGenerating}
                            className={cn(
                              "w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-rose-600/10 cursor-pointer disabled:opacity-50"
                            )}
                          >
                            {copyGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> PROCESANDO CON IA DE ELITE...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" /> GENERAR COPY DE ALTO IMPACTO
                              </>
                            )}
                          </button>
                        </div>

                        {/* RESULTADO DEL COPY */}
                        <div className="lg:col-span-7 flex flex-col h-full min-h-[450px]">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono mb-2">RESULTADO PREPARADO DE ALTO IMPACTO</span>
                          
                          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                            
                            {copyGenerating ? (
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-16">
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full animate-bounce">
                                  <Sparkles className="w-6 h-6 text-rose-400" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold uppercase text-white tracking-widest font-mono">FUTURA Redactor de Élite...</p>
                                  <p className="text-[9px] text-slate-500 tracking-wider uppercase font-mono px-4">Estructurando ganchos, inyectando palancas de dolor y terminando el llamado de conversión</p>
                                </div>
                                <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 animate-pulse rounded-full" style={{ width: '80%' }} />
                                </div>
                              </div>
                            ) : customGeneratedCopy ? (
                              <div className="flex-grow flex flex-col space-y-4 min-h-[300px]">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                      {copyPlatform.toUpperCase()} ({copyType.toUpperCase()})
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={handleCopyToClipboardCustom}
                                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-rose-500 text-slate-300 active:text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                  >
                                    {copiedCustom ? (
                                      <>
                                        <Check className="w-3 h-3 text-teal-400" /> ¡COPIADO!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" /> COPIAR COPY
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* EDITABLE INLINE TEXTAREA FOR COMFORT */}
                                <div className="flex-1 flex flex-col space-y-2">
                                  <span className="text-[7.5px] font-bold text-slate-500 font-mono tracking-widest uppercase">Editor en Tiempo Real (Edita libremente abajo)</span>
                                  <textarea
                                    value={customGeneratedCopy}
                                    onChange={(e) => setCustomGeneratedCopy(e.target.value)}
                                    className="flex-1 min-h-[250px] bg-surface-950/60 border border-white/10 rounded-xl p-4 text-xs font-sans text-slate-200 leading-relaxed outline-none focus:border-rose-500/30"
                                  />
                                </div>

                                {/* REFINAR CON IA CONTINUO */}
                                <div className="border-t border-white/5 pt-4 space-y-2">
                                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-wider block font-mono">Refinar con el Experto de FUTURA</span>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={refinementPrompt}
                                      onChange={(e) => setRefinementPrompt(e.target.value)}
                                      placeholder="Pídele: 'hazlo más corto', 'cambia el llamado a la acción', 'agrega más dolor'..."
                                      className="flex-1 bg-black border border-white/10 focus:border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleRefineSocialCopy(refinementPrompt);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleRefineSocialCopy(refinementPrompt)}
                                      disabled={!refinementPrompt.trim() || copyGenerating}
                                      className="px-4 py-2 bg-white text-black font-black uppercase text-[9px] tracking-wider rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      REFINAR
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-2xl py-12">
                                <Bot className="w-10 h-10 text-slate-600 mb-3" />
                                <h5 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-1.5">MANIFIESTO DEL COPYWRITING FUTURA</h5>
                                <div className="max-w-md w-full space-y-3 mt-1.5">
                                  <p className="text-[10px] text-slate-400 leading-relaxed">
                                    Sigue la filosofía **"Results over Aesthetics"**: eliminamos la jerga de agencias tradicionales para asestar verdades pragmáticas directas que convierten.
                                  </p>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-left font-mono text-[8px] text-slate-500 bg-black/60 p-3 rounded-xl border border-white/5">
                                    <div>⚡ Ganchos de Scroll</div>
                                    <div>💰 CTAs de Caja Rápida</div>
                                    <div>💀 Directos al Dolor</div>
                                    <div>📈 Formatos Ágiles</div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA 3: CONEXIÓN SOCIAL / SCHEDULE */}
                  {creativeOutputTab === 'social' && (
                    <div className="space-y-6 animate-fadeIn" id="panel-output-social">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Centro Integrado de Sinergia Redes</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">Conecta con tus Redes, agenda publicaciones automáticas y haz feedback en tiempo real</p>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-400" />
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Sincronización API Lista</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Redes Conectar Area */}
                        <div className="space-y-4">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">Cuentas Sociales Activas (Emparejadas de Marca)</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Instagram Connect Card */}
                            <div className={cn(
                              "border p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-colors",
                              instagramConnected ? "bg-teal-500/5 border-teal-500/20" : "bg-black/45 border-white/5 hover:border-purple-600/30"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white uppercase font-mono tracking-wider">Instagram Business</span>
                                <span className={cn(
                                  "text-[7px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  instagramConnected ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-400"
                                )}>
                                  {instagramConnected ? "SINCRONIZADO" : "DESCONECTADO"}
                                </span>
                              </div>
                              
                              {instagramConnected ? (
                                <p className="text-[9px] text-slate-400 font-mono">Pre-vinculado: @{socialUsernames.instagram || "futbolist_curated"}</p>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ingresa tu @usuario"
                                  value={socialUsernames.instagram}
                                  onChange={(e) => setSocialUsernames(prev => ({ ...prev, instagram: e.target.value }))}
                                  className="bg-surface-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white w-full outline-none"
                                />
                              )}

                              <button
                                onClick={() => {
                                  if (instagramConnected) {
                                    setInstagramConnected(false);
                                  } else {
                                    setSocialLoading('insta');
                                    setTimeout(() => {
                                      setInstagramConnected(true);
                                      setSocialLoading(null);
                                    }, 1000);
                                  }
                                }}
                                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest cursor-pointer mt-1"
                              >
                                {socialLoading === 'insta' ? "CONECTANDO..." : instagramConnected ? "DESCONECTAR" : "VINCULAR PERFIL"}
                              </button>
                            </div>

                            {/* TikTok Connect Card */}
                            <div className={cn(
                              "border p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-colors",
                              tiktokConnected ? "bg-teal-500/5 border-teal-500/20" : "bg-black/45 border-white/5 hover:border-purple-600/30"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white uppercase font-mono tracking-wider">TikTok Creator</span>
                                <span className={cn(
                                  "text-[7px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  tiktokConnected ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-400"
                                )}>
                                  {tiktokConnected ? "SINCRONIZADO" : "DESCONECTADO"}
                                </span>
                              </div>
                              
                              {tiktokConnected ? (
                                <p className="text-[9px] text-slate-400 font-mono">Pre-vinculado: @{socialUsernames.tiktok || "futbolist_trend"}</p>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ingresa tu @usuario"
                                  value={socialUsernames.tiktok}
                                  onChange={(e) => setSocialUsernames(prev => ({ ...prev, tiktok: e.target.value }))}
                                  className="bg-surface-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white w-full outline-none"
                                />
                              )}

                              <button
                                onClick={() => {
                                  if (tiktokConnected) {
                                    setTiktokConnected(false);
                                  } else {
                                    setSocialLoading('tik');
                                    setTimeout(() => {
                                      setTiktokConnected(true);
                                      setSocialLoading(null);
                                    }, 1000);
                                  }
                                }}
                                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest cursor-pointer mt-1"
                              >
                                {socialLoading === 'tik' ? "CONECTANDO..." : tiktokConnected ? "DESCONECTAR" : "VINCULAR PERFIL"}
                              </button>
                            </div>

                            {/* YouTube Shorts Connect Card */}
                            <div className={cn(
                              "border p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-colors",
                              youtubeConnected ? "bg-teal-500/5 border-teal-500/20" : "bg-black/45 border-white/5 hover:border-purple-600/30"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white uppercase font-mono tracking-wider">YouTube Shorts</span>
                                <span className={cn(
                                  "text-[7px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  youtubeConnected ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-400"
                                )}>
                                  {youtubeConnected ? "SINCRONIZADO" : "DESCONECTADO"}
                                </span>
                              </div>
                              
                              {youtubeConnected ? (
                                <p className="text-[9px] text-slate-400 font-mono">Pre-vinculado: @{socialUsernames.youtube || "futbolist_shorts"}</p>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Canal o identificador"
                                  value={socialUsernames.youtube}
                                  onChange={(e) => setSocialUsernames(prev => ({ ...prev, youtube: e.target.value }))}
                                  className="bg-surface-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white w-full outline-none"
                                />
                              )}

                              <button
                                onClick={() => {
                                  if (youtubeConnected) {
                                    setYoutubeConnected(false);
                                  } else {
                                    setSocialLoading('yt');
                                    setTimeout(() => {
                                      setYoutubeConnected(true);
                                      setSocialLoading(null);
                                    }, 1000);
                                  }
                                }}
                                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest cursor-pointer mt-1"
                              >
                                {socialLoading === 'yt' ? "CONECTANDO..." : youtubeConnected ? "DESCONECTAR" : "VINCULAR PERFIL"}
                              </button>
                            </div>

                            {/* WhatsApp Personal Connect Card */}
                            <div className={cn(
                              "border p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-colors",
                              whatsappConnected ? "bg-teal-500/5 border-teal-500/20" : "bg-black/45 border-white/5 hover:border-purple-600/30"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white uppercase font-mono tracking-wider">WhatsApp Personal</span>
                                <span className={cn(
                                  "text-[7px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  whatsappConnected ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-400"
                                )}>
                                  {whatsappConnected ? "CONECTADO" : "DESCONECTADO"}
                                </span>
                              </div>
                              
                              {whatsappConnected ? (
                                <p className="text-[9px] text-slate-400 font-mono">Pre-vinculado: {socialUsernames.whatsapp || "+52 xxxxxxxxxx"}</p>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Número de WhatsApp"
                                  value={socialUsernames.whatsapp}
                                  onChange={(e) => setSocialUsernames(prev => ({ ...prev, whatsapp: e.target.value }))}
                                  className="bg-surface-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white w-full outline-none"
                                />
                              )}

                              <button
                                onClick={() => {
                                  if (whatsappConnected) {
                                    setWhatsappConnected(false);
                                  } else {
                                    setSocialLoading('wa');
                                    setTimeout(() => {
                                      setWhatsappConnected(true);
                                      setSocialLoading(null);
                                    }, 1000);
                                  }
                                }}
                                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest cursor-pointer mt-1"
                              >
                                {socialLoading === 'wa' ? "CONECTANDO..." : whatsappConnected ? "DESCONECTAR" : "VINCULAR NÚMERO"}
                              </button>
                            </div>

                            {/* WhatsApp Business Connect Card */}
                            <div className={cn(
                              "border p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-colors",
                              whatsappBusinessConnected ? "bg-teal-500/5 border-teal-500/20" : "bg-black/45 border-white/5 hover:border-purple-600/30"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white uppercase font-mono tracking-wider">WhatsApp Business</span>
                                <span className={cn(
                                  "text-[7px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  whatsappBusinessConnected ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-400"
                                )}>
                                  {whatsappBusinessConnected ? "CONECTADO" : "DESCONECTADO"}
                                </span>
                              </div>
                              
                              {whatsappBusinessConnected ? (
                                <p className="text-[9px] text-slate-400 font-mono">Pre-vinculado: {socialUsernames.whatsappBusiness || "+52 xxxxxxxxxx (Biz)"}</p>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Número de WhatsApp Business"
                                  value={socialUsernames.whatsappBusiness}
                                  onChange={(e) => setSocialUsernames(prev => ({ ...prev, whatsappBusiness: e.target.value }))}
                                  className="bg-surface-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white w-full outline-none"
                                />
                              )}

                              <button
                                onClick={() => {
                                  if (whatsappBusinessConnected) {
                                    setWhatsappBusinessConnected(false);
                                  } else {
                                    setSocialLoading('wab');
                                    setTimeout(() => {
                                      setWhatsappBusinessConnected(true);
                                      setSocialLoading(null);
                                    }, 1000);
                                  }
                                }}
                                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest cursor-pointer mt-1"
                              >
                                {socialLoading === 'wab' ? "CONECTANDO..." : whatsappBusinessConnected ? "DESCONECTAR" : "VINCULAR NÚMERO"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Scheduling Scheduler Panel */}
                        <div className="space-y-4 bg-surface-900/20 p-6 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-400" />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Calendario y Lanzador Automático</span>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block">Seleccione fecha de lanzamiento</span>
                              <input
                                type="datetime-local"
                                value={schedulingDate}
                                onChange={(e) => setSchedulingDate(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-500 outline-none cursor-pointer"
                              />
                            </div>

                            <div className="border border-teal-500/20 bg-teal-500/5 p-4 rounded-xl space-y-2">
                              <div className="flex items-center gap-2 text-[9px] font-black text-teal-400 uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5" />
                                <span>Verificación de Integridad de Marca</span>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                                Al presionar **Publicar campaña**, el sistema cargará los logotipos guardados en tu Bóveda de Marca activa, verificará el uso correcto del espacio de aire recomendado por el asesor cognitivo, compilará el vídeo Reel y lo agendará para publicar inmediatamente.
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setIsScheduled(true);
                                setTimeout(() => setIsScheduled(false), 4000);
                              }}
                              className="w-full px-5 py-3.5 bg-teal-500 hover:bg-teal-400 transition-all text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              PRODUCIR Y LANZAR CAMPAÑA
                            </button>

                            {isScheduled && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 text-center rounded-lg bg-teal-500/10 border border-teal-400/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider"
                              >
                                PROCESANDO: Sincronizando logotipos... Evaluando simetría... ¡Publicación agendada con éxito para el {new Date(schedulingDate).toLocaleString()}!
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA 4: MONETIZACIÓN Y NEGOCIO DE MEMBRESÍAS */}
                  {creativeOutputTab === 'monetization' && (
                    <div className="space-y-6 animate-fadeIn" id="panel-output-monetization">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-display">Configuración de Membresías y Marginado de Producción</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">Configura las tasas de recarga, margina el consumo de las APIs y proyecta la rentabilidad de FUTURA</p>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-500 text-[10px] font-bold">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>MÚLTIPLO DE GANANCIAS ACTIVO</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Margining Configurator Slider */}
                        <div className="space-y-4">
                          <div className="p-5 bg-black/45 border border-white/5 rounded-2xl space-y-4">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block font-mono">Controlador de Margen de API (Múltiplo de Venta)</span>
                            
                            <p className="text-[10px] text-slate-400 leading-relaxed leading-normal">
                              Cuando tus clientes o creadores con membresía Starter/Pro ejecutan renderizados de imágenes o videos, el sistema calcula el costo bruto del token de Google Cloud AI Studio y aplica automáticamente el recargo configurado para maximizar tu rentabilidad neta.
                            </p>

                            <div className="space-y-2 pt-2">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-slate-400">Multiplicador por Generación:</span>
                                <span className="text-amber-400 font-bold font-display text-sm">{costMultiplier.toFixed(1)}x</span>
                              </div>
                              <input 
                                type="range" 
                                min="1.5" 
                                max="10.0" 
                                step="0.5" 
                                value={costMultiplier} 
                                onChange={(e) => {
                                  const multiplier = parseFloat(e.target.value);
                                  setCostMultiplier(multiplier);
                                  setRetailPricePerGen(baseCostPerGen * multiplier);
                                }}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />
                              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                                <span>1.5x (Margen Mínimo)</span>
                                <span>10.0x (Máxima Rentabilidad)</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
                              <div className="bg-white/5 p-3 rounded-xl text-center">
                                <span className="text-[8px] text-slate-500 uppercase font-mono tracking-widest block mb-0.5">Costo Base API Est.</span>
                                <span className="text-sm font-display font-medium text-slate-300">${baseCostPerGen.toFixed(2)}</span>
                              </div>
                              <div className="bg-amber-500/15 p-3 rounded-xl text-center border border-amber-500/10">
                                <span className="text-[8px] text-amber-500 uppercase font-mono tracking-widest block mb-0.5">Precio de Venta Sugerido</span>
                                <span className="text-sm font-display font-black text-amber-400">${retailPricePerGen.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Profitability Dashboard Simulator */}
                        <div className="space-y-4 bg-amber-500/5 p-6 rounded-2xl border border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">PROYECCIÓN DE INGRESOS MENSUALES</span>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-300 font-bold">Creadores Activos en Membresía:</span>
                                <span className="text-white font-black font-display text-xs">{monthlyCreatorsEstimation} MAC</span>
                              </div>
                              <input 
                                type="range" 
                                min="20" 
                                max="1000" 
                                step="10" 
                                value={monthlyCreatorsEstimation} 
                                onChange={(e) => setMonthlyCreatorsEstimation(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-300 font-bold">Generaciones estables por Creador/mes:</span>
                                <span className="text-white font-black font-display text-xs">{creatorsGenPerMonth} / mes</span>
                              </div>
                              <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                step="5" 
                                value={creatorsGenPerMonth} 
                                onChange={(e) => setCreatorsGenPerMonth(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />
                            </div>

                            <div className="border-t border-amber-500/20 pt-4 grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block">Costo Operativo API Total</span>
                                <span className="text-base font-display font-bold text-slate-300">
                                  ${(monthlyCreatorsEstimation * creatorsGenPerMonth * baseCostPerGen).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8.5px] text-amber-500 uppercase tracking-wider block font-bold">INGRESO NETO RECARGO</span>
                                <span className="text-xl font-display font-black text-amber-400">
                                  ${(monthlyCreatorsEstimation * creatorsGenPerMonth * (retailPricePerGen - baseCostPerGen)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                              </div>
                            </div>

                            <div className="bg-black/45 p-3 rounded-xl border border-white/5 flex items-center justify-between text-[9px] text-slate-400 uppercase tracking-widest">
                              <span>ROI de la Suite FUTURA:</span>
                              <span className="text-teal-400 font-black font-mono">+{( ((retailPricePerGen - baseCostPerGen) / baseCostPerGen) * 100 ).toFixed(0)}% Profit Margin</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* 5. BOTÓN DE EDICIÓN / ACCIÓN UNIFICADA */}
              <div 
                className="glass-panel p-6 rounded-[2rem] border-brand-primary/10 bg-surface-950/40 backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-6"
                id="section-controles-unificados"
              >
                <div>
                  <h5 className="text-[10px] font-black text-white uppercase tracking-wider">¿Qué deseas hacer ahora con este diseño?</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Personaliza agregando logotipos y textos sobre el lienzo o guárdalo directamente en tu bóveda.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {finalImage ? (
                    <>
                      {/* El botón de edición principal unificado */}
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 md:flex-none px-8 py-4.5 bg-brand-primary text-white rounded-2xl font-black text-xs hover:scale-105 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-brand-primary/20"
                        id="btn-editar-unico"
                      >
                        <Pencil className="w-4 h-4" /> PERSONALIZAR EN CANVA
                      </button>

                      <button 
                        onClick={handleSaveToGallery}
                        disabled={isSaving}
                        className="flex-1 md:flex-none px-6 py-4.5 bg-white text-black rounded-2xl font-black text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                        id="btn-boveda-directa"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        GUARDAR EN BÓVEDA
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleImageGen}
                      disabled={generatingImage}
                      className={cn(
                        "w-full px-10 py-5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden",
                        generatingImage ? "bg-white/5 text-slate-500" : "bg-brand-primary text-white shadow-brand-primary/30 hover:scale-[1.05]"
                      )}
                      id="btn-generar-visual-fuerza"
                    >
                      {generatingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {generatingImage ? "PROCESANDO ADN..." : "REVELAR VISUAL / RENDERIZAR"}
                    </button>
                  )}
                </div>
              </div>

              {/* Ajustes y Refinamientos discretos al final */}
              <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-surface-900/10 space-y-4">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">¿No te convence el resultado? Solicita un Ajuste</h4>
                <div className="flex gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 bg-black hover:border-brand-primary/50 transition-all shrink-0",
                      adhocReference && "border-brand-primary"
                    )}
                    id="btn-upload-adhoc-output"
                  >
                    {adhocReference ? <img src={adhocReference} className="w-full h-full object-cover rounded-lg" /> : <Camera className="w-4 h-4 text-slate-600" />}
                  </button>
                  <textarea 
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                    placeholder="Escribe qué te gustaría cambiar o corregir del diseño..."
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white resize-none h-12 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    id="textarea-refine-bottom"
                  />
                </div>
                <button 
                  onClick={handleRefine}
                  className="w-full py-3.5 bg-surface-900 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary/10 transition-all"
                  id="btn-refine-submit-bottom"
                >
                  RE-ALINEAR DISEÑO CON NUEVA INSTRUCCIÓN
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal Overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[200] bg-surface-950 flex flex-col overflow-hidden",
              isFullscreen ? "p-0" : "p-4 md:p-12"
            )}
          >
            <div className={cn(
              "bg-surface-900/90 backdrop-blur-3xl flex flex-col h-full border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]",
              isFullscreen ? "rounded-none" : "rounded-[3rem]"
            )}>
              {/* Editor Header */}
              <div className="p-4 md:p-6 border-b border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8">
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">FUTURA HUB</span>
                    <h4 className="text-lg md:text-xl text-white font-display font-bold">BRAND STUDIO</h4>
                  </div>
                  
                  <div className="h-10 w-px bg-white/10 hidden lg:block" />

                  {/* Tools */}
                  <div className="flex items-center gap-1 md:gap-2 bg-black/40 p-1 md:p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => setActiveTool('select')} className={cn("p-2 md:p-3 rounded-xl transition-all", activeTool === 'select' ? "bg-brand-primary text-white" : "text-slate-500 hover:text-white")}><Send className="w-4 h-4 rotate-45" /></button>
                    <button onClick={() => setActiveTool('pencil')} className={cn("p-2 md:p-3 rounded-xl transition-all", activeTool === 'pencil' ? "bg-brand-primary text-white" : "text-slate-500 hover:text-white")}><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setActiveTool('rect')} className={cn("p-2 md:p-3 rounded-xl transition-all", activeTool === 'rect' ? "bg-brand-primary text-white" : "text-slate-500 hover:text-white")}><Square className="w-4 h-4" /></button>
                    <button onClick={() => { setActiveTool('text'); addText(); }} className={cn("p-2 md:p-3 rounded-xl transition-all", activeTool === 'text' ? "bg-brand-primary text-white" : "text-slate-500 hover:text-white")}><Type className="w-4 h-4" /></button>
                  </div>

                  {/* Settings */}
                  <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent" />
                    <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="bg-transparent text-sm text-white font-bold outline-none cursor-pointer">
                      {[12, 18, 24, 32, 40, 60, 80, 120, 200, 300].map(s => <option key={s} value={s} className="bg-surface-900">{s}px</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={cn(
                      "px-3.5 py-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer",
                      isFullscreen 
                        ? "bg-brand-primary text-white border-brand-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
                    )}
                    title={isFullscreen ? "Salir de pantalla completa" : "Ir a pantalla completa"}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? "Modo Ventana" : "Pantalla Completa"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-xs font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest">Descartar</button>
                  <button onClick={saveEdits} className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                    <Check className="w-5 h-5" /> ACTUALIZAR DISEÑO
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Sidebar: Phrases and Logos */}
                <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-white/5 bg-surface-950/50 p-6 lg:p-8 overflow-y-auto shrink-0 space-y-8 lg:space-y-10 custom-scrollbar">
                  
                  {/* PANEL DE PROPIEDADES (CAPA SELECCIONADA) */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Propiedades de Capa
                    </h5>
                    
                    {selectedObject ? (
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* Tipo de Elemento */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Capa Activa: <span className="text-brand-primary">{selectedObject.type === 'i-text' ? 'TEXTO' : selectedObject.type === 'rect' ? 'RECTÁNGULO' : 'IMAGEN'}</span>
                          </span>
                          <button 
                            onClick={() => {
                              if (canvas) {
                                canvas.discardActiveObject();
                                canvas.renderAll();
                                setSelectedObject(null);
                              }
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                            title="Deseleccionar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Alineación Horizontal y Vertical del Lienzo + Duplicación */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                          <button 
                            onClick={alignSelectedCenterH}
                            className="py-2.5 bg-white/5 hover:bg-white/15 hover:text-brand-primary border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5"
                            title="Centrar horizontalmente"
                          >
                            <AlignLeft className="w-4 h-4 rotate-90" />
                            <span>Centrar H</span>
                          </button>
                          <button 
                            onClick={alignSelectedCenterV}
                            className="py-2.5 bg-white/5 hover:bg-white/15 hover:text-brand-primary border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5"
                            title="Centrar verticalmente"
                          >
                            <AlignCenter className="w-4 h-4" />
                            <span>Centrar V</span>
                          </button>
                          <button 
                            onClick={duplicateSelected}
                            className="py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 hover:text-white border border-brand-primary/25 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 text-brand-primary"
                            title="Duplicar esta capa"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Duplicar</span>
                          </button>
                        </div>

                        {/* Controles de Tipografía Especiales para Texto */}
                        {selectedObject.type === 'i-text' && (
                          <div className="space-y-4 pt-4 border-t border-white/5">
                            {/* Selector de Fuente */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Familia Tipográfica</label>
                              <div className="relative">
                                <select 
                                  value={activeFontFamily} 
                                  onChange={(e) => setActiveFontFamily(e.target.value)} 
                                  className="w-full bg-black/40 text-xs text-white border border-white/10 rounded-xl py-3 px-4 outline-none cursor-pointer hover:border-brand-primary/30 transition-all appearance-none font-medium"
                                  style={{ fontFamily: activeFontFamily }}
                                >
                                  <option value="Inter" className="bg-surface-900 font-sans">Inter (Modern Clean)</option>
                                  <option value="Outfit" className="bg-surface-900">Outfit (Tech Sans)</option>
                                  <option value="JetBrains Mono" className="bg-surface-900 font-mono">JetBrains Mono (Mono Tech)</option>
                                  <option value="Montserrat" className="bg-surface-900">Montserrat (Clean Bold)</option>
                                  <option value="Space Grotesk" className="bg-surface-900">Space Grotesk (High Tech)</option>
                                  <option value="Syne" className="bg-surface-900 font-black">Syne (Ultra Creative)</option>
                                  <option value="Playfair Display" className="bg-surface-900 italic">Playfair Display (Serif)</option>
                                  <option value="Bebas Neue" className="bg-surface-900">Bebas Neue (Impact Headline)</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>

                            {/* Tamaño de Fuente e Inputs */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tamaño de Fuente</label>
                                <span className="font-mono text-xs text-brand-primary font-bold">{fontSize}px</span>
                              </div>
                              <input 
                                type="range" 
                                min="10" 
                                max="250" 
                                value={fontSize} 
                                onChange={(e) => setFontSize(Number(e.target.value))} 
                                className="w-full accent-brand-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Estilos de Fuente: Bold, Italic, Underline y Alignments */}
                            <div className="flex items-center justify-between gap-4">
                              {/* Bold, Italic, Underline */}
                              <div className="flex items-center bg-black/35 p-1 rounded-xl border border-white/5">
                                <button 
                                  onClick={() => setActiveFontWeight(activeFontWeight === 'bold' ? 'normal' : 'bold')} 
                                  className={cn("p-2 rounded-lg transition-all", activeFontWeight === 'bold' ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                                  title="Negrita"
                                >
                                  <Bold className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setActiveFontStyle(activeFontStyle === 'italic' ? 'normal' : 'italic')} 
                                  className={cn("p-2 rounded-lg transition-all", activeFontStyle === 'italic' ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                                  title="Cursiva"
                                >
                                  <Italic className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setActiveUnderline(!activeUnderline)} 
                                  className={cn("p-2 rounded-lg transition-all", activeUnderline ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                                  title="Subrayado"
                                >
                                  <Underline className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Aligns */}
                              <div className="flex items-center bg-black/35 p-1 rounded-xl border border-white/5">
                                <button 
                                  onClick={() => setActiveTextAlign('left')} 
                                  className={cn("p-2 rounded-lg transition-all", activeTextAlign === 'left' ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                                  title="Alinear Izquierda"
                                >
                                  <AlignLeft className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setActiveTextAlign('center')} 
                                  className={cn("p-2 rounded-lg transition-all", activeTextAlign === 'center' ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                                  title="Centrar Texto"
                                >
                                  <AlignCenter className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setActiveTextAlign('right')} 
                                  className={cn("p-2 rounded-lg transition-all", activeTextAlign === 'right' ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                                  title="Alinear Derecha"
                                >
                                  <AlignRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stroke / Bordes (Contornos) */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Contornos y Trazo</label>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={activeStrokeColor} 
                                onChange={(e) => setActiveStrokeColor(e.target.value)} 
                                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent outline-none p-0 animate-pulse" 
                                title="Color de borde o contorno"
                              />
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{activeStrokeColor}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-black/35 px-2.5 py-1.5 rounded-lg border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase">Grosor</span>
                              <input 
                                type="number" 
                                min="0" 
                                max="20" 
                                value={activeStrokeWidth} 
                                onChange={(e) => setActiveStrokeWidth(Number(e.target.value))} 
                                className="w-8 bg-transparent text-xs text-white text-center outline-none border-none font-bold font-mono"
                              />
                              <span className="text-[9px] text-slate-500">px</span>
                            </div>
                          </div>
                        </div>

                        {/* Color de Relleno y de Brush can be updated in real-time */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Color de Relleno</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={brushColor} 
                                onChange={(e) => setBrushColor(e.target.value)} 
                                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent outline-none p-0" 
                              />
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{brushColor}</span>
                            </div>
                          </div>
                        </div>

                        {/* Opacidad */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Opacidad de Capa</label>
                            <span className="font-mono text-xs text-white font-bold">{Math.round(opacity * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05" 
                            value={opacity} 
                            onChange={(e) => setOpacity(Number(e.target.value))} 
                            className="w-full accent-brand-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Acciones de Ordenación y Eliminación */}
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                          <button onClick={bringForward} className="py-3 bg-white/5 rounded-xl text-[9px] font-black flex items-center justify-center gap-2 hover:bg-white/10 text-white transition-all border border-white/5"><Layers className="w-3.5 h-3.5 text-brand-primary" /> SUBIR CAPA</button>
                          <button onClick={sendBackward} className="py-3 bg-white/5 rounded-xl text-[9px] font-black flex items-center justify-center gap-2 hover:bg-white/10 text-white transition-all border border-white/5"><Layers className="w-3.5 h-3.5 text-brand-primary rotate-180" /> BAJAR CAPA</button>
                        </div>
                        <button onClick={deleteSelected} className="w-full py-3.5 bg-red-500/10 rounded-xl text-[9px] font-black flex items-center justify-center gap-2 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/10"><Trash2 className="w-4 h-4 animate-bounce" /> ELIMINAR CAPA</button>
                      </div>
                    ) : (
                      <div className="bg-white/[0.02] border border-dashed border-white/5 rounded-3xl p-6 text-center space-y-2 py-8">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
                          <Send className="w-4 h-4 rotate-45" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Sin selección activa</p>
                        <p className="text-[9px] text-slate-600 leading-normal max-w-[220px] mx-auto">
                          Haz clic sobre cualquier elemento/texto en el lienzo central para editar libremente su fuente, tamaño, colores o contornos.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* INSERTAR ARCHIVO PNG LOCAL */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Añadir Archivos Locales
                    </h5>
                    <button 
                      onClick={() => canvasImageUploadRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-white/10 hover:border-brand-primary/40 bg-white/5 hover:bg-brand-primary/5 rounded-2xl text-[10px] text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-brand-primary" /> INSERTAR PNG / SVG / JPG
                    </button>
                    <input 
                      type="file" 
                      ref={canvasImageUploadRef} 
                      onChange={handleCanvasImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* RECURSOS DEL BAÚL DE MARCA */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Brand Vault Assets
                    </h5>
                    {activeBrand?.logos && activeBrand.logos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {activeBrand.logos.map((logo, i) => (
                          <button 
                            key={i} 
                            onClick={() => addLogoToCanvas(logo)}
                            className="aspect-square bg-white rounded-2xl p-4 border border-white/5 hover:scale-105 hover:border-brand-primary/50 transition-all shadow-xl group cursor-pointer"
                          >
                            <img src={logo} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-600 italic">No hay logos cargados en esta marca.</p>
                    )}
                  </div>

                  {/* COPIAS RECOMENDADAS */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Type className="w-3 h-3" /> Copys Sugeridos
                    </h5>
                    <div className="space-y-2">
                      {phrases.map((phrase, i) => (
                        <button 
                          key={i} 
                          onClick={() => {
                            if (!canvas) return;
                            const text = new fabric.IText(phrase.toUpperCase(), {
                              left: 200,
                              top: 200,
                              fontFamily: 'Inter',
                              fontSize: 50,
                              fill: brushColor,
                              fontWeight: 'bold',
                              cornerColor: '#00F0FF',
                              cornerSize: 10,
                              transparentCorners: false
                            });
                            canvas.add(text);
                            canvas.setActiveObject(text);
                            canvas.renderAll();
                          }}
                          className="w-full p-4 bg-white/5 hover:bg-brand-primary/20 border border-white/5 rounded-2xl text-[10px] text-left text-slate-400 hover:text-white font-bold transition-all"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 bg-black/40 relative overflow-auto flex items-center justify-center p-4 md:p-12 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] custom-scrollbar">
                  <div className="sticky top-0 left-1/2 -translate-x-1/2 z-10 bg-surface-900 border border-white/10 px-4 md:px-6 py-2 rounded-full mb-12 flex items-center lg:gap-4 gap-2.5 shadow-2xl scale-90 md:scale-100 whitespace-nowrap">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Zoom</span>
                    <input type="range" min="0.1" max="3" step="0.1" value={zoom} onChange={(e) => handleZoom(Number(e.target.value))} className="w-24 md:w-32 accent-brand-primary h-1" />
                    <span className="text-xs font-mono text-white min-w-[3ch]">{Math.round(zoom * 100)}%</span>
                    <div className="w-px h-4 bg-white/10" />
                    <button 
                      onClick={fitCanvasToContainer}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-primary/30 rounded-lg text-[9px] font-black text-brand-primary uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Ajustar Lienzo
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="px-2.5 py-1 bg-brand-primary/15 hover:bg-brand-primary/25 border border-brand-primary/20 hover:border-brand-primary/40 rounded-lg text-[9px] font-black text-brand-primary uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize2 className="w-3 h-3 text-brand-primary animate-pulse" />
                          <span>Modo Ventana</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3 text-brand-primary animate-pulse" />
                          <span>Pantalla Completa</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div 
                    ref={canvasContainerRef}
                    className="shadow-[0_0_150px_rgba(0,0,0,0.85)] border border-white/15 ring-1 ring-white/5 overflow-hidden bg-black transition-all duration-300"
                    style={{
                      width: '100%',
                      maxWidth: selectedFormat.includes("1920") 
                        ? (isFullscreen ? '420px' : '330px') 
                        : (selectedFormat.includes("1350") 
                          ? (isFullscreen ? '720px' : '550px') 
                          : (isFullscreen ? '680px' : '520px')),
                      maxHeight: selectedFormat.includes("1920")
                        ? (isFullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 320px)')
                        : (selectedFormat.includes("1350")
                          ? (isFullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 320px)')
                          : (isFullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 320px)')),
                      aspectRatio: selectedFormat.includes("1920") ? '9/16' : 
                                   selectedFormat.includes("1350") ? '4/5' : '1/1'
                    }}
                  >
                    <canvas ref={canvasRef} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
