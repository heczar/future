/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { getSkillsForEngine, type OpenDesignSkill } from '../services/openDesignService';

interface Props {
  engineType: 'strategy' | 'copy' | 'image';
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  strategy: '🧠',
  copywriting: '✍️',
  image: '🎨',
  video: '🎬',
  'design-system': '🎯',
  branding: '💎',
  general: '⚡'
};

export default function OpenDesignSkillPicker({ engineType, selectedSkills, onSkillsChange }: Props) {
  const [skills, setSkills] = useState<OpenDesignSkill[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setSkills(getSkillsForEngine(engineType));
  }, [engineType]);

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      onSkillsChange(selectedSkills.filter(s => s !== skillName));
    } else {
      onSkillsChange([...selectedSkills, skillName]);
    }
  };

  if (skills.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
      >
        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>🔌 Open Design Skills</span>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
          {selectedSkills.length} activas
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map(skill => {
            const isSelected = selectedSkills.includes(skill.name);
            return (
              <button
                key={skill.name}
                onClick={() => toggleSkill(skill.name)}
                title={skill.description}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                <span>{CATEGORY_ICONS[skill.category] || '⚡'}</span>
                <span>{skill.name}</span>
                {isSelected && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
