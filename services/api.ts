
import { Skill, Activity, HistoryRecord, LEVELS_THRESHOLD } from '../types';

const STORAGE_KEYS = {
  SKILLS: 'mental_tracker_skills',
  ACTIVITIES: 'mental_tracker_activities',
  HISTORY: 'mental_tracker_history',
};

// Initial Seed Data
const INITIAL_SKILLS: Skill[] = [
  { code: 'coding', name: 'Coding', icon: '💻', currentPoints: 150, level: 1, progress: 50 },
  { code: 'fitness', name: 'Fitness', icon: '💪', currentPoints: 45, level: 0, progress: 45 },
  { code: 'reading', name: 'Reading', icon: '📚', currentPoints: 210, level: 2, progress: 10 },
  { code: 'meditation', name: 'Mindfulness', icon: '🧘', currentPoints: 80, level: 0, progress: 80 },
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: 'a1', name: 'LeetCode Problem', description: 'Solved a medium problem', points: 15, skillCode: 'coding', createdAt: Date.now() },
  { id: 'a2', name: 'Gym Session', description: '1 hour workout', points: 20, skillCode: 'fitness', isDaily: true, penalty: 10, createdAt: Date.now() - 259200000 }, // Created 3 days ago
  { id: 'a3', name: 'Read Chapter', description: 'Read 1 chapter of a technical book', points: 10, skillCode: 'reading', createdAt: Date.now() },
  { id: 'a4', name: 'Morning Meditation', description: '10 minutes guided', points: 5, skillCode: 'meditation', isDaily: true, penalty: 5, createdAt: Date.now() },
];

// Helper to calculate level and progress
const calculateStats = (points: number) => {
  const level = Math.floor(points / LEVELS_THRESHOLD);
  const progress = points % LEVELS_THRESHOLD;
  return { level, progress };
};

// Initialize Storage if empty
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SKILLS)) {
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(INITIAL_SKILLS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    const initialHistory: HistoryRecord[] = [
        { id: 'h1', skillCode: 'coding', activityName: 'LeetCode Problem', points: 15, timestamp: Date.now() - 86400000 },
        { id: 'h2', skillCode: 'coding', activityName: 'Project Work', points: 50, timestamp: Date.now() - 172800000 },
    ];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(initialHistory));
  }
};

initStorage();

// --- API Methods ---

export const getSkills = async (): Promise<Skill[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency
  const skillsStr = localStorage.getItem(STORAGE_KEYS.SKILLS);
  return skillsStr ? JSON.parse(skillsStr) : [];
};

export const createSkill = async (name: string, icon: string, initialPoints: number): Promise<void> => {
  const skills = await getSkills(); // Await latency for consistency
  
  // Generate a URL-safe unique code
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const uniqueSuffix = Date.now().toString().slice(-6);
  const code = `${slug || 'skill'}-${uniqueSuffix}`;

  const { level, progress } = calculateStats(initialPoints);

  const newSkill: Skill = {
    code,
    name: name.trim(),
    icon: icon.trim() || '⚡',
    currentPoints: initialPoints,
    level,
    progress
  };

  skills.push(newSkill);
  localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
};

export const getSkillDetails = async (code: string): Promise<{ skill: Skill; history: HistoryRecord[] } | null> => {
  // Check for daily penalties before returning data
  await processDailyPenalties(code);

  await new Promise(resolve => setTimeout(resolve, 300));
  const skills = await getSkills();
  const skill = skills.find(s => s.code === code);
  
  if (!skill) return null;

  const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
  const allHistory: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
  const skillHistory = allHistory
    .filter(h => h.skillCode === code)
    .sort((a, b) => b.timestamp - a.timestamp);

  return { skill, history: skillHistory };
};

export const getActivities = async (): Promise<Activity[]> => {
  const str = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
  return str ? JSON.parse(str) : [];
};

export const createActivity = async (activity: Activity): Promise<void> => {
  const activities = await getActivities();
  activities.push(activity);
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
};

export const addHistoryRecord = async (record: HistoryRecord): Promise<void> => {
  const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
  const history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
  history.push(record);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

  // Recalculate skill points
  await recalculateSkillPoints(record.skillCode);
};

export const deleteHistoryRecord = async (id: string, skillCode: string): Promise<void> => {
  const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
  let history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
  history = history.filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

  await recalculateSkillPoints(skillCode);
};

// --- Internal Helpers ---

const recalculateSkillPoints = async (skillCode: string) => {
  const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
  const allHistory: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
  
  // Sum points for this skill
  const totalPoints = allHistory
    .filter(h => h.skillCode === skillCode)
    .reduce((sum, h) => sum + h.points, 0);

  // Update skill record
  const skills = await getSkills();
  const skillIndex = skills.findIndex(s => s.code === skillCode);
  
  if (skillIndex !== -1) {
    const { level, progress } = calculateStats(totalPoints);
    skills[skillIndex] = {
      ...skills[skillIndex],
      currentPoints: totalPoints,
      level,
      progress
    };
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  }
};

/**
 * Checks all daily activities for the skill and generates penalty records 
 * for missed days up to yesterday.
 */
const processDailyPenalties = async (skillCode: string) => {
  const activities = await getActivities();
  const dailyActivities = activities.filter(a => a.skillCode === skillCode && a.isDaily);
  
  if (dailyActivities.length === 0) return;

  const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
  let allHistory: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
  let hasNewPenalties = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to check if same day
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  for (const activity of dailyActivities) {
    // Start checking from activity creation or a sensible fallback
    const startDate = activity.createdAt ? new Date(activity.createdAt) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Iterate from start date until yesterday
    const checkDate = new Date(startDate);
    
    // Don't check today, only past days
    while (checkDate < today) {
      
      // 1. Did we do it this day?
      const performed = allHistory.some(h => 
        h.activityId === activity.id && 
        isSameDay(new Date(h.timestamp), checkDate) &&
        !h.isAutoPenalty // User actions only
      );

      // 2. Was a penalty already applied this day?
      const penalized = allHistory.some(h => 
        h.activityId === activity.id && 
        isSameDay(new Date(h.timestamp), checkDate) &&
        h.isAutoPenalty
      );

      if (!performed && !penalized) {
        // Add penalty
        const penaltyPoints = activity.penalty ? -Math.abs(activity.penalty) : -10;
        const newRecord: HistoryRecord = {
          id: `penalty-${activity.id}-${checkDate.getTime()}`,
          skillCode: skillCode,
          activityId: activity.id,
          activityName: `Missed Daily: ${activity.name}`,
          points: penaltyPoints,
          notes: 'Automatic penalty for missing daily goal',
          timestamp: checkDate.getTime() + 43200000, // Set to Noon of that day
          isAutoPenalty: true
        };
        allHistory.push(newRecord);
        hasNewPenalties = true;
      }

      // Next day
      checkDate.setDate(checkDate.getDate() + 1);
    }
  }

  if (hasNewPenalties) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(allHistory));
    await recalculateSkillPoints(skillCode);
  }
};
