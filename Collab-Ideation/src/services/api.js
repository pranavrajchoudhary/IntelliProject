import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (name, email, password, role) =>
    api.post('/auth/register', { name, email, password, role }),
};

export const projectAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  addMember: (id, memberId) => api.post(`/projects/${id}/members`, { memberId }),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`)
};

export const taskAPI = {
  getProjectTasks: (projectId) => api.get(`/tasks/project/${projectId}`),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const documentAPI = {
  getProjectDocs: (projectId) => api.get(`/documents/project/${projectId}`),
  getDocument: (id) => api.get(`/documents/${id}`),
  createDocument: (data) => api.post('/documents', data),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  getVersions: (id) => api.get(`/documents/${id}/versions`),
  restoreVersion: (id, versionId) => api.post(`/documents/${id}/versions/${versionId}/restore`)
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsers: () => api.get('/users'),
  updateUserRole: (userId, data) => api.put(`/users/${userId}/role`, data),
  searchUsers: (query) => api.get(`/users/search?query=${query}`)
};

export const messageAPI = {
  getProjectMessages: (projectId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/messages/project/${projectId}${queryString ? `?${queryString}` : ''}`;
    return api.get(url);
  },
  getUserMessages: () => api.get('/messages/user'),
  createMessage: (data) => api.post('/messages', data),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  getUnreadCounts: () => api.get('/messages/unread-counts'),
};

export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getProjectAnalytics: (projectId) => api.get(`/analytics/project/${projectId}`),
  getLatestSnapshot: () => api.get('/analytics/snapshot/latest'),
  saveStatsSnapshot: (force = false) => api.post(`/analytics/snapshot?force=${force}`),
  getHistoricalTrends: (days = 30) => api.get(`/analytics/trends?days=${days}`)
};

export const settingsAPI = {
  getUserSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  changePassword: (data) => api.put('/settings/password', data),
  sendPasswordResetOTP: (email) => api.post('/settings/password-reset/send-otp', { email }),
  verifyOTPAndResetPassword: (email, otp, newPassword) => api.post('/settings/password-reset/verify-otp', { email, otp, newPassword }),
  deleteAccount: () => api.delete('/settings/account')
};

export const aiAPI = {
  generateIdeas: (prompt, projectId) => api.post('/api/ai/generate-ideas', { prompt, projectId })
};

export const aiChatAPI = {
  advancedChat: (message) => api.post('/api/ai-chat/chat', { message }),
  chat: (message) => api.post('/api/ai-chat/chat', { message }),
  projectChat: ({ message, projectId }) => api.post('/api/ai-chat/project-chat', { message, projectId }),
  generateIdeas: (topic, industry) => api.post('/api/ai-chat/project-ideas', { topic, industry })
};

export const uploadAPI = {
  uploadAudio: (formData) => api.post('/upload/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const meetingAPI = {
  // Meeting rooms
  createMeeting: (data) => api.post('/meetings', data),
  getActiveMeetings: () => api.get('/meetings/active'),
  getUpcomingMeetings: () => api.get('/meetings/upcoming'),
  getMeetingHistory: (page = 1, limit = 10) => api.get(`/meetings/history?page=${page}&limit=${limit}`),
  
  // Room actions
  joinMeeting: (roomId) => api.post(`/meetings/${roomId}/join`),
  leaveMeeting: (roomId) => api.post(`/meetings/${roomId}/leave`),
  endMeeting: (roomId) => api.post(`/meetings/${roomId}/end`),
  cancelMeeting: (roomId) => api.delete(`/meetings/${roomId}/cancel`),
  
  // Settings and controls
  updateSettings: (roomId, settings) => api.put(`/meetings/${roomId}/settings`, { settings }),
  muteParticipant: (roomId, participantId, muted, canUnmute = true) => 
    api.put(`/meetings/${roomId}/participants/${participantId}/mute`, { muted, canUnmute }),
  
  // Voice controls
  muteAllParticipants: (roomId) => api.post(`/meetings/${roomId}/mute-all`),
  unmuteAllParticipants: (roomId) => api.post(`/meetings/${roomId}/unmute-all`),
  
  // Whiteboard access
  updateWhiteboardAccess: (roomId, access, allowedUsers) => 
    api.put(`/meetings/${roomId}/whiteboard-access`, { access, allowedUsers }),
  getTurnCredentials: () => api.get('/meetings/turn-credentials'),

  kickParticipant: (roomId, participantId) => 
  api.post(`/meetings/${roomId}/participants/${participantId}/kick`),
};

export const ideaAPI = {
  saveIdea: (data) => api.post('/ideas', data),
  getProjectIdeas: (projectId) => api.get(`/ideas/project/${projectId}`),
  deleteIdea: (ideaId) => api.delete(`/ideas/${ideaId}`)
};

export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getPendingRegistrations: () => api.get('/admin/pending-registrations'),
  approveRegistration: (userId, approved, rejectionReason) => 
    api.put(`/admin/registrations/${userId}/approve`, { approved, rejectionReason }),
  getUserActivities: () => api.get('/admin/activities'),
  getAdminStats: () => api.get('/admin/stats'),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  suspendUser: (userId, suspended) => api.put(`/admin/users/${userId}/suspend`, { suspended }),
  restoreUserRole: (userId) => api.put(`/admin/users/${userId}/restore-role`),
  getUserActivity: (userId) => api.get(`/admin/users/${userId}/activity`),
};

export default api;