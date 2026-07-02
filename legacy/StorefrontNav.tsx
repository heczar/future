/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, ShoppingBag, Eye, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { useAccount } from './AccountProvider';

export default function StorefrontNav() {
  const { accountId } = useAccount();
  const [copiedLink, setCopiedLink] = React.useState(false);

  const storefrontUrl = `https://futuramarketing.stripe.shop/store/${accountId || 'default_store'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
      <div className="space-y-1">
        <span className="text-[8px] font-mono font-black text-brand-primary uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 animate-pulse text-brand-primary" />
          DIRECCIÓN COMPLETA DE TU STOREFRONT
        </span>
        <h4 className="text-xs font-bold text-white select-all font-mono tracking-wide break-all">
          {storefrontUrl}
        </h4>
        <p className="text-[10px] text-slate-500">
          Tus compradores globales verán tus ofertas directamente en esta url auto-optimizada mediante Checkout.
        </p>
      </div>

      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
        <button
          onClick={handleCopyLink}
          className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" /> ¡COPIADA!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> COPIAR DIRECCIÓN
            </>
          )}
        </button>

        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/10"
        >
          <Eye className="w-3.5 h-3.5" /> VISITAR EN VIVO
        </a>
      </div>
    </div>
  );
}
