/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiClient, callWithRetry } from "./utils.js";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, X-Gemini-Api-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'] || req.headers['x-gemini-api-key'] || "";
  const { 
    prompt, 
    aspectRatio, 
    styleReferences,
    brandName,
    niche,
    colors,
    logoStyle,
    mockupType,
    customMockupDesc
  } = req.body || {};
  let model = "imagen-3.0-generate-002";

  try {
    const isLogo = (prompt || "").toLowerCase().includes("logo") || (prompt || "").toLowerCase().includes("icon") || (prompt || "").toLowerCase().includes("symbol") || (prompt || "").toLowerCase().includes("isotipo");
    
    // Create an incredibly descriptive high-quality prompt wrapper
    let enhancedPrompt = "";
    if (isLogo) {
      enhancedPrompt = `A premium professional corporate brand logo isotype, flat vector design graphic, ultra-minimalist style. ${prompt}. Clean solid flat background, sharp vector wireframe balance, modern logo system, symmetrical geometry, sleek vector curves, sharp edges. Suitable for luxury and high-converting modern digital brands. Strictly NO blurry gradients, NO complex drop shadows.`;
    } else {
      enhancedPrompt = `A high-resolution, premium editorial product photograph. ${prompt}. Minimalist setup, studio soft lighting, moody atmospheric depth, warm ambient shadows, high-contrast details, sharp focus, premium commercial styling.`;
    }

    // Prohibit unrequested texts or gibberish that image generators often output
    enhancedPrompt += " Ensure extremely high rendering quality with professional studio presentation. Strictly NO written text, misspelled generic words, garbled logos or letters unless requested.";

    console.log(`[FUTURA SERVER] Final enhanced prompt sent to Imagen 3.0: "${enhancedPrompt}"`);

    let response = null;
    let quotaDetected = false;

    // Use official Google GenAI Imagen 3.0 image generation model
    try {
      response = await callWithRetry(async () => {
        return await getAiClient(customKey).models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: enhancedPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: (aspectRatio || "1:1") as any,
          },
        });
      }, 1, 1000);
    } catch (modelErr: any) {
      const errStr = (modelErr?.message || "").toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit")) {
        quotaDetected = true;
        console.log("[FUTURA] Imagen model hit quota/limits.");
      } else {
        console.warn("[FUTURA] imagen-3.0-generate-002 failed. Serving ultra-polished Vector SVG mockup fallback...", modelErr?.message || modelErr);
      }
    }

    let imageUrl: string | null = null;

    // Parse image from generateImages response
    if (response && response.generatedImages?.[0]?.imageBytes) {
      imageUrl = `data:image/jpeg;base64,${response.generatedImages[0].imageBytes}`;
    }

    // Default elegant fallback if zero bytes found or quota was hit
    if (!imageUrl || quotaDetected) {
      imageUrl = getContextualFallback(prompt, brandName, niche, colors, logoStyle, mockupType, customMockupDesc);
    }

    return res.status(200).json({ imageUrl });
  } catch (error: any) {
    const errStr = (error?.message || "").toLowerCase();
    if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("exhausted") || errStr.includes("limit")) {
      console.log("[FUTURA] Server Image Generation rate/quota limited. Responding with elegant design placeholder.");
    } else {
      const cleanMsg = (error?.message || String(error)).slice(0, 100);
      console.log("[FUTURA] Server Image Generation exception. Serving elegant design placeholder.", cleanMsg);
    }
    const backupUrl = getContextualFallback(prompt, brandName, niche, colors, logoStyle, mockupType, customMockupDesc);
    return res.status(200).json({ imageUrl: backupUrl });
  }
}

