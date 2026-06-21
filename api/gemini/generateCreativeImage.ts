/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient } from "./utils";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { prompt, aspectRatio, styleReferences } = req.body || {};
  let model = "gemini-2.5-flash-image";

  try {
    const parts: any[] = [];

    if (Array.isArray(styleReferences) && styleReferences.length > 0) {
      styleReferences.slice(0, 3).forEach((img: string) => {
        const partsArr = img.split(';base64,');
        if (partsArr.length === 2) {
          const mimeMatch = partsArr[0].match(/data:(.*?)$/);
          const mimeTypePart = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const data = partsArr[1];
          parts.push({
            inlineData: {
              mimeType: mimeTypePart,
              data: data
            }
          });
        }
      });
    }

    const enhancedPrompt = `${prompt}. 
    STYLE MIMICRY MANDATE: Analyze the layout perspective, composition, 3D arrangement, background mood, and negative space of the style reference images. You must strictly match this layout and color palette in the generated image, making it look like a seamless twin design but reflecting the requested content.
    STRONGLY PROHIBITED: Do not include or write any letters, brand labels, titles, signs, readable texts, or logos on the image backdrop. Always provide a clean visual space for manual brand placement.`;

    parts.push({ text: enhancedPrompt });

    let response = null;
    let quotaDetected = false;

    try {
      response = await getAiClient(customKey).models.generateContent({
        model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio || "1:1") as any,
          },
        },
      });
    } catch (modelErr: any) {
      const errStr = (modelErr?.message || "").toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit")) {
        quotaDetected = true;
        console.log("[FUTURA] Image model quota limit exceeded (429/RESOURCE_EXHAUSTED). Activating local design fallback.");
      } else {
        console.warn("[FUTURA] Primary image model failed. Trying alternative model...", modelErr.message || modelErr);
        try {
          // Fallback model
          response = await getAiClient(customKey).models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: (aspectRatio || "1:1") as any,
                imageSize: "1K"
              },
            },
          });
        } catch (altErr: any) {
          const altErrStr = (altErr?.message || "").toLowerCase();
          if (altErrStr.includes("quota") || altErrStr.includes("429") || altErrStr.includes("exhausted") || altErrStr.includes("limit")) {
            quotaDetected = true;
            console.log("[FUTURA] Alternate image model quota limit exceeded. Activating local design fallback.");
          } else {
            console.warn("[FUTURA] Alternate image model failed too:", altErr.message || altErr);
          }
        }
      }
    }

    let imageUrl: string | null = null;
    if (response && response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    // Default elegant fallback if zero bytes found or quota was hit
    if (!imageUrl || quotaDetected) {
      imageUrl = getContextualFallback(prompt);
    }

    return res.status(200).json({ imageUrl });
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit")) {
      console.log("[FUTURA] Server Image Generation rate/quota limited. Responding with elegant design placeholder.");
    } else {
      console.log("[FUTURA] Server Image Generation exception. Serving elegant design placeholder.", error.message || error);
    }
    const backupUrl = getContextualFallback(prompt);
    return res.status(200).json({ imageUrl: backupUrl });
  }
}

