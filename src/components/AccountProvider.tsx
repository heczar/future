/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthWrapper';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AccountContextType {
  accountId: string | null;
  stripeOnboardingComplete: boolean;
  setAccountId: (id: string | null) => Promise<void>;
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setAccountIdState(null);
      setStripeOnboardingComplete(false);
      setLoading(false);
      return;
    }

    // Subscribe to real-time changes in user's profile to stay responsive
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAccountIdState(data.stripeAccountId || null);
        setStripeOnboardingComplete(data.stripeOnboardingComplete || false);
      } else {
        setAccountIdState(null);
        setStripeOnboardingComplete(false);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error reading account from Firestore:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const setAccountId = async (id: string | null) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { stripeAccountId: id }, { merge: true });
      setAccountIdState(id);
    } catch (e) {
      console.error("Error setting Stripe account ID:", e);
    }
  };

  const setOnboardingComplete = async (complete: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { stripeOnboardingComplete: complete }, { merge: true });
      setStripeOnboardingComplete(complete);
    } catch (e) {
      console.error("Error setting onboarding complete status:", e);
    }
  };

  return (
    <AccountContext.Provider value={{ accountId, stripeOnboardingComplete, setAccountId, setOnboardingComplete, loading }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
