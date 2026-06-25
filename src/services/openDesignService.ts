/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Open Design Integration Service for FUTURA.
 * Provides access to curated skills, design systems, and prompt templates
 * from the nexu-io/open-design repository (https://github.com/nexu-io/open-design).
 */

export interface OpenDesignSkill {
  name: string;
  description: string;
  category: 'strategy' | 'copywriting' | 'image' | 'video' | 'design-system' | 'branding' | 'general';
  instructions: string;
  triggers: string[];
}

export interface PromptTemplate {
  name: string;
  category: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  thumbnail?: string;
}

export interface DesignSystemProfile {
  name: string;
  description: string;
  colors: { name: string; hex: string }[];
  typography: string;
  style: string;
}

// ========== CURATED OPEN DESIGN SKILLS CATALOG ==========
// Source: https://github.com/nexu-io/open-design/tree/main/skills

const OPEN_DESIGN_SKILLS: OpenDesignSkill[] = [
  // --- STRATEGY SKILLS ---
  {
    name: 'brainstorming',
    description: 'Generate creative ideas, explore directions, and diverge before converging on a strategy.',
    category: 'strategy',
    triggers: ['brainstorm', 'ideas', 'ideation'],
    instructions: `BRAINSTORMING SKILL (Open Design):
- Generate at least 5 divergent creative directions before converging.
- Use lateral thinking: analogies, inversions, random stimuli, SCAMPER.
- Present ideas in a structured grid: Idea Name → Core Insight → Execution Sketch.
- Rank by feasibility × impact × novelty.
- Always end with a "Wild Card" idea that breaks conventions.`
  },
  {
    name: 'creative-director',
    description: 'Act as a creative director reviewing and elevating design quality, providing art direction and brand consistency feedback.',
    category: 'strategy',
    triggers: ['creative direction', 'art direction', 'brand review'],
    instructions: `CREATIVE DIRECTOR SKILL (Open Design):
- Review all outputs through the lens of: Brand Consistency, Visual Hierarchy, Emotional Impact, Technical Quality.
- Provide feedback in the format: "KEEP / CHANGE / ADD / REMOVE".
- Ensure every deliverable passes the "Squint Test" (readable at arm's length).
- Enforce the active DESIGN.md color palette, typography scale, and spacing grid.
- Grade outputs: A (ship-ready), B (minor tweaks), C (rework needed).`
  },
  {
    name: 'design-brief',
    description: 'Create structured design briefs from vague requirements, extracting target audience, objectives, deliverables, and constraints.',
    category: 'strategy',
    triggers: ['brief', 'requirements', 'project scope'],
    instructions: `DESIGN BRIEF SKILL (Open Design):
- Extract and structure: Objective → Target Audience → Key Message → Tone → Deliverables → Constraints → Timeline.
- Ask clarifying questions if critical info is missing (audience, budget, deadline).
- Output a one-page brief formatted as a clean card with labeled sections.
- Include a "Success Metrics" section defining how to measure impact.`
  },
  {
    name: 'brand-guidelines',
    description: 'Generate or review brand guidelines including logo usage, color systems, typography, and tone of voice.',
    category: 'branding',
    triggers: ['brand guide', 'brand manual', 'style guide'],
    instructions: `BRAND GUIDELINES SKILL (Open Design):
- Structure: Logo (clear space, minimum size, don'ts) → Colors (primary, secondary, accent + hex/RGB) → Typography (headings, body, captions) → Imagery Style → Tone of Voice → Do's & Don'ts.
- Include usage examples for: Social Media, Print, Presentations, Merchandise.
- Define the brand personality using 3-5 adjectives.
- Provide a "Quick Reference Card" summary.`
  },
  {
    name: 'brand-extract',
    description: 'Extract brand identity elements from existing materials: logos, colors, fonts, tone, and visual patterns.',
    category: 'branding',
    triggers: ['extract brand', 'analyze brand', 'brand audit'],
    instructions: `BRAND EXTRACT SKILL (Open Design):
- Analyze uploaded materials to extract: Dominant Colors (hex values), Typography (font families, weights), Layout Patterns, Visual Motifs, Tone of Voice.
- Output a structured "Brand DNA" card with all extracted elements.
- Suggest complementary colors and fonts that align with the detected style.
- Rate brand consistency across materials: Strong / Moderate / Weak.`
  },
  // --- COPYWRITING SKILLS ---
  {
    name: 'copywriting',
    description: 'Write and rewrite marketing copy for landing pages, homepages, and ads. Useful as a copy chief partner during launches.',
    category: 'copywriting',
    triggers: ['copywriting', 'landing copy', 'ad copy', 'homepage copy'],
    instructions: `COPYWRITING SKILL (Open Design — Curated from Corey Haines):
- Write copy that converts using proven frameworks: AIDA, PAS (Pain-Agitate-Solve), BAB (Before-After-Bridge).
- Every headline must pass the "So What?" test.
- Lead with benefits, not features. Use specific numbers over vague claims.
- Include power words: Free, New, Proven, Instant, Exclusive, Guaranteed, Limited.
- Structure: Hook (1 line) → Problem (2-3 lines) → Solution (2-3 lines) → Proof (1-2 lines) → CTA (1 line).
- Vary sentence length for rhythm. Short. Then a longer one that builds momentum and carries the reader forward.`
  },
  {
    name: 'ad-creative',
    description: 'Generate and iterate ad creative including headlines, descriptions, and primary text for paid social and search ads.',
    category: 'copywriting',
    triggers: ['ad creative', 'ad headline', 'paid social ad', 'search ad'],
    instructions: `AD CREATIVE SKILL (Open Design — Curated from Corey Haines):
- Generate 3-5 headline variations per brief (short, punchy, under 40 chars).
- Write primary text variants: Short (under 90 chars), Medium (90-150 chars), Long (150-280 chars).
- Include scroll-stopping hooks: Questions, Bold Claims, Urgency, Social Proof, Contrarian Takes.
- Format for each platform: Facebook/Instagram (primary text + headline + description), Google (headlines + descriptions), LinkedIn (intro text + headline).
- A/B test suggestions: always provide at least 2 contrasting angles.`
  },
  {
    name: 'enhance-prompt',
    description: 'Take a basic prompt and enhance it with detailed, professional-grade instructions for better AI output.',
    category: 'general',
    triggers: ['enhance prompt', 'improve prompt', 'better prompt'],
    instructions: `ENHANCE PROMPT SKILL (Open Design):
- Take the user's basic prompt and expand it with: Specific details, Style references, Technical parameters, Negative constraints.
- For image prompts: Add lighting, camera angle, lens, color grading, composition, texture, mood.
- For text prompts: Add tone, format, audience, length, examples, constraints.
- Always preserve the user's original intent while dramatically increasing output quality.
- Output format: "Original → Enhanced" side by side.`
  },
  {
    name: 'card-twitter',
    description: 'Design Twitter/X card layouts with optimized visual hierarchy for social media engagement.',
    category: 'copywriting',
    triggers: ['twitter card', 'x post', 'tweet design'],
    instructions: `TWITTER/X CARD SKILL (Open Design):
- Design for the 2:1 or 1.91:1 aspect ratio Twitter card format.
- Visual hierarchy: Large headline (max 8 words) → Supporting visual → Branding element.
- Text overlay rules: High contrast, sans-serif font, max 2 lines.
- Include engagement elements: Thread hooks, Quote tweet bait, Reply triggers.
- Color: Use brand colors with a single accent for CTA elements.`
  },
  // --- IMAGE SKILLS ---
  {
    name: 'color-expert',
    description: 'Generate harmonious color palettes, analyze color relationships, and suggest brand-appropriate color systems.',
    category: 'image',
    triggers: ['color palette', 'color scheme', 'color harmony'],
    instructions: `COLOR EXPERT SKILL (Open Design):
- Generate palettes using color theory: Complementary, Analogous, Triadic, Split-Complementary, Tetradic.
- Output hex, RGB, and HSL values for each color.
- Include: Primary, Secondary, Accent, Background, Text, Success, Warning, Error.
- Test contrast ratios for WCAG AA/AAA accessibility compliance.
- Suggest dark mode variants for each palette.
- Provide mood associations for each color choice.`
  },
  {
    name: 'canvas-design',
    description: 'Create structured canvas designs and visual layouts for social media posts, banners, and marketing materials.',
    category: 'image',
    triggers: ['canvas', 'social media design', 'banner design'],
    instructions: `CANVAS DESIGN SKILL (Open Design):
- Design for specific canvas sizes: Instagram Post (1080×1080), Story (1080×1920), Facebook Cover (851×315), LinkedIn Banner (1584×396), YouTube Thumbnail (1280×720).
- Apply the rule of thirds grid for element placement.
- Ensure text occupies less than 20% of the canvas area (Facebook ad rule).
- Use visual hierarchy: Focal Point → Supporting Elements → Background.
- Include bleed area and safe zone guidelines.`
  },
  {
    name: 'ecommerce-image-workflow',
    description: 'Generate product photography prompts and e-commerce image workflows including lifestyle shots, flat lays, and detail views.',
    category: 'image',
    triggers: ['product photo', 'ecommerce image', 'product shot'],
    instructions: `ECOMMERCE IMAGE WORKFLOW SKILL (Open Design):
- Generate a complete product image set: Hero Shot (45° angle, white background), Lifestyle Shot (in-context usage), Detail Shot (texture/material close-up), Scale Shot (with reference object), Group Shot (product family).
- Lighting setup: 3-point studio lighting with soft key, fill, and rim light.
- Post-processing: Clean white background (RGB 255,255,255), consistent shadows, color-accurate.
- Platform optimization: Amazon (1000×1000 min, white bg), Shopify (2048×2048), Instagram Shopping (1080×1080).`
  },
  {
    name: 'design-consultation',
    description: 'Provide design consultation and feedback, reviewing visual materials and suggesting improvements.',
    category: 'strategy',
    triggers: ['design review', 'design feedback', 'visual critique'],
    instructions: `DESIGN CONSULTATION SKILL (Open Design):
- Review designs across 5 dimensions: Aesthetics, Usability, Brand Alignment, Technical Quality, Innovation.
- Use the "Praise-Question-Suggest" feedback framework.
- Identify the 3 most impactful changes that would elevate the design.
- Reference specific design principles: Proximity, Alignment, Repetition, Contrast (PARC).
- Provide annotated feedback with specific coordinates/areas.`
  },
  // --- VIDEO SKILLS ---
  {
    name: 'video-social-short',
    description: 'Create scripts and storyboards for short-form social media videos (Reels, TikTok, Shorts) optimized for engagement.',
    category: 'video',
    triggers: ['reel', 'tiktok', 'short video', 'video script'],
    instructions: `VIDEO SOCIAL SHORT SKILL (Open Design / HyperFrames):
- Structure: Hook (0-3s) → Problem/Setup (3-8s) → Solution/Reveal (8-20s) → CTA (20-30s).
- Hook types: Pattern interrupt, Bold claim, Before/After, "Wait for it...", Direct question.
- Include: Shot list (camera angle + action), Text overlay cues, Music/SFX suggestions, Transition types.
- Optimize for: Sound-off viewing (captions mandatory), Vertical 9:16 format, Loop-worthy endings.
- Engagement triggers: Save-worthy info, Share-worthy humor, Comment-worthy controversy.`
  }
];

// ========== CURATED PROMPT TEMPLATES ==========
// Source: https://github.com/nexu-io/open-design/tree/main/prompt-templates

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: 'Professional Product Hero',
    category: 'product',
    prompt: 'Premium product photography, center-frame composition, soft gradient background transitioning from dark slate to deep navy, volumetric studio lighting with subtle rim light, 8K resolution, photorealistic render, clean minimal aesthetic, luxury brand feel',
    model: 'imagen-3.0',
    aspectRatio: '1:1'
  },
  {
    name: 'Corporate Event Banner',
    category: 'event',
    prompt: 'Modern corporate event banner design, clean geometric layout with overlapping translucent color blocks in indigo and teal, dark navy background, sans-serif typography placeholders, professional business atmosphere, sleek minimal composition',
    model: 'imagen-3.0',
    aspectRatio: '16:9'
  },
  {
    name: 'Social Media Carousel Cover',
    category: 'social',
    prompt: 'Instagram carousel cover slide design, bold gradient background from deep purple to midnight blue, clean vector icons, card-style layout with rounded corners, modern flat design aesthetic, vibrant accent colors, professional social media template',
    model: 'imagen-3.0',
    aspectRatio: '1:1'
  },
  {
    name: 'Tech Startup Landing Hero',
    category: 'web',
    prompt: 'Hero section background for tech startup website, abstract 3D mesh gradient in dark mode, floating geometric shapes with glass morphism effect, deep indigo and electric blue color scheme, futuristic and premium feel, 4K wallpaper quality',
    model: 'imagen-3.0',
    aspectRatio: '16:9'
  },
  {
    name: 'Brand Identity Mockup',
    category: 'branding',
    prompt: 'Professional brand identity mockup scene, business cards and stationery on dark slate surface, elegant studio lighting, shallow depth of field, premium paper textures, minimalist corporate design, photorealistic 3D render',
    model: 'imagen-3.0',
    aspectRatio: '4:3'
  },
  {
    name: 'Food & Restaurant Visual',
    category: 'gastronomy',
    prompt: 'Stunning food photography, overhead flat lay composition on dark wood surface, natural window lighting, fresh vibrant ingredients, steam rising from hot dish, professional culinary styling, moody atmospheric tones, magazine editorial quality',
    model: 'imagen-3.0',
    aspectRatio: '1:1'
  },
  {
    name: 'Fitness & Wellness',
    category: 'health',
    prompt: 'Dynamic fitness scene, athlete in motion with dramatic studio lighting, dark background with subtle smoke effects, high-contrast color grading in teal and orange, powerful composition, professional sports photography style, energy and movement',
    model: 'imagen-3.0',
    aspectRatio: '9:16'
  },
  {
    name: 'E-commerce Flat Lay',
    category: 'product',
    prompt: 'Premium e-commerce flat lay arrangement, products artfully arranged on clean white marble surface, soft natural top-down lighting, subtle shadows, lifestyle accessories as props, curated and aspirational, high-end brand aesthetic',
    model: 'imagen-3.0',
    aspectRatio: '1:1'
  },
  {
    name: 'Real Estate Interior',
    category: 'realestate',
    prompt: 'Luxury modern interior design photograph, open floor plan living room, floor-to-ceiling windows with city skyline view, warm ambient lighting, contemporary furniture, clean lines, architectural photography style, wide angle lens, HDR quality',
    model: 'imagen-3.0',
    aspectRatio: '16:9'
  },
  {
    name: 'Education & Workshop',
    category: 'education',
    prompt: 'Modern education and workshop scene, diverse group collaborating around a table with laptops and notebooks, bright airy coworking space, natural light, warm and inviting atmosphere, professional yet approachable, documentary photography style',
    model: 'imagen-3.0',
    aspectRatio: '16:9'
  },
  {
    name: 'Beauty & Cosmetics',
    category: 'beauty',
    prompt: 'Luxury cosmetics product photography, elegant arrangement with rose gold and blush pink tones, soft diffused lighting, water droplets on surface for freshness, marble and glass textures, high-end beauty brand aesthetic, macro detail quality',
    model: 'imagen-3.0',
    aspectRatio: '1:1'
  },
  {
    name: 'Abstract Data Visualization',
    category: 'tech',
    prompt: 'Abstract data visualization artwork, flowing particle streams in neon blue and violet on dark background, holographic mesh networks, digital neural pathways, futuristic AI concept art, clean vector lines, tech conference presentation quality',
    model: 'imagen-3.0',
    aspectRatio: '16:9'
  }
];