function getContextualFallback(promptText: string): string {
  const text = (promptText || "").toLowerCase();

  // 1. IS IT A LOGO REQUEST?
  const isLogo = text.includes("logo") || text.includes("icon") || text.includes("symbol") || text.includes("isotipo") || text.includes("branding") || text.includes("isologo") || text.includes("logotipo");

  if (isLogo) {
    // Generate a high-fidelity SVG path, custom tailored to the sector
    let svgGraphic = "";

    if (text.includes("dental") || text.includes("dentist") || text.includes("odontolog") || text.includes("dient") || text.includes("sonris")) {
      svgGraphic = `
        <defs>
          <linearGradient id="dentalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00F5FF"/>
            <stop offset="100%" stop-color="#0A4D92"/>
          </linearGradient>
        </defs>
        <!-- Sacred geometry background lines -->
        <circle cx="200" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
        <circle cx="200" cy="180" r="140" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <polygon points="200,60 310,250 90,250" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
        
        <!-- Abstract clean premium dental element (Elegant styled tooth) -->
        <path d="M200,90 C250,90 280,130 270,190 C260,230 230,270 200,290 C170,270 140,230 130,190 C120,130 150,90 200,90 Z" fill="none" stroke="url(#dentalGrad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M200,120 C220,120 235,145 230,180 C218,220 200,240 200,240 C200,240 182,220 170,180 C165,145 180,120 200,120 Z" fill="url(#dentalGrad)" opacity="0.85"/>
        <circle cx="200" cy="165" r="12" fill="#FFFFFF"/>
        <!-- Radiant diamond sparkle -->
        <path d="M200,100 L205,110 L215,115 L205,120 L200,130 L195,120 L185,115 L195,110 Z" fill="#FFD700" />
      `;
    } else if (text.includes("cafe") || text.includes("coffee") || text.includes("gourmet") || text.includes("restauran") || text.includes("comid") || text.includes("food") || text.includes("panader") || text.includes("alimento")) {
      svgGraphic = `
        <defs>
          <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFD700"/>
            <stop offset="100%" stop-color="#C58927"/>
          </linearGradient>
        </defs>
        <circle cx="200" cy="180" r="110" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
        <!-- Stylized premium minimalist coffee cup geometric outline -->
        <path d="M130,150 L270,150 L255,240 C250,275 220,290 200,290 C180,290 150,275 145,240 Z" fill="none" stroke="url(#warmGrad)" stroke-width="12" stroke-linecap="round" />
        <path d="M270,180 C295,180 300,205 300,215 C300,225 295,240 270,240" fill="none" stroke="url(#warmGrad)" stroke-width="12" stroke-linecap="round" />
        <!-- Aura Steam curves -->
        <path d="M165,125 C170,105 165,95 170,80" fill="none" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
        <path d="M200,125 C205,105 200,95 205,80" fill="none" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
        <path d="M235,125 C240,105 235,95 240,80" fill="none" stroke="#FFD700" stroke-width="5" stroke-linecap="round"/>
      `;
    } else if (text.includes("tech") || text.includes("software") || text.includes("comput") || text.includes("digital") || text.includes("artificial") || text.includes("ia") || text.includes("ai") || text.includes("program")) {
      svgGraphic = `
        <defs>
          <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00F5FF"/>
            <stop offset="100%" stop-color="#9400D3"/>
          </linearGradient>
        </defs>
        <polygon points="200,60 310,123 310,250 200,313 90,250 90,123" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
        <polygon points="200,90 285,139 285,238 200,287 115,238 115,139" fill="none" stroke="url(#techGrad)" stroke-width="8" stroke-linejoin="round"/>
        
        <!-- Connection Nodes -->
        <circle cx="200" cy="90" r="14" fill="#00F5FF"/>
        <circle cx="285" cy="238" r="14" fill="#9400D3"/>
        <circle cx="115" cy="238" r="14" fill="#00F5FF"/>
        
        <!-- Core light of cyber node -->
        <circle cx="200" cy="188" r="40" fill="none" stroke="url(#techGrad)" stroke-width="5" />
        <circle cx="200" cy="188" r="18" fill="#FFFFFF" />
      `;
    } else if (text.includes("wellness") || text.includes("salu") || text.includes("yoga") || text.includes("sport") || text.includes("vida") || text.includes("health") || text.includes("fit") || text.includes("terapia")) {
      svgGraphic = `
        <defs>
          <linearGradient id="wellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#39FF14"/>
            <stop offset="100%" stop-color="#008080"/>
          </linearGradient>
        </defs>
        <circle cx="200" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
        <!-- Sacred lotus flower -->
        <path d="M200,80 C218,135 255,145 290,165 C235,182 212,198 200,270 C188,198 165,182 110,165 C145,145 182,135 200,80 Z" fill="url(#wellGrad)" opacity="0.9" />
        <path d="M200,120 C210,155 235,165 255,180 C220,190 205,200 200,245 C195,200 180,190 145,180 C165,165 190,155 200,120 Z" fill="#FFFFFF" opacity="0.95" />
      `;
    } else {
      // Cosmic / default abstract universal geometric design (Flower of Life style)
      svgGraphic = `
        <defs>
          <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4A00E0"/>
            <stop offset="100%" stop-color="#8E2DE2"/>
          </linearGradient>
        </defs>
        <circle cx="200" cy="180" r="110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
        <circle cx="200" cy="110" r="75" fill="none" stroke="url(#defaultGrad)" stroke-width="6" opacity="0.6"/>
        <circle cx="200" cy="250" r="75" fill="none" stroke="url(#defaultGrad)" stroke-width="6" opacity="0.6"/>
        <circle cx="130" cy="180" r="75" fill="none" stroke="url(#defaultGrad)" stroke-width="6" opacity="0.6"/>
        <circle cx="270" cy="180" r="75" fill="none" stroke="url(#defaultGrad)" stroke-width="6" opacity="0.6"/>
        
        <!-- Focal geometry node -->
        <circle cx="200" cy="180" r="32" fill="url(#defaultGrad)" />
        <polygon points="200,162 216,189 184,189" fill="#FFFFFF" />
      `;
    }

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <!-- Background dark space -->
        <rect width="100%" height="100%" fill="#090d16" rx="30"/>
        
        <!-- Fine background noise grid -->
        <path d="M 0 100 L 400 100 M 0 200 L 400 200 M 0 300 L 400 300 M 100 0 L 100 400 M 200 0 L 200 400 M 300 0 L 300 400" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1" />
        
        <!-- Render Isotype -->
        ${svgGraphic}

        <!-- Clean professional caption -->
        <text x="200" y="360" text-anchor="middle" fill="#5F708A" font-family="'Inter', system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" letter-spacing="6" opacity="0.6">FUTURA AUTOMATIC ENGINE</text>
      </svg>
    `;

    const base64Svg = Buffer.from(svgString.trim()).toString('base64');
    return `data:image/svg+xml;base64,${base64Svg}`;
  }

  // 2. IS IT AN IMAGE / BACKGROUND BACKDROP REQUEST?
  // Use professional Spanish-to-English translation mapping to query high contrast beautiful lifestyle photography dynamically.
  const mappings: { [key: string]: string } = {
    "dental": "dental,dentist,smile",
    "dentist": "dental,dentist,smile",
    "odontolo": "dental,dentist,clinic",
    "dient": "dental,dentist,smile",
    "sonris": "smile,happy,person",
    "cafe": "coffee,cafe,bean",
    "coffee": "coffee,cafe,cup",
    "gourmet": "gourmet,cuisine,food",
    "cafeter": "cafe,coffee,bakery",
    "food": "food,culinary,gourmet",
    "comid": "food,culinary,dish",
    "restauran": "restaurant,dining",
    "hamburg": "burger,fastfood",
    "plat": "food,dish",
    "tech": "technology,digital",
    "software": "code,programming,developer",
    "comput": "computer,developer,desk",
    "matrix": "cyberpunk,matrix,cyber",
    "digital": "digital,abstract",
    "ia": "artificial-intelligence,tech",
    "artificial": "technology,cyber",
    "web": "webdesign,ux,computer",
    "code": "code,developer",
    "programac": "code,developer",
    "belleza": "beauty,spa,cosmetics",
    "spa": "spa,wellness,bamboo",
    "cosmetic": "cosmetics,makeup,skincare",
    "piel": "skincare,serum",
    "beauty": "beauty,skincare",
    "estet": "spa,beauty",
    "masaj": "massage,spa",
    "house": "architecture,interior,house",
    "inmobil": "realestate,property,luxury-home",
    "arquitectur": "architecture,modern-building",
    "hogar": "home,cozy-living",
    "apartamento": "apartment,loft,interior",
    "diseño": "design,interior,architecture",
    "interi": "interior,minimalist-room",
    "fitness": "fitness,gym",
    "gimnas": "gym,fitness",
    "fit": "fitness,workout",
    "sport": "sports,athlete",
    "entrenamien": "training,workout",
    "fuerz": "gym,workout",
    "banana": "banana,fruit,yellow",
    "platano": "banana,fruit,yellow",
    "zapato": "shoes,sneakers,fashion",
    "calzado": "shoes,fashion",
    "vestid": "dress,fashion,apparel",
    "ropa": "clothing,fashion",
    "moda": "fashion,style",
    "auto": "car,automotive,sportscar",
    "coche": "car,automotive",
    "carro": "car,luxury-car",
    "motor": "car,automotive",
    "perro": "dog,cute-pet",
    "gato": "cat,cute-pet",
    "mascota": "pet,dog,cat",
    "viaje": "travel,adventure,destination",
    "turism": "travel,landscape",
    "playa": "beach,ocean,relax",
    "montaña": "mountain,landscape,nature",
    "hotel": "luxury-hotel,resort",
    "marketing": "marketing,business,office",
    "negocio": "business,workspace,meeting",
    "finanz": "finance,money,investment",
    "dinero": "wealth,money",
    "educac": "education,learning,classroom",
    "escuel": "school,learning,book",
    "medicin": "medicine,healthcare,doctor",
    "salud": "health,wellness"
  };

  const matchedTags: string[] = [];
  for (const [key, val] of Object.entries(mappings)) {
    if (text.includes(key)) {
      matchedTags.push(val);
    }
  }

  let keywords = "";
  if (matchedTags.length > 0) {
    keywords = matchedTags.join(",");
  } else {
    const cleanWords = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove spanish accents
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => {
        return w.length > 3 && 
               !["para", "como", "esta", "este", "todo", "sigue", "necesito", "solicit", "solicito", "conectar", "conecta", "crear", "hacer", "diseno", "imagen", "imagenes", "resultado", "resultados", "estilo", "marca", "marcas"].includes(w);
      });
    
    if (cleanWords.length > 0) {
      keywords = cleanWords.slice(0, 3).join(",");
    } else {
      keywords = "abstract,minimal,background";
    }
  }

  const cacheBuster = Math.floor(Math.random() * 1000);
  return `https://images.unsplash.com/featured/1000x1000/?${encodeURIComponent(keywords)}&sig=${cacheBuster}`;
}

