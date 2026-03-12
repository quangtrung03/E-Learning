import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../../services/api';

interface Suggestion {
  type: 'course' | 'user' | 'tag';
  id?: string;
  label: string;
  sub?: string;
  image?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setLoading(true);
    searchAPI.suggestions(debouncedQuery).then(res => {
      if (cancelled) return;
      const data = res.data;
      const list: Suggestion[] = [];
      (data.courses || []).forEach((c: any) => list.push({ type: 'course', id: c._id, label: c.title, sub: c.instructor?.name, image: c.thumbnail }));
      (data.users || []).forEach((u: any) => list.push({ type: 'user', id: u._id, label: u.name, sub: u.bio?.slice(0, 50), image: u.avatar }));
      (data.tags || []).forEach((t: string) => list.push({ type: 'tag', label: t }));
      setSuggestions(list.slice(0, 8));
    }).catch(() => setSuggestions([])).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((s: Suggestion) => {
    setOpen(false);
    setQuery('');
    if (s.type === 'course') navigate(`/courses/${s.id}`);
    else if (s.type === 'user') navigate(`/users/${s.id}`);
    else if (s.type === 'tag') navigate(`/search?q=${encodeURIComponent(s.label)}&type=all`);
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const icons: Record<string, string> = { course: '📚', user: '👤', tag: '#' };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center">
          <svg className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm khóa học, người dùng..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-transparent rounded-xl focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-400 dark:text-white dark:placeholder-gray-400 transition-colors"
            autoComplete="off"
          />
          {loading && (
            <svg className="absolute right-3 w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button key={`${s.type}-${s.id || s.label}`}
              onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-sm ${i === activeIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {s.image ? (
                <img src={s.image} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">{icons[s.type]}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">{s.label}</p>
                {s.sub && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.sub}</p>}
              </div>
              <span className="text-[10px] text-gray-400 uppercase">{s.type === 'course' ? 'Khóa học' : s.type === 'user' ? 'Người dùng' : 'Tag'}</span>
            </button>
          ))}
          <button
            onMouseDown={e => { e.preventDefault(); handleSearch(e as any); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Xem tất cả kết quả cho "{query}"
          </button>
        </div>
      )}
    </div>
  );
}