// ========== CURATED DESIGN SYSTEMS ==========

const DESIGN_SYSTEMS: DesignSystemProfile[] = [
  {
    name: 'FUTURA Institucional',
    description: 'Sistema de diseño predeterminado del portafolio del usuario. Emprendimiento local, institucional, cercano.',
    colors: [
      { name: 'Índigo Imperial', hex: '#4F46E5' },
      { name: 'Pizarra Profunda', hex: '#1E293B' },
      { name: 'Gris Claro', hex: '#F1F5F9' },
      { name: 'Blanco Puro', hex: '#FFFFFF' },
      { name: 'Ámbar Dorado', hex: '#F59E0B' }
    ],
    typography: 'Roboto, Inter — Sans-serif bold/extra-bold para títulos, regular para cuerpo',
    style: 'Corporate institutional, clean grids, slide presentation layouts, structured card-style info blocks'
  },
  {
    name: 'Midnight Luxe',
    description: 'Dark premium luxury brand design. Ideal para marcas de alta gama, joyería, moda, bienes raíces de lujo.',
    colors: [
      { name: 'Midnight Black', hex: '#0A0A0A' },
      { name: 'Champagne Gold', hex: '#D4AF37' },
      { name: 'Ivory White', hex: '#FFFFF0' },
      { name: 'Slate Gray', hex: '#708090' }
    ],
    typography: 'Playfair Display for headings, Inter for body — Serif/sans-serif contrast',
    style: 'High contrast dark backgrounds, gold accents, editorial photography, generous whitespace'
  },
  {
    name: 'Neon Startup',
    description: 'Vibrante y tecnológico. Para startups tech, SaaS, fintech, crypto, apps.',
    colors: [
      { name: 'Electric Violet', hex: '#7C3AED' },
      { name: 'Neon Cyan', hex: '#06B6D4' },
      { name: 'Dark Space', hex: '#0F172A' },
      { name: 'Hot Pink', hex: '#EC4899' },
      { name: 'Pure White', hex: '#FFFFFF' }
    ],
    typography: 'Outfit, Space Grotesk — Geometric sans-serif, bold weights',
    style: 'Glassmorphism, gradients, neon glows, floating UI elements, dark mode first'
  },
  {
    name: 'Organic Natural',
    description: 'Orgánico y terroso. Para alimentos orgánicos, wellness, yoga, eco-products, agricultura.',
    colors: [
      { name: 'Forest Green', hex: '#166534' },
      { name: 'Warm Sand', hex: '#D2B48C' },
      { name: 'Cream', hex: '#FFFDD0' },
      { name: 'Terracotta', hex: '#E2725B' },
      { name: 'Deep Brown', hex: '#3E2723' }
    ],
    typography: 'Lora for headings, Source Sans Pro for body — Warm serif/sans combination',
    style: 'Natural textures, earth tones, hand-drawn elements, botanical illustrations, kraft paper feel'
  },
  {
    name: 'Swiss Minimal',
    description: 'Diseño suizo minimalista. Para agencias de diseño, arquitectura, consulting premium.',
    colors: [
      { name: 'Pure Black', hex: '#000000' },
      { name: 'Signal Red', hex: '#FF0000' },
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Medium Gray', hex: '#808080' }
    ],
    typography: 'Helvetica Neue, Inter — Strict grid, precise spacing, medium weight',
    style: 'Grid-based layouts, asymmetric balance, lots of whitespace, strict hierarchy, no decorations'
  },
  {
    name: 'Tropical Vibrant',
    description: 'Vibrante y tropical. Para turismo, beach bars, travel agencies, Caribbean brands.',
    colors: [
      { name: 'Ocean Blue', hex: '#0077B6' },
      { name: 'Sunset Orange', hex: '#FB8500' },
      { name: 'Palm Green', hex: '#2D6A4F' },
      { name: 'Coral Pink', hex: '#FF6B6B' },
      { name: 'Sandy Beige', hex: '#F5E6CC' }
    ],
    typography: 'Montserrat for headings, Nunito for body — Rounded, friendly, approachable',
    style: 'Bright saturated colors, photo-heavy, organic curves, playful compositions, summer vibes'
  }
];

