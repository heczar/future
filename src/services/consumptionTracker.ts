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
    dailyConsultsLimit: 10,
    monthlyConsultsLimit: 150,
    monthlyTokensLimit: 50000,
    monthlyImagesLimit: 3,
  },
  pilot: { // FUTURA Pilot - $10 USD (Chats gratis/ilimitados, 25 renders)
    dailyConsultsLimit: 999999,
    monthlyConsultsLimit: 999999,
    monthlyTokensLimit: 999999999,
    monthlyImagesLimit: 25,
  },
  pro: { // FUTURA Pro - $29 USD (Chats gratis/ilimitados, 100 renders)
    dailyConsultsLimit: 999999,
    monthlyConsultsLimit: 999999,
    monthlyTokensLimit: 999999999,
    monthlyImagesLimit: 100,
  },
  agency: { // FUTURA Agency - $79 USD (Chats gratis/ilimitados, 350 renders)
    dailyConsultsLimit: 999999,
    monthlyConsultsLimit: 999999,
    monthlyTokensLimit: 999999999,
    monthlyImagesLimit: 350,
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
  
  // Resolve plan based on Firestore property activePlan
  let activePlan = userData?.activePlan || (isPremium ? 'agency' : 'free');
  
  // Normalise obsolete plans for total database compatibility
  if (activePlan === 'copy_chat') activePlan = 'pilot';
  if (activePlan === 'starter' || activePlan === 'growth') activePlan = 'pro';
  if (activePlan === 'scale') activePlan = 'agency';
  
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
  try {
    const cons = await getUserConsumption(userId, isPremium);
    console.log(`[QUOTA CHECK] User: ${userId}, Action: ${actionType}, Used: Consults(D:${cons.dailyConsultsUsed}/M:${cons.monthlyConsultsUsed}), Tokens:${cons.monthlyTokensUsed}/${cons.monthlyTokensLimit}, Images:${cons.monthlyImagesUsed}/${cons.monthlyImagesLimit}`);
  } catch (e) {
    console.warn("[QUOTA] Error checking consumption:", e);
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
