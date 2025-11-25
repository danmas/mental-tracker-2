const API_BASE = '/api';

const fetchAPI = async (endpoint, options) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
};

export const getSkills = async () => {
  return fetchAPI('/skills');
};

export const createSkill = async (name, icon, initialPoints) => {
  await fetchAPI('/skills', {
    method: 'POST',
    body: JSON.stringify({ name, icon, initialPoints }),
  });
};

export const getSkillDetails = async (code) => {
  try {
    return await fetchAPI(`/skills/${code}`);
  } catch (err) {
    console.error('Error fetching skill details:', err);
    return null;
  }
};

export const getActivities = async () => {
  return fetchAPI('/activities');
};

export const createActivity = async (activity) => {
  await fetchAPI('/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
};

export const addHistoryRecord = async (record) => {
  await fetchAPI('/history', {
    method: 'POST',
    body: JSON.stringify(record),
  });
};

export const deleteHistoryRecord = async (id, skillCode) => {
  await fetchAPI(`/history/${id}?skillCode=${encodeURIComponent(skillCode)}`, {
    method: 'DELETE',
  });
};

