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
  status?: string;
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
  verifyEmail: (data: { token?: string; email?: string; otp?: string }): Promise<AxiosResponse<any>> =>
    api.post('/auth/verify-email', data),
  resendVerification: (data: { email: string }): Promise<AxiosResponse<any>> =>
    api.post('/auth/resend-verification', data),
  forgotPassword: (data: { email: string }): Promise<AxiosResponse<any>> =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token?: string; email?: string; otp?: string; newPassword: string }): Promise<AxiosResponse<any>> =>
    api.post('/auth/reset-password', data),
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
  getMyCourseEnrollment: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/courses/${courseId}/enrollment`),
  updateMyLastLesson: (courseId: string, lessonId: string): Promise<AxiosResponse<any>> =>
    api.put(`/courses/${courseId}/enrollment/last-lesson`, { lessonId }),
  getMyStudents: (): Promise<AxiosResponse<any>> =>
    api.get('/courses/my-students'),
  getMyRevenue: (): Promise<AxiosResponse<any>> =>
    api.get('/courses/my-revenue'),
};

// Lesson API calls
export const lessonAPI = {
  getLessonsByCourse: (courseId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/lessons/by-course/${courseId}`, { params }),
  getLesson: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/lessons/${id}`),
  bulkSetLessonVisibility: (courseId: string, lessonIds: string[], isHidden: boolean): Promise<AxiosResponse<any>> =>
    api.put(`/lessons/by-course/${courseId}/visibility`, { lessonIds, isHidden }),
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

// Course Section API calls
export const sectionAPI = {
  getSectionsByCourse: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/sections/by-course/${courseId}`),
  createSection: (courseId: string, data: { title: string; description?: string; order?: number }): Promise<AxiosResponse<any>> =>
    api.post(`/sections/by-course/${courseId}`, data),
  updateSection: (id: string, data: { title?: string; description?: string; order?: number }): Promise<AxiosResponse<any>> =>
    api.put(`/sections/${id}`, data),
  deleteSection: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/sections/${id}`)
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
  getSubmissionsByAssignment: (assignmentId: string, params?: { status?: string; student?: string }): Promise<AxiosResponse<any>> =>
    api.get(`/assignments/${assignmentId}/submissions`, { params }),
  gradeSubmission: (submissionId: string, data: { score?: number; feedback?: string; detailedFeedback?: any[] }): Promise<AxiosResponse<any>> =>
    api.put(`/assignments/submissions/${submissionId}/grade`, data),
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
    api.get(`/discussions/course/${courseId}`, { params }),
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
    api.get(`/reviews/course/${courseId}`, { params }),
  createReview: (reviewData: any): Promise<AxiosResponse<any>> =>
    api.post('/reviews', reviewData),
  updateReview: (id: string, reviewData: any): Promise<AxiosResponse<any>> =>
    api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/reviews/${id}`),
  markReviewHelpful: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/reviews/${id}/helpful`),
  // Admin APIs
  getAllReviews: (params?: { page?: number; limit?: number; status?: string; course?: string; minRating?: number; maxRating?: number; sortBy?: string }): Promise<AxiosResponse<any>> =>
    api.get('/reviews/admin/all', { params }),
  getPendingReviews: (params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/reviews/admin/pending', { params }),
  moderateReview: (id: string, data: { action: 'approve' | 'reject'; reason?: string }): Promise<AxiosResponse<any>> =>
    api.put(`/reviews/admin/reviews/${id}/moderate`, data),
};

// Study Group API calls
export const studyGroupAPI = {
  getStudyGroupsByCourse: (courseId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/courses/${courseId}/study-groups`, { params }),
  getStudyGroups: (params?: { page?: number; limit?: number; search?: string; studyLevel?: string; language?: string; sortBy?: string; sortOrder?: string }): Promise<AxiosResponse<any>> =>
    api.get('/study-groups', { params }),
  getStudyGroupByCode: (code: string): Promise<AxiosResponse<any>> =>
    api.get(`/study-groups/by-code/${encodeURIComponent(code)}`),
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
  getPlatformFeeReport: (params?: { year?: number; month?: number }): Promise<AxiosResponse<any>> =>
    api.get('/analytics/platform-fee', { params }),
};

