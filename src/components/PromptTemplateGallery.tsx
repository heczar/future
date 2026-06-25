/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { getPromptTemplates, getTemplateCategories, type PromptTemplate } from '../services/openDesignService';

interface Props {
  onSelectTemplate: (template: PromptTemplate) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  product: '📦 Producto',
  event: '🎪 Evento',
  social: '📱 Social Media',
  web: '🌐 Web',
  branding: '💎 Branding',
  gastronomy: '🍽️ Gastronomía',
  health: '💪 Salud & Fitness',
  realestate: '🏠 Bienes Raíces',
  education: '📚 Educación',
  beauty: '💄 Belleza',
  tech: '🤖 Tecnología'
};

export default function PromptTemplateGallery({ onSelectTemplate }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  
  const templates = getPromptTemplates();
  const categories = getTemplateCategories();
  
  const filtered = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
      >
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>🖼️ Galería de Templates</span>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
          {templates.length} templates
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filtered.map((template, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectTemplate(template);
                  setIsOpen(false);
                }}
                className="group p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/30 transition-all text-left"
              >
                <div className="text-lg mb-1">{CATEGORY_LABELS[template.category]?.split(' ')[0] || '🎨'}</div>
                <div className="text-xs font-medium text-gray-200 group-hover:text-amber-200 transition-colors">
                  {template.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {template.aspectRatio}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
