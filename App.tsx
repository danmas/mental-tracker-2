import React, { useState } from 'react';
import { ViewState } from './types';
import { Dashboard } from './pages/Dashboard';
import { SkillDetails } from './pages/SkillDetails';

function App() {
  const [view, setView] = useState<ViewState>({ name: 'dashboard' });

  // Simple state-based router
  const navigateToSkill = (skillCode: string) => {
    setView({ name: 'skill_details', skillCode });
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    setView({ name: 'dashboard' });
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={navigateHome}
          >
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-100">Mental<span className="text-brand-500">Tracker</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-400">Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {view.name === 'dashboard' ? (
          <Dashboard onSkillClick={navigateToSkill} />
        ) : (
          <SkillDetails 
            skillCode={view.skillCode} 
            onBack={navigateHome} 
          />
        )}
      </main>
    </div>
  );
}

export default App;