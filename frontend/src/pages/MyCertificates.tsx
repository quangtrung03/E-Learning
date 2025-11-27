import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import api from '../services/api';

interface Certificate {
  _id: string;
  certificateId: string;
  certificateName: string;
  completionDate: Date;
  issueDate: Date;
  expiryDate?: Date;
  score: number;
  grade: string;
  certificateUrl: string;
  verified: boolean;
  course: {
    _id: string;
    title: string;
    category: string;
    level: string;
    thumbnail?: string;
  };
  courseDuration: number;
  skills: string[];
  status: 'active' | 'revoked' | 'expired';
  sharedCount: number;
}

const MyCertificates: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/certificates/my-certificates');
      
      if (response.data.success) {
        setCertificates(response.data.data.certificates);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    // In a real implementation, this would generate and download a PDF
    window.open(`/certificates/${certificate.certificateId}?download=true`, '_blank');
  };

  const handleShareCertificate = async (certificate: Certificate) => {
    const shareUrl = `${window.location.origin}/certificates/${certificate.certificateId}?public=true`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: certificate.certificateName,
          text: `Tôi vừa hoàn thành khóa học "${certificate.course.title}" và nhận được chứng chỉ!`,
          url: shareUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.showToast({ type: 'success', title: 'Đã copy link chia sẻ vào clipboard!' });
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  const handleVerifyCertificate = async (certificate: Certificate) => {
    window.open(`/certificates/verify/${certificate.certificateId}`, '_blank');
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100';
      case 'D':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'revoked':
        return 'text-red-600 bg-red-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa có chứng chỉ nào</h2>
          <p className="text-gray-600 mb-6">
            Hoàn thành các khóa học để nhận chứng chỉ xác nhận năng lực của bạn
          </p>
          <Button onClick={() => window.location.href = '/courses'}>Khám phá khóa học</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chứng chỉ của tôi</h1>
        <p className="text-gray-600">
          Quản lý và chia sẻ các chứng chỉ bạn đã đạt được từ các khóa học
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(Array.isArray(certificates) ? certificates : []).map((certificate) => (
          <Card key={certificate._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Certificate Preview */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(certificate.status)}`}>
                  {certificate.status === 'active' ? 'Có hiệu lực' : 
                   certificate.status === 'revoked' ? 'Đã thu hồi' : 'Hết hạn'}
                </span>
              </div>
              
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">CHỨNG CHỈ HOÀN THÀNH</h3>
                  <p className="text-sm opacity-90">{certificate.course.title}</p>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-75">Điểm số</p>
                    <p className="text-2xl font-bold">{certificate.score}%</p>
                  </div>
                  <div className={`px-3 py-1 rounded ${getGradeColor(certificate.grade)}`}>
                    <span className="font-bold">{certificate.grade}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Info */}
            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">ID Chứng chỉ</p>
                  <p className="font-mono text-sm">{certificate.certificateId}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Ngày hoàn thành</p>
                  <p className="text-sm">{new Date(certificate.completionDate).toLocaleDateString('vi-VN')}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Thời lượng khóa học</p>
                  <p className="text-sm">{certificate.courseDuration} giờ</p>
                </div>

                {(() => {
                  const skills = Array.isArray(certificate.skills) ? certificate.skills : [];
                  if (skills.length === 0) return null;
                  return (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Kỹ năng đạt được</p>
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDownloadCertificate(certificate)}
                  disabled={certificate.status !== 'active'}
                >
                  📄 Tải xuống PDF
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleShareCertificate(certificate)}
                    disabled={certificate.status !== 'active'}
                  >
                    🔗 Chia sẻ
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedCertificate(certificate);
                      setShowPreview(true);
                    }}
                  >
                    👁️ Xem
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleVerifyCertificate(certificate)}
                  >
                    ✅ Xác thực
                  </Button>
                </div>
              </div>

              {/* Share Stats */}
              {certificate.sharedCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Đã được chia sẻ {certificate.sharedCount} lần
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Xem trước chứng chỉ</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  ✕ Đóng
                </Button>
              </div>

              {/* Certificate Design */}
              <div className="border-8 border-blue-600 p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-blue-800 mb-4">CHỨNG CHỈ HOÀN THÀNH</h1>
                  <p className="text-lg text-gray-600">được trao cho</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{user?.name}</h2>
                  <p className="text-lg text-gray-700 mb-4">
                    đã hoàn thành xuất sắc khóa học
                  </p>
                  <h3 className="text-2xl font-bold text-blue-700 mb-6">
                    {selectedCertificate.course.title}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-8">
                  <div>
                    <p className="text-sm text-gray-500">Điểm số</p>
                    <p className="text-2xl font-bold text-green-600">{selectedCertificate.score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Xếp loại</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedCertificate.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Thời lượng</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedCertificate.courseDuration}h</p>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-6">
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-sm text-gray-500">Ngày hoàn thành</p>
                      <p className="font-semibold">
                        {new Date(selectedCertificate.completionDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Mã chứng chỉ</p>
                      <p className="font-mono font-semibold">{selectedCertificate.certificateId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Xác thực tại</p>
                      <p className="font-semibold">elearning.com/verify</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
