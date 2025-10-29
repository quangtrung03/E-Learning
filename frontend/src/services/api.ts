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
  getMyEnrolledCourses: (params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/courses/enrolled', { params }),
};

// Lesson API calls
export const lessonAPI = {
  getLessonsByCourse: (courseId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/lessons/by-course/${courseId}`, { params }),
  getLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/lessons/${id}`),
  createLesson: (courseId: string, lessonData: any): Promise<AxiosResponse<any>> =>
    api.post(`/lessons/create/${courseId}`, lessonData),
  updateLesson: (id: string, lessonData: any): Promise<AxiosResponse<any>> =>
    api.put(`/lessons/${id}`, lessonData),
  deleteLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/lessons/${id}`),
  completeLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/lessons/${id}/complete`),
  uncompleteLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/lessons/${id}/complete`),
};

// Assignment API calls
export const assignmentAPI = {
  getAssignmentsByCourse: (courseId: string, params?: { page?: number; limit?: number; type?: string }): Promise<AxiosResponse<any>> =>
    api.get(`/assignments/by-course/${courseId}`, { params }),
  getAssignment: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/assignments/${id}`),
  createAssignment: (assignmentData: any): Promise<AxiosResponse<any>> =>
    api.post('/assignments', assignmentData),
  submitAssignment: (id: string, data?: any): Promise<AxiosResponse<any>> =>
    api.post(`/assignments/${id}/submit`, data),
  completeSubmission: (submissionId: string, answers: any[]): Promise<AxiosResponse<any>> =>
    api.put(`/assignments/submissions/${submissionId}/complete`, { answers }),
};

// Certificate API calls
export const certificateAPI = {
  generateCertificate: (courseId: string): Promise<AxiosResponse<any>> =>
    api.post('/certificates/generate', { courseId }),
  getMyCertificates: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/certificates/my-certificates', { params }),
  verifyCertificate: (hash: string): Promise<AxiosResponse<any>> =>
    api.get(`/certificates/verify/${hash}`),
  getCertificate: (id: string, isPublic?: boolean): Promise<AxiosResponse<any>> =>
    api.get(`/certificates/${id}${isPublic ? '?public=true' : ''}`),
  getCertificateStats: (): Promise<AxiosResponse<any>> =>
    api.get('/certificates/admin/stats'),
};

// Discussion API calls
export const discussionAPI = {
  getDiscussionsByCourse: (courseId: string, params?: { page?: number; limit?: number; category?: string }): Promise<AxiosResponse<any>> =>
    api.get(`/courses/${courseId}/discussions`, { params }),
  getDiscussion: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/discussions/${id}`),
  createDiscussion: (discussionData: any): Promise<AxiosResponse<any>> =>
    api.post('/discussions', discussionData),
  replyToDiscussion: (id: string, content: string): Promise<AxiosResponse<any>> =>
    api.post(`/discussions/${id}/replies`, { content }),
  likeDiscussion: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/discussions/${id}/like`),
  unlikeDiscussion: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/discussions/${id}/like`),
};

// Review API calls
export const reviewAPI = {
  getReviewsByCourse: (courseId: string, params?: { page?: number; limit?: number; sort?: string }): Promise<AxiosResponse<any>> =>
    api.get(`/courses/${courseId}/reviews`, { params }),
  createReview: (reviewData: any): Promise<AxiosResponse<any>> =>
    api.post('/reviews', reviewData),
  updateReview: (id: string, reviewData: any): Promise<AxiosResponse<any>> =>
    api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/reviews/${id}`),
  markReviewHelpful: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/reviews/${id}/helpful`),
};

// Study Group API calls
export const studyGroupAPI = {
  getStudyGroupsByCourse: (courseId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/courses/${courseId}/study-groups`, { params }),
  getStudyGroup: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/${id}`),
  createStudyGroup: (groupData: any): Promise<AxiosResponse<any>> =>
    api.post('/study-groups', groupData),
  joinStudyGroup: (id: string, inviteCode?: string): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${id}/join`, { inviteCode }),
  leaveStudyGroup: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/study-groups/${id}/leave`),
  getMyStudyGroups: (): Promise<AxiosResponse<any>> =>
    api.get('/study-groups/my-groups'),
};

// Learning Analytics API calls
export const analyticsAPI = {
  getUserAnalytics: (courseId?: string): Promise<AxiosResponse<any>> =>
    api.get('/analytics/user', { params: { courseId } }),
  getCourseAnalytics: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/analytics/course/${courseId}`),
  updateLearningProgress: (courseId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/analytics/progress/${courseId}`, data),
};

// Payment API calls
export const paymentAPI = {
  createPaymentIntent: (courseId: string, paymentData: any): Promise<AxiosResponse<any>> =>
    api.post('/payments/create-intent', { courseId, ...paymentData }),
  confirmPayment: (paymentIntentId: string): Promise<AxiosResponse<any>> =>
    api.post(`/payments/${paymentIntentId}/confirm`),
  getPaymentHistory: (params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/payments/history', { params }),
  requestRefund: (paymentId: string, reason: string): Promise<AxiosResponse<any>> =>
    api.post(`/payments/${paymentId}/refund`, { reason }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
