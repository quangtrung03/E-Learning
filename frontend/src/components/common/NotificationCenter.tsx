import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import type { UserNotificationItem } from '../../utils/userNotifications';

interface NotificationCenterProps {
  isOpen: boolean;
  items: UserNotificationItem[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const timeAgo = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Vừa xong';
  if (parsed.getTime() > Date.now()) return 'Sắp diễn ra';
  const diffMs = Date.now() - parsed.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

export default function NotificationCenter({
  isOpen,
  items,
  onClose,
  onMarkRead,
  onMarkAllRead
}: NotificationCenterProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 w-96 max-w-[calc(100vw-24px)] rounded-xl border border-gray-200 bg-white shadow-xl z-[70]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Trung tâm thông báo</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" />
            Đọc tất cả
          </Button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 px-1">✕</button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">Chưa có thông báo mới</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onMarkRead(item.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${item.read ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(item.createdAt)}</p>
                  </div>
                  {!item.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
