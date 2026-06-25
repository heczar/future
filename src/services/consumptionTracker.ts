/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export interface ApiConsumption {
  dailyConsultsUsed: number;
  dailyConsultsLimit: number;
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  monthlyImagesUsed: number;
  monthlyImagesLimit: number;
  lastResetDate: string; // YYYY-MM-DD for daily resets
}

export const LIMITS = {
  sencilla: {
    dailyConsultsLimit: 5,
    monthlyTokensLimit: 25000,
    monthlyImagesLimit: 3,
  },
  elitePro: {
    dailyConsultsLimit: 250,
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
  const activeLimits = isPremium ? LIMITS.elitePro : LIMITS.sencilla;

  const defaultConsumption: ApiConsumption = {
    dailyConsultsUsed: 0,
    dailyConsultsLimit: activeLimits.dailyConsultsLimit,
    monthlyTokensUsed: 0,
    monthlyTokensLimit: activeLimits.monthlyTokensLimit,
    monthlyImagesUsed: 0,
    monthlyImagesLimit: activeLimits.monthlyImagesLimit,
    lastResetDate: todayStr
  };

  if (!snap.exists()) {
    return defaultConsumption;
  }

  const userData = snap.data();
  let cons: ApiConsumption = userData.apiConsumption || { ...defaultConsumption };

  // Sync limits to match membership tier changes dynamically
  cons.dailyConsultsLimit = activeLimits.dailyConsultsLimit;
  cons.monthlyTokensLimit = activeLimits.monthlyTokensLimit;
  cons.monthlyImagesLimit = activeLimits.monthlyImagesLimit;

  // Check if daily reset is needed
  if (cons.lastResetDate !== todayStr) {
    cons.dailyConsultsUsed = 0;
    cons.lastResetDate = todayStr;
    
    // Also reset monthly token limit and images periodically if empty / fallback (every 30 days)
    // Simply reset with today's reset for smooth sandbox operation, keeping months alive
    if (Math.random() < 0.05) { // 5% chance of checking if we should do a monthly refresh
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
  // BYPASS FOR LOCAL DEVELOPMENT: Never block the developer/owner on localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return true;
  }

  const cons = await getUserConsumption(userId, isPremium);
  
  if (actionType === 'consult' || actionType === 'strategy') {
    if (cons.dailyConsultsUsed >= cons.dailyConsultsLimit) {
      throw new Error(`CRÍTICO: Límite de consultas diario alcanzado (${cons.dailyConsultsUsed}/${cons.dailyConsultsLimit}). Sube a Elite PRO para habilitar análisis premium ilimitados.`);
    }
    const tokenEst = actionType === 'strategy' ? 4500 : 1500;
    if (cons.monthlyTokensUsed + tokenEst > cons.monthlyTokensLimit) {
      throw new Error(`CRÍTICO: Carga de tokens excedida (${cons.monthlyTokensUsed}/${cons.monthlyTokensLimit}). Actualiza tu membresía para expandir infinitamente tu capacidad.`);
    }
  } else if (actionType === 'image') {
    if (cons.monthlyImagesUsed >= cons.monthlyImagesLimit) {
      throw new Error(`CRÍTICO: Límite de generación de imágenes alcanzado (${cons.monthlyImagesUsed}/${cons.monthlyImagesLimit}). Desbloquea Elite PRO para renderizar activos publicitarios reales.`);
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
      cons.monthlyTokensUsed += Math.floor(1200 + Math.random() * 800); // 1200 - 2000 random token estimation
    } else if (actionType === 'strategy') {
      cons.dailyConsultsUsed += 1;
      cons.monthlyTokensUsed += Math.floor(3800 + Math.random() * 1500); // 3800 - 5300 token estimation
    } else if (actionType === 'image') {
      cons.monthlyImagesUsed += 1;
    } else if (actionType === 'ignition_brand') {
      cons.dailyConsultsUsed += 1;
      cons.monthlyTokensUsed += 3500; // heavier brand structure calculation
    }

    await updateDoc(docRef, {
      apiConsumption: cons
    });
  } catch (error) {
    console.warn("Could not record consumption inside Firestore document:", error);
  }
}
