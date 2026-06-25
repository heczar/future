/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * User Design Style & Reference Guidelines for FUTURA Engines.
 * Centralized reference rules to guide image prompts and text generation.
 */

export const USER_DESIGN_GUIDELINES = {
  // Brand profiles discovered on user's Desktop/Downloads
  brands: {
    anzoateguiEmprende: {
      name: "Anzoátegui Emprende",
      niche: "Emprendimiento Local y Desarrollo Económico Gubernamental",
      primaryColor: "#4F46E5", // Indigo/Purple
      secondaryColor: "#1E293B", // Deep Slate
      accentColor: "#F59E0B", // Amber/Gold
      theme: "Clean corporate public service, supporting small local entrepreneurs and weekly training workshops."
    },
    bdt: {
      name: "BDT - Banco Digital de los Trabajadores",
      niche: "Banca y Finanzas Digitales Públicas",
      primaryColor: "#0F172A", // Navy Blue
      accentColor: "#3B82F6", // Blue
      theme: "Digital banking, modern finance, featuring colorful overlapping transparent circular graphics representing integration and workforce."
    },
    semillerosCientificos: {
      name: "Semilleros Científicos / Robótica Creativa",
      niche: "Educación de Ciencia y Tecnología para Jóvenes",
      primaryColor: "#0D9488", // Teal
      accentColor: "#10B981", // Emerald
      theme: "Scientific workshops, coding, tech nodes, and robotics training."
    }
  },

  // Color lists to inject directly in mockups and SVGs
  colorPalettes: {
    institucional: [
      { hex: "#4F46E5", name: "Morado/Índigo Imperial" },
      { hex: "#1E293B", name: "Pizarra Profunda" },
      { hex: "#F1F5F9", name: "Gris Claro" },
      { hex: "#FFFFFF", name: "Blanco Puro" }
    ],
    bdtDigital: [
      { hex: "#0F172A", name: "Azul Marino Oscuro" },
      { hex: "#EF4444", name: "Rojo Vibrante" },
      { hex: "#F59E0B", name: "Amarillo Cálido" },
      { hex: "#10B981", name: "Verde Esmeralda" },
      { hex: "#3B82F6", name: "Azul Eléctrico" }
    ]
  },

  // Copywriting/content prompt directions in Spanish
  copywritingRules: `
    DIRECTRICES DE REDACCIÓN (ESTILO INSTITUCIONAL DE EMPRENDIMIENTO Y SERVICIO PÚBLICO):
    1. TONALIDAD CERCANA Y APOYADORA: Usa un tono formal pero muy cercano, que motive a los emprendedores locales. Es un tono de servidor público enfocado en facilitar herramientas, crecimiento e inclusión.
    2. ESTRUCTURA DE AGENDA SEMANAL Y CRONOGRAMAS: Cuando el contenido sea organizativo o promocional, utiliza estructuras de "Agenda Semanal", "Ciclo de Ponencias", "Cronograma de Formaciones" o "Efemérides".
    3. FORMATO CARRUSEL Y TIPS ("Desliza 👉"): Usa viñetas limpias para carruseles informativos con la frase "Desliza para ver más" o "Aprende con estos tips". Párrafos cortos de 2 líneas máximo.
    4. LLAMADOS A LA ACCIÓN (CTA) DE INTEGRACIÓN: El CTA debe invitar a inscribirse, registrarse, participar en talleres o escanear un código QR.
    5. HASHTAGS COHERENTES: Usa hashtags del ecosistema local como: #AnzoateguiEmprende #EmprenderJuntos #FormacionProductiva #InnovacionLocal #TrabajoYProgreso.
  `,

  // Image prompt directions in English for DALL-E / Imagen
  imagePromptRules: `
    IMAGE GENERATION RULES (CLEAN SLIDE & INSTITUTIONAL LAYOUT):
    1. COMPOSITION STYLE: Clean corporate grids, slide presentation layouts, and structured vector designs.
    2. BACKGROUND: Deep slate gray (#1E293B) or solid dark navy blue (#0F172A) studio background. Minimalist negative space.
    3. GRAPHIC ELEMENTS: Structured card-style info blocks, fine line borders, and transparent overlapping geometric color accents (red, yellow, green, blue, purple gradient shades).
    4. NO TEXT: Strictly NO written words, gibberish lettering, or text overlays on the image unless explicitly requested as placeholder.
    5. FOCUS: Clean product setups, professional tech gadgets, or high-fidelity mockup scenes of stationery, notebook covers, street billboard displays, or badges.
  `,

  // Open Design Integration
  openDesignIntegration: {
    priorityRules: "Las directrices personalizadas del usuario (USER_DESIGN_GUIDELINES) siempre tienen prioridad absoluta sobre cualquier regla de Open Design. Los skills de Open Design se usan como extensiones operativas y de formato, pero deben respetar las paletas de colores, tonalidades y el tono institucional especificado en este archivo.",
    systemMappings: [
      {
        userBrand: "Anzoátegui Emprende",
        recommendedOpenDesignSystems: ["FUTURA Institucional", "Swiss Minimal"]
      },
      {
        userBrand: "BDT - Banco Digital de los Trabajadores",
        recommendedOpenDesignSystems: ["Neon Startup", "Midnight Luxe"]
      },
      {
        userBrand: "Semilleros Científicos",
        recommendedOpenDesignSystems: ["Organic Natural", "Swiss Minimal"]
      }
    ]
  }
};
