
import React, { useEffect, useState, useMemo } from 'react';
import { Skill, Activity, HistoryRecord } from '../types';
import { getSkillDetails, getActivities, addHistoryRecord, deleteHistoryRecord, createActivity } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { IconChevronLeft, IconPlus, IconActivity, IconTrash } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SkillDetailsProps {
  skillCode: string;
  onBack: () => void;
}

export const SkillDetails: React.FC<SkillDetailsProps> = ({ skillCode, onBack }) => {
  const [skill, setSkill] = useState<Skill | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);

  // Form States - Log Activity
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [pointsInput, setPointsInput] = useState(10);
  const [notesInput, setNotesInput] = useState('');
  
  // Form States - Create Activity
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [newActivityPoints, setNewActivityPoints] = useState(10);
  const [isDaily, setIsDaily] = useState(false);
  const [penaltyPoints, setPenaltyPoints] = useState(10);

  const loadData = async () => {
    try {
      const details = await getSkillDetails(skillCode);
      const acts = await getActivities();
      if (details) {
        setSkill(details.skill);
        setHistory(details.history);
      }
      setAvailableActivities(acts.filter(a => a.skillCode === skillCode));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillCode]);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;

    let actName = 'Custom Activity';
    if (selectedActivityId) {
      const act = availableActivities.find(a => a.id === selectedActivityId);
      if (act) actName = act.name;
    }

    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      skillCode: skill.code,
      activityId: selectedActivityId || undefined,
      activityName: actName,
      points: pointsInput,
      notes: notesInput,
      timestamp: Date.now()
    };

    await addHistoryRecord(newRecord);
    setIsLogOpen(false);
    setNotesInput('');
    loadData(); // Refresh to update levels
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;

    const newAct: Activity = {
      id: Date.now().toString(),
      name: newActivityName,
      description: newActivityDesc,
      points: newActivityPoints,
      skillCode: skill.code,
      isDaily: isDaily,
      penalty: isDaily ? penaltyPoints : undefined,
      createdAt: Date.now()
    };

    await createActivity(newAct);
    setIsCreateActivityOpen(false);
    setNewActivityName('');
    setNewActivityDesc('');
    setIsDaily(false);
    setPenaltyPoints(10);
    loadData();
  };

  const handleDeleteHistory = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this record?')) {
      await deleteHistoryRecord(id, skillCode);
      loadData();
    }
  };

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryRecord[] } = {};
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [history]);

  // Chart Data (Last 7 days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString(undefined, { weekday: 'short' });
      
      // start of day
      const start = new Date(d.setHours(0,0,0,0)).getTime();
      const end = new Date(d.setHours(23,59,59,999)).getTime();

      const points = history
        .filter(h => h.timestamp >= start && h.timestamp <= end)
        .reduce((sum, h) => sum + h.points, 0);

      data.push({ name: dayStr, points });
    }
    return data;
  }, [history]);

  if (loading || !skill) return <div className="p-8 text-center text-gray-400">Loading skill data...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors group"
        >
          <IconChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-100">
            <span>{skill.icon}</span> {skill.name}
          </h1>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-sm text-gray-400 uppercase font-bold tracking-wider">Current Level</span>
            <div className="text-4xl font-black text-gray-100">{skill.level}</div>
          </div>
          <div className="text-right">
             <span className={`text-2xl font-bold ${skill.currentPoints < 0 ? 'text-red-400' : 'text-brand-400'}`}>
                {skill.currentPoints}
             </span>
             <span className="text-gray-400 text-sm ml-1">XP</span>
          </div>
        </div>
        <ProgressBar progress={skill.progress} height="h-4" />
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>{skill.progress} / 100 XP to next level</span>
          <span>Level {skill.level + 1}</span>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-gray-100">Weekly Activity</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#374151'}} 
                contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6'}}
                itemStyle={{color: '#f3f4f6'}}
              />
              <Bar dataKey="points" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setIsLogOpen(true)}
          className="flex flex-col items-center justify-center p-4 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-900/20 hover:bg-brand-700 transition-all active:scale-95 border border-transparent"
        >
          <IconPlus className="w-8 h-8 mb-2" />
          <span className="font-bold">Log Activity</span>
        </button>
        <button 
          onClick={() => setIsCreateActivityOpen(true)}
          className="flex flex-col items-center justify-center p-4 bg-gray-800 text-brand-400 border border-brand-900 rounded-xl hover:bg-gray-700 transition-all active:scale-95"
        >
          <IconActivity className="w-8 h-8 mb-2" />
          <span className="font-medium">New Activity Type</span>
        </button>
      </div>

      {/* History List */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-100">History</h3>
        {history.length === 0 ? (
          <div className="text-center py-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <p className="text-gray-500">No activities logged yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pl-1 sticky top-0 bg-gray-900/95 backdrop-blur-sm py-2 z-10">
                  {date}
                </h4>
                <div className="space-y-3">
                  {items.map(record => (
                    <div key={record.id} className={`bg-gray-800 p-4 rounded-xl border flex justify-between items-center shadow-sm ${record.isAutoPenalty ? 'border-red-900/50 bg-red-900/10' : 'border-gray-700'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                            <p className={`font-bold ${record.isAutoPenalty ? 'text-red-300' : 'text-gray-200'}`}>{record.activityName}</p>
                            {record.isAutoPenalty && <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded uppercase tracking-wider">Missed</span>}
                        </div>
                        {record.notes && <p className="text-sm text-gray-400 mt-1">{record.notes}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${record.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {record.points > 0 ? '+' : ''}{record.points} XP
                        </span>
                        <button 
                          onClick={() => handleDeleteHistory(record.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <IconTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Log Activity */}
      <Modal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} title="Log Activity">
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Activity</label>
            <select 
              value={selectedActivityId} 
              onChange={(e) => {
                setSelectedActivityId(e.target.value);
                const act = availableActivities.find(a => a.id === e.target.value);
                if (act) setPointsInput(act.points);
              }}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">-- Manual Entry --</option>
              {availableActivities.map(a => (
                <option key={a.id} value={a.id}>
                    {a.name} {a.isDaily && '📅'} (+{a.points} XP)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Points Earned</label>
            <input 
              type="number" 
              value={pointsInput}
              onChange={(e) => setPointsInput(Number(e.target.value))}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Can be negative for penalties.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
            <textarea 
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              rows={3}
              placeholder="What did you learn?"
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors">
              Confirm & Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Activity */}
      <Modal isOpen={isCreateActivityOpen} onClose={() => setIsCreateActivityOpen(false)} title="Create New Activity">
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Activity Name</label>
            <input 
              required
              type="text" 
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Read 10 Pages"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <input 
              type="text" 
              value={newActivityDesc}
              onChange={(e) => setNewActivityDesc(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Short description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Points for Success</label>
                <input 
                  required
                  type="number" 
                  value={newActivityPoints}
                  onChange={(e) => setNewActivityPoints(Number(e.target.value))}
                  className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 border p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
          </div>

          <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
             <div className="flex items-center gap-2 mb-2">
                 <input 
                    type="checkbox" 
                    id="isDaily"
                    checked={isDaily}
                    onChange={(e) => setIsDaily(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-500 text-brand-500 focus:ring-brand-500 focus:ring-offset-gray-800"
                 />
                 <label htmlFor="isDaily" className="text-sm font-medium text-gray-200 select-none">
                     Perform Every Day
                 </label>
             </div>
             
             {isDaily && (
                 <div className="animate-fade-in mt-2">
                    <label className="block text-xs font-medium text-red-300 mb-1">Penalty if missed (Points to lose)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                      className="w-full rounded-lg border-red-900/50 bg-gray-800 text-white placeholder-gray-400 border p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                        System will automatically deduct these points for every missed day.
                    </p>
                 </div>
             )}
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors">
              Create Activity Type
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
