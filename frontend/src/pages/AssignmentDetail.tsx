import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface Question {
  _id?: string;
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
  description: string;
  type: 'quiz' | 'essay' | 'project' | 'coding';
  questions: Question[];
  timeLimit?: number;
  maxAttempts: number;
  passingScore: number;
  totalPoints: number;
  isPublished: boolean;
  dueDate?: Date;
  instructions?: string;
}

interface Submission {
  _id: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number;
  score: number;
  passed: boolean;
  status: 'in-progress' | 'submitted' | 'graded';
  answers: Array<{
    question: string;
    selectedOptions: number[];
    textAnswer?: string;
    isCorrect?: boolean;
    pointsEarned: number;
  }>;
}

const AssignmentDetail: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0 && currentSubmission?.status === 'in-progress') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmitAssignment();
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, currentSubmission]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assignments/${assignmentId}`);
      
      if (response.data.success) {
        setAssignment(response.data.data.assignment);
        setSubmissions(response.data.data.submissions || []);
        
        // Initialize answers array (defensive: questions may be missing)
        const questions = response.data.data.assignment?.questions ?? [];
        const initialAnswers = (Array.isArray(questions) ? questions : []).map(() => ({
          selectedOptions: [],
          textAnswer: ''
        }));
        setAnswers(initialAnswers);
        
        // Check for in-progress submission
        const inProgress = response.data.data.submissions?.find(
          (sub: Submission) => sub.status === 'in-progress'
        );
        
        if (inProgress) {
          setCurrentSubmission(inProgress);
          if (response.data.data.assignment.timeLimit) {
            const elapsed = Math.floor((new Date().getTime() - new Date(inProgress.startedAt).getTime()) / 1000);
            const remaining = (response.data.data.assignment.timeLimit * 60) - elapsed;
            setTimeRemaining(Math.max(0, remaining));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssignment = async () => {
    try {
      setSubmitting(true);
      const response = await api.post(`/assignments/${assignmentId}/submit`);
      
      if (response.data.success) {
        const newSubmission = response.data.data.submission;
        setCurrentSubmission(newSubmission);
        setSubmissions(prev => [...prev, newSubmission]);
        
        if (assignment?.timeLimit) {
          setTimeRemaining(assignment.timeLimit * 60);
        }
      }
    } catch (error: any) {
      console.error('Error starting assignment:', error);
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu làm bài' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, value: any, type: 'select' | 'text') => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      if (type === 'select') {
        newAnswers[questionIndex] = {
          ...newAnswers[questionIndex],
          selectedOptions: [value]
        };
      } else {
        newAnswers[questionIndex] = {
          ...newAnswers[questionIndex],
          textAnswer: value
        };
      }
      return newAnswers;
    });
  };

  const handleSubmitAssignment = async () => {
    if (!currentSubmission) return;
    
    try {
      setSubmitting(true);
      
      // Update submission with answers (defensive: assignment.questions may be missing)
      const questionIds = (assignment?.questions && Array.isArray(assignment.questions)) ? assignment.questions.map(q => q._id) : [];
      const updatedSubmission = {
        ...currentSubmission,
        answers: answers.map((answer, index) => ({
          question: questionIds[index] || null,
          selectedOptions: answer.selectedOptions,
          textAnswer: answer.textAnswer
        }))
      };
      
      const response = await api.put(`/assignments/submissions/${currentSubmission._id}/complete`, {
        answers: updatedSubmission.answers
      });
      
      if (response.data.success) {
        const completedSubmission = response.data.data.submission;
        setCurrentSubmission(null);
        setSubmissions(prev => 
          prev.map(sub => 
            sub._id === completedSubmission._id ? completedSubmission : sub
          )
        );
        setShowResults(true);
        setTimeRemaining(null);
      }
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const canAttempt = () => {
    if (!assignment || !submissions) return false;
    return submissions.length < assignment.maxAttempts;
  };

  const getLatestSubmission = () => {
    return submissions.sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bài tập</h2>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  if (showResults) {
    const latestSubmission = getLatestSubmission();
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            {latestSubmission.passed ? (
              <div className="text-green-600">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-2">Chúc mừng!</h2>
                <p className="text-lg">Bạn đã hoàn thành bài tập thành công</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-3xl font-bold mb-2">Cần cải thiện</h2>
                <p className="text-lg">Bạn cần đạt ít nhất {assignment.passingScore}% để đỗ</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{latestSubmission.score}%</div>
              <div className="text-gray-600">Điểm số</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {latestSubmission.score || 0}/{assignment.totalPoints}
              </div>
              <div className="text-gray-600">Điểm thô</div>
            </div>
          </div>
          
          <div className="space-y-4">
            {canAttempt() && !latestSubmission.passed && (
              <Button onClick={() => setShowResults(false)}>
                Làm lại ({submissions.length}/{assignment.maxAttempts})
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>
              Quay lại khóa học
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSubmission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          {timeRemaining !== null && (
            <div className={`text-2xl font-mono px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              ⏰ {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        <Card className="p-6 mb-6">
          <div className="mb-6">
            <p className="text-gray-700">{assignment.description}</p>
            {assignment.instructions && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Hướng dẫn:</h3>
                <p className="text-blue-700">{assignment.instructions}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {(Array.isArray(assignment.questions) ? assignment.questions : []).map((question, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">
                    Câu {index + 1}: {question.question}
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {question.points} điểm
                  </span>
                </div>

                {question.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={optionIndex}
                          checked={answers[index]?.selectedOptions[0] === optionIndex}
                          onChange={(e) => handleAnswerChange(index, parseInt(e.target.value), 'select')}
                          className="form-radio text-blue-600"
                        />
                        <span className="text-gray-700">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={1}
                        checked={answers[index]?.selectedOptions[0] === 1}
                        onChange={(e) => handleAnswerChange(index, parseInt(e.target.value), 'select')}
                        className="form-radio text-blue-600"
                      />
                      <span className="text-gray-700">Đúng</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={0}
                        checked={answers[index]?.selectedOptions[0] === 0}
                        onChange={(e) => handleAnswerChange(index, parseInt(e.target.value), 'select')}
                        className="form-radio text-blue-600"
                      />
                      <span className="text-gray-700">Sai</span>
                    </label>
                  </div>
                )}

                {question.type === 'essay' && (
                  <textarea
                    value={answers[index]?.textAnswer || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value, 'text')}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentSubmission(null)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmitAssignment}
              disabled={submitting}
            >
              {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{assignment.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
          </span>
          <span>📊 {assignment.totalPoints} điểm</span>
          <span>✅ Cần {assignment.passingScore}% để đỗ</span>
          <span>🔄 Tối đa {assignment.maxAttempts} lần làm</span>
          {assignment.timeLimit && (
            <span>⏰ {assignment.timeLimit} phút</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin bài tập</h2>
          <div className="space-y-4">
            <p className="text-gray-700">{assignment.description}</p>
            
            {assignment.instructions && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Hướng dẫn:</h3>
                <p className="text-blue-700 text-sm">{assignment.instructions}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Chi tiết:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Số câu hỏi: {assignment.questions.length}</li>
                <li>• Tổng điểm: {assignment.totalPoints}</li>
                <li>• Điểm đỗ: {assignment.passingScore}%</li>
                <li>• Số lần làm tối đa: {assignment.maxAttempts}</li>
                {assignment.timeLimit && <li>• Thời gian: {assignment.timeLimit} phút</li>}
                {assignment.dueDate && (
                  <li>• Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lịch sử làm bài</h2>
          
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Bạn chưa làm bài tập này</p>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(submissions) ? submissions : []).map((submission) => (
                <div 
                  key={submission._id} 
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Lần {submission.attemptNumber}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      submission.passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.score}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Thời gian: {Math.round(submission.timeSpent / 60)} phút</p>
                    <p>Ngày làm: {new Date(submission.submittedAt || submission.startedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            {canAttempt() ? (
              <Button 
                onClick={handleStartAssignment}
                disabled={submitting}
                className="w-full"
              >
                {submissions.length === 0 ? 'Bắt đầu làm bài' : `Làm lại (${submissions.length}/${assignment.maxAttempts})`}
              </Button>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Bạn đã hết lượt làm bài</p>
                {getLatestSubmission()?.passed && (
                  <span className="text-green-600 font-medium">✅ Đã đỗ</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AssignmentDetail;
