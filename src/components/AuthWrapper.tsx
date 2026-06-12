/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, signIn as firebaseSignIn } from '../lib/firebase';
import { onAuthStateChanged, User, GoogleAuthProvider } from 'firebase/auth';
import { Shield, Lock, Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signIn: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setAccessToken(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      const result = await firebaseSignIn();
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  const logout = () => {
    setAccessToken(null);
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
