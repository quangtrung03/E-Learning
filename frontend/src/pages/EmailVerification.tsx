import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import OTPInput from '../components/OTPInput';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useTokenMode, setUseTokenMode] = useState(false);

  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    if (tokenFromUrl) {
      // Auto verify if token in URL
      verifyEmailToken(tokenFromUrl);
    } else {
      // Show manual input form
      setStatus('manual');
    }
  }, [tokenFromUrl]);

  const verifyEmailToken = async (verificationToken: string) => {
    try {
      setIsVerifying(true);
      
      showToast({
        type: 'info',
        title: 'Đang xác thực...',
        message: 'Vui lòng chờ giây lát',
        duration: 2000
      });

      const response = await authAPI.verifyEmail({ token: verificationToken });
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        
        showToast({
          type: 'success',
          title: 'Xác thực thành công!',
          message: 'Tài khoản của bạn đã được kích hoạt',
          duration: 5000
        });
        
        // Save token to localStorage and redirect to dashboard after 3 seconds
        if (response.data.data.token) {
          localStorage.setItem('token', response.data.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Xác thực không thành công');
        
        showToast({
          type: 'error',
          title: 'Xác thực thất bại!',
          message: response.data.message || 'Token không hợp lệ hoặc đã hết hạn',
          duration: 6000
        });
      }
    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xác thực email. Vui lòng thử lại.';
      setMessage(errorMessage);
      
      showToast({
        type: 'error',
        title: 'Lỗi xác thực!',
        message: errorMessage,
        duration: 6000
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useTokenMode) {
      // Token mode - verify with long token
      if (!token.trim()) {
        setMessage('Vui lòng nhập token xác thực');
        return;
      }
      await verifyEmailToken(token.trim());
    } else {
      // OTP mode - verify with email + OTP
      if (!email.trim()) {
        setMessage('Vui lòng nhập địa chỉ email');
        return;
      }
      if (otp.length !== 6) {
        setMessage('Vui lòng nhập đầy đủ 6 chữ số OTP');
        return;
      }
      
      try {
        setIsVerifying(true);
        
        showToast({
          type: 'info',
          title: 'Đang xác thực...',
          message: 'Vui lòng chờ giây lát',
          duration: 2000
        });

        const response = await authAPI.verifyEmail({ email: email.trim(), otp });
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
          
          showToast({
            type: 'success',
            title: 'Xác thực thành công!',
            message: 'Tài khoản của bạn đã được kích hoạt',
            duration: 5000
          });
          
          // Save token to localStorage and redirect to dashboard after 3 seconds
          if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Xác thực không thành công');
          
          showToast({
            type: 'error',
            title: 'Xác thực thất bại!',
            message: response.data.message || 'OTP không hợp lệ hoặc đã hết hạn',
            duration: 6000
          });
        }
      } catch (error: any) {
        setStatus('error');
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xác thực email. Vui lòng thử lại.';
        setMessage(errorMessage);
        
        showToast({
          type: 'error',
          title: 'Lỗi xác thực!',
          message: errorMessage,
          duration: 6000
        });
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleResendEmail = async () => {
    const email = prompt('Vui lòng nhập email của bạn để gửi lại email xác thực:');
    if (!email) return;

    try {
      setIsVerifying(true);
      
      showToast({
        type: 'info',
        title: 'Đang gửi email...',
        message: 'Vui lòng chờ giây lát',
        duration: 2000
      });

      const response = await authAPI.resendVerification({ email });
      
      if (response.data.success) {
        showToast({
          type: 'success',
          title: 'Gửi email thành công!',
          message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.',
          duration: 6000
        });
      } else {
        showToast({
          type: 'error',
          title: 'Gửi email thất bại!',
          message: response.data.message || 'Không thể gửi lại email xác thực',
          duration: 5000
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Lỗi gửi email!',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email xác thực',
        duration: 6000
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-white">
                {status === 'loading' && (
                  <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {status === 'success' && (
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {status === 'error' && (
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {status === 'manual' && (
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <h1 className="mt-4 text-2xl font-bold text-white">
                {status === 'loading' && 'Đang xác thực email...'}
                {status === 'success' && 'Xác thực thành công!'}
                {status === 'error' && 'Xác thực thất bại'}
                {status === 'manual' && 'Xác thực Email'}
              </h1>
              <p className="mt-2 text-blue-100">
                {status === 'loading' && 'Vui lòng chờ trong giây lát'}
                {status === 'success' && 'Chào mừng bạn đến với Nền tảng Học trực tuyến'}
                {status === 'error' && 'Có vấn đề với quá trình xác thực'}
                {status === 'manual' && 'Nhập token xác thực từ email'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {status === 'loading' && (
              <div className="text-center">
                <p className="text-gray-600">Đang xác thực email của bạn...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">{message}</p>
                </div>
                <p className="text-gray-600">
                  Bạn sẽ được chuyển hướng đến trang dashboard trong 3 giây...
                </p>
                <div className="pt-4">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Đi đến Bảng điều khiển ngay
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{message}</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={isVerifying}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isVerifying ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                  </button>
                  
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            )}

            {status === 'manual' && (
              <form onSubmit={handleManualVerify} className="space-y-4">
                {/* Toggle between OTP and Token modes */}
                <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUseTokenMode(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !useTokenMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    🔢 Nhập mã OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseTokenMode(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      useTokenMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    🔗 Nhập token
                  </button>
                </div>

                {!useTokenMode ? (
                  /* OTP Mode */
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        📧 Địa chỉ email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email đã đăng ký..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                        🔢 Nhập mã OTP (6 chữ số)
                      </label>
                      <OTPInput
                        value={otp}
                        onChange={setOtp}
                        autoFocus
                        error={!!message && status === 'manual'}
                      />
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Kiểm tra email của bạn và nhập mã OTP 6 chữ số (Hết hạn sau 10 phút)
                      </p>
                    </div>
                  </>
                ) : (
                  /* Token Mode */
                  <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                      🔗 Token xác thực
                    </label>
                    <input
                      type="text"
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Nhập token từ email..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Kiểm tra email của bạn và copy token xác thực vào đây
                    </p>
                  </div>
                )}

                {message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isVerifying || 
                    (!useTokenMode && (otp.length !== 6 || !email.trim())) ||
                    (useTokenMode && !token.trim())
                  }
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isVerifying ? 'Đang xác thực...' : '✅ Xác thực Email'}
                </button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    className="text-blue-600 hover:text-blue-500 text-sm"
                  >
                    Chưa nhận được email? Gửi lại
                  </button>
                  
                  <div>
                    <Link to="/login" className="text-gray-600 hover:text-gray-500 text-sm">
                      Quay lại đăng nhập
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
