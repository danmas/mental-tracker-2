import express from 'express';
import * as dataService from '../services/dataService.js';

const router = express.Router();

// GET /api/skills - Get all skills
router.get('/skills', (req, res) => {
  try {
    const skills = dataService.getSkills();
    res.json(skills);
  } catch (err) {
    console.error('Error getting skills:', err);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// POST /api/skills - Create a new skill
router.post('/skills', (req, res) => {
  try {
    const { name, icon, initialPoints } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const newSkill = dataService.createSkill(name, icon || '', initialPoints || 0);
    res.status(201).json(newSkill);
  } catch (err) {
    console.error('Error creating skill:', err);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// GET /api/skills/:code - Get skill details with history
router.get('/skills/:code', (req, res) => {
  try {
    const { code } = req.params;
    const details = dataService.getSkillDetails(code);
    
    if (!details) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json(details);
  } catch (err) {
    console.error('Error getting skill details:', err);
    res.status(500).json({ error: 'Failed to get skill details' });
  }
});

// GET /api/activities - Get all activities
router.get('/activities', (req, res) => {
  try {
    const activities = dataService.getActivities();
    res.json(activities);
  } catch (err) {
    console.error('Error getting activities:', err);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// POST /api/activities - Create a new activity
router.post('/activities', (req, res) => {
  try {
    const activity = req.body;
    
    if (!activity.name || !activity.skillCode) {
      return res.status(400).json({ error: 'Name and skillCode are required' });
    }
    
    const newActivity = dataService.createActivity(activity);
    res.status(201).json(newActivity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// POST /api/history - Add a history record
router.post('/history', (req, res) => {
  try {
    const record = req.body;
    
    if (!record.skillCode || !record.activityName) {
      return res.status(400).json({ error: 'skillCode and activityName are required' });
    }
    
    const newRecord = dataService.addHistoryRecord(record);
    res.status(201).json(newRecord);
  } catch (err) {
    console.error('Error adding history record:', err);
    res.status(500).json({ error: 'Failed to add history record' });
  }
});

// DELETE /api/history/:id - Delete a history record
router.delete('/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { skillCode } = req.query;
    
    if (!skillCode) {
      return res.status(400).json({ error: 'skillCode query parameter is required' });
    }
    
    const deleted = dataService.deleteHistoryRecord(id, skillCode);
    
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'History record not found' });
    }
  } catch (err) {
    console.error('Error deleting history record:', err);
    res.status(500).json({ error: 'Failed to delete history record' });
  }
});

export default router;
