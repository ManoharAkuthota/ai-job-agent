import axios from 'axios';

// Dynamically resolve API URL:
// 1. If VITE_API_URL is set at build time, use it.
// 2. If running on Render (*.onrender.com), default to live Render backend.
// 3. Otherwise (local dev), fallback to empty string so Vite proxy handles /api.
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://manohar-ai-job-backend.onrender.com';
  }
  return '';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 60000, // 60s timeout for Render free tier container wakeups
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer JWT token to all requests if user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jobagent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When sending FormData (multipart file upload), remove default application/json header
  // so the browser automatically sets multipart/form-data with the correct boundary!
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Automatic retry interceptor for Render cold starts / mobile network hiccups
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Never automatically replay FormData stream because stream is consumed once
    if (config.data instanceof FormData) {
      return Promise.reject(error);
    }

    // Retry on network errors or 502/503/504 (common during container wake up)
    const isNetworkOr5xx = !error.response || (error.response.status >= 500 && error.response.status <= 504);
    if (isNetworkOr5xx) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < 3) {
        config.__retryCount += 1;
        const delayMs = config.__retryCount * 2500; // 2.5s, 5s, 7.5s backoff
        await new Promise((res) => setTimeout(res, delayMs));
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

export const getAgentStatus = () => api.get('/agent/status');
export const pingBackend = () => api.get('/agent/status', { timeout: 20000 });
export const getAgentLogs = () => api.get('/agent/logs');
export const getSettings = () => api.get('/agent/settings');
export const updateSettings = (settings) => api.post('/agent/settings', settings);
export const runAgentNow = () => api.post('/agent/run-now');

export const getJobs = (status, minScore, days = 7) => {
  const params = {};
  if (status) params.status = status;
  if (minScore) params.minScore = minScore;
  if (days) params.days = days;
  return api.get('/jobs', { params });
};
export const scanJobs = (domain, keywords) => api.post('/jobs/scan', null, { params: { domain, keywords } });

export const getProfile = () => api.get('/profile');
export const saveProfile = (profile) => api.post('/profile', profile);
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/profile/upload-resume', formData, {
    headers: {
      'Content-Type': undefined, // Browser must set multipart/form-data with its own boundary
    },
    timeout: 90000, // 90s timeout for mobile upload
  });
};

export const getResumes = () => api.get('/resumes');
export const tailorResume = (jobId) => api.post(`/resumes/tailor/${jobId}`);
export const getResumeByJobId = (jobId) => api.get(`/resumes/job/${jobId}`);
export const getPdfUrl = (resumeId) => `${API_BASE}/api/resumes/${resumeId}/pdf`;

export const getApplications = () => api.get('/applications');
export const applyForJob = (jobId, notes) => api.post(`/applications/apply/${jobId}`, { notes });
export const updateApplicationStatus = (id, status, notes) => api.patch(`/applications/${id}/status`, { status, notes });
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getProofUrl = (applicationId) => `${API_BASE}/api/applications/${applicationId}/proof`;

// Cover Letter APIs
export const generateCoverLetter = (jobId) => api.post(`/cover-letters/generate/${jobId}`);
export const getCoverLetters = () => api.get('/cover-letters');
export const getCoverLetterById = (id) => api.get(`/cover-letters/${id}`);
export const getCoverLetterPdfUrl = (id) => `${API_BASE}/api/cover-letters/${id}/pdf`;

// Interview Preparation APIs
export const generateInterviewPrep = (jobId) => api.post(`/interview-prep/generate/${jobId}`);
export const getInterviewPreps = () => api.get('/interview-prep');
export const getInterviewPrepById = (id) => api.get(`/interview-prep/${id}`);
export const getInterviewPrepByJobId = (jobId) => api.get(`/interview-prep/job/${jobId}`);

// AI Provider & Notification testing
export const checkOllama = (endpoint) => api.get('/agent/check-ollama', { params: { endpoint } });
export const testEmailNotification = (email) => api.post('/agent/test-email', { email });

// Authentication APIs
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (fullName, email, password) => api.post('/auth/register', { fullName, email, password });
export const getCurrentUser = () => api.get('/auth/me');

// General Knowledge (GK) Interactive Quiz APIs
export const getGkTopics = () => api.get('/gk/topics');
export const getGkNextQuestion = (topic, difficulty, exclude) => api.get('/gk/next', { params: { topic, difficulty, exclude } });

export default api;