// Payment API calls
export const paymentAPI = {
  createPayment: (paymentData: {
    courseId: string;
    couponCode?: string;
    paymentMethod: { type: 'bank-transfer' | 'vnpay' | 'momo' | 'zalopay' | 'paypal'; provider: string };
    billingAddress?: {
      fullName?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  }): Promise<AxiosResponse<any>> => api.post('/payments/create-intent', paymentData),
  getPaymentByOrderId: (orderId: string): Promise<AxiosResponse<any>> =>
    api.get(`/payments/order/${encodeURIComponent(orderId)}`),
  fakeSuccess: (orderId: string): Promise<AxiosResponse<any>> =>
    api.post(`/payments/${encodeURIComponent(orderId)}/fake-success`),
  getMyPayments: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/payments/my-payments', { params }),
  getPayment: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/payments/${id}`),
  requestRefund: (paymentId: string, reason: string): Promise<AxiosResponse<any>> =>
    api.post(`/payments/${paymentId}/refund`, { reason }),
};

// Message API calls
export const messageAPI = {
  getConversations: (): Promise<AxiosResponse<any>> =>
    api.get('/messages/conversations'),
  getOrCreateConversation: (userId: string): Promise<AxiosResponse<any>> =>
    api.post('/messages/conversations', { userId }),
  searchUsers: (q: string): Promise<AxiosResponse<any>> =>
    api.get('/messages/users/search', { params: { q } }),
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/messages/conversations/${conversationId}`, { params }),
  sendMessage: (
    conversationId: string,
    content: string,
    type?: string,
    file?: { fileUrl?: string; fileName?: string }
  ): Promise<AxiosResponse<any>> =>
    api.post(`/messages/conversations/${conversationId}`, {
      content,
      type,
      fileUrl: file?.fileUrl,
      fileName: file?.fileName,
    }),
  markAsRead: (conversationId: string): Promise<AxiosResponse<any>> =>
    api.put(`/messages/conversations/${conversationId}/read`),
  deleteMessage: (messageId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/messages/${messageId}`),
};

export const friendAPI = {
  searchUsers: (q: string): Promise<AxiosResponse<any>> =>
    api.get('/friends/search', { params: { q } }),
  getFriends: (): Promise<AxiosResponse<any>> =>
    api.get('/friends'),
  getRequests: (): Promise<AxiosResponse<any>> =>
    api.get('/friends/requests'),
  sendRequest: (toUserId: string): Promise<AxiosResponse<any>> =>
    api.post('/friends/requests', { toUserId }),
  acceptRequest: (requestId: string): Promise<AxiosResponse<any>> =>
    api.put(`/friends/requests/${requestId}/accept`),
  rejectRequest: (requestId: string): Promise<AxiosResponse<any>> =>
    api.put(`/friends/requests/${requestId}/reject`),
  blockUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.post('/friends/block', { userId }),
  unblockUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/friends/block/${userId}`),
};

