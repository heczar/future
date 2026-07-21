/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface ApiConsumption {
  dailyConsultsUsed: number;
  dailyConsultsLimit: number;
  monthlyConsultsUsed?: number;
  monthlyConsultsLimit?: number;
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  monthlyImagesUsed: number;
  monthlyImagesLimit: number;
  lastResetDate: string; // YYYY-MM-DD for daily resets
}

export const LIMITS = {
  free: {
    dailyConsultsLimit: 5,
    monthlyConsultsLimit: 150,
    monthlyTokensLimit: 25000,
    monthlyImagesLimit: 3,
  },
  copy_chat: {
    dailyConsultsLimit: 15,
    monthlyConsultsLimit: 100,
    monthlyTokensLimit: 150000,
    monthlyImagesLimit: 0,
  },
  pilot: {
    dailyConsultsLimit: 10,
    monthlyConsultsLimit: 50,
    monthlyTokensLimit: 100000,
    monthlyImagesLimit: 10,
  },
  starter: {
    dailyConsultsLimit: 30,
    monthlyConsultsLimit: 250,
    monthlyTokensLimit: 500000,
    monthlyImagesLimit: 50,
  },
  growth: {
    dailyConsultsLimit: 100,
    monthlyConsultsLimit: 1000,
    monthlyTokensLimit: 2000000,
    monthlyImagesLimit: 150,
  },
  scale: {
    dailyConsultsLimit: 1000,
    monthlyConsultsLimit: 999999, // Ilimitado en la práctica
    monthlyTokensLimit: 15000000, // 15M Tokens
    monthlyImagesLimit: 500,
  }
};

/**
 * Validates and gets/initializes user consumption from Firestore.
 */
export async function getUserConsumption(userId: string, isPremium: boolean): Promise<ApiConsumption> {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const userData = snap.exists() ? snap.data() : null;
  
  // Resolve plan based on Firestore property activePlan, falling back to isPremium logic
  const activePlan = userData?.activePlan || (isPremium ? 'scale' : 'free');
  const activeLimits = LIMITS[activePlan as keyof typeof LIMITS] || LIMITS.free;

  const defaultConsumption: ApiConsumption = {
    dailyConsultsUsed: 0,
    dailyConsultsLimit: activeLimits.dailyConsultsLimit,
    monthlyConsultsUsed: 0,
    monthlyConsultsLimit: activeLimits.monthlyConsultsLimit,
    monthlyTokensUsed: 0,
    monthlyTokensLimit: activeLimits.monthlyTokensLimit,
    monthlyImagesUsed: 0,
    monthlyImagesLimit: activeLimits.monthlyImagesLimit,
    lastResetDate: todayStr
  };

  if (!snap.exists()) {
    return defaultConsumption;
  }

  let cons: ApiConsumption = userData.apiConsumption || { ...defaultConsumption };

  // Sync limits to match membership tier changes dynamically
  cons.dailyConsultsLimit = activeLimits.dailyConsultsLimit;
  cons.monthlyConsultsLimit = activeLimits.monthlyConsultsLimit;
  cons.monthlyTokensLimit = activeLimits.monthlyTokensLimit;
  cons.monthlyImagesLimit = activeLimits.monthlyImagesLimit;

  // Initialize monthly consult properties if they don't exist
  if (cons.monthlyConsultsUsed === undefined) cons.monthlyConsultsUsed = 0;
  if (cons.monthlyConsultsLimit === undefined) cons.monthlyConsultsLimit = activeLimits.monthlyConsultsLimit;

  // Check if daily reset is needed
  if (cons.lastResetDate !== todayStr) {
    cons.dailyConsultsUsed = 0;
    cons.lastResetDate = todayStr;
    
    // Periodically prune tokens slightly as dynamic simulator cleanup
    if (Math.random() < 0.05) {
      cons.monthlyTokensUsed = Math.max(0, cons.monthlyTokensUsed - 3000);
      cons.monthlyImagesUsed = Math.max(0, cons.monthlyImagesUsed - 1);
    }
  }

  return cons;
}

/**
 * Verifies if user has remaining quota before performing an action.
 */
export async function assertHasQuota(userId: string, isPremium: boolean, actionType: 'consult' | 'image' | 'strategy'): Promise<boolean> {
  const cons = await getUserConsumption(userId, isPremium);
  
  if (actionType === 'consult' || actionType === 'strategy') {
    if (cons.dailyConsultsUsed >= cons.dailyConsultsLimit) {
      throw new Error(`CRÍTICO: Límite de consultas diario alcanzado (${cons.dailyConsultsUsed}/${cons.dailyConsultsLimit}). Sube de nivel en la pestaña de Membresías para reactivar tu capacidad.`);
    }
    if ((cons.monthlyConsultsUsed || 0) >= (cons.monthlyConsultsLimit || 0)) {
      throw new Error(`CRÍTICO: Límite de consultas mensual alcanzado (${cons.monthlyConsultsUsed}/${cons.monthlyConsultsLimit}). Actualiza tu membresía para expandir tu capacidad.`);
    }
    const tokenEst = actionType === 'strategy' ? 4500 : 1500;
    if (cons.monthlyTokensUsed + tokenEst > cons.monthlyTokensLimit) {
      throw new Error(`CRÍTICO: Carga de tokens excedida (${cons.monthlyTokensUsed}/${cons.monthlyTokensLimit}). Actualiza tu membresía para expandir tu capacidad.`);
    }
  } else if (actionType === 'image') {
    if (cons.monthlyImagesLimit === 0) {
      throw new Error("CRÍTICO: Tu plan actual (Copy & Chat) no incluye renders de diseño. Adquiere un plan que contenga imágenes o recarga un pack adicional de renders.");
    }
    if (cons.monthlyImagesUsed >= cons.monthlyImagesLimit) {
      throw new Error(`CRÍTICO: Límite de renders mensuales alcanzado (${cons.monthlyImagesUsed}/${cons.monthlyImagesLimit}). Desbloquea un nivel superior o recarga un pack de renders.`);
    }
  }
  
  return true;
}

/**
 * Registers and increments consumption metrics inside user record in Firestore.
 */
export async function trackActionConsumption(userId: string, isPremium: boolean, actionType: 'consult' | 'image' | 'strategy' | 'ignition_brand') {
  try {
    const docRef = doc(db, 'users', userId);
    const cons = await getUserConsumption(userId, isPremium);
    
    if (actionType === 'consult') {
      cons.dailyConsultsUsed += 1;
      cons.monthlyConsultsUsed = (cons.monthlyConsultsUsed || 0) + 1;
      cons.monthlyTokensUsed += Math.floor(1200 + Math.random() * 800); // 1200 - 2000 random token estimation
    } else if (actionType === 'strategy') {
      cons.dailyConsultsUsed += 1;
      cons.monthlyConsultsUsed = (cons.monthlyConsultsUsed || 0) + 1;
      cons.monthlyTokensUsed += Math.floor(3800 + Math.random() * 1500); // 3800 - 5300 token estimation
    } else if (actionType === 'image') {
      cons.monthlyImagesUsed += 1;
    } else if (actionType === 'ignition_brand') {
      cons.dailyConsultsUsed += 1;
      cons.monthlyConsultsUsed = (cons.monthlyConsultsUsed || 0) + 1;
      cons.monthlyTokensUsed += 3500; // heavier brand structure calculation
    }

    await updateDoc(docRef, {
      apiConsumption: cons
    });
  } catch (error) {
    console.warn("Could not record consumption inside Firestore document:", error);
  }
}
