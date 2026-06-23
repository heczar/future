/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Central constants for FUTURA app.
 * Single source of truth for shared brand data and configuration.
 */

import { ProjectContext } from '../types';

/**
 * The FUTURA brand's own marketing context used as a default/demo brand.
 * Previously duplicated in App.tsx and CreativeEngine.tsx — now centralized here.
 */
export const VIRTUAL_FUTURA_BRAND: ProjectContext = {
  id: 'futura_brand_vault',
  name: 'FUTURA (Auto-Marketing SPE)',
  description: 'Consultora Estratégica y Suite de IA Avanzada de Future Marketing Consult enfocada en el lema "Resultados sobre Estética". Es un robot pensante y generador de activos de alta conversión bajo la metodología SPE para dominar el mercado hispanohablante de infoproductores y agencias de marketing, capturando clientes listos para pagar.',
  logos: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop'],
  trainingMaterial: [
    'Mantra central: Resultados sobre Estética.',
    'Metodología base: Sistema Pentagonal de Ejecución (SPE).',
    'Gancho clave: Deja de crear contenido que solo le gusta a tu mamá y empieza a capturar clientes reales.',
    'Paleta de diseño recomendada: Fucsia eléctrico, Violeta y Slate profundo con gran espacio negativo.',
    'Enfoque promocional: Destrucción de fricciones de compra mediante la consultoría y la IA de nivel ultra-élite.'
  ],
  methodology: 'SPE',
  brandGuidelines: {
    primaryColor: '#BF5AF2',
    secondaryColor: '#0A0A0C',
    tone: 'Persuasivo brutal de alta conversión, de élite educadora y analítico pragmático'
  }
};

/** Alias for backward compatibility */
export const virtualFuturaBrand = VIRTUAL_FUTURA_BRAND;

/** App brand colors */
export const BRAND_COLORS = {
  primary: '#BF5AF2',
  secondary: '#0A0A0C',
  accent: '#7C3AED',
} as const;

/** Admin email — single source of truth */
export const ADMIN_EMAIL = 'heczaroficial@gmail.com';

/** Membership plan limits */
export const MEMBERSHIP_LIMITS = {
  sencilla: {
    dailyConsultsLimit: 5,
    monthlyTokensLimit: 25000,
    monthlyImagesLimit: 3,
  },
  elitePro: {
    dailyConsultsLimit: 250,
    monthlyTokensLimit: 15_000_000,
    monthlyImagesLimit: 500,
  },
} as const;
