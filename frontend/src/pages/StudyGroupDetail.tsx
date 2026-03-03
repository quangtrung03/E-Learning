import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyGroupAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Users, Calendar, Clock, Link as LinkIcon, 
  Lock, Globe, UserPlus, UserMinus, Crown, 
  Settings 
} from 'lucide-react';

interface Member {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  joinedAt: Date;
  status: string;
}

interface StudyGroup {
  _id: string;
  name: string;
  description: string;
  course: {
    _id: string;
    title: string;
  };
  creator: {
    _id: string;
    name: string;
    avatar?: string;
  };
  members: Member[];
  currentMemberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  requireApproval: boolean;
  inviteCode?: string;
  tags: string[];
  studyLevel: string;
  language: string;
  timezone: string;
  rules: string[];
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
    description?: string;
  }>;
  createdAt: Date;
}

const StudyGroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'schedule'>('about');

  useEffect(() => {
    if (id) {
      fetchGroupDetail();
    }
  }, [id]);

  const fetchGroupDetail = async () => {
    try {
      setLoading(true);
      const response = await studyGroupAPI.getStudyGroup(id!);
      if (response.data.success) {
        setGroup(response.data.data.studyGroup);
      }
    } catch (error: any) {
      console.error('Error fetching group detail:', error);
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tải thông tin nhóm' });
      navigate('/study-groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      setJoining(true);
      const response = await studyGroupAPI.joinStudyGroup(id!);
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Tham gia nhóm thành công!' });
        fetchGroupDetail();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tham gia nhóm' });
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await studyGroupAPI.leaveStudyGroup(id!);
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Rời khỏi nhóm thành công!' });
        navigate('/study-groups');
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể rời khỏi nhóm' });
    }
  };

  const isMember = group?.members.some(m => m.user._id === user?._id);
  const isCreator = group?.creator._id === user?._id;
  const isFull = (group?.currentMemberCount || 0) >= (group?.maxMembers || 0);

  const dayMapping: Record<string, string> = {
    monday: 'Thứ 2',
    tuesday: 'Thứ 3',
    wednesday: 'Thứ 4',
    thursday: 'Thứ 5',
    friday: 'Thứ 6',
    saturday: 'Thứ 7',
    sunday: 'Chủ nhật'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin nhóm...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                  {group.isPrivate ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className="text-gray-600">{group.course.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Tạo bởi {group.creator.name}</span>
                  {isCreator && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Trưởng nhóm
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isMember ? (
                <>
                  {isCreator && (
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Cài đặt
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLeaveGroup}>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Rời nhóm
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  disabled={isFull || joining}
                  onClick={handleJoinGroup}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {joining ? 'Đang tham gia...' : isFull ? 'Nhóm đã đầy' : 'Tham gia nhóm'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {group.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
              {group.studyLevel}
            </span>
            <span className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
              {group.language === 'vi' || group.language === 'Vietnamese'
                ? 'Tiếng Việt'
                : group.language === 'English'
                  ? 'Tiếng Anh'
                  : group.language}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{group.currentMemberCount}/{group.maxMembers} thành viên</span>
            </div>
            {group.schedule.length > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{group.schedule.length} buổi học/tuần</span>
              </div>
            )}
            {group.isPrivate && group.inviteCode && (
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                <span>Mã: {group.inviteCode}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Giới thiệu
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Thành viên ({group.currentMemberCount})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lịch học
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Mô tả nhóm</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{group.description}</p>

            {group.rules.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-3">📋 Quy định nhóm</h3>
                <ul className="space-y-2">
                  {group.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-600 font-semibold">{index + 1}.</span>
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members.map((member) => (
              <Card key={member.user._id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-lg">
                      {member.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {member.user.name}
                      </h3>
                      {member.role === 'admin' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tham gia: {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          group.schedule.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có lịch học
              </h3>
              <p className="text-gray-600">
                Nhóm chưa thiết lập lịch học thường xuyên
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.schedule.map((session, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dayMapping[session.day] || session.day}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                    </div>
                  </div>

                  {session.description && (
                    <p className="text-gray-700 mb-3">{session.description}</p>
                  )}

                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Link học online</span>
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StudyGroupDetail;
