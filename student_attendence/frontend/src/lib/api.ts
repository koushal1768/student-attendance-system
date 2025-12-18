import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    studentId?: string;
    adminSecret?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// HOD (Admin) API
export const hodAPI = {
  getPendingUsers: async (role?: 'student' | 'teacher') => {
    const response = await api.get('/hod/pending-users', {
      params: role ? { role } : undefined,
    });
    return response.data;
  },

  verifyUser: async (id: string) => {
    const response = await api.post(`/hod/verify-user/${id}`);
    return response.data;
  },
};

// User API (for teachers to manage students)
export const userAPI = {
  getStudents: async () => {
    const response = await api.get('/users/students');
    return response.data;
  },
  
  getStudentById: async (id: string) => {
    const response = await api.get(`/users/students/${id}`);
    return response.data;
  },
  
  addStudent: async (data: {
    name: string;
    email: string;
    password: string;
    studentId: string;
  }) => {
    const response = await api.post('/users/students', data);
    return response.data;
  },
  
  updateStudent: async (id: string, data: {
    name?: string;
    email?: string;
    studentId?: string;
  }) => {
    const response = await api.put(`/users/students/${id}`, data);
    return response.data;
  },
  
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/users/students/${id}`);
    return response.data;
  },
};

// Session API (Attendance Sessions)
export const sessionAPI = {
  createSession: async (data: {
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    const response = await api.post('/sessions', data);
    return response.data;
  },
  
  getSessions: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },
  
  getSessionById: async (id: string) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },
  
  updateSession: async (id: string, data: { isActive?: boolean }) => {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data;
  },
  
  deleteSession: async (id: string) => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  },
  
  startFaceRecognition: async (id: string) => {
    const response = await api.post(`/sessions/${id}/start-face-recognition`);
    return response.data;
  },
  
  stopFaceRecognition: async (id: string) => {
    const response = await api.post(`/sessions/${id}/stop-face-recognition`);
    return response.data;
  },
};

// Attendance API
export const attendanceAPI = {
  scanQR: async (qrCodeString: string) => {
    const response = await api.post('/attendance/qr-scan', { qrCodeString });
    return response.data;
  },
  
  getRecords: async (params?: {
    sessionId?: string;
    studentId?: string;
    subject?: string;
    limit?: number;
  }) => {
    const response = await api.get('/attendance/records', { params });
    return response.data;
  },
  
  getStudentRecords: async (studentId: string) => {
    const response = await api.get(`/attendance/records/${studentId}`);
    return response.data;
  },
};

export default api;
