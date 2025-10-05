import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, LoadingSpinner } from '../components/ui';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  requestAdmin: boolean;
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
    confirmPassword: '',
    requestAdmin: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

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

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập họ tên';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        requestAdmin: formData.requestAdmin
      });

      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          requestAdmin: false
        });

        // Redirect to email verification page after 3 seconds
        setTimeout(() => {
          navigate('/email-verification');
        }, 3000);
      }
      // Error handling is now done in AuthContext with toast
    } catch (err: any) {
      console.error('Registration error:', err);
      // Error handling is now done in AuthContext with toast
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <Card.Body className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <Card.Title size="xl">Tạo tài khoản mới</Card.Title>
              <p className="text-gray-600 mt-2">
                Tham gia cộng đồng học tập ELearn
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="md" text="Đang tạo tài khoản..." />
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Name Field */}
              <Input
                label="Họ và tên"
                name="name"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                error={validationErrors.name}
              />

              {/* Email Field */}
              <Input
                label="Địa chỉ email"
                name="email"
                type="email"
                required
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                error={validationErrors.email}
              />

              {/* Password Field */}
              <Input
                label="Mật khẩu"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                error={validationErrors.password}
              />

              {/* Confirm Password Field */}
              <Input
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                error={validationErrors.confirmPassword}
              />

              {/* Admin Request Checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  id="requestAdmin"
                  name="requestAdmin"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                  checked={formData.requestAdmin}
                  onChange={handleChange}
                  disabled={loading}
                />
                <div className="text-sm">
                  <label htmlFor="requestAdmin" className="text-gray-700 font-medium">
                    Đăng ký làm Admin
                  </label>
                  <p className="text-xs text-blue-600">
                    Yêu cầu quyền quản trị viên (cần được phê duyệt qua email)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </Button>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center">
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Chính sách bảo mật
                </Link>
              </p>
            </form>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Đăng nhập ngay
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Register;
