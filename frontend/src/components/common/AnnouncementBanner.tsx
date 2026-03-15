import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { announcementAPI } from '../../services/api';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  linkUrl?: string;
  linkText?: string;
  dismissible: boolean;
  priority: number;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    icon: <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
  }
};

const STORAGE_KEY = 'dismissed_announcements';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await announcementAPI.getActiveAnnouncements();
        if (res.data.success) {
          setAnnouncements(res.data.data.announcements || []);
        }
      } catch {
        // Silently ignore - announcements are non-critical
      }
    };
    fetchAnnouncements();
  }, []);

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore storage errors
    }
  };

  const visible = announcements.filter(a => !dismissed.has(a._id));

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-0">
      {visible.map(ann => {
        const style = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
        return (
          <div
            key={ann._id}
            className={`${style.bg} ${style.border} border-b px-4 py-2.5`}
          >
            <div className="max-w-7xl mx-auto flex items-start gap-3">
              {style.icon}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${style.text}`}>{ann.title}</p>
                <p className={`text-xs ${style.text} opacity-90 mt-0.5`}>{ann.message}</p>
                {ann.linkUrl && ann.linkText && (
                  <a
                    href={ann.linkUrl}
                    target={ann.linkUrl.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs font-medium underline mt-1 ${style.text}`}
                  >
                    {ann.linkText}
                    {ann.linkUrl.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                  </a>
                )}
              </div>
              {ann.dismissible && (
                <button
                  onClick={() => handleDismiss(ann._id)}
                  className={`p-1 rounded-md hover:bg-black/10 transition-colors ${style.text} shrink-0`}
                  aria-label="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