// ========== SERVICE FUNCTIONS ==========

/** Get all available Open Design skills */
export function getAvailableSkills(): OpenDesignSkill[] {
  return OPEN_DESIGN_SKILLS;
}

/** Get skills filtered by engine type */
export function getSkillsForEngine(engineType: 'strategy' | 'copy' | 'image'): OpenDesignSkill[] {
  const categoryMap: Record<string, string[]> = {
    strategy: ['strategy', 'branding', 'general'],
    copy: ['copywriting', 'general'],
    image: ['image', 'design-system', 'general']
  };
  const categories = categoryMap[engineType] || [];
  return OPEN_DESIGN_SKILLS.filter(s => categories.includes(s.category));
}

/** Get a specific skill by name */
export function getSkillByName(name: string): OpenDesignSkill | undefined {
  return OPEN_DESIGN_SKILLS.find(s => s.name === name);
}

/** Build a combined system prompt injection from selected skills */
export function buildSkillsPromptInjection(skillNames: string[]): string {
  const skills = skillNames
    .map(name => OPEN_DESIGN_SKILLS.find(s => s.name === name))
    .filter(Boolean) as OpenDesignSkill[];

  if (skills.length === 0) return '';

  const header = `\n\n=== OPEN DESIGN SKILLS ACTIVAS (Powered by nexu-io/open-design) ===\nLas siguientes habilidades profesionales de diseño están activas y DEBEN influir en tu output:\n`;
  
  const body = skills.map(s => `\n--- SKILL: ${s.name.toUpperCase()} ---\n${s.instructions}`).join('\n');
  
  const footer = `\n=== FIN DE SKILLS ACTIVAS ===\n`;

  return header + body + footer;
}

