import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyGroupAPI, courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Users, BookOpen, Lock, Calendar, Tag, X } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
}

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STUDY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['Vietnamese', 'English', 'Chinese', 'Japanese', 'Korean', 'Other'];

const StudyGroupCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course: '',
    maxMembers: 10,
    isPrivate: false,
    requireApproval: false,
    tags: [] as string[],
    studyLevel: 'Intermediate',
    language: 'Vietnamese',
    schedule: [] as ScheduleItem[],
    rules: '',
    goals: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [scheduleDay, setScheduleDay] = useState('Monday');
  const [scheduleStart, setScheduleStart] = useState('18:00');
  const [scheduleEnd, setScheduleEnd] = useState('20:00');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses({ limit: 100, status: 'approved' });
      console.log('Courses API response:', response.data);
      
      if (response.data.success) {
        const coursesData = response.data.data?.courses || response.data.data || [];
        console.log('Parsed courses:', coursesData);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        
        if (coursesData.length === 0) {
          toast.showToast({
            type: 'warning',
            title: 'Không có khóa học',
            message: 'Hiện chưa có khóa học nào được phê duyệt'
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast.showToast({
        type: 'error',
        title: 'Lỗi tải khóa học',
        message: error.response?.data?.message || 'Không thể tải danh sách khóa học'
      });
      setCourses([]);
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Tên nhóm không được để trống';
      } else if (formData.name.length < 5) {
        newErrors.name = 'Tên nhóm phải có ít nhất 5 ký tự';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Mô tả không được để trống';
      } else if (formData.description.length < 20) {
        newErrors.description = 'Mô tả phải có ít nhất 20 ký tự';
      }

      if (!formData.course) {
        newErrors.course = 'Vui lòng chọn khóa học';
      }
    }

    if (stepNumber === 2) {
      if (formData.maxMembers < 2) {
        newErrors.maxMembers = 'Số thành viên tối thiểu là 2';
      } else if (formData.maxMembers > 100) {
        newErrors.maxMembers = 'Số thành viên tối đa là 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddSchedule = () => {
    if (scheduleStart && scheduleEnd && scheduleStart < scheduleEnd) {
      const newSchedule = {
        day: scheduleDay,
        startTime: scheduleStart,
        endTime: scheduleEnd
      };
      
      // Check if schedule for this day already exists
      const existingIndex = formData.schedule.findIndex(s => s.day === scheduleDay);
      if (existingIndex >= 0) {
        const updated = [...formData.schedule];
        updated[existingIndex] = newSchedule;
        setFormData({ ...formData, schedule: updated });
      } else {
        setFormData({ ...formData, schedule: [...formData.schedule, newSchedule] });
      }
    }
  };

  const handleRemoveSchedule = (day: string) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter(s => s.day !== day)
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      console.log('Validation failed at step:', step);
      return;
    }

    try {
      setLoading(true);

      // Map formData.course to courseId for backend compatibility
      const { course, ...restFormData } = formData;
      
      if (!course) {
        toast.showToast({
          type: 'error',
          title: 'Thiếu thông tin',
          message: 'Vui lòng chọn khóa học'
        });
        setLoading(false);
        return;
      }

      const submitData = {
        ...restFormData,
        courseId: course, // Backend expects courseId not course
        creator: user?._id,
        members: [user?._id]
      };

      console.log('📤 Submitting study group data:', submitData);
      const response = await studyGroupAPI.createStudyGroup(submitData);
      console.log('✅ Study group created:', response.data);

      if (response.data.success) {
        toast.showToast({
          type: 'success',
          title: 'Tạo nhóm học thành công!',
          message: 'Nhóm học của bạn đã được tạo'
        });
        navigate(`/study-groups/${response.data.data.group._id}`);
      }
    } catch (error: any) {
      console.error('❌ Error creating study group:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Đã có lỗi xảy ra';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Show validation errors
        errorMessage = error.response.data.errors.map((e: any) => e.msg).join(', ');
      }
      
      toast.showToast({
        type: 'error',
        title: 'Không thể tạo nhóm học',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= stepNum
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stepNum}
            </div>
            {stepNum < 3 && (
              <div
                className={`w-16 h-1 ${
                  step > stepNum ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-8">
        <span className={`text-sm ${step === 1 ? 'text-primary-600 font-semibold' : 'text-gray-600'}`}>
          Thông tin cơ bản
        </span>
        <span className={`text-sm ${step === 2 ? 'text-primary-600 font-semibold' : 'text-gray-600'}`}>
          Cài đặt nhóm
        </span>
        <span className={`text-sm ${step === 3 ? 'text-primary-600 font-semibold' : 'text-gray-600'}`}>
          Lịch học & Quy tắc
        </span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên nhóm học <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="VD: Nhóm học NodeJS cơ bản"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả nhóm <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả về mục tiêu, phương pháp học, v.v..."
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length} / 500 ký tự
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Khóa học liên quan <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.course}
          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.course ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">-- Chọn khóa học --</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        {errors.course && <p className="text-red-500 text-sm mt-1">{errors.course}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trình độ học
        </label>
        <select
          value={formData.studyLevel}
          onChange={(e) => setFormData({ ...formData, studyLevel: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {STUDY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level === 'Beginner' ? 'Mới bắt đầu' : level === 'Intermediate' ? 'Trung cấp' : 'Nâng cao'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngôn ngữ giao tiếp
        </label>
        <select
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="inline w-4 h-4 mr-1" />
          Số thành viên tối đa
        </label>
        <input
          type="number"
          value={formData.maxMembers}
          onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 10 })}
          min="2"
          max="100"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.maxMembers ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.maxMembers && <p className="text-red-500 text-sm mt-1">{errors.maxMembers}</p>}
        <p className="text-sm text-gray-500 mt-1">
          Từ 2 đến 100 thành viên
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.isPrivate}
            onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Nhóm riêng tư
            </div>
            <p className="text-sm text-gray-600">
              Chỉ những người có mã mời mới có thể tìm thấy và tham gia nhóm
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.requireApproval}
            onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Yêu cầu phê duyệt</div>
            <p className="text-sm text-gray-600">
              Quản trị viên phải phê duyệt yêu cầu tham gia nhóm
            </p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="inline w-4 h-4 mr-1" />
          Tags (tối đa 10)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="VD: nodejs, backend, api"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            disabled={formData.tags.length >= 10}
          />
          <Button onClick={handleAddTag} disabled={formData.tags.length >= 10}>
            Thêm
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-primary-700 hover:text-primary-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline w-4 h-4 mr-1" />
          Lịch học hàng tuần
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <select
            value={scheduleDay}
            onChange={(e) => setScheduleDay(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day === 'Monday' ? 'Thứ 2' : day === 'Tuesday' ? 'Thứ 3' : day === 'Wednesday' ? 'Thứ 4' : day === 'Thursday' ? 'Thứ 5' : day === 'Friday' ? 'Thứ 6' : day === 'Saturday' ? 'Thứ 7' : 'Chủ nhật'}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={scheduleStart}
            onChange={(e) => setScheduleStart(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="time"
            value={scheduleEnd}
            onChange={(e) => setScheduleEnd(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <Button onClick={handleAddSchedule}>Thêm</Button>
        </div>
        <div className="space-y-2">
          {formData.schedule.map((item) => (
            <div
              key={item.day}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">
                {item.day === 'Monday' ? 'Thứ 2' : item.day === 'Tuesday' ? 'Thứ 3' : item.day === 'Wednesday' ? 'Thứ 4' : item.day === 'Thursday' ? 'Thứ 5' : item.day === 'Friday' ? 'Thứ 6' : item.day === 'Saturday' ? 'Thứ 7' : 'Chủ nhật'}
              </span>
              <span className="text-gray-600">
                {item.startTime} - {item.endTime}
              </span>
              <button
                onClick={() => handleRemoveSchedule(item.day)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.schedule.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              Chưa có lịch học nào. Thêm lịch học để nhóm hiệu quả hơn.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mục tiêu nhóm
        </label>
        <textarea
          value={formData.goals}
          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          placeholder="VD: Hoàn thành khóa học trong 3 tháng, xây dựng 2 dự án thực tế..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quy tắc nhóm
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          placeholder="VD: Tôn trọng lẫn nhau, không spam, tham gia đầy đủ các buổi học..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/study-groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo nhóm học mới</h1>
            <p className="text-gray-600 mt-1">Tạo nhóm học để cùng nhau tiến bộ</p>
          </div>
        </div>

        <Card className="p-8">
          {renderStepIndicator()}

          <div className="mt-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                Quay lại
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button onClick={handleNext}>
                Tiếp theo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Tạo nhóm học
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudyGroupCreate;
