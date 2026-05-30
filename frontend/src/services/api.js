import axios from 'axios';

// Create central Axios instance
const API = axios.create({
  baseURL: '', // Empty because Vite proxy maps /api to http://localhost:8000
  timeout: 30000,
});

// Automatic JWT header injection interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle expired tokens gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and trigger reload/redirect on token expiry
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData) => {
    const response = await API.post('/api/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await API.post('/api/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await API.get('/api/auth/me');
    return response.data;
  }
};

export const resumeAPI = {
  upload: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/api/resume/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },
  match: async (resumeText, jobDescription, candidateName = 'Candidate') => {
    const response = await API.post('/api/resume/match', {
      resume_text: resumeText,
      job_description: jobDescription,
      candidate_name: candidateName
    });
    return response.data;
  }
};

export const jobAPI = {
  create: async (jobData) => {
    const response = await API.post('/api/job/', jobData);
    return response.data;
  },
  list: async () => {
    const response = await API.get('/api/job/');
    return response.data;
  },
  rank: async (jobId) => {
    const response = await API.post(`/api/job/${jobId}/rank`);
    return response.data;
  }
};

export default API;
