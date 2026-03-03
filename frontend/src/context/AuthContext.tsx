import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useToast } from './ToastContext';
import { setSentryUser } from '../sentry';

// Types
interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  isActive: boolean;
  isAdmin?: boolean;
  enrolledCourses: Array<{
    course: string;
    enrolledAt: Date;
    progress: number;
  }>;
  createdCourses: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  login: (credentials: LoginData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (userData: UpdateProfileData | UpdateProfileFormData) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

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

// For FormData updates
type UpdateProfileFormData = FormData;

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
} as const;

type AuthAction = 
  | { type: 'LOGIN_START' | 'REGISTER_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_SUCCESS' }
  | { type: 'LOGIN_FAILURE' | 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOAD_USER' }
  | { type: 'LOAD_USER_SUCCESS'; payload: User }
  | { type: 'LOAD_USER_FAILURE'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOAD_USER:
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          return {
            ...state,
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          };
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      return {
        ...state,
        isLoading: false,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    setSentryUser(state.user);
  }, [state.user]);

  // Load user data on app start
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Call API to get fresh user data
          const response = await authAPI.getProfile();
          if (response.data.success) {
            localStorage.setItem('token', token);
            dispatch({ 
              type: AUTH_ACTIONS.LOAD_USER_SUCCESS, 
              payload: response.data.data.user 
            });
          } else {
            dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'Failed to load user data' });
          }
        } catch (error: any) {
          console.error('Error loading user data:', error);
          dispatch({ 
            type: AUTH_ACTIONS.LOAD_USER_FAILURE, 
            payload: error.response?.data?.message || 'Failed to load user data' 
          });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER });
      }
    };

    loadUserData();
  }, []);

  // Register function
  const register = async (userData: RegisterData): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('🚀 Frontend: Starting registration...');
      console.log('📦 User data:', { ...userData, password: '***' });
      
      // Show loading toast
      showToast({
        type: 'info',
        title: 'Đang xử lý...',
        message: 'Đang tạo tài khoản và gửi email xác thực',
        duration: 2000
      });
      
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await authAPI.register(userData);
      console.log('✅ Registration successful:', response.data);
      
      // Register success but user needs email verification
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });
      
      // Show success toast
      showToast({
        type: 'success',
        title: 'Đăng ký thành công!',
        message: response.data.message || 'Vui lòng kiểm tra email để xác thực tài khoản',
        duration: 7000
      });
      
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error: any) {
      console.error('❌ Frontend: Registration failed');
      console.error('🔍 Error details:', error);
      console.error('📝 Response data:', error.response?.data);
      console.error('🔢 Status code:', error.response?.status);
      
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.[0]?.msg || 
                     error.message || 
                     'Đăng ký thất bại';
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Đăng ký thất bại!',
        message: message,
        duration: 6000
      });
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: message,
      });
      return { success: false, message };
    }
  };

  // Login function
  const login = async (credentials: LoginData): Promise<{ success: boolean; message?: string }> => {
    try {
      showToast({
        type: 'info',
        title: 'Đang đăng nhập...',
        message: 'Vui lòng chờ giây lát',
        duration: 2000
      });

      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.login(credentials);
      const { token, data } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: data.user, token },
      });

      showToast({
        type: 'success',
        title: 'Đăng nhập thành công!',
        message: `Chào mừng ${data.user.name} trở lại`,
        duration: 3000
      });
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      
      showToast({
        type: 'error',
        title: 'Đăng nhập thất bại!',
        message: message,
        duration: 5000
      });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: message,
      });
      return { success: false, message };
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update profile function
  const updateProfile = async (userData: UpdateProfileData | UpdateProfileFormData): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: updatedUser,
      });
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      return { success: false, message };
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value: AuthContextType = {
    ...state,
    register,
    login,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
