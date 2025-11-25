import React from 'react';
import htm from 'htm';
import { ProgressBar } from './ProgressBar.js';

const html = htm.bind(React.createElement);

export const SkillCard = ({ skill, onClick }) => {
  return html`
    <div 
      onClick=${onClick}
      className="bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-700 hover:shadow-md hover:border-brand-500 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl bg-gray-700 p-2 rounded-lg">${skill.icon}</span>
          <div>
            <h3 className="font-bold text-gray-100 group-hover:text-brand-400 transition-colors">${skill.name}</h3>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Level ${skill.level}</span>
          </div>
        </div>
        <div className="text-right">
            <span className="text-sm font-bold text-brand-400">${skill.currentPoints} XP</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>${skill.progress}/100</span>
        </div>
        <${ProgressBar} progress=${skill.progress} />
      </div>
    </div>
  `;
};

