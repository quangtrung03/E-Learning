import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setMessage(response.data.message);
        setIsEmailSent(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi email đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">🔐 Quên mật khẩu</h2>
          <p className="mt-2 text-sm text-gray-600">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!isEmailSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  📧 Địa chỉ email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nhập email của bạn"
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang gửi...
                    </>
                  ) : (
                    '📤 Gửi link đặt lại mật khẩu'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  ← Quay lại trang đăng nhập
                </Link>
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
                    <h3 className="text-sm font-medium text-green-800">Email đã được gửi!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{message}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Hướng dẫn tiếp theo:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Kiểm tra hộp thư email <strong>{email}</strong></li>
                  <li>Tìm email từ "E-Learning Platform"</li>
                  <li>Click vào nút "Đặt lại mật khẩu" trong email</li>
                  <li>Nhập mật khẩu mới và xác nhận</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  💡 <strong>Lưu ý:</strong> Link đặt lại mật khẩu có hiệu lực trong 1 giờ
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  📧 Gửi lại email
                </button>
                
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ← Quay lại trang đăng nhập
                </Link>
              </div>
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

export default ForgotPassword;
