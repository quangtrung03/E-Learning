import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface FormData {
  fullName: string;
  citizenId: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  occupation: string;
  experience: string;
  reason: string;
}

interface ValidationRequest {
  requestId: string;
  user: {
    name: string;
    email: string;
  };
  email: string;
}

const AdminRequestForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationData, setValidationData] = useState<ValidationRequest | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    citizenId: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    occupation: '',
    experience: '',
    reason: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/auth/admin/validate/${token}`);
      setValidationData(response.data.data);
      setLoading(false);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: error.response?.data?.message || 'Token không hợp lệ'
      });
      navigate('/');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Họ tên không được quá 100 ký tự';
    }

    if (!formData.citizenId.trim()) {
      newErrors.citizenId = 'Số CCCD là bắt buộc';
    } else if (!/^[0-9]{9,12}$/.test(formData.citizenId)) {
      newErrors.citizenId = 'Số CCCD phải có 9-12 số';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'Bạn phải từ 18 tuổi trở lên';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 10-11 số';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    } else if (formData.address.length > 200) {
      newErrors.address = 'Địa chỉ không được quá 200 ký tự';
    }

    if (formData.occupation && formData.occupation.length > 100) {
      newErrors.occupation = 'Nghề nghiệp không được quá 100 ký tự';
    }

    if (formData.experience && formData.experience.length > 1000) {
      newErrors.experience = 'Kinh nghiệm không được quá 1000 ký tự';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Lý do muốn làm admin là bắt buộc';
    } else if (formData.reason.length > 500) {
      newErrors.reason = 'Lý do không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error khi user bắt đầu nhập
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Vui lòng kiểm tra lại thông tin'
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await api.post('/auth/admin/submit-request', {
        token,
        ...formData
      });
      
      showToast({
        type: 'success',
        title: 'Đã gửi yêu cầu thành công! Chúng tôi sẽ xem xét và phản hồi sớm nhất.'
      });
      navigate('/dashboard');
    } catch (error: any) {
      showToast({
        type: 'error',
        title: error.response?.data?.message || 'Có lỗi xảy ra'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Yêu cầu trở thành Admin
          </h1>
          <p className="mt-2 text-gray-600">
            Vui lòng điền đầy đủ thông tin để hoàn tất yêu cầu
          </p>
          {validationData && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Email:</strong> {validationData.email}
              </p>
              <p className="text-blue-800">
                <strong>Tên:</strong> {validationData.user.name}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin cá nhân */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Thông tin cá nhân
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ tên đầy đủ */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên đầy đủ *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Số CCCD */}
                <div>
                  <label htmlFor="citizenId" className="block text-sm font-medium text-gray-700 mb-1">
                    Số CCCD *
                  </label>
                  <input
                    type="text"
                    id="citizenId"
                    name="citizenId"
                    value={formData.citizenId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.citizenId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123456789012"
                  />
                  {errors.citizenId && (
                    <p className="mt-1 text-sm text-red-600">{errors.citizenId}</p>
                  )}
                </div>

                {/* Ngày sinh */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0901234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="mt-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Thông tin nghề nghiệp */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Thông tin nghề nghiệp
              </h2>
              
              {/* Nghề nghiệp */}
              <div className="mb-6">
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Nghề nghiệp
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.occupation ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Kỹ sư phần mềm, Giáo viên, ..."
                />
                {errors.occupation && (
                  <p className="mt-1 text-sm text-red-600">{errors.occupation}</p>
                )}
              </div>

              {/* Kinh nghiệm */}
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Kinh nghiệm và kỹ năng
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.experience ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mô tả kinh nghiệm làm việc, kỹ năng liên quan đến giáo dục, quản lý..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.experience.length}/1000 ký tự
                </p>
                {errors.experience && (
                  <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
                )}
              </div>
            </div>

            {/* Lý do muốn làm admin */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Lý do muốn trở thành Admin
              </h2>
              
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Tại sao bạn muốn trở thành Admin? *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Vui lòng chia sẻ động lực và mục tiêu của bạn khi trở thành admin..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.reason.length}/500 ký tự
                </p>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                )}
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestForm;