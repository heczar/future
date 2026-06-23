/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DashboardInput — Extracted from App.tsx for better maintainability.
 * Input bar for the main hub advisor query.
 */

import React from 'react';
import { Send } from 'lucide-react';

interface DashboardInputProps {
  value: string;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export default function DashboardInput({ value, onSubmit, isLoading }: DashboardInputProps) {
  const [localVal, setLocalVal] = React.useState(value);

  React.useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localVal.trim()) {
      onSubmit(localVal);
      setLocalVal('');
    }
  };

  return (
    <div className="relative group max-w-3xl mx-auto pt-2">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
      <div className="relative flex flex-col sm:flex-row items-center gap-3 bg-surface-950 border border-white/10 p-2 rounded-2xl shadow-3xl group-focus-within:border-brand-primary/40 transition-all">
        <input
          type="text"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          placeholder="Consulta sobre tu estrategia corporativa..."
          className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 text-sm placeholder:text-slate-700 outline-none w-full"
          onKeyDown={handleKeyDown}
        />
        <div className="flex w-full sm:w-auto gap-3 p-1 sm:p-0">
          <button
            onClick={() => {
              if (localVal.trim()) {
                onSubmit(localVal);
                setLocalVal('');
              }
            }}
            disabled={isLoading || !localVal.trim()}
            className="flex-1 sm:w-auto px-6 py-3 bg-brand-primary disabled:opacity-40 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/30 w-full cursor-pointer"
          >
            CONSULTAR
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
