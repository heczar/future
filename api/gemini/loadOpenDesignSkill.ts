/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Open Design Skill Loader — Server-side endpoint for FUTURA.
 * Reads and serves curated Open Design skills, design systems, and prompt templates.
 */

// Curated skill instructions sourced from https://github.com/nexu-io/open-design/tree/main/skills
const SKILL_INSTRUCTIONS: Record<string, string> = {
  'brainstorming': `BRAINSTORMING SKILL (Open Design):
- Generate at least 5 divergent creative directions before converging.
- Use lateral thinking: analogies, inversions, random stimuli, SCAMPER.
- Present ideas in a structured grid: Idea Name → Core Insight → Execution Sketch.
- Rank by feasibility × impact × novelty.
- Always end with a "Wild Card" idea that breaks conventions.`,

  'creative-director': `CREATIVE DIRECTOR SKILL (Open Design):
- Review all outputs through: Brand Consistency, Visual Hierarchy, Emotional Impact, Technical Quality.
- Provide feedback as: "KEEP / CHANGE / ADD / REMOVE".
- Ensure every deliverable passes the "Squint Test".
- Enforce the active DESIGN.md color palette, typography scale, and spacing grid.
- Grade outputs: A (ship-ready), B (minor tweaks), C (rework needed).`,

  'design-brief': `DESIGN BRIEF SKILL (Open Design):
- Extract: Objective → Target Audience → Key Message → Tone → Deliverables → Constraints → Timeline.
- Ask clarifying questions if critical info is missing.
- Output a one-page brief formatted as a clean card with labeled sections.
- Include a "Success Metrics" section.`,

  'copywriting': `COPYWRITING SKILL (Open Design — Corey Haines):
- Use proven frameworks: AIDA, PAS (Pain-Agitate-Solve), BAB (Before-After-Bridge).
- Every headline must pass the "So What?" test.
- Lead with benefits, not features. Use specific numbers.
- Power words: Free, New, Proven, Instant, Exclusive, Guaranteed, Limited.
- Structure: Hook (1 line) → Problem (2-3 lines) → Solution (2-3 lines) → Proof (1-2 lines) → CTA (1 line).`,

  'ad-creative': `AD CREATIVE SKILL (Open Design — Corey Haines):
- Generate 3-5 headline variations (short, punchy, under 40 chars).
- Write primary text variants: Short (<90 chars), Medium (90-150), Long (150-280).
- Scroll-stopping hooks: Questions, Bold Claims, Urgency, Social Proof, Contrarian Takes.
- Format per platform: Facebook/IG, Google Ads, LinkedIn.
- Always provide at least 2 contrasting A/B test angles.`,

  'enhance-prompt': `ENHANCE PROMPT SKILL (Open Design):
- Take basic prompts and expand with: Specific details, Style references, Technical parameters, Negative constraints.
- For image prompts: Add lighting, camera angle, lens, color grading, composition, texture, mood.
- For text prompts: Add tone, format, audience, length, examples.
- Preserve original intent while dramatically increasing output quality.`,

  'card-twitter': `TWITTER/X CARD SKILL (Open Design):
- Design for 2:1 or 1.91:1 aspect ratio.
- Visual hierarchy: Large headline (max 8 words) → Supporting visual → Branding.
- High contrast text overlay, sans-serif, max 2 lines.
- Engagement: Thread hooks, Quote tweet bait, Reply triggers.`,

  'color-expert': `COLOR EXPERT SKILL (Open Design):
- Generate palettes using: Complementary, Analogous, Triadic, Split-Complementary.
- Output hex, RGB, HSL for each color.
- Include: Primary, Secondary, Accent, Background, Text, Success, Warning, Error.
- Test WCAG AA/AAA contrast ratios. Suggest dark mode variants.`,

  'canvas-design': `CANVAS DESIGN SKILL (Open Design):
- Sizes: IG Post (1080×1080), Story (1080×1920), FB Cover (851×315), LinkedIn (1584×396), YT Thumb (1280×720).
- Apply rule of thirds. Text <20% of canvas area.
- Visual hierarchy: Focal Point → Supporting → Background.`,

  'ecommerce-image-workflow': `ECOMMERCE IMAGE WORKFLOW SKILL (Open Design):
- Complete set: Hero (45° white bg), Lifestyle (in-context), Detail (close-up), Scale (reference), Group (family).
- 3-point studio lighting. Clean white bg (255,255,255).
- Platform specs: Amazon (1000×1000 min), Shopify (2048×2048), IG Shopping (1080×1080).`,

  'design-consultation': `DESIGN CONSULTATION SKILL (Open Design):
- Review across: Aesthetics, Usability, Brand Alignment, Technical Quality, Innovation.
- Use "Praise-Question-Suggest" framework.
- Identify top 3 most impactful changes.
- Reference PARC principles: Proximity, Alignment, Repetition, Contrast.`,

  'brand-extract': `BRAND EXTRACT SKILL (Open Design):
- Analyze materials to extract: Colors (hex), Typography, Layout Patterns, Visual Motifs, Tone.
- Output structured "Brand DNA" card.
- Suggest complementary colors/fonts. Rate consistency: Strong/Moderate/Weak.`,

  'brand-guidelines': `BRAND GUIDELINES SKILL (Open Design):
- Structure: Logo usage → Colors → Typography → Imagery → Tone → Do's & Don'ts.
- Usage examples for: Social, Print, Presentations, Merch.
- Define brand personality with 3-5 adjectives. Include Quick Reference Card.`,

  'video-social-short': `VIDEO SOCIAL SHORT SKILL (Open Design / HyperFrames):
- Structure: Hook (0-3s) → Problem (3-8s) → Solution (8-20s) → CTA (20-30s).
- Hook types: Pattern interrupt, Bold claim, Before/After, "Wait for it", Direct question.
- Include: Shot list, Text overlay cues, Music/SFX, Transitions.
- Optimize: Sound-off (captions), Vertical 9:16, Loop-worthy endings.`
};

export function getSkillInstruction(skillName: string): string | null {
  return SKILL_INSTRUCTIONS[skillName] || null;
}

export function buildSkillsInjection(skillNames: string[]): string {
  const instructions = skillNames
    .map(name => {
      const instruction = SKILL_INSTRUCTIONS[name];
      return instruction ? `\n--- SKILL: ${name.toUpperCase()} ---\n${instruction}` : null;
    })
    .filter(Boolean);

  if (instructions.length === 0) return '';
  return `\n\n=== OPEN DESIGN SKILLS ACTIVAS (Powered by nexu-io/open-design) ===\n${instructions.join('\n')}\n=== FIN SKILLS ===\n`;
}

export function listSkillNames(): string[] {
  return Object.keys(SKILL_INSTRUCTIONS);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query?.action || req.url?.split('?action=')[1]?.split('&')[0] || 'list';

  if (action === 'list') {
    return res.status(200).json({
      skills: Object.entries(SKILL_INSTRUCTIONS).map(([name, instruction]) => ({
        name,
        preview: instruction.split('\n')[0]
      }))
    });
  }

  if (action === 'get') {
    const name = req.query?.name || '';
    const instruction = getSkillInstruction(name);
    if (!instruction) return res.status(404).json({ error: `Skill '${name}' not found` });
    return res.status(200).json({ name, instruction });
  }

  return res.status(400).json({ error: 'Invalid action. Use ?action=list or ?action=get&name=skillname' });
}
