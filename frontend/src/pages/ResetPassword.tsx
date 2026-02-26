import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import OTPInput from '../components/OTPInput';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(!!token);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [useTokenMode, setUseTokenMode] = useState(!!token);

  // Verify token on component mount (only if token exists)
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifyingToken(false);
        setTokenValid(false);
        setUseTokenMode(false); // Switch to OTP mode if no token
        return;
      }

      try {
        const response = await api.get(`/auth/verify-reset-token/${token}`);
        
        if (response.data.success) {
          setTokenValid(true);
          setUserInfo(response.data.data);
          setUseTokenMode(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn');
        setTokenValid(false);
        setUseTokenMode(false); // Allow OTP mode as fallback
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
      let response;
      
      if (useTokenMode && token) {
        // Token mode - reset with token
        response = await api.post('/auth/reset-password', {
          token,
          newPassword
        });
      } else {
        // OTP mode - reset with email + OTP
        if (!email.trim()) {
          setError('Vui lòng nhập địa chỉ email');
          setIsLoading(false);
          return;
        }
        if (otp.length !== 6) {
          setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
          setIsLoading(false);
          return;
        }
        
        response = await api.post('/auth/reset-password', {
          email: email.trim(),
          otp,
          newPassword
        });
      }
      
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

  // Invalid token state - but allow OTP mode
  if (!tokenValid && !isVerifyingToken && token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">⚠️ Token không hợp lệ</h2>
            <p className="mt-2 text-sm text-gray-600">
              Nhưng bạn vẫn có thể đặt lại mật khẩu bằng mã OTP
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Thông báo</h3>
                  <div className="mt-2 text-sm text-yellow-700">
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
                <button
                  onClick={() => {
                    setTokenValid(false);
                    setUseTokenMode(false);
                    setError('');
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔢 Thử đặt lại bằng mã OTP
                </button>
                
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  🔄 Yêu cầu mã mới
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
              {/* Show mode toggle only if not using token from URL */}
              {!token && (
                <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUseTokenMode(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !useTokenMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    🔢 Dùng mã OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseTokenMode(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      useTokenMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    🔗 Dùng token
                  </button>
                </div>
              )}

              {/* Email + OTP inputs for OTP mode */}
              {!useTokenMode && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      📧 Địa chỉ email
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Nhập email đã đăng ký"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      🔢 Nhập mã OTP (6 chữ số)
                    </label>
                    <OTPInput
                      value={otp}
                      onChange={setOtp}
                      autoFocus
                      error={!!error}
                      disabled={isLoading}
                    />
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Kiểm tra email của bạn và nhập mã OTP 6 chữ số (Hết hạn sau 10 phút)
                    </p>
                  </div>
                </>
              )}

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
                  disabled={
                    isLoading || 
                    !newPassword || 
                    !confirmPassword ||
                    (!useTokenMode && (otp.length !== 6 || !email.trim()))
                  }
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

              {!token && (
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Chưa có mã? Yêu cầu gửi lại →
                  </Link>
                </div>
              )}
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
