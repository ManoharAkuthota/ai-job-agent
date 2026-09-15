import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAgentStatus = () => api.get('/agent/status');
export const getAgentLogs = () => api.get('/agent/logs');
export const getSettings = () => api.get('/agent/settings');
export const updateSettings = (settings) => api.post('/agent/settings', settings);
export const runAgentNow = () => api.post('/agent/run-now');

export const getJobs = (status, minScore) => {
  const params = {};
  if (status) params.status = status;
  if (minScore) params.minScore = minScore;
  return api.get('/jobs', { params });
};
export const scanJobs = (domain, keywords) => api.post('/jobs/scan', null, { params: { domain, keywords } });

export const getProfile = () => api.get('/profile');
export const saveProfile = (profile) => api.post('/profile', profile);

export const getResumes = () => api.get('/resumes');
export const tailorResume = (jobId) => api.post(`/resumes/tailor/${jobId}`);
export const getResumeByJobId = (jobId) => api.get(`/resumes/job/${jobId}`);
export const getPdfUrl = (resumeId) => `${API_BASE}/api/resumes/${resumeId}/pdf`;

export const getApplications = () => api.get('/applications');
export const applyForJob = (jobId, notes) => api.post(`/applications/apply/${jobId}`, { notes });
export const updateApplicationStatus = (id, status, notes) => api.patch(`/applications/${id}/status`, { status, notes });
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getProofUrl = (applicationId) => `${API_BASE}/api/applications/${applicationId}/proof`;

export default api;