/** Get all prompt templates */
export function getPromptTemplates(): PromptTemplate[] {
  return PROMPT_TEMPLATES;
}

/** Get prompt templates by category */
export function getPromptTemplatesByCategory(category: string): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(t => t.category === category);
}

/** Get all available design systems */
export function getDesignSystems(): DesignSystemProfile[] {
  return DESIGN_SYSTEMS;
}

/** Get a specific design system */
export function getDesignSystem(name: string): DesignSystemProfile | undefined {
  return DESIGN_SYSTEMS.find(ds => ds.name === name);
}

/** Build a design system prompt injection */
export function buildDesignSystemPromptInjection(systemName: string): string {
  const ds = DESIGN_SYSTEMS.find(d => d.name === systemName);
  if (!ds) return '';

  return `\n\n=== DESIGN SYSTEM ACTIVO: ${ds.name} ===\nDescripción: ${ds.description}\nPaleta de Colores: ${ds.colors.map(c => `${c.name} (${c.hex})`).join(', ')}\nTipografía: ${ds.typography}\nEstilo: ${ds.style}\n=== FIN DESIGN SYSTEM ===\n`;
}

/** Get unique template categories */
export function getTemplateCategories(): string[] {
  return [...new Set(PROMPT_TEMPLATES.map(t => t.category))];
}
