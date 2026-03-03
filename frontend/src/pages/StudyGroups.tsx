import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyGroupAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Users, Lock, Globe, Calendar, UserPlus, Search } from 'lucide-react';

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
  currentMemberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  requireApproval: boolean;
  tags: string[];
  studyLevel: string;
  language: string;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
  }>;
  createdAt: Date;
}

const StudyGroups = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [allGroupsLoading, setAllGroupsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'all-groups'>('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [joinCode, setJoinCode] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  useEffect(() => {
    if (activeTab !== 'all-groups') return;

    const handle = setTimeout(() => {
      fetchAllGroups();
    }, 300);

    return () => clearTimeout(handle);
  }, [activeTab, searchQuery, filterLevel]);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const response = await studyGroupAPI.getMyStudyGroups();
      if (response.data.success) {
        setMyGroups(response.data.data.studyGroups || []);
      }
    } catch (error: any) {
      console.error('Error fetching my study groups:', error);
      // Fallback to empty state instead of showing a scary error for benign cases
      setMyGroups([]);

      const status = error.response?.status;
      if (status === 401) {
        toast.showToast({ type: 'error', title: 'Vui lòng đăng nhập lại để xem nhóm học tập' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroups = async () => {
    try {
      setAllGroupsLoading(true);
      const params: any = {
        page: 1,
        limit: 20,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterLevel !== 'all') params.studyLevel = filterLevel;

      const response = await studyGroupAPI.getStudyGroups(params);
      if (response.data.success) {
        setAllGroups(response.data.data.studyGroups || []);
      } else {
        setAllGroups([]);
      }
    } catch (error: any) {
      console.error('Error fetching study groups:', error);
      setAllGroups([]);
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tải danh sách nhóm' });
    } finally {
      setAllGroupsLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.showToast({ type: 'error', title: 'Vui lòng nhập mã nhóm' });
      return;
    }

    try {
      setJoiningByCode(true);
      const lookup = await studyGroupAPI.getStudyGroupByCode(code);
      const group = lookup.data?.data?.studyGroup as StudyGroup | undefined;
      if (!lookup.data?.success || !group?._id) {
        toast.showToast({ type: 'error', title: lookup.data?.message || 'Không tìm thấy nhóm' });
        return;
      }

      const joinResp = await studyGroupAPI.joinStudyGroup(group._id, code);
      if (joinResp.data?.success) {
        toast.showToast({ type: 'success', title: joinResp.data?.message || 'Tham gia nhóm thành công!' });
        setJoinCode('');
        fetchMyGroups();
        fetchAllGroups();
      } else {
        toast.showToast({ type: 'error', title: joinResp.data?.message || 'Không thể tham gia nhóm' });
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tham gia nhóm' });
    } finally {
      setJoiningByCode(false);
    }
  };



  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await studyGroupAPI.joinStudyGroup(groupId);
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Tham gia nhóm thành công!' });
        fetchMyGroups();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tham gia nhóm' });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await studyGroupAPI.leaveStudyGroup(groupId);
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Rời khỏi nhóm thành công!' });
        fetchMyGroups();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể rời khỏi nhóm' });
    }
  };

  const renderGroupCard = (group: StudyGroup, isMember: boolean) => {
    const isFull = group.currentMemberCount >= group.maxMembers;

    return (
      <div
        key={group._id}
        className="cursor-pointer"
        onClick={() => navigate(`/study-groups/${group._id}`)}
      >
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.course.title}</p>
              </div>
            </div>
            {group.isPrivate ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : (
              <Globe className="w-5 h-5 text-green-500" />
            )}
          </div>

          <p className="text-gray-700 mb-4 line-clamp-2">{group.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {group.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
              {group.studyLevel}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{group.currentMemberCount}/{group.maxMembers}</span>
              </div>
              {group.schedule.length > 0 && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{group.schedule.length} buổi học</span>
                </div>
              )}
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              {isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLeaveGroup(group._id)}
                >
                  Rời nhóm
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={isFull}
                  onClick={() => handleJoinGroup(group._id)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {isFull ? 'Đã đầy' : 'Tham gia'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải nhóm học tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Nhóm học tập</h1>
            <p className="text-gray-600 mt-2">Học cùng nhau, tiến bộ hơn mỗi ngày</p>
          </div>
          <Button onClick={() => navigate('/study-groups/create')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Tạo nhóm mới
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'my-groups'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nhóm của tôi ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('all-groups')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'all-groups'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tất cả nhóm
          </button>
        </div>

        {/* Tìm kiếm và bộ lọc */}
        {activeTab === 'all-groups' && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm nhóm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mã nhóm"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-36 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button onClick={handleJoinByCode} disabled={joiningByCode}>
                Tham gia
              </Button>
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả trình độ</option>
              <option value="beginner">Người mới</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Nâng cao</option>
              <option value="mixed">Hỗn hợp</option>
            </select>
          </div>
        )}

        {/* Content */}
        {activeTab === 'my-groups' ? (
          myGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl text-gray-300 mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa tham gia nhóm nào
              </h3>
              <p className="text-gray-600 mb-6">
                Tham gia hoặc tạo nhóm học tập để học cùng những người có cùng mục tiêu
              </p>
              <Button onClick={() => navigate('/study-groups/create')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Tạo nhóm đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((group) => renderGroupCard(group, true))}
            </div>
          )
        ) : (
          allGroupsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách nhóm...</p>
            </div>
          ) : allGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl text-gray-300 mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy nhóm
              </h3>
              <p className="text-gray-600">
                Thử đổi từ khóa tìm kiếm hoặc tham gia bằng mã nhóm
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allGroups.map((group) => {
                const isMember = myGroups.some((g) => g._id === group._id);
                return renderGroupCard(group, isMember);
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StudyGroups;
