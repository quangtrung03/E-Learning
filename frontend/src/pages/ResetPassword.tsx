import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token đặt lại mật khẩu không hợp lệ');
        setIsVerifyingToken(false);
        return;
      }

      try {
        const response = await api.get(`/auth/verify-reset-token/${token}`);
        
        if (response.data.success) {
          setTokenValid(true);
          setUserInfo(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn');
        setTokenValid(false);
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      
      if (response.data.success) {
        setMessage(response.data.message);
        setIsPasswordReset(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.' 
            }
          });
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Đang xác thực token...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">❌ Token không hợp lệ</h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-center">
              <p className="text-sm text-gray-600">
                Token đặt lại mật khẩu có thể đã hết hạn hoặc đã được sử dụng.
              </p>
              
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  🔄 Yêu cầu đặt lại mật khẩu mới
                </Link>
                
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ← Quay lại trang đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">🔐 Đặt lại mật khẩu</h2>
          {userInfo && (
            <p className="mt-2 text-sm text-gray-600">
              Cho tài khoản: <strong>{userInfo.email}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!isPasswordReset ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  🔒 Mật khẩu mới
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  🔒 Xác nhận mật khẩu mới
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-medium">Độ mạnh mật khẩu:</p>
                  <div className="flex items-center space-x-1">
                    <span className={newPassword.length >= 6 ? 'text-green-600' : 'text-red-600'}>
                      {newPassword.length >= 6 ? '✅' : '❌'} Ít nhất 6 ký tự
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={newPassword === confirmPassword && confirmPassword !== '' ? 'text-green-600' : 'text-red-600'}>
                      {newPassword === confirmPassword && confirmPassword !== '' ? '✅' : '❌'} Mật khẩu khớp
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-400">❌</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang đặt lại...
                    </>
                  ) : (
                    '🔄 Đặt lại mật khẩu'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-green-400 text-2xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Thành công!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{message}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Bạn sẽ được chuyển hướng đến trang đăng nhập sau <strong>3 giây</strong>...
                </p>
              </div>

              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                🚀 Đăng nhập ngay
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2025 E-Learning Platform. Bảo mật và an toàn cho người dùng.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
