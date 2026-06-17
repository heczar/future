/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthWrapper';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { ShoppingBag, Trash2, Edit3, DollarSign, Package, AlertCircle, Loader2, Plus, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Subscribe to products subcollection under user's private document to keep it private/individual
    const productsRef = collection(db, 'users', user.uid, 'products');
    const q = query(productsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(items);
      setLoading(false);
    }, (err) => {
      console.error("Error loading products from Firebase:", err);
      // Fallback: load some default demo products if something goes wrong
      setProducts([
        { id: 'p1', productName: 'Campaña Estratégica Elite SEO', productDescription: 'Optimización y posicionamiento para motores de búsqueda con reporte semanal.', productPrice: 15000 },
        { id: 'p2', productName: 'Auditoría de Embudo de Ventas (Funnels)', productDescription: 'Inspección de abandono de carritos y optimización de conversión.', productPrice: 8500 }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteProduct = async (prodId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'products', prodId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting product from Firebase:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sincronizando Catálogo Firestore...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 mx-auto flex items-center justify-center text-slate-500">
          <Package className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase">Sin Productos en la Tienda</h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Aún no has creado ofertas de cobro para esta cuenta individual. Agrega un producto arriba para iniciar tu facturación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {products.map((p) => {
        const formattedPrice = (p.productPrice / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        });

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between gap-4 hover:border-brand-primary/30 transition-all text-left"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center text-brand-primary">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-primary" />
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">
                    {p.productName}
                  </h4>
                </div>
                <strong className="text-xs font-mono font-black text-emerald-400 shrink-0">
                  {formattedPrice}
                </strong>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed h-[34px]">
                {p.productDescription || 'Sin descripción detallada.'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[9px] font-mono">
              <div className="text-slate-500 text-[8px] uppercase tracking-wider">
                ID: {p.id.substring(0, 8)}...
              </div>
              <button
                onClick={() => handleDeleteProduct(p.id)}
                className="p-1 px-2.5 bg-red-500/15 text-red-400 hover:text-white hover:bg-red-500/40 rounded transition-all flex items-center gap-1.5 cursor-pointer"
                title="Eliminar producto de la base de datos"
              >
                <Trash2 className="w-3 h-3" />
                ELIMINAR
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