// Admin API calls
export const adminAPI = {
  // User management
  getAllUsers: (params?: { page?: number; limit?: number; role?: string; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/admin/users', { params }),
  getUserById: (userId: string): Promise<AxiosResponse<any>> =>
    api.get(`/admin/users/${userId}`),
  updateUserRole: (userId: string, role: string): Promise<AxiosResponse<any>> =>
    api.put(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId: string, status: string): Promise<AxiosResponse<any>> =>
    api.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/admin/users/${userId}`),

  // Course management
  getAllCourses: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/admin/courses', { params }),
  approveCourse: (courseId: string): Promise<AxiosResponse<any>> =>
    api.put(`/admin/courses/${courseId}/approve`),
  rejectCourse: (courseId: string, reason: string): Promise<AxiosResponse<any>> =>
    api.put(`/admin/courses/${courseId}/reject`, { rejectionReason: reason }),

  // Admin requests
  getAdminRequests: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/admin/requests', { params }),
  processAdminRequest: (requestId: string, action: 'approve' | 'reject', reason?: string): Promise<AxiosResponse<any>> =>
    api.put(`/admin/requests/${requestId}`, { action, reason }),
  
  // Analytics & Dashboard
  getDashboardStats: (): Promise<AxiosResponse<any>> =>
    api.get('/admin/dashboard/stats'),
  getSystemAnalytics: (params?: { period?: string }): Promise<AxiosResponse<any>> =>
    api.get('/admin/analytics', { params }),
    
  // Payment management
  getAllPayments: (params?: { page?: number; limit?: number; status?: string }): Promise<AxiosResponse<any>> =>
    api.get('/payments/admin/all', { params }),
  approvePayment: (paymentId: string): Promise<AxiosResponse<any>> =>
    api.put(`/payments/${paymentId}/confirm`, { manualConfirm: true }),
  markPaymentDisputed: (paymentId: string, reason?: string): Promise<AxiosResponse<any>> =>
    api.put(`/payments/${paymentId}/dispute`, { reason }),
  processRefund: (paymentId: string, reason: string, refundAmount?: number): Promise<AxiosResponse<any>> =>
    api.put(`/payments/${paymentId}/refund`, { reason, refundAmount }),

  // Settings: default course thumbnails
  getCourseThumbnails: (): Promise<AxiosResponse<any>> => api.get('/admin/settings/course-thumbnails'),
  addCourseThumbnail: (url: string, setActive: boolean = true): Promise<AxiosResponse<any>> =>
    api.post('/admin/settings/course-thumbnails', { url, setActive }),
  setActiveCourseThumbnail: (url: string): Promise<AxiosResponse<any>> =>
    api.put('/admin/settings/course-thumbnails/active', { url }),
  removeCourseThumbnail: (url: string): Promise<AxiosResponse<any>> =>
    api.delete('/admin/settings/course-thumbnails', { data: { url } }),
};

// Content API
export const contentAPI = {
  getCategories: () => api.get('/categories'),
  getInstructors: () => api.get('/instructors'),
  getInstructor: (id: string) => api.get(`/instructors/${id}`),
  getTestimonials: () => api.get('/testimonials'),
  getTestimonial: (slug: string) => api.get(`/testimonials/${slug}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData: FormData, onProgress?: (progress: number) => void, type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return api.post(`/upload/image${qs}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  uploadVideo: (formData: FormData, onProgress?: (progress: number) => void, type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return api.post(`/upload/video${qs}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  uploadAudio: (formData: FormData, onProgress?: (progress: number) => void, type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return api.post(`/upload/audio${qs}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  uploadDocument: (formData: FormData, onProgress?: (progress: number) => void, type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return api.post(`/upload/document${qs}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

// Public Settings API
export const settingsAPI = {
  getDefaultCourseThumbnail: (): Promise<AxiosResponse<any>> => api.get('/settings/default-course-thumbnail'),
};

// Coupon API calls
export const couponAPI = {
  getAllCoupons: (params?: { page?: number; limit?: number; status?: string; type?: string }): Promise<AxiosResponse<any>> =>
    api.get('/coupons', { params }),
  getCoupon: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/coupons/${id}`),
  createCoupon: (couponData: any): Promise<AxiosResponse<any>> =>
    api.post('/coupons', couponData),
  updateCoupon: (id: string, couponData: any): Promise<AxiosResponse<any>> =>
    api.put(`/coupons/${id}`, couponData),
  deleteCoupon: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/coupons/${id}`),
  toggleCouponStatus: (id: string): Promise<AxiosResponse<any>> =>
    api.put(`/coupons/${id}/toggle-status`),
  getCouponAnalytics: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/coupons/${id}/analytics`),
  validateCoupon: (data: { code: string; courseId?: string }): Promise<AxiosResponse<any>> =>
    api.post('/coupons/validate', data),
  getPublicCoupons: (courseId?: string): Promise<AxiosResponse<any>> =>
    api.get('/coupons/public', { params: courseId ? { courseId } : undefined }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// ─── Search API ───────────────────────────────────────────
export const searchAPI = {
  global: (params: { q: string; type?: 'all' | 'courses' | 'users' | 'posts' | 'categories'; page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/search', { params }),
  suggestions: (q: string): Promise<AxiosResponse<any>> =>
    api.get('/search/suggestions', { params: { q } }),
};

// ─── Social API ───────────────────────────────────────────
export const socialAPI = {
  // Feed
  getFeed: (params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/social/feed', { params }),
  getExplorePosts: (params?: { page?: number; limit?: number; tag?: string }): Promise<AxiosResponse<any>> =>
    api.get('/social/posts/explore', { params }),
  getSavedPosts: (params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get('/social/saved', { params }),

  // Posts
  createPost: (data: { content: string; images?: any[]; type?: string; tags?: string[]; visibility?: string; relatedCourse?: string; relatedCertificate?: string }): Promise<AxiosResponse<any>> =>
    api.post('/social/posts', data),
  getPost: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/social/posts/${id}`),
  updatePost: (id: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/social/posts/${id}`, data),
  deletePost: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/social/posts/${id}`),
  toggleLike: (postId: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/posts/${postId}/like`),
  toggleSave: (postId: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/posts/${postId}/save`),
  addComment: (postId: string, content: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/posts/${postId}/comments`, { content }),
  deleteComment: (postId: string, commentId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/social/posts/${postId}/comments/${commentId}`),
  likeComment: (postId: string, commentId: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/posts/${postId}/comments/${commentId}/like`),

  // Stories
  getStories: (): Promise<AxiosResponse<any>> =>
    api.get('/social/stories'),
  createStory: (data: { mediaUrl: string; mediaPublicId?: string; mediaType?: string; caption?: string; backgroundColor?: string; textOverlay?: string; linkUrl?: string; linkLabel?: string }): Promise<AxiosResponse<any>> =>
    api.post('/social/stories', data),
  viewStory: (id: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/stories/${id}/view`),
  reactToStory: (id: string, reaction: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/stories/${id}/react`, { reaction }),
  deleteStory: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/social/stories/${id}`),

  // Users (social)
  getUserProfile: (userId: string): Promise<AxiosResponse<any>> =>
    api.get(`/social/users/${userId}/profile`),
  getUserPosts: (userId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> =>
    api.get(`/social/users/${userId}/posts`, { params }),
  toggleFollow: (userId: string): Promise<AxiosResponse<any>> =>
    api.post(`/social/users/${userId}/follow`),
  getFollowers: (userId: string): Promise<AxiosResponse<any>> =>
    api.get(`/social/users/${userId}/followers`),
  getFollowing: (userId: string): Promise<AxiosResponse<any>> =>
    api.get(`/social/users/${userId}/following`),

  // Preferences / Settings
  getPreferences: (): Promise<AxiosResponse<any>> =>
    api.get('/social/preferences'),
  updatePreferences: (data: { language?: string; theme?: string; notifications?: Record<string, boolean>; privacy?: Record<string, any> }): Promise<AxiosResponse<any>> =>
    api.put('/social/preferences', data),
  updateSocialProfile: (data: { name?: string; bio?: string; phone?: string; avatar?: string; coverImage?: string; website?: string; location?: string; socialLinks?: Record<string, string> }): Promise<AxiosResponse<any>> =>
    api.put('/social/profile', data),
};

// Study Schedule API
export const scheduleAPI = {
  getSchedule: (params?: { month?: string; date?: string }): Promise<AxiosResponse<any>> =>
    api.get('/schedule', { params }),
  createEvent: (data: { title: string; courseId?: string; date: string; startTime?: string; endTime?: string; color?: string; note?: string }): Promise<AxiosResponse<any>> =>
    api.post('/schedule', data),
  updateEvent: (id: string, data: Partial<{ title: string; courseId: string; date: string; startTime: string; endTime: string; color: string; note: string; completed: boolean }>): Promise<AxiosResponse<any>> =>
    api.put(`/schedule/${id}`, data),
  deleteEvent: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/schedule/${id}`),
};

export default api;

