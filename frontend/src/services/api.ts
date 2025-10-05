import axios, { type AxiosResponse } from 'axios';

// Types
interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'teacher';
  requestAdmin?: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  name?: string;
  phone?: string;
  bio?: string;
}

interface CourseParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  level?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Create axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug API configuration
console.log('🔧 API Configuration:');
console.log('🌐 VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔗 Final baseURL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`);

// Request interceptor to add auth token
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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData: RegisterData): Promise<AxiosResponse<any>> => 
    api.post('/auth/register', userData),
  login: (credentials: LoginData): Promise<AxiosResponse<any>> => 
    api.post('/auth/login', credentials),
  getProfile: (): Promise<AxiosResponse<any>> => 
    api.get('/auth/me'),
  updateProfile: (userData: UpdateProfileData | FormData): Promise<AxiosResponse<any>> => {
    // Handle FormData differently
    if (userData instanceof FormData) {
      return api.put('/auth/update-profile', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put('/auth/update-profile', userData);
  },
  verifyEmail: (data: { token: string }): Promise<AxiosResponse<any>> =>
    api.post('/auth/verify-email', data),
  resendVerification: (data: { email: string }): Promise<AxiosResponse<any>> =>
    api.post('/auth/resend-verification', data),
};

// Course API calls
export const courseAPI = {
  getAllCourses: (params?: CourseParams): Promise<AxiosResponse<any>> => 
    api.get('/courses', { params }),
  getCourse: (id: string): Promise<AxiosResponse<any>> => 
    api.get(`/courses/${id}`),
  createCourse: (courseData: any): Promise<AxiosResponse<any>> => 
    api.post('/courses', courseData),
  updateCourse: (id: string, courseData: any): Promise<AxiosResponse<any>> => 
    api.put(`/courses/${id}`, courseData),
  deleteCourse: (id: string): Promise<AxiosResponse<any>> => 
    api.delete(`/courses/${id}`),
  enrollCourse: (id: string): Promise<AxiosResponse<any>> => 
    api.post(`/courses/${id}/enroll`),
  submitCourseForApproval: (id: string): Promise<AxiosResponse<any>> =>
    api.put(`/courses/${id}/submit`),
  getMyCourses: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/courses/my-courses', { params }),
};

// Lesson API calls
export const lessonAPI = {
  getLessonsByCourse: (courseId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/courses/${courseId}/lessons`, { params }),
  getLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/lessons/${id}`),
  createLesson: (courseId: string, lessonData: any): Promise<AxiosResponse<any>> =>
    api.post(`/courses/${courseId}/lessons`, lessonData),
  updateLesson: (id: string, lessonData: any): Promise<AxiosResponse<any>> =>
    api.put(`/lessons/${id}`, lessonData),
  deleteLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/lessons/${id}`),
  completeLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/lessons/${id}/complete`),
  uncompleteLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/lessons/${id}/complete`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
