import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const LEVELS_THRESHOLD = 100;

// File paths
const FILES = {
  SKILLS: path.join(DATA_DIR, 'skills.json'),
  ACTIVITIES: path.join(DATA_DIR, 'activities.json'),
  HISTORY: path.join(DATA_DIR, 'history.json'),
};

// Initial Seed Data
const INITIAL_SKILLS = [
  { code: 'coding', name: 'Coding', icon: '💻', currentPoints: 150, level: 1, progress: 50 },
  { code: 'fitness', name: 'Fitness', icon: '💪', currentPoints: 45, level: 0, progress: 45 },
  { code: 'reading', name: 'Reading', icon: '📚', currentPoints: 210, level: 2, progress: 10 },
  { code: 'meditation', name: 'Mindfulness', icon: '🧘', currentPoints: 80, level: 0, progress: 80 },
];

const INITIAL_ACTIVITIES = [
  { id: 'a1', name: 'LeetCode Problem', description: 'Solved a medium problem', points: 15, skillCode: 'coding', createdAt: Date.now() },
  { id: 'a2', name: 'Gym Session', description: '1 hour workout', points: 20, skillCode: 'fitness', isDaily: true, penalty: 10, createdAt: Date.now() - 259200000 },
  { id: 'a3', name: 'Read Chapter', description: 'Read 1 chapter of a technical book', points: 10, skillCode: 'reading', createdAt: Date.now() },
  { id: 'a4', name: 'Morning Meditation', description: '10 minutes guided', points: 5, skillCode: 'meditation', isDaily: true, penalty: 5, createdAt: Date.now() },
];

const INITIAL_HISTORY = [
  { id: 'h1', skillCode: 'coding', activityName: 'LeetCode Problem', points: 15, timestamp: Date.now() - 86400000 },
  { id: 'h2', skillCode: 'coding', activityName: 'Project Work', points: 50, timestamp: Date.now() - 172800000 },
];

// Ensure data directory and files exist
const initStorage = () => {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize files with seed data if they don't exist
  if (!fs.existsSync(FILES.SKILLS)) {
    fs.writeFileSync(FILES.SKILLS, JSON.stringify(INITIAL_SKILLS, null, 2), 'utf8');
  }
  if (!fs.existsSync(FILES.ACTIVITIES)) {
    fs.writeFileSync(FILES.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES, null, 2), 'utf8');
  }
  if (!fs.existsSync(FILES.HISTORY)) {
    fs.writeFileSync(FILES.HISTORY, JSON.stringify(INITIAL_HISTORY, null, 2), 'utf8');
  }
};

// Initialize on module load
initStorage();

// --- File I/O Helpers ---

const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    throw err;
  }
};

// --- Business Logic Helpers ---

const calculateStats = (points) => {
  const level = Math.floor(points / LEVELS_THRESHOLD);
  const progress = points % LEVELS_THRESHOLD;
  return { level, progress };
};

const recalculateSkillPoints = (skillCode) => {
  const allHistory = readJSON(FILES.HISTORY);
  const skills = readJSON(FILES.SKILLS);
  
  // Sum points for this skill
  const totalPoints = allHistory
    .filter(h => h.skillCode === skillCode)
    .reduce((sum, h) => sum + h.points, 0);

  // Update skill record
  const skillIndex = skills.findIndex(s => s.code === skillCode);
  
  if (skillIndex !== -1) {
    const { level, progress } = calculateStats(totalPoints);
    skills[skillIndex] = {
      ...skills[skillIndex],
      currentPoints: totalPoints,
      level,
      progress
    };
    writeJSON(FILES.SKILLS, skills);
  }
};

// Helper to check if same day
const isSameDay = (d1, d2) => 
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

/**
 * Checks all daily activities for the skill and generates penalty records 
 * for missed days up to yesterday.
 */
const processDailyPenalties = (skillCode) => {
  const activities = readJSON(FILES.ACTIVITIES);
  const dailyActivities = activities.filter(a => a.skillCode === skillCode && a.isDaily);
  
  if (dailyActivities.length === 0) return;

  let allHistory = readJSON(FILES.HISTORY);
  let hasNewPenalties = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
        !h.isAutoPenalty
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
        const newRecord = {
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
    writeJSON(FILES.HISTORY, allHistory);
    recalculateSkillPoints(skillCode);
  }
};

// --- API Methods ---

export const getSkills = () => {
  return readJSON(FILES.SKILLS);
};

export const createSkill = (name, icon, initialPoints) => {
  const skills = readJSON(FILES.SKILLS);
  
  // Generate a URL-safe unique code
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const uniqueSuffix = Date.now().toString().slice(-6);
  const code = `${slug || 'skill'}-${uniqueSuffix}`;

  const { level, progress } = calculateStats(initialPoints);

  const newSkill = {
    code,
    name: name.trim(),
    icon: icon.trim() || '⚡',
    currentPoints: initialPoints,
    level,
    progress
  };

  skills.push(newSkill);
  writeJSON(FILES.SKILLS, skills);
  
  return newSkill;
};

export const getSkillDetails = (code) => {
  // Check for daily penalties before returning data
  processDailyPenalties(code);

  const skills = readJSON(FILES.SKILLS);
  const skill = skills.find(s => s.code === code);
  
  if (!skill) return null;

  const allHistory = readJSON(FILES.HISTORY);
  const skillHistory = allHistory
    .filter(h => h.skillCode === code)
    .sort((a, b) => b.timestamp - a.timestamp);

  return { skill, history: skillHistory };
};

export const getActivities = () => {
  return readJSON(FILES.ACTIVITIES);
};

export const createActivity = (activity) => {
  const activities = readJSON(FILES.ACTIVITIES);
  activities.push(activity);
  writeJSON(FILES.ACTIVITIES, activities);
  return activity;
};

export const addHistoryRecord = (record) => {
  const history = readJSON(FILES.HISTORY);
  history.push(record);
  writeJSON(FILES.HISTORY, history);

  // Recalculate skill points
  recalculateSkillPoints(record.skillCode);
  
  return record;
};

export const deleteHistoryRecord = (id, skillCode) => {
  let history = readJSON(FILES.HISTORY);
  const originalLength = history.length;
  history = history.filter(h => h.id !== id);
  
  if (history.length < originalLength) {
    writeJSON(FILES.HISTORY, history);
    recalculateSkillPoints(skillCode);
    return true;
  }
  return false;
};
