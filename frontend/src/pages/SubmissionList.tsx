import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { 
  ArrowLeft, 
  FileText
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Submission {
  _id: string;
  student: Student;
  attemptNumber: number;
  score: number;
  pointsEarned: number;
  totalPoints: number;
  passed: boolean;
  status: 'in-progress' | 'submitted' | 'graded';
  submittedAt?: string;
  gradedAt?: string;
  timeSpent: number;
  feedback?: string;
}

interface Assignment {
  _id: string;
  title: string;
  type: string;
  totalPoints: number;
  passingScore: number;
}

interface Stats {
  total: number;
  submitted: number;
  graded: number;
  passed: number;
  averageScore: number;
}

const SubmissionList = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date');

  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await assignmentAPI.getSubmissionsByAssignment(assignmentId!, params);
      
      if (response.data.success) {
        setAssignment(response.data.data.assignment);
        setSubmissions(response.data.data.submissions || []);
        setStats(response.data.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tải danh sách bài nộp' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submissionId: string) => {
    navigate(`/assignments/${assignmentId}/submissions/${submissionId}/grade`);
  };

  const getStatusBadge = (submission: Submission) => {
    if (submission.status === 'graded') {
      return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          submission.passed 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {submission.passed ? '✓ Đạt' : '✗ Chưa đạt'} ({submission.score}%)
        </span>
      );
    } else if (submission.status === 'submitted') {
      return (
        <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
          ⏳ Chờ chấm
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
          📝 Đang làm
        </span>
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa nộp';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.student.name.localeCompare(b.student.name);
      case 'score':
        return b.score - a.score;
      case 'date':
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Danh sách bài nộp
        </h1>
        {assignment && (
          <div className="flex items-center gap-4 text-gray-600">
            <p className="text-lg">{assignment.title}</p>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {assignment.type}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Tổng học viên</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-sm text-gray-600 mt-1">Đã nộp</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.graded}</div>
            <div className="text-sm text-gray-600 mt-1">Đã chấm</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-gray-600 mt-1">Đạt yêu cầu</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.averageScore}%</div>
            <div className="text-sm text-gray-600 mt-1">Điểm TB</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="in-progress">Đang làm</option>
          <option value="submitted">Chờ chấm</option>
          <option value="graded">Đã chấm</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'date')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="date">Sắp xếp: Ngày nộp</option>
          <option value="name">Sắp xếp: Tên</option>
          <option value="score">Sắp xếp: Điểm</option>
        </select>
      </div>

      {/* Submissions Table */}
      {sortedSubmissions.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có bài nộp nào
          </h3>
          <p className="text-gray-500">
            Học viên chưa nộp bài hoặc chưa có học viên tham gia
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian làm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần thử
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSubmissions.map(submission => (
                  <tr key={submission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {submission.student.avatar ? (
                          <img 
                            src={submission.student.avatar} 
                            alt={submission.student.name}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3">
                            {submission.student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.status === 'graded' ? (
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {submission.score}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.pointsEarned}/{submission.totalPoints} điểm
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeSpent(submission.timeSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Lần {submission.attemptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {submission.status === 'submitted' || submission.status === 'graded' ? (
                        <Button
                          variant={submission.status === 'submitted' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleGradeSubmission(submission._id)}
                        >
                          {submission.status === 'submitted' ? 'Chấm điểm' : 'Xem chi tiết'}
                        </Button>
                      ) : (
                        <span className="text-gray-400">Đang làm...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SubmissionList;
