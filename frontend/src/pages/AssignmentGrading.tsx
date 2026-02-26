import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { ArrowLeft, Save, CheckCircle, XCircle, FileText } from 'lucide-react';

interface Answer {
  question: string;
  selectedOptions?: number[];
  textAnswer?: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
  }>;
  isCorrect?: boolean;
  pointsEarned: number;
}

interface Question {
  _id: string;
  type: 'multiple-choice' | 'true-false' | 'essay' | 'fill-blank';
  question: string;
  options?: Array<{
    text: string;
    isCorrect?: boolean;
  }>;
  correctAnswer?: any;
  explanation?: string;
  points: number;
  order: number;
}

interface Assignment {
  _id: string;
  title: string;
  type: string;
  questions: Question[];
  totalPoints: number;
  passingScore: number;
}

interface Submission {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignment: Assignment;
  attemptNumber: number;
  answers: Answer[];
  score: number;
  pointsEarned: number;
  totalPoints: number;
  passed: boolean;
  status: string;
  submittedAt?: string;
  timeSpent: number;
  feedback?: string;
  gradedAt?: string;
}

const AssignmentGrading = () => {
  const { assignmentId, submissionId } = useParams<{ assignmentId: string; submissionId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: ''
  });

  useEffect(() => {
    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      // Note: We need to get submission details from assignment API
      // Since we don't have a direct getSubmission endpoint, we fetch from assignment
      const response = await assignmentAPI.getAssignment(assignmentId!);
      
      if (response.data.success) {
        // In real implementation, we'd have a getSubmission API
        // For now, we'll use the assignment data
        // This is a workaround - in production, add getSubmission API
        const submissionsResponse = await assignmentAPI.getSubmissionsByAssignment(assignmentId!);
        const foundSubmission = submissionsResponse.data.data.submissions.find(
          (s: any) => s._id === submissionId
        );
        
        if (foundSubmission) {
          // Merge with full assignment data
          foundSubmission.assignment = response.data.data.assignment;
          setSubmission(foundSubmission);
          setGradeData({
            score: foundSubmission.score || 0,
            feedback: foundSubmission.feedback || ''
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching submission:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tải bài nộp' 
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async () => {
    if (gradeData.score < 0 || gradeData.score > 100) {
      toast.showToast({ type: 'warning', title: 'Điểm phải từ 0 đến 100' });
      return;
    }

    try {
      setSaving(true);
      
      const response = await assignmentAPI.gradeSubmission(submissionId!, {
        score: gradeData.score,
        feedback: gradeData.feedback
      });

      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã chấm điểm thành công!' });
        navigate(`/assignments/${assignmentId}/submissions`);
      }
    } catch (error: any) {
      console.error('Error grading submission:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể chấm điểm' 
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Không tìm thấy bài nộp</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/assignments/${assignmentId}/submissions`)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chấm điểm bài nộp
        </h1>
        <p className="text-gray-600">{submission.assignment?.title}</p>
      </div>

      {/* Student Info Card */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin học viên</h2>
        <div className="flex items-center gap-4 mb-4">
          {submission.student.avatar ? (
            <img 
              src={submission.student.avatar} 
              alt={submission.student.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
              {submission.student.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900">{submission.student.name}</p>
            <p className="text-sm text-gray-600">{submission.student.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Lần thử</p>
            <p className="text-lg font-semibold text-gray-900">#{submission.attemptNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Thời gian nộp</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(submission.submittedAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Thời gian làm</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTimeSpent(submission.timeSpent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trạng thái</p>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
              submission.status === 'graded'
                ? submission.passed 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {submission.status === 'graded' 
                ? (submission.passed ? 'Đạt' : 'Chưa đạt')
                : 'Chờ chấm'
              }
            </span>
          </div>
        </div>
      </Card>

      {/* Answers Review */}
      {submission.assignment?.questions && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Câu trả lời của học viên</h2>
          
          <div className="space-y-6">
            {submission.assignment.questions.map((question, qIndex) => {
              const answer = submission.answers[qIndex];
              
              return (
                <div key={question._id} className="pb-6 border-b last:border-b-0">
                  {/* Question */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Câu {qIndex + 1}: {question.question}
                    </h3>
                    <span className="text-sm font-semibold text-blue-600">
                      {question.points} điểm
                    </span>
                  </div>
                  
                  {/* Question Type Badge */}
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mb-3">
                    {question.type === 'multiple-choice' && 'Trắc nghiệm'}
                    {question.type === 'true-false' && 'Đúng/Sai'}
                    {question.type === 'essay' && 'Tự luận'}
                    {question.type === 'fill-blank' && 'Điền vào chỗ trống'}
                  </span>

                  {/* Student Answer */}
                  {question.type === 'multiple-choice' && question.options && answer?.selectedOptions && (
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, oIndex) => {
                        const isSelected = answer.selectedOptions?.includes(oIndex);
                        const isCorrect = option.isCorrect;
                        
                        return (
                          <div 
                            key={oIndex}
                            className={`p-3 rounded-lg border-2 ${
                              isSelected && isCorrect
                                ? 'border-green-500 bg-green-50'
                                : isSelected && !isCorrect
                                ? 'border-red-500 bg-red-50'
                                : isCorrect
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )
                              )}
                              <span>{option.text}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'essay' && answer?.textAnswer && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <p className="text-gray-700 whitespace-pre-wrap">{answer.textAnswer}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {answer?.attachments && answer.attachments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">File đính kèm:</p>
                      <div className="space-y-2">
                        {answer.attachments.map((file, fIndex) => (
                          <div key={fIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.originalName}</span>
                                                  </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Points Earned */}
                  {answer && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700">Điểm đạt được:</span>
                      <span className={`font-bold ${
                        answer.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {answer.pointsEarned}/{question.points}
                      </span>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Giải thích:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Grading Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Chấm điểm và nhận xét</h2>
        
        <div className="space-y-6">
          {/* Score Input */}
          <div>
            <label htmlFor="score" className="block text-sm font-semibold text-gray-700 mb-2">
              Điểm tổng (0-100) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="score"
                min="0"
                max="100"
                value={gradeData.score}
                onChange={(e) => setGradeData({ ...gradeData, score: Number(e.target.value) })}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              />
              <span className="text-2xl font-bold text-gray-900">%</span>
              
              <div className={`ml-4 px-4 py-2 rounded-lg font-semibold ${
                gradeData.score >= submission.assignment.passingScore
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {gradeData.score >= submission.assignment.passingScore ? '✓ Đạt' : '✗ Chưa đạt'}
                <span className="text-sm ml-2">
                  (Điểm đạt: {submission.assignment.passingScore}%)
                </span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-semibold text-gray-700 mb-2">
              Nhận xét của giáo viên
            </label>
            <textarea
              id="feedback"
              rows={6}
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              placeholder="Nhập nhận xét, góp ý cho học viên..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Tóm tắt</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Điểm số</p>
                <p className="text-lg font-bold text-gray-900">{gradeData.score}%</p>
              </div>
              <div>
                <p className="text-gray-600">Kết quả</p>
                <p className={`text-lg font-bold ${
                  gradeData.score >= submission.assignment.passingScore
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {gradeData.score >= submission.assignment.passingScore ? 'ĐẠT' : 'CHƯA ĐẠT'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Điểm đạt</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.round((gradeData.score / 100) * submission.totalPoints)}/{submission.totalPoints}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái</p>
                <p className="text-lg font-bold text-blue-600">
                  {submission.status === 'graded' ? 'Đã chấm' : 'Chờ chấm'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => navigate(`/assignments/${assignmentId}/submissions`)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={saving || gradeData.score < 0 || gradeData.score > 100}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu điểm
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Previous Feedback (if regrading) */}
      {submission.status === 'graded' && submission.gradedAt && (
        <Card className="p-6 mt-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Lưu ý</h3>
          <p className="text-sm text-yellow-800">
            Bài nộp này đã được chấm lúc {formatDate(submission.gradedAt)}. 
            Việc chấm lại sẽ cập nhật điểm số và nhận xét mới.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AssignmentGrading;