function getContextualFallback(
  promptText: string,
  brandName?: string,
  niche?: string,
  colors?: { hex: string; name: string }[],
  logoStyle?: string,
  mockupType?: string,
  customMockupDesc?: string
): string {
  const svgString = generateAdvancedDynamicSVG(promptText, brandName, niche, colors, logoStyle, mockupType, customMockupDesc);
  const base64Svg = Buffer.from(svgString.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

export function generateAdvancedDynamicSVG(
  textPrompt: string,
  brandName?: string,
  niche?: string,
  colors?: { hex: string; name: string }[],
  logoStyle?: string,
  mockupType?: string,
  customMockupDesc?: string
): string {
  const safePrompt = String(textPrompt || "");
  const cleanName = String(brandName || "FUTURA");
  const safeNiche = String(niche || "");
  const safeLogoStyle = String(logoStyle || "");
  const safeMockupType = String(mockupType || "");
  const safeCustomMockupDesc = String(customMockupDesc || "");

  const initials = (() => {
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const p0 = parts[0] ? String(parts[0]) : "";
      const p1 = parts[1] ? String(parts[1]) : "";
      const char0 = p0[0] || "";
      const char1 = p1[0] || "";
      return (char0 + char1).toUpperCase() || "FT";
    }
    return cleanName.trim().slice(0, 2).toUpperCase() || "FT";
  })();

  const hex1 = colors?.[0]?.hex || "#FFD700";
  const hex2 = colors?.[1]?.hex || "#C58927";
  const hex3 = colors?.[2]?.hex || "#090d16";
  const hex4 = colors?.[3]?.hex || "#1e293b";

  const lowerNiche = safeNiche.toLowerCase();
  const lowerPrompt = safePrompt.toLowerCase();
  
  const isMockup = lowerPrompt.includes("mockup") || lowerPrompt.includes("valla") || lowerPrompt.includes("escaparate") || lowerPrompt.includes("packaging") || lowerPrompt.includes("letrero") || lowerPrompt.includes("tarjeta") || lowerPrompt.includes("uniforme") || lowerPrompt.includes("vaso") || lowerPrompt.includes("pantalla") || lowerPrompt.includes("vehículo") || lowerPrompt.includes("van");

  // Helper to extract a high-fidelity vector element depending on the Niche / Service
  const getNicheVectorArtwork = (strokeId: string): string => {
    if (lowerNiche.includes("dental") || lowerNiche.includes("dentis") || lowerNiche.includes("odonto") || lowerNiche.includes("diente") || lowerNiche.includes("dent")) {
      return `
        <!-- High-fidelity Sacred Geometry Dental / Molar artwork -->
        <circle cx="200" cy="165" r="55" fill="none" stroke="url(#${strokeId})" stroke-width="1.5" stroke-dasharray="3,6" opacity="0.4" />
        <path d="M190,135 C190,115 200,115 200,135 C200,115 210,115 210,135 C210,170 200,200 200,210 C200,200 190,170 190,135 Z" fill="none" stroke="url(#${strokeId})" stroke-width="4.5" stroke-linejoin="round" />
        <path d="M195,140 C195,128 200,128 200,140 C200,128 205,128 205,140 C205,165 200,190 200,198 C200,190 195,165 195,140 Z" fill="url(#${strokeId})" opacity="0.3" />
        <circle cx="200" cy="132" r="3.5" fill="#FFFFFF" />
        <path d="M170,170 C185,155 215,155 230,170" fill="none" stroke="${hex1}" stroke-width="2.5" stroke-linecap="round" />
      `;
    }
    if (lowerNiche.includes("cafe") || lowerNiche.includes("coff") || lowerNiche.includes("gourmet") || lowerNiche.includes("rest") || lowerNiche.includes("food") || lowerNiche.includes("comid") || lowerNiche.includes("bakery") || lowerNiche.includes("panad") || lowerNiche.includes("hamburgu")) {
      return `
        <!-- High-fidelity Coffee Bean / Luxury Gourmet artwork -->
        <circle cx="200" cy="165" r="50" fill="none" stroke="url(#${strokeId})" stroke-width="2.5" />
        <ellipse cx="200" cy="165" rx="28" ry="40" fill="none" stroke="url(#${strokeId})" stroke-width="4" transform="rotate(30, 200, 165)" />
        <path d="M185,190 Q200,165 215,140" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
        <circle cx="200" cy="120" r="3" fill="${hex1}" />
        <circle cx="200" cy="210" r="3" fill="${hex1}" />
        <path d="M165,130 L169,136 L175,138 L169,140 L167,146 L165,140 L159,138 L165,136 Z" fill="${hex1}" />
        <path d="M235,190 L239,196 L245,198 L239,200 L237,206 L235,200 L229,198 L235,196 Z" fill="${hex1}" />
      `;
    }
    if (lowerNiche.includes("soft") || lowerNiche.includes("tech") || lowerNiche.includes("saas") || lowerNiche.includes("ia") || lowerNiche.includes("ai") || lowerNiche.includes("app") || lowerNiche.includes("cyber") || lowerNiche.includes("digital") || lowerNiche.includes("web") || lowerNiche.includes("code")) {
      return `
        <!-- High-fidelity Isometric Tech Cube -->
        <polygon points="200,110 245,132 245,190 200,212 155,190 155,132" fill="none" stroke="url(#${strokeId})" stroke-width="3.5" stroke-linejoin="round" />
        <polygon points="200,110 200,212 M200,161 L245,132 M200,161 L155,132" stroke="url(#${strokeId})" stroke-width="1.5" opacity="0.6" />
        <circle cx="200" cy="110" r="4.5" fill="#FFFFFF" />
        <circle cx="245" cy="132" r="4.5" fill="${hex1}" />
        <circle cx="245" cy="190" r="4.5" fill="${hex2}" />
        <circle cx="200" cy="212" r="4.5" fill="#FFFFFF" />
        <circle cx="155" cy="190" r="4.5" fill="${hex2}" />
        <circle cx="155" cy="132" r="4.5" fill="${hex1}" />
        <circle cx="200" cy="161" r="28" fill="none" stroke="url(#${strokeId})" stroke-width="1" stroke-dasharray="4,4" />
      `;
    }
    if (lowerNiche.includes("fit") || lowerNiche.includes("gym") || lowerNiche.includes("sport") || lowerNiche.includes("wellness") || lowerNiche.includes("yoga") || lowerNiche.includes("pilates") || lowerNiche.includes("salud") || lowerNiche.includes("entrena")) {
      return `
        <!-- High-fidelity Athletic / Lotus Energy -->
        <path d="M165,175 C165,150 185,138 200,175 C215,138 235,150 235,175 C235,200 215,212 200,175 C185,212 165,200 165,175 Z" fill="none" stroke="url(#${strokeId})" stroke-width="4.5" />
        <circle cx="200" cy="175" r="14" fill="none" stroke="#FFFFFF" stroke-width="1.5" />
        <circle cx="200" cy="175" r="30" fill="none" stroke="url(#${strokeId})" stroke-width="1" stroke-dasharray="4,8" />
        <path d="M200,125 V225" stroke="${hex1}" stroke-width="2" stroke-linecap="round" />
        <circle cx="200" cy="125" r="4" fill="${hex2}" />
        <circle cx="200" cy="225" r="4" fill="${hex2}" />
      `;
    }
    if (lowerNiche.includes("bell") || lowerNiche.includes("beaut") || lowerNiche.includes("spa") || lowerNiche.includes("cosmet") || lowerNiche.includes("barber") || lowerNiche.includes("peluq") || lowerNiche.includes("moda") || lowerNiche.includes("fashion") || lowerNiche.includes("clot") || lowerNiche.includes("joya") || lowerNiche.includes("estet")) {
      return `
        <!-- High-fidelity Beauty / Organic Laurel Badge -->
        <path d="M165,145 C155,180 175,218 200,218 C225,218 245,180 235,145" fill="none" stroke="url(#${strokeId})" stroke-width="4" stroke-linecap="round" />
        <path d="M200,128 L204,138 L215,138 L206,145 L209,156 L200,149 L191,156 L194,145 L185,138 L196,138 Z" fill="#FFFFFF" />
        <circle cx="163" cy="142" r="4" fill="${hex1}" />
        <circle cx="237" cy="142" r="4" fill="${hex2}" />
        <path d="M180,185 C190,192 210,192 220,185" fill="none" stroke="url(#${strokeId})" stroke-width="1.5" />
      `;
    }
    if (lowerNiche.includes("arch") || lowerNiche.includes("const") || lowerNiche.includes("real") || lowerNiche.includes("estate") || lowerNiche.includes("hogar") || lowerNiche.includes("casa") || lowerNiche.includes("build") || lowerNiche.includes("prop")) {
      return `
        <!-- High-fidelity Architectonic blueprint geometry -->
        <path d="M160,180 L200,130 L240,180 Z" fill="none" stroke="url(#${strokeId})" stroke-width="5" stroke-linejoin="round" />
        <rect x="175" y="180" width="50" height="40" fill="none" stroke="#FFFFFF" stroke-width="2.5" />
        <line x1="200" y1="180" x2="200" y2="220" stroke="url(#${strokeId})" stroke-width="2" />
        <line x1="145" y1="220" x2="255" y2="220" stroke="url(#${strokeId})" stroke-width="3" stroke-linecap="round" />
        <circle cx="200" cy="115" r="5" fill="${hex1}" />
      `;
    }
    if (lowerNiche.includes("law") || lowerNiche.includes("abog") || lowerNiche.includes("finan") || lowerNiche.includes("money") || lowerNiche.includes("consult") || lowerNiche.includes("corret") || lowerNiche.includes("segur") || lowerNiche.includes("bank")) {
      return `
        <!-- High-fidelity Pillar of Trust / Balance Scale -->
        <rect x="160" y="210" width="80" height="8" fill="url(#${strokeId})" rx="2" />
        <line x1="200" y1="135" x2="200" y2="210" stroke="#FFFFFF" stroke-width="5" />
        <line x1="165" y1="150" x2="235" y2="150" stroke="url(#${strokeId})" stroke-width="4.5" stroke-linecap="round" />
        <circle cx="165" cy="165" r="8" fill="none" stroke="${hex1}" stroke-width="2" />
        <circle cx="235" cy="165" r="8" fill="none" stroke="${hex1}" stroke-width="2" />
        <polygon points="200,120 212,135 188,135" fill="${hex2}" />
      `;
    }
    return ""; // Will fallback to style-only default graphic paths
  };

  if (isMockup) {
    // Generate a beautiful Mockup simulation inside SVG
    const mockSelected = mockupType || "Valla Publicitaria Urbana";
    const bgGradId = "mockBgGrad_" + Math.random().toString(36).substr(2, 9);
    const contentGradId = "mockContentGrad_" + Math.random().toString(36).substr(2, 9);

    let mockupMainGraphics = "";

    if (mockSelected.includes("Valla") || mockSelected.includes("Billboard")) {
      mockupMainGraphics = `
        <!-- High-fidelity Billboard on skyscraper steel structure -->
        <rect x="30" y="60" width="340" height="200" fill="#0c101a" rx="10" stroke="${hex1}33" stroke-width="2" />
        <rect x="40" y="70" width="320" height="180" fill="url(#${contentGradId})" rx="6" />
        
        <!-- Steel structure legs -->
        <line x1="100" y1="260" x2="100" y2="350" stroke="#2a3547" stroke-width="6" />
        <line x1="300" y1="260" x2="300" y2="350" stroke="#2a3547" stroke-width="6" />
        <line x1="80" y1="350" x2="320" y2="350" stroke="#1e293b" stroke-width="4" />
        
        <!-- Spotlights pointing up -->
        <circle cx="90" cy="275" r="5" fill="#fff" />
        <polygon points="90,270 50,150 170,150" fill="rgba(255,255,255,0.08)" />
        <circle cx="310" cy="275" r="5" fill="#fff" />
        <polygon points="310,270 230,150 350,150" fill="rgba(255,255,255,0.08)" />

        <!-- Logo inside Billboard -->
        <g transform="translate(140, 95) scale(0.6)">
          <circle cx="100" cy="80" r="50" fill="none" stroke="#FFFFFF" stroke-width="5" />
          <text x="100" y="95" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="38" letter-spacing="2">${initials}</text>
          <text x="100" y="160" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="bold" font-size="20" letter-spacing="4">${cleanName.toUpperCase()}</text>
        </g>

        <!-- Dynamic scene contextual text -->
        <text x="200" y="235" text-anchor="middle" fill="#FFFFFF" opacity="0.65" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="3">FUTURA PREMIUM HIGHWAY BILLBOARD</text>
      `;
    } else if (mockSelected.includes("Letrero") || mockSelected.includes("Office") || mockSelected.includes("Lobby")) {
      mockupMainGraphics = `
        <!-- Minimalist Luxury Lobby wall with glass 3D sign -->
        <rect x="20" y="40" width="360" height="320" fill="#141a29" rx="16" />
        <path d="M 20,40 L 380,360 M 20,120 L 320,360 M 120,40 L 380,280" stroke="rgba(255,255,255,0.015)" stroke-width="1" />
        
        <!-- Acrylic Glass Plate backboard -->
        <rect x="60" y="100" width="280" height="180" fill="rgba(255,255,255,0.02)" rx="12" stroke="rgba(255,255,255,0.1)" stroke-width="1" style="backdrop-filter: blur(5px);" />
        <!-- Chrome Standoff Bolts in corners -->
        <circle cx="75" cy="115" r="4" fill="#8a9cbd" />
        <circle cx="325" cy="115" r="4" fill="#8a9cbd" />
        <circle cx="75" cy="265" r="4" fill="#8a9cbd" />
        <circle cx="325" cy="265" r="4" fill="#8a9cbd" />

        <!-- Glow on the main glass -->
        <ellipse cx="200" cy="190" rx="80" ry="40" fill="${hex1}" opacity="0.12" filter="blur(15px)" />

        <!-- 3D Sign Logo Group -->
        <g transform="translate(130, 115) scale(0.7)">
          <circle cx="100" cy="65" r="45" fill="none" stroke="${hex1}" stroke-width="4.5" />
          <text x="100" y="78" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="bold" font-size="28">${initials}</text>
          <text x="100" y="145" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="950" font-size="20" letter-spacing="4">${cleanName.toUpperCase()}</text>
        </g>
        
        <text x="200" y="325" text-anchor="middle" fill="${hex1}" opacity="0.6" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="3">LOBBY 3D RECEPTION SIGN</text>
      `;
    } else if (mockSelected.includes("Empaque") || mockSelected.includes("Caja") || mockSelected.includes("Package") || mockSelected.includes("Box")) {
      mockupMainGraphics = `
        <!-- High-contrast luxury packaging presentation in dark model studio -->
        <rect x="80" y="80" width="240" height="240" fill="#0b0e14" rx="20" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
        <!-- Elegant diagonal drop shadow -->
        <ellipse cx="200" cy="335" rx="90" ry="10" fill="rgba(0,0,0,0.55)" />
        
        <!-- Premium Velvet Ribbon -->
        <rect x="80" y="180" width="240" height="45" fill="url(#${contentGradId})" opacity="0.3" stroke="rgba(255,255,255,0.06)" />
        <rect x="180" y="80" width="40" height="240" fill="url(#${contentGradId})" opacity="0.3" stroke="rgba(255,255,255,0.06)" />
        
        <g transform="translate(130, 110) scale(0.7)">
          <!-- Abstract Emblem -->
          <circle cx="100" cy="70" r="40" fill="none" stroke="${hex1}" stroke-width="4" stroke-dasharray="8,4" />
          <text x="100" y="83" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="bold" font-size="30">${initials}</text>
          <text x="100" y="150" text-anchor="middle" fill="${hex1}" font-family="'Inter', sans-serif" font-weight="bold" font-size="16" letter-spacing="4">${cleanName.toUpperCase()}</text>
        </g>

        <text x="200" y="300" text-anchor="middle" fill="#5F708A" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="4">MATTE LUXURY EMBOSSED BOX</text>
      `;
    } else if (mockSelected.includes("vaso") || mockSelected.includes("Vaso") || mockSelected.includes("Café") || mockSelected.includes("Coffee Cup")) {
      mockupMainGraphics = `
        <!-- Coffee cup & Kraft bag luxury mockup -->
        <ellipse cx="200" cy="330" rx="60" ry="10" fill="rgba(0,0,0,0.4)" />
        
        <!-- Kraft Shopping bag standing in the background -->
        <polygon points="110,120 220,120 230,310 100,310" fill="#14110d" stroke="#2b241c" stroke-width="1.5" />
        <path d="M140,120 Q165,80 190,120" fill="none" stroke="#2b241c" stroke-width="4.5" stroke-linecap="round" />
        
        <!-- Kraft Bag Print label -->
        <rect x="135" y="160" width="60" height="70" fill="#090d16" rx="6" />
        <text x="165" y="195" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="bold" font-size="14">${initials}</text>
        <text x="165" y="215" text-anchor="middle" fill="${hex1}" font-family="'JetBrains Mono', monospace" font-size="6" letter-spacing="1">PREMIUM BEANS</text>
        
        <!-- Matte Black Cylindrical Coffee Cup in foreground -->
        <polygon points="210,170 290,170 275,310 225,310" fill="#080c14" rx="4" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <ellipse cx="250" cy="170" rx="40" ry="8" fill="#111622" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        
        <!-- Heat Protector Sleeve -->
        <polygon points="218,210 282,210 278,260 222,260" fill="url(#${contentGradId})" opacity="0.85" />
        <!-- Heat Sleeve Label logo -->
        <text x="250" y="235" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="950" font-size="14">${initials}</text>
        <text x="250" y="250" text-anchor="middle" fill="#000000" font-family="'Inter', sans-serif" font-weight="bold" font-size="6" letter-spacing="2">${cleanName.toUpperCase()}</text>
        
        <text x="200" y="345" text-anchor="middle" fill="#5F708A" font-family="'JetBrains Mono', sans-serif" font-size="8.5" letter-spacing="4">ECO-KRAFT STATIONERY KIT</text>
      `;
    } else if (mockSelected.includes("Uniforme") || mockSelected.includes("Camiseta") || mockSelected.includes("Apparel") || mockSelected.includes("Shirt")) {
      mockupMainGraphics = `
        <!-- High-fidelity Apparel streetwear mockup (Tshirt & Cap) -->
        <!-- Front TShirt silhouette vector -->
        <path d="M90,130 L115,100 L140,115 L145,155 L160,155 L160,320 L240,320 L240,155 L255,155 L260,115 L285,100 L310,130 L295,175 L270,160 L260,330 L140,330 L130,160 L105,175 Z" fill="#0c101a" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
        <path d="M175,108 C175,115 225,115 225,108" fill="none" stroke="url(#${contentGradId})" stroke-width="4.5" stroke-linecap="round" />
        
        <!-- Branded logo chest prints -->
        <g transform="translate(170, 160) scale(0.6)">
          <circle cx="50" cy="50" r="30" fill="none" stroke="${hex1}" stroke-width="4" />
          <text x="50" y="60" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="bold" font-size="28">${initials}</text>
          <text x="50" y="110" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="bold" font-size="16" letter-spacing="3">${cleanName.toUpperCase()}</text>
        </g>
        
        <!-- Athletic Baseball Cap Vector overlay on top left -->
        <g transform="translate(70, 70) scale(0.5)">
          <path d="M50,70 C50,20 150,20 150,70" fill="#141a29" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
          <path d="M140,65 C180,65 210,85 190,95 C160,95 140,85 140,65 Z" fill="url(#${contentGradId})" opacity="0.85" />
          <!-- Cap stamp -->
          <circle cx="100" cy="48" r="14" fill="#000000" />
          <text x="100" y="53" text-anchor="middle" fill="#FFFFFF" font-weight="bold" font-size="14">${initials}</text>
        </g>

        <text x="200" y="345" text-anchor="middle" fill="#5F708A" font-family="'JetBrains Mono', monospace" font-size="8" letter-spacing="5">STREETWEAR EMBROIDERED MERCH</text>
      `;
    } else if (mockSelected.includes("Pantalla") || mockSelected.includes("iPhone") || mockSelected.includes("App Screen")) {
      mockupMainGraphics = `
        <!-- High-fidelity iPhone App UX Mockup screen -->
        <!-- Phone Outer Bezel -->
        <rect x="110" y="50" width="180" height="310" fill="#070a13" rx="30" stroke="#252d3d" stroke-width="4" />
        <!-- Screen Canvas shadow -->
        <rect x="120" y="60" width="160" height="290" fill="#0b0f19" rx="22" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        
        <!-- Speaker / Dynamic Island notch -->
        <rect x="175" y="68" width="50" height="15" fill="#000" rx="7.5" />
        <circle cx="215" cy="75.5" r="2.5" fill="#111" />
        
        <!-- App UX Content Frame -->
        <g transform="translate(130, 95)">
          <span fill="#FFFFFF" style="font-family:'Space Grotesk', sans-serif;">
            <text x="10" y="25" fill="#FFFFFF" font-weight="bold" font-size="14">${cleanName}</text>
            <text x="10" y="38" fill="${hex1}" font-family="monospace" font-size="7" font-weight="bold">${niche ? niche.toUpperCase().slice(0, 20) : "MOBILE HUB"}</text>
          </span>
          <circle cx="120" cy="25" r="15" fill="none" stroke="${hex1}" stroke-width="1.5" />
          <text x="120" y="30" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="bold">${initials}</text>
          
          <!-- UX Cards -->
          <rect x="10" y="60" width="120" height="55" fill="rgba(255,255,255,0.02)" rx="8" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
          <text x="20" y="76" fill="#8d9eb5" font-family="'Inter', sans-serif;" font-size="7" font-weight="bold" letter-spacing="1">DASHBOARD CORE</text>
          <text x="20" y="94" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="900">$18,460</text>
          <!-- Accent trend wave chart -->
          <path d="M70,95 Q85,75 100,90 T120,80" fill="none" stroke="url(#${contentGradId})" stroke-width="3" stroke-linecap="round" />
          
          <!-- CTA Button -->
          <rect x="10" y="130" width="120" height="30" fill="url(#${contentGradId})" rx="8" />
          <text x="70" y="148" text-anchor="middle" fill="#000000" font-family="'Inter', sans-serif" font-weight="bold" font-size="9" letter-spacing="1">PROPULSAR SPE</text>
          
          <!-- Footer Navigation indicators -->
          <rect x="20" y="200" width="10" height="10" fill="${hex1}" rx="2" />
          <rect x="50" y="200" width="10" height="10" fill="#252d3d" rx="2" />
          <rect x="80" y="200" width="10" height="10" fill="#252d3d" rx="2" />
          <rect x="110" y="200" width="10" height="10" fill="#252d3d" rx="2" />
        </g>
        
        <text x="200" y="380" text-anchor="middle" fill="#5F708A" font-family="'JetBrains Mono', monospace" font-size="8" letter-spacing="3">APP UX PREVIEW INTERFACE</text>
      `;
    } else if (mockSelected.includes("Vehículo") || mockSelected.includes("Van") || mockSelected.includes("Delivery Van")) {
      mockupMainGraphics = `
        <!-- High-fidelity Commercial delivery van vehicle wrapper mockup -->
        <ellipse cx="200" cy="315" rx="140" ry="12" fill="rgba(0,0,0,0.55)" />
        
        <!-- Van body drawing complex path -->
        <path d="M50,230 L55,160 L65,145 L95,145 L115,115 L220,115 L320,115 L340,150 L345,210 L345,265 L335,275 L310,275 C310,250 280,250 280,275 L140,275 C140,250 110,250 110,275 L60,275 Z" fill="#080c14" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
        
        <!-- Windows -->
        <path d="M68,160 L108,160 L115,148 L95,148 Z" fill="#000000" />
        <path d="M125,125 L165,125 L165,160 L125,160 Z" fill="#111622" opacity="0.8" />
        
        <!-- Wheels -->
        <circle cx="125" cy="275" r="22" fill="#000000" stroke="#1d2636" stroke-width="3" />
        <circle cx="125" cy="275" r="10" fill="#5a6578" />
        <circle cx="295" cy="275" r="22" fill="#000000" stroke="#1d2636" stroke-width="3" />
        <circle cx="295" cy="275" r="10" fill="#5a6578" />

        <!-- High contrast luxury livery wrap (flowing diagonal graphic lines) -->
        <path d="M135,160 L285,115 L310,180 L185,265 Z" fill="url(#${contentGradId})" opacity="0.35" />
        <path d="M175,185 L325,115 L310,240 L210,270 Z" fill="url(#${contentGradId})" opacity="0.15" />

        <!-- Bold Vinyl logo on van body -->
        <g transform="translate(160, 160) scale(0.65)">
          <path d="M30,30 H110 L80,80 H30 Z" fill="none" stroke="#FFFFFF" stroke-width="5" />
          <text x="110" y="65" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="28" letter-spacing="3">${cleanName.toUpperCase()}</text>
          <text x="110" y="85" fill="${hex1}" font-family="'JetBrains Mono', monospace" font-size="11" letter-spacing="4">${niche ? niche.toUpperCase().slice(0, 18) : "LOGISTICS"}</text>
        </g>
        
        <text x="200" y="340" text-anchor="middle" fill="#5F708A" font-family="'JetBrains Mono', sans-serif" font-size="8.5" letter-spacing="4">COMMERCIAL VAN WRAP LIVERY</text>
      `;
    } else {
      // Default: Papelería Corporativa Completa
      mockupMainGraphics = `
        <!-- Elegant Stationery / business cards mockup floating over dark velvet marble -->
        <!-- Card 1 -->
        <rect x="50" y="80" width="220" height="130" fill="#0c101a" rx="12" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" transform="rotate(-6, 160, 145)" />
        <!-- Card 2 (on top) -->
        <rect x="130" y="140" width="220" height="130" fill="#141d2e" rx="12" stroke="${hex1}2b" stroke-width="1.5" transform="rotate(4, 240, 205)" />
        
        <!-- Shadow of Card 2 -->
        <rect x="135" y="145" width="220" height="130" rx="12" fill="rgba(0,0,0,0.35)" transform="rotate(4, 240, 205)" />
        <rect x="130" y="140" width="220" height="130" fill="#090d16" rx="12" stroke="${hex1}44" stroke-width="1.5" transform="rotate(4, 240, 205)" />

        <!-- Logo content on Card 2 -->
        <g transform="translate(155, 160) scale(0.65)">
          <circle cx="60" cy="50" r="30" fill="none" stroke="${hex1}" stroke-width="4.5" />
          <text x="60" y="61" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="950" font-size="28">${initials}</text>
          <text x="60" y="115" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="bold" font-size="16" letter-spacing="4">${cleanName.toUpperCase()}</text>
          <text x="60" y="138" text-anchor="middle" fill="${hex2}" font-family="'JetBrains Mono', monospace" font-size="9" letter-spacing="5">${niche?.toUpperCase().slice(0,20) || "ELITE"}</text>
        </g>
        
        <text x="200" y="325" text-anchor="middle" fill="#5F708A" font-family="'JetBrains Mono', sans-serif" font-size="8" letter-spacing="5">DOUBLE BRANDED STATIONERY</text>
      `;
    }

    const mockupSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <defs>
          <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#04060b"/>
            <stop offset="100%" stop-color="#0a101f"/>
          </linearGradient>
          <linearGradient id="${contentGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${hex1}"/>
            <stop offset="100%" stop-color="${hex2}"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#${bgGradId})" rx="28"/>
        
        <!-- Clean geometric framing lines -->
        <path d="M 10 0 L 10 400 M 390 0 L 390 400" stroke="rgba(255, 255, 255, 0.015)" stroke-width="1.5" />
        
        ${mockupMainGraphics}

        <!-- Custom prompt descriptor line (If any) -->
        ${safeCustomMockupDesc ? `
        <rect x="40" y="15" width="320" height="24" fill="rgba(0,0,0,0.6)" rx="6" stroke="rgba(255,255,255,0.04)" stroke-width="0.75" />
        <text x="200" y="30" text-anchor="middle" fill="${hex1}" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="bold" letter-spacing="1">PREFERENCIA: ${safeCustomMockupDesc.toUpperCase().slice(0, 42)}...</text>
        ` : ""}
      </svg>
    `;
    return mockupSvg;
  }

  // ELSE: LOGO GENERATOR (DYNAMICALLY INTEGRATING NICHE EMBLEMS!)
  const chosenStyle = safeLogoStyle || "Simétrico y Geométrico de Lujo";
  const bgGradId = "bgGrad_" + Math.random().toString(36).substr(2, 9);
  const strokeGradId = "strokeGrad_" + Math.random().toString(36).substr(2, 9);

  let graphicContent = "";
  const nicheVectorArts = getNicheVectorArtwork(strokeGradId);

  if (nicheVectorArts) {
    // If a robust niche icon was extracted, make it the magnificent centerpiece!
    graphicContent = `
      <!-- Centerpiece Dynamic Niche-Driven Iconography -->
      ${nicheVectorArts}
      
      <!-- Visual style framing decor -->
      <circle cx="200" cy="175" r="105" fill="none" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1.5" />
      <circle cx="200" cy="175" r="95" fill="none" stroke="url(#${strokeGradId})" stroke-width="1" stroke-dasharray="8,12" opacity="0.5" />
      
      <!-- Monogram detail integrated if requested -->
      ${(chosenStyle.includes("Monograma") || chosenStyle.includes("Siglas")) ? `
      <rect x="180" y="155" width="40" height="40" fill="#04060b" rx="20" stroke="${hex1}" stroke-width="1.5" />
      <text x="200" y="181" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-weight="bold" font-size="16" letter-spacing="-1">${initials}</text>
      ` : ""}
    `;
  } else if (chosenStyle.includes("Monograma") || chosenStyle.includes("Siglas")) {
    graphicContent = `
      <!-- High-fidelity fine line Monogram dynamic layout -->
      <circle cx="200" cy="175" r="95" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      <circle cx="200" cy="175" r="85" fill="none" stroke="url(#${strokeGradId})" stroke-width="1.5" />
      <circle cx="200" cy="175" r="75" fill="none" stroke="url(#${strokeGradId})" stroke-dasharray="4,8" stroke-width="1" />
      
      <!-- Micro decoration anchors -->
      <line x1="200" y1="50" x2="200" y2="70" stroke="${hex1}" stroke-width="1.5" />
      <line x1="200" y1="280" x2="200" y2="300" stroke="${hex1}" stroke-width="1.5" />
      <circle cx="200" cy="175" r="58" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

      <!-- Centerpiece Monogram Letters with sophisticated tracking -->
      <text x="200" y="196" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', 'Inter', sans-serif" font-weight="900" font-size="58" letter-spacing="-3" fill-opacity="0.95">${initials}</text>
      <!-- Horizontal strike line -->
      <line x1="145" y1="172" x2="255" y2="172" stroke="${hex1}" stroke-width="2" />
    `;
  } else if (chosenStyle.includes("Orgánico") || chosenStyle.includes("Natural") || chosenStyle.includes("Eco")) {
    graphicContent = `
      <!-- Dynamic stylized sacred biology / leaf outline -->
      <circle cx="200" cy="175" r="110" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      <!-- Left leaf petal -->
      <path d="M200,90 C250,130 250,210 200,260 C150,210 150,130 200,90 Z" fill="none" stroke="url(#${strokeGradId})" stroke-width="6" stroke-linecap="round"/>
      <!-- Right leaf secondary overlay -->
      <path d="M200,120 C235,150 235,210 200,250 C165,210 165,150 200,120 Z" fill="url(#${strokeGradId})" opacity="0.3" />
      <circle cx="200" cy="175" r="10" fill="#FFFFFF" />
      <!-- Radiant stars -->
      <path d="M150,120 L153,126 L159,129 L153,132 L150,138 L147,132 L141,129 L147,126 Z" fill="${hex1}" opacity="0.8" />
      <path d="M250,120 L253,126 L259,129 L253,132 L250,138 L247,132 L241,129 L247,126 Z" fill="${hex1}" opacity="0.8" />
    `;
  } else if (chosenStyle.includes("Tecnológico") || chosenStyle.includes("SaaS") || chosenStyle.includes("Tech")) {
    graphicContent = `
      <!-- Cybernetic tech nodes & futuristic network vectors -->
      <polygon points="200,65 295,120 295,230 200,285 105,230 105,120" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="3" />
      <polygon points="200,80 280,126 280,219 200,265 120,219 120,126" fill="none" stroke="url(#${strokeGradId})" stroke-dasharray="10,6" stroke-width="5" stroke-linejoin="round" />
      
      <!-- Concentric tech core -->
      <circle cx="200" cy="175" r="45" fill="none" stroke="url(#${strokeGradId})" stroke-width="3" />
      <circle cx="200" cy="175" r="30" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1" />
      <circle cx="200" cy="175" r="15" fill="#FFFFFF" />
      
      <!-- Nodes -->
      <circle cx="200" cy="80" r="12" fill="${hex1}" />
      <circle cx="280" cy="219" r="12" fill="${hex2}" />
      <circle cx="120" cy="219" r="12" fill="${hex1}" />
      <line x1="200" y1="80" x2="200" y2="130" stroke="${hex1}" stroke-width="2" />
    `;
  } else if (chosenStyle.includes("Heráldico") || chosenStyle.includes("Emblema") || chosenStyle.includes("Corporativo")) {
    graphicContent = `
      <!-- Medieval stark royal heraldry minimalist shield -->
      <path d="M130,90 L270,90 L270,180 C270,230 200,270 200,270 C200,270 130,230 130,180 Z" fill="none" stroke="url(#${strokeGradId})" stroke-width="8" stroke-linejoin="round" />
      <path d="M145,105 L255,105 L255,175 C255,215 200,250 200,250 C200,250 145,215 145,175 Z" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
      
      <!-- Triple star of authority -->
      <path d="M200,120 L204,130 L214,132 L206,138 L208,148 L200,142 L192,148 L194,138 L186,132 L196,130 Z" fill="${hex1}" />
      <path d="M175,160 L225,160 L200,195 Z" fill="url(#${strokeGradId})" />
      <circle cx="200" cy="215" r="8" fill="#FFFFFF" />
    `;
  } else if (chosenStyle.includes("Mascota") || chosenStyle.includes("Urbano") || chosenStyle.includes("Comida")) {
    graphicContent = `
      <!-- Modern Bold Streetwear Badge circle badge -->
      <circle cx="200" cy="175" r="95" fill="none" stroke="url(#${strokeGradId})" stroke-width="10" />
      <circle cx="200" cy="175" r="80" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="6,4" />
      
      <!-- Street flame / lighting bolt in center -->
      <path d="M205,105 L165,185 L195,185 L185,245 L235,155 L195,155 Z" fill="url(#${strokeGradId})" />
      
      <!-- Circular text banner -->
      <path id="badgeTextPath" d="M125,245 A90,90 0 0,1 275,245" fill="none" stroke="transparent" />
      <text font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold" fill="#5F708A" letter-spacing="3">
        <textPath href="#badgeTextPath" startOffset="50%" text-anchor="middle">
          FUTURA URBAN CORE
        </textPath>
      </text>
    `;
  } else if (chosenStyle.includes("Vintage") || chosenStyle.includes("Industrial")) {
    graphicContent = `
      <!-- Elegant vintage diamond typography cogs frame -->
      <polygon points="200,75 295,170 200,265 105,170" fill="none" stroke="url(#${strokeGradId})" stroke-width="6" />
      <polygon points="200,90 275,170 200,250 125,170" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
      
      <!-- Crossed retro lines of heritage -->
      <line x1="150" y1="125" x2="250" y2="225" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
      <line x1="250" y1="125" x2="150" y2="225" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
      
      <!-- Elegant center circle with brand initial -->
      <circle cx="200" cy="170" r="38" fill="#090d16" stroke="url(#${strokeGradId})" stroke-width="2" />
      <text x="200" y="184" text-anchor="middle" fill="#FFFFFF" font-family="'Playfair Display', serif" font-weight="900" font-size="34" letter-spacing="1">${initials.slice(0,1)}</text>
      
      <circle cx="200" cy="100" r="4" fill="${hex1}" />
      <circle cx="200" cy="240" r="4" fill="${hex1}" />
    `;
  } else {
    // Default: Simétrico y Geométrico de Lujo (Premium Gold/Obsidian)
    graphicContent = `
      <!-- Interlocking luxurious golden spheres -->
      <circle cx="200" cy="175" r="95" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1" />
      
      <circle cx="200" cy="120" r="70" fill="none" stroke="url(#${strokeGradId})" stroke-width="3" opacity="0.55"/>
      <circle cx="200" cy="230" r="70" fill="none" stroke="url(#${strokeGradId})" stroke-width="3" opacity="0.55"/>
      <circle cx="145" cy="175" r="70" fill="none" stroke="url(#${strokeGradId})" stroke-width="3" opacity="0.55"/>
      <circle cx="255" cy="175" r="70" fill="none" stroke="url(#${strokeGradId})" stroke-width="3" opacity="0.55"/>
      
      <!-- Inner core diamond -->
      <polygon points="200,135 235,175 200,215 165,175" fill="url(#${strokeGradId})" opacity="0.85" />
      <polygon points="200,145 224,175 200,205 176,175" fill="#FFFFFF" />
      
      <circle cx="200" cy="175" r="6" fill="#04060b" />
    `;
  }

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#04060b"/>
          <stop offset="100%" stop-color="#090e19"/>
        </linearGradient>
        <linearGradient id="${strokeGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${hex1}"/>
          <stop offset="100%" stop-color="${hex2}"/>
        </linearGradient>
      </defs>
      
      <!-- Rounded dark space background -->
      <rect width="100%" height="100%" fill="url(#${bgGradId})" rx="28"/>
      
      <!-- Fine vector background grids -->
      <path d="M 0 50 L 400 50 M 0 100 L 400 100 M 0 150 L 400 150 M 0 200 L 400 200 M 0 250 L 400 250 M 0 300 L 400 300 M 0 350 L 400 350" stroke="rgba(255, 255, 255, 0.015)" stroke-width="0.75" />
      <path d="M 50 0 L 50 400 M 100 0 L 100 400 M 150 0 L 150 400 M 200 0 L 200 400 M 250 0 L 250 400 M 300 0 L 300 400 M 350 0 L 350 400" stroke="rgba(255, 255, 255, 0.015)" stroke-width="0.75" />
      
      <!-- Circular safe framing ring -->
      <circle cx="200" cy="175" r="130" fill="none" stroke="rgba(255,255,255,0.01)" stroke-width="1" />

      <!-- Graphic vector composition -->
      ${graphicContent}

      <!-- Clean textual composition with brand name -->
      <text x="200" y="340" text-anchor="middle" fill="#FFFFFF" font-family="'Space Grotesk', 'Inter', sans-serif" font-weight="bold" font-size="14" letter-spacing="6" fill-opacity="0.9">${cleanName.toUpperCase()}</text>
      <text x="200" y="360" text-anchor="middle" fill="${hex1}" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="bold" letter-spacing="4" fill-opacity="0.8">${safeNiche ? safeNiche.toUpperCase().slice(0, 36) : "FUTURA AUTOMATIC DESIGN"}</text>
    </svg>
  `;

  return svgString;
}

