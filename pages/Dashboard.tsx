import React, { useEffect, useState } from 'react';
import { Skill } from '../types';
import { getSkills, createSkill } from '../services/api';
import { SkillCard } from '../components/SkillCard';
import { IconTrophy, IconPlus } from '../components/Icons';
import { Modal } from '../components/Modal';

interface DashboardProps {
  onSkillClick: (code: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSkillClick }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Skill Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newPoints, setNewPoints] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSkills();
      setSkills(data);
    } catch (error) {
      console.error("Failed to load skills", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    await createSkill(newName, newIcon, newPoints);
    
    // Reset form
    setNewName('');
    setNewIcon('');
    setNewPoints(0);
    setIsCreateOpen(false);
    
    // Refresh list
    loadData();
  };

  if (loading && skills.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const totalLevels = skills.reduce((acc, s) => acc + s.level, 0);

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-r from-brand-700 to-indigo-900 rounded-2xl p-6 text-white shadow-lg border border-brand-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-full">
            <IconTrophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-brand-100 text-sm font-medium">Total Proficiency</p>
            <h1 className="text-3xl font-bold">{totalLevels} <span className="text-lg font-normal text-brand-200">Levels Gained</span></h1>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-100 px-1">Your Skills</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map(skill => (
          <SkillCard 
            key={skill.code} 
            skill={skill} 
            onClick={() => onSkillClick(skill.code)} 
          />
        ))}

        {/* Add New Skill Button */}
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-gray-800/50 rounded-xl p-5 shadow-sm border-2 border-dashed border-gray-700 hover:border-brand-500 hover:bg-gray-800 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 h-full min-h-[140px] group"
        >
          <div className="p-3 bg-gray-700 rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <IconPlus className="w-6 h-6 text-gray-400 group-hover:text-brand-400" />
          </div>
          <span className="font-medium text-gray-400 group-hover:text-brand-400">Add New Skill</span>
        </button>
      </div>

      {/* Create Skill Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Skill">
        <form onSubmit={handleCreateSkill} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Skill Name</label>
            <input 
              required
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Guitar, Cooking, Spanish"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Icon (Emoji)</label>
            <input 
              type="text" 
              maxLength={4}
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. 🎸"
            />
            <p className="text-xs text-gray-500 mt-1">Paste an emoji or type a short symbol.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Starting XP (Optional)</label>
            <input 
              type="number" 
              min="0"
              value={newPoints}
              onChange={(e) => setNewPoints(Number(e.target.value))}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Use this if you are migrating progress from elsewhere.</p>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors">
              Create Skill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};