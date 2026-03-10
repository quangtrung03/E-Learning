import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, LoadingSpinner } from '../components/ui';

type AuthMode = 'login' | 'register';

type Props = {
  initialMode?: AuthMode;
};

interface RegisterFormData {
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

const AuthFlip = ({ initialMode = 'login' }: Props) => {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Keep in sync if parent renders different initialMode
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const isRegister = mode === 'register';

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    requestAdmin: false
  });

  const [registerErrors, setRegisterErrors] = useState<ValidationErrors>({});
  const [registerLoading, setRegisterLoading] = useState(false);

  const isBusy = useMemo(() => {
    return isLoading || registerLoading;
  }, [isLoading, registerLoading]);

  const validateRegister = (): boolean => {
    const errors: ValidationErrors = {};

    if (!registerForm.name.trim()) {
      errors.name = 'Vui lòng nhập họ tên';
    } else if (registerForm.name.trim().length < 2) {
      errors.name = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!registerForm.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!registerForm.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (registerForm.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!registerForm.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(loginForm);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegister()) return;

    setRegisterLoading(true);
    try {
      const result = await register({
        name: registerForm.name.trim(),
        email: registerForm.email.toLowerCase().trim(),
        password: registerForm.password,
        requestAdmin: registerForm.requestAdmin
      });

      if (result.success) {
        setRegisterForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          requestAdmin: false
        });

        setTimeout(() => {
          navigate('/email-verification');
        }, 1500);
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const setModeSafe = (nextMode: AuthMode) => {
    setMode(nextMode);
    setRegisterErrors({});
    if (error) clearError();
  };

  // The register face is absolutely positioned for the flip animation.
  // Without reserving height, the page height is based on the (shorter) login face,
  // causing the register form to overflow and visually overlap the footer.
  const loginFaceRef = useRef<HTMLDivElement>(null);
  const registerFaceRef = useRef<HTMLDivElement>(null);
  const [flipHeight, setFlipHeight] = useState<number | null>(null);

  const measureFlipHeight = () => {
    const loginH = loginFaceRef.current?.offsetHeight ?? 0;
    const registerH = registerFaceRef.current?.offsetHeight ?? 0;
    const next = Math.max(loginH, registerH);
    setFlipHeight(next > 0 ? next : null);
  };

  useLayoutEffect(() => {
    // Run at least once after mount and after mode changes.
    // Use RAF to ensure the browser has applied layout after transforms.
    requestAnimationFrame(() => measureFlipHeight());
  }, [mode]);

  useEffect(() => {
    measureFlipHeight();

    const onResize = () => measureFlipHeight();
    window.addEventListener('resize', onResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measureFlipHeight());
      if (loginFaceRef.current) ro.observe(loginFaceRef.current);
      if (registerFaceRef.current) ro.observe(registerFaceRef.current);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="w-full flex justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setModeSafe('login')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  !isRegister ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setModeSafe('register')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  isRegister ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Đăng ký
              </button>
            </div>
          </div>

          <div className="relative [perspective:1000px]" style={flipHeight ? { height: flipHeight } : undefined}>
            <div
              className={`relative transition-transform duration-700 [transform-style:preserve-3d] ${
                isRegister ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* Front: Login */}
              <div ref={loginFaceRef} className="[backface-visibility:hidden]">
                <Card>
                  <Card.Body className="space-y-6">
                    <div className="text-center">
                      <Card.Title size="xl">Chào mừng trở lại!</Card.Title>
                      <p className="text-gray-600 mt-2">Đăng nhập để tiếp tục hành trình học tập của bạn</p>
                    </div>

                    {isLoading && (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner size="md" text="Đang đăng nhập..." />
                      </div>
                    )}

                    <form className="space-y-6" onSubmit={submitLogin}>
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {error}
                        </div>
                      )}

                      <Input
                        label="Địa chỉ email"
                        name="email"
                        type="email"
                        required
                        placeholder="tenban@vidu.vn"
                        value={loginForm.email}
                        onChange={(e) => {
                          setLoginForm((prev) => ({ ...prev, email: e.target.value }));
                          if (error) clearError();
                        }}
                        disabled={isBusy}
                      />

                      <Input
                        label="Mật khẩu"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm((prev) => ({ ...prev, password: e.target.value }));
                          if (error) clearError();
                        }}
                        disabled={isBusy}
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                            Ghi nhớ đăng nhập
                          </label>
                        </div>

                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                        >
                          Quên mật khẩu?
                        </Link>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isBusy}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
                      </Button>
                    </form>

                    <div className="text-center text-sm text-gray-600">
                      Chưa có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => setModeSafe('register')}
                        className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                      >
                        Đăng ký ngay
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Back: Register */}
              <div
                ref={registerFaceRef}
                className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]"
              >
                <Card>
                  <Card.Body className="space-y-6">
                    <div className="text-center">
                      <Card.Title size="xl">Tạo tài khoản mới</Card.Title>
                      <p className="text-gray-600 mt-2">Tham gia cộng đồng học tập ELearn</p>
                    </div>

                    {registerLoading && (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner size="md" text="Đang tạo tài khoản..." />
                      </div>
                    )}

                    <form className="space-y-4" onSubmit={submitRegister}>
                      <Input
                        label="Họ và tên"
                        name="name"
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={registerForm.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegisterForm((prev) => ({ ...prev, name: value }));
                          if (registerErrors.name) setRegisterErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        disabled={isBusy}
                        error={registerErrors.name}
                      />

                      <Input
                        label="Địa chỉ email"
                        name="email"
                        type="email"
                        required
                        placeholder="vd: ban@example.com"
                        value={registerForm.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegisterForm((prev) => ({ ...prev, email: value }));
                          if (registerErrors.email) setRegisterErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        disabled={isBusy}
                        error={registerErrors.email}
                      />

                      <Input
                        label="Mật khẩu"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegisterForm((prev) => ({ ...prev, password: value }));
                          if (registerErrors.password) setRegisterErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        disabled={isBusy}
                        error={registerErrors.password}
                      />

                      <Input
                        label="Xác nhận mật khẩu"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegisterForm((prev) => ({ ...prev, confirmPassword: value }));
                          if (registerErrors.confirmPassword) {
                            setRegisterErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                          }
                        }}
                        disabled={isBusy}
                        error={registerErrors.confirmPassword}
                      />

                      <div className="flex items-start space-x-3">
                        <input
                          id="requestAdmin"
                          name="requestAdmin"
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 mt-1"
                          checked={registerForm.requestAdmin}
                          onChange={(e) => setRegisterForm((prev) => ({ ...prev, requestAdmin: e.target.checked }))}
                          disabled={isBusy}
                        />
                        <div className="text-sm">
                          <label htmlFor="requestAdmin" className="text-gray-700 font-medium">
                            Đăng ký làm quản trị viên
                          </label>
                          <p className="text-xs text-primary-600">Yêu cầu quyền quản trị viên (cần được phê duyệt qua email)</p>
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isBusy}>
                        {registerLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Bằng việc đăng ký, bạn đồng ý với{' '}
                        <Link to="/terms" className="text-primary-600 hover:underline">
                          Điều khoản sử dụng
                        </Link>{' '}
                        và{' '}
                        <Link to="/privacy" className="text-primary-600 hover:underline">
                          Chính sách bảo mật
                        </Link>
                      </p>
                    </form>

                    <div className="text-center text-sm text-gray-600">
                      Đã có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => setModeSafe('login')}
                        className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                      >
                        Đăng nhập ngay
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 mt-6">
            Bạn có thể chuyển qua lại giữa Đăng nhập/Đăng ký.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFlip;
