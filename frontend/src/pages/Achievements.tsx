import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ShieldCheck, Star, Lock, Medal, Crown, Sparkles } from 'lucide-react';
import { analyticsAPI, certificateAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type Tab = 'achievements' | 'certificates';

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rarity: 'legendary' | 'epic' | 'rare' | 'common';
  xpReward: number;
  progress: number;
  target: number;
  icon: string;
  unlocked: boolean;
  progressPercent: number;
}

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  avatar?: string | null;
  xp: number;
  completedCourses: number;
  certificates: number;
  avgProgress: number;
}

interface CertificateItem {
  _id: string;
  certificateId: string;
  certificateName: string;
  issueDate: string;
  score: number;
  grade: string;
  status: string;
  course?: { title?: string };
}

const rarityStyle: Record<AchievementItem['rarity'], string> = {
  legendary: 'bg-amber-50 text-amber-700 border-amber-200',
  epic: 'bg-violet-50 text-violet-700 border-violet-200',
  rare: 'bg-blue-50 text-blue-700 border-blue-200',
  common: 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<Tab>('achievements');
  const [loading, setLoading] = useState(true);
  const [achievementData, setAchievementData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardItem | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [filterState, setFilterState] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [filterRarity, setFilterRarity] = useState<'all' | AchievementItem['rarity']>('all');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [achRes, leaderRes, certRes] = await Promise.all([
          analyticsAPI.getAchievements(),
          analyticsAPI.getLeaderboard({ limit: 10 }),
          certificateAPI.getMyCertificates({ limit: 8 })
        ]);
        setAchievementData(achRes.data?.data || null);
        setLeaderboard(leaderRes.data?.data?.leaderboard || []);
        setMyRank(leaderRes.data?.data?.myRank || null);
        setCertificates(certRes.data?.data?.certificates || []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const achievements: AchievementItem[] = achievementData?.achievements || [];

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      if (filterState === 'unlocked' && !item.unlocked) return false;
      if (filterState === 'locked' && item.unlocked) return false;
      if (filterRarity !== 'all' && item.rarity !== filterRarity) return false;
      return true;
    });
  }, [achievements, filterState, filterRarity]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const summary = achievementData?.summary || {
    totalAchievements: 0,
    unlockedCount: 0,
    lockedCount: 0,
    completionRate: 0,
    totalXP: 0,
    rarityCounts: { legendary: 0, epic: 0, rare: 0, common: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thành tích & Chứng chỉ</h1>
        <p className="text-gray-600 mt-1">Mở khóa thành tích, tích lũy XP và theo dõi thứ hạng học tập của bạn.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${activeTab === 'achievements' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
        >
          <Trophy className="w-4 h-4 inline mr-1.5" />
          Thành tích
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${activeTab === 'certificates' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500'}`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1.5" />
          Chứng chỉ
        </button>
      </div>

      {activeTab === 'achievements' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <p className="text-sm text-gray-500 mb-1">Tổng đã đạt</p>
              <p className="text-4xl font-bold text-green-600">{summary.unlockedCount} <span className="text-2xl text-gray-400">/ {summary.totalAchievements}</span></p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 mb-1">Hoàn thành</p>
              <p className="text-4xl font-bold text-blue-600">{summary.completionRate}%</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 mb-1">Tổng XP</p>
              <p className="text-4xl font-bold text-amber-500">{summary.totalXP}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 mb-1">Đã khóa</p>
              <p className="text-4xl font-bold text-gray-500">{summary.lockedCount}</p>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-600">Trạng thái:</span>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {(['all', 'unlocked', 'locked'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterState(f)}
                    className={`px-3 py-1.5 text-sm ${filterState === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
                  >
                    {f === 'all' ? 'Tất cả' : f === 'unlocked' ? 'Đã đạt' : 'Đã khóa'}
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">Độ hiếm:</span>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
              >
                <option value="all">Tất cả độ hiếm</option>
                <option value="legendary">Huyền thoại</option>
                <option value="epic">Sử thi</option>
                <option value="rare">Hiếm</option>
                <option value="common">Thông thường</option>
              </select>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAchievements.map((item) => (
              <Card key={item.id} className={`p-4 border ${item.unlocked ? 'border-green-200' : 'border-gray-200'} relative`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${item.unlocked ? 'bg-green-50' : 'bg-gray-100 grayscale'}`}>
                      {item.unlocked ? item.icon : <Lock className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md border ${rarityStyle[item.rarity]}`}>{item.rarity}</span>
                </div>
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full ${item.unlocked ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${item.progressPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{Math.min(item.progress, item.target)} / {item.target}</span>
                    <span className="text-amber-600 font-semibold">+{item.xpReward} XP</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-500" />
              Bảng xếp hạng học tập
            </h2>
            <div className="space-y-2">
              {leaderboard.map((item) => (
                <div key={item.userId} className={`flex items-center justify-between p-3 rounded-lg border ${item.rank <= 3 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold text-gray-700">#{item.rank}</div>
                    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                      {item.avatar ? <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-gray-600">{item.name.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Khóa hoàn thành: {item.completedCourses} • Chứng chỉ: {item.certificates}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">{item.xp} XP</p>
                    <p className="text-xs text-gray-500">Tiến độ TB: {item.avgProgress}%</p>
                  </div>
                </div>
              ))}
            </div>
            {myRank && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Vị trí của bạn: #{myRank.rank}</span>
                </div>
                <span className="font-semibold text-blue-700">{myRank.xp} XP</span>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'certificates' && (
        <Card className="p-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Chứng chỉ gần đây
          </h2>
          {certificates.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              Bạn chưa có chứng chỉ. Hãy hoàn thành khóa học để nhận chứng chỉ đầu tiên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((c) => (
                <div key={c._id} className="p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{c.certificateName || c.course?.title || 'Chứng chỉ'}</p>
                      <p className="text-xs text-gray-500 mt-1">#{c.certificateId}</p>
                    </div>
                    <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-green-50 text-green-700">
                      <Medal className="w-3 h-3 mr-1" />
                      {c.grade}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Điểm: <strong className="text-gray-900">{c.score}%</strong></span>
                    <span>{new Date(c.issueDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link to="/my-certificates">
              <Button variant="outline"><Star className="w-4 h-4 mr-1.5" /> Xem tất cả chứng chỉ</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

