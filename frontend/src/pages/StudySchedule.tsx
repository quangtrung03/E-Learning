import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, X, CalendarDays, Clock, BookOpen, Pencil } from 'lucide-react';
import { scheduleAPI, courseAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduleEvent {
  _id: string;
  title: string;
  course?: { _id: string; title: string; thumbnail?: string } | null;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  note?: string;
  completed: boolean;
}

interface EventForm {
  title: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  note: string;
}

interface EnrolledCourse {
  _id: string;
  title: string;
}

const PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_VN = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayString() {
  const t = new Date();
  return toDateString(t.getFullYear(), t.getMonth(), t.getDate());
}

// ─── Component ───────────────────────────────────────────────────────────────

const StudySchedule = () => {
  const toast = useToast();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventForm>({
    title: '',
    courseId: '',
    date: '',
    startTime: '',
    endTime: '',
    color: '#3b82f6',
    note: '',
  });

  // Detail panel (click day)
  const [panelDate, setPanelDate] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthEvents();
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const fetchMonthEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await scheduleAPI.getSchedule({ month: monthKey });
      if (res.data.success) setEvents(res.data.data);
    } catch { /* silent */ } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const res = await courseAPI.getMyEnrolledCourses({ limit: 100 });
      const d = res.data?.data?.courses || res.data?.data || res.data?.courses || [];
      setEnrolledCourses(d.map((c: any) => ({ _id: c._id, title: c.title })));
    } catch { /* silent */ }
  };

  // ── Calendar grid ────────────────────────────────────────────────────────

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  // ── Navigation ──────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = (dateStr: string) => {
    setEditingEvent(null);
    setForm({ title: '', courseId: '', date: dateStr, startTime: '', endTime: '', color: '#3b82f6', note: '' });
    setShowModal(true);
  };

  const openEdit = (ev: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      courseId: ev.course?._id || '',
      date: ev.date,
      startTime: ev.startTime || '',
      endTime: ev.endTime || '',
      color: ev.color,
      note: ev.note || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.showToast({ type: 'error', title: 'Vui lòng nhập tên buổi học' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        courseId: form.courseId || undefined,
        date: form.date,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        color: form.color,
        note: form.note,
      };
      if (editingEvent) {
        const res = await scheduleAPI.updateEvent(editingEvent._id, payload);
        if (res.data.success) {
          setEvents(prev => prev.map(e => e._id === editingEvent._id ? res.data.data : e));
          toast.showToast({ type: 'success', title: 'Đã cập nhật buổi học' });
        }
      } else {
        const res = await scheduleAPI.createEvent(payload);
        if (res.data.success) {
          setEvents(prev => [...prev, res.data.data]);
          toast.showToast({ type: 'success', title: 'Đã thêm buổi học' });
        }
      }
      setShowModal(false);
    } catch (err: any) {
      toast.showToast({ type: 'error', title: err.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (ev: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await scheduleAPI.updateEvent(ev._id, { completed: !ev.completed });
      if (res.data.success) {
        setEvents(prev => prev.map(x => x._id === ev._id ? res.data.data : x));
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (ev: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Xóa buổi học này?')) return;
    try {
      await scheduleAPI.deleteEvent(ev._id);
      setEvents(prev => prev.filter(x => x._id !== ev._id));
      toast.showToast({ type: 'success', title: 'Đã xóa buổi học' });
      if (panelDate && eventsOnDate(panelDate).length <= 1) setPanelDate(null);
    } catch { /* silent */ }
  };

  const today = todayString();
  const panelEvents = panelDate ? eventsOnDate(panelDate) : [];

  // ── Summary stats ────────────────────────────────────────────────────────
  const completedCount = events.filter(e => e.completed).length;
  const totalCount = events.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="container-custom py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <CalendarDays className="w-8 h-8" /> Lịch học
              </h1>
              <p className="text-indigo-100 text-sm">Lên lịch và theo dõi các buổi học của bạn</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
              <p className="text-indigo-200 text-xs">buổi hoàn thành tháng này</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Calendar ── */}
          <div className="flex-1">
            <Card className="p-6">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">
                  {MONTH_VN[viewMonth]} {viewYear}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day-of-week labels */}
              <div className="grid grid-cols-7 mb-2">
                {DOW_LABELS.map(d => (
                  <div key={d} className={`text-center text-xs font-semibold py-2 ${d === 'CN' ? 'text-red-500' : 'text-gray-500'}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              {loadingEvents ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="min-h-[80px]" />;
                    }
                    const dateStr = toDateString(viewYear, viewMonth, day);
                    const dayEvents = eventsOnDate(dateStr);
                    const isToday = dateStr === today;
                    const isSunday = new Date(viewYear, viewMonth, day).getDay() === 0;
                    const isSelected = panelDate === dateStr;

                    return (
                      <div
                        key={day}
                        onClick={() => setPanelDate(isSelected ? null : dateStr)}
                        className={`min-h-[80px] p-1.5 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50'
                            : isToday
                            ? 'border-indigo-300 bg-indigo-50/50'
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                            isToday
                              ? 'bg-indigo-600 text-white'
                              : isSunday
                              ? 'text-red-500'
                              : 'text-gray-700'
                          }`}>
                            {day}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); openCreate(dateStr); }}
                            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-indigo-100 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            title="Thêm buổi học"
                          >
                            <Plus className="w-3 h-3 text-gray-500 hover:text-indigo-600" />
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(ev => (
                            <div
                              key={ev._id}
                              className="text-xs px-1 py-0.5 rounded truncate leading-tight"
                              style={{ backgroundColor: ev.color + '22', color: ev.color, borderLeft: `2px solid ${ev.color}` }}
                            >
                              {ev.completed ? '✓ ' : ''}{ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} khác</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add event CTA */}
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreate(today)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" /> Thêm buổi học hôm nay
                </Button>
              </div>
            </Card>
          </div>

          {/* ── Side panel: events on selected day ── */}
          <div className="w-full lg:w-80 space-y-4">
            {panelDate ? (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">
                    {new Date(panelDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <button onClick={() => setPanelDate(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {panelEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-3">Chưa có buổi học nào</p>
                    <Button size="sm" onClick={() => openCreate(panelDate)}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm buổi học
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {panelEvents.map(ev => (
                      <div key={ev._id} className="border rounded-lg p-3" style={{ borderLeftColor: ev.color, borderLeftWidth: 3 }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${ev.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {ev.title}
                            </p>
                            {(ev.startTime || ev.endTime) && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                              </p>
                            )}
                            {ev.course && (
                              <Link to={`/courses/${ev.course._id}`} className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5 hover:underline">
                                <BookOpen className="w-3 h-3" /> {ev.course.title}
                              </Link>
                            )}
                            {ev.note && <p className="text-xs text-gray-500 mt-1 italic">{ev.note}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={e => handleToggleComplete(ev, e)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                ev.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                              }`}
                              title={ev.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                            >
                              {ev.completed && <Check className="w-3 h-3" />}
                            </button>
                            <button onClick={e => openEdit(ev, e)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={e => handleDelete(ev, e)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => openCreate(panelDate)} className="w-full gap-1">
                      <Plus className="w-4 h-4" /> Thêm buổi học
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5 text-center">
                <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Chọn một ngày để xem hoặc thêm buổi học</p>
              </Card>
            )}

            {/* Month summary */}
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">📊 Tháng này</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng buổi học</span>
                  <span className="font-semibold text-gray-900">{totalCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Đã hoàn thành</span>
                  <span className="font-semibold text-green-600">{completedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Còn lại</span>
                  <span className="font-semibold text-orange-600">{totalCount - completedCount}</span>
                </div>
                {totalCount > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Tiến độ</span>
                      <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingEvent ? 'Chỉnh sửa buổi học' : 'Thêm buổi học mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi học *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: Ôn tập React Hooks"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học liên kết</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                >
                  <option value="">— Không liên kết —</option>
                  {enrolledCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>

              {/* Color palette */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : editingEvent ? 'Cập nhật' : 'Thêm buổi học'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySchedule;
