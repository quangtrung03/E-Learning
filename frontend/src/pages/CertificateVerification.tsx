import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CheckCircle, XCircle, AlertCircle, Award, Calendar, User, BookOpen, ExternalLink } from 'lucide-react';

interface Certificate {
  _id: string;
  certificateId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
    instructor: {
      name: string;
    };
  };
  issuedAt: string;
  status: 'active' | 'revoked';
  verificationUrl: string;
}

const CertificateVerification = () => {
  const { hash } = useParams<{ hash: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'revoked' | null>(null);

  useEffect(() => {
    if (hash) {
      verifyCertificate();
    }
  }, [hash]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await certificateAPI.verifyCertificate(hash!);
      
      if (response.data.success) {
        setCertificate(response.data.data.certificate);
        
        if (response.data.data.certificate.status === 'revoked') {
          setVerificationStatus('revoked');
        } else {
          setVerificationStatus('valid');
        }
      } else {
        setVerificationStatus('invalid');
        setError(response.data.message || 'Chứng chỉ không hợp lệ');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerificationStatus('invalid');
      setError(err.response?.data?.message || 'Không thể xác minh chứng chỉ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 'valid':
        return {
          icon: CheckCircle,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-600',
          title: 'Chứng chỉ hợp lệ',
          message: 'Chứng chỉ này đã được xác thực và hợp lệ'
        };
      case 'revoked':
        return {
          icon: XCircle,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-600',
          title: 'Chứng chỉ đã bị thu hồi',
          message: 'Chứng chỉ này đã bị thu hồi và không còn hiệu lực'
        };
      case 'invalid':
        return {
          icon: AlertCircle,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-600',
          title: 'Không tìm thấy chứng chỉ',
          message: error || 'Không thể xác minh chứng chỉ này'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Đang xác minh chứng chỉ...</h3>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Award className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xác Minh Chứng Chỉ
          </h1>
          <p className="text-gray-600">
            Kiểm tra tính xác thực của chứng chỉ học tập
          </p>
        </div>

        {/* Status Card */}
        {statusConfig && (
          <Card className={`p-8 mb-6 border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 ${statusConfig.bgColor} rounded-full flex items-center justify-center`}>
                <statusConfig.icon className={`w-8 h-8 ${statusConfig.iconColor}`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${statusConfig.textColor} mb-2`}>
                  {statusConfig.title}
                </h2>
                <p className={`${statusConfig.textColor} text-lg`}>
                  {statusConfig.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Certificate Details */}
        {certificate && verificationStatus === 'valid' && (
          <Card className="p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              Thông tin chứng chỉ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certificate ID */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mã chứng chỉ</p>
                  <p className="font-mono font-semibold text-gray-900 break-all">
                    {certificate.certificateId}
                  </p>
                </div>
              </div>

              {/* Student Name */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Học viên</p>
                  <p className="font-semibold text-gray-900">{certificate.user.name}</p>
                  <p className="text-sm text-gray-600">{certificate.user.email}</p>
                </div>
              </div>

              {/* Course */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Khóa học</p>
                  <p className="font-semibold text-gray-900">{certificate.course.title}</p>
                  <p className="text-sm text-gray-600">
                    Giảng viên: {certificate.course.instructor.name}
                  </p>
                </div>
              </div>

              {/* Issue Date */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngày cấp</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(certificate.issuedAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <Link to={`/courses/${certificate.course._id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Xem khóa học
                </Button>
              </Link>
              <a 
                href={certificate.verificationUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Chia sẻ link xác minh
                </Button>
              </a>
            </div>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="p-6 bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Lưu ý bảo mật
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Chứng chỉ này được bảo vệ bằng mã hóa và không thể giả mạo</li>
                <li>• Bạn có thể xác minh chứng chỉ bất kỳ lúc nào thông qua link này</li>
                <li>• Nếu chứng chỉ bị thu hồi, trạng thái sẽ hiển thị ngay lập tức</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link to="/">
            <Button variant="outline">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;
