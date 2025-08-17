// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me'
  },
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id) => `/projects/${id}`,
    MEMBERS: (id) => `/projects/${id}/members`
  },
  TASKS: {
    BASE: '/tasks',
    BY_PROJECT: (projectId) => `/tasks/project/${projectId}`,
    BY_ID: (id) => `/tasks/${id}`
  },
  AI: {
    GENERATE_IDEAS: '/ai/generate-ideas'
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_PROJECT: (projectId) => `/documents/project/${projectId}`,
    BY_ID: (id) => `/documents/${id}`,
    VERSIONS: (id) => `/documents/${id}/versions`
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    BY_ID: (id) => `/users/${id}`
  }
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'pm',
  MEMBER: 'member',
  GUEST: 'guest'
};

// Task Status
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'inprogress',
  DONE: 'done'
};

// Task Priority
export const TASK_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

// Socket Events
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  DRAWING: 'drawing',
  ADD_SHAPE: 'addShape',
  CHAT_MESSAGE: 'chatMessage',
  TYPING: 'typing',
  STOP_TYPING: 'stopTyping'
};

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 3000
};

// Colors (for status indicators only)
export const STATUS_COLORS = {
  SUCCESS: '#10b981', // green-500
  ERROR: '#ef4444',   // red-500  
  WARNING: '#f59e0b', // yellow-500
  INFO: '#3b82f6',    // blue-500
  PENDING: '#6b7280'  // gray-500
};

// Animation Variants
export const ANIMATION_VARIANTS = {
  FADE_IN: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  SCALE_IN: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  },
  SLIDE_FROM_RIGHT: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 }
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebarState'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Account created successfully!',
  LOGOUT: 'Logged out successfully',
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  DOCUMENT_SAVED: 'Document saved successfully!',
  IDEAS_GENERATED: 'Ideas generated successfully!'
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500
};

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILES: 10
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

export default {
  API_ENDPOINTS,
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  SOCKET_EVENTS,
  UI_CONSTANTS,
  STATUS_COLORS,
  ANIMATION_VARIANTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  UPLOAD_LIMITS,
  PAGINATION
};
