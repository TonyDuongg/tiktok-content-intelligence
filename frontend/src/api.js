const API_BASE = '';

export function getAuthToken() {
  return localStorage.getItem('tiktok_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('tiktok_token', token);
  } else {
    localStorage.removeItem('tiktok_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(API_BASE + endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Lỗi hệ thống (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (email, password, fullName) =>
    request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName })
    }),

  login: (email, password) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => request('/api/v1/auth/me'),

  // Categories
  getCategories: () => request('/api/v1/categories'),

  // Channels
  ingestChannel: (username, categoryId, maxVideos = 10) => {
    const params = new URLSearchParams({ username, maxVideos });
    if (categoryId) params.append('categoryId', categoryId);
    return request(`/api/v1/channels/ingest?${params.toString()}`, { method: 'POST' });
  },

  getChannel: (username) => request(`/api/v1/channels/${username}`),

  getTopVideos: (username, limit = 10) =>
    request(`/api/v1/channels/${username}/top-videos?limit=${limit}`),

  // Jobs
  dispatchJob: (jobData) =>
    request('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    }),

  getJob: (jobId) => request(`/api/v1/jobs/${jobId}`),

  getMyJobs: () => request('/api/v1/jobs/my-jobs'),

  // AI Scripts
  generateDirectScript: (scriptData) =>
    request('/api/v1/scripts/generate', {
      method: 'POST',
      body: JSON.stringify(scriptData)
    }),

  getScriptDetail: (scriptId) => request(`/api/v1/scripts/${scriptId}`),

  getMyScripts: () => request('/api/v1/scripts/my-scripts'),

  updateScriptStatus: (scriptId, status) =>
    request(`/api/v1/scripts/${scriptId}/status?status=${status}`, {
      method: 'PATCH'
    })
};
