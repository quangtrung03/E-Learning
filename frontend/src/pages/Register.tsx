import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.name)) {
      errors.name = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Vui lòng nhập email hợp lệ';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📋 Form submitted with data:', { ...formData, password: '***', confirmPassword: '***' });
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('❌ Form validation failed:', errors);
      setValidationErrors(errors);
      return;
    }
    
    console.log('✅ Form validation passed');
    setValidationErrors({});
    setError('');
    setLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = formData;
      console.log('📤 Sending registration data:', { ...registerData, password: '***' });
      
      const result = await register(registerData);
      console.log('📊 Registration result:', result);
      
      if (result.success) {
        console.log('🎉 Registration successful, showing email verification message');
        setRegistrationSuccess(true);
        setSuccessMessage(result.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
      } else {
        console.log('❌ Registration failed:', result.message);
        setError(result.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('💥 Unexpected error in form submission:', error);
      setError('Đã xảy ra lỗi không mong muốn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white font-bold text-3xl">E</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Tham gia E-Learning
          </h2>
          <p className="text-gray-600">
            Khám phá, học hỏi và chia sẻ kiến thức cùng cộng đồng
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {registrationSuccess ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{successMessage}</p>
                    <div className="mt-3 space-y-2">
                      <Link 
                        to="/verify-email" 
                        className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-600"
                      >
                        Xác thực email ngay →
                      </Link>
                      <p className="text-xs text-green-600">
                        Kiểm tra hộp thư (kể cả thư mục spam) để nhận email xác thực
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nhập họ và tên của bạn"
              />
              {validationErrors.name && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.122-2.122m0 0L16.242 7.758M12 12l-2.122 2.122m2.122-2.122L16.242 16.242"} />
                  </svg>
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nhập lại mật khẩu"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tạo tài khoản...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Tạo tài khoản
                </>
              )}
            </button>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Register;
