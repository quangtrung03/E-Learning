import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CloudinaryFolder {
  name: string;
  path: string;
}

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  resource_type: string;
}

type MediaType = 'image' | 'video';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── FolderNode ───────────────────────────────────────────────────────────────

interface FolderNodeProps {
  folder: CloudinaryFolder;
  selectedFolder: string;
  onSelect: (path: string) => void;
  depth?: number;
}

const FolderNode = ({ folder, selectedFolder, onSelect, depth = 0 }: FolderNodeProps) => {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<CloudinaryFolder[] | null>(null);
  const isSelected = selectedFolder === folder.path;

  const toggle = async () => {
    if (!open && children === null) {
      try {
        const res = await api.get('/admin/media/folders', { params: { prefix: folder.path } });
        setChildren(res.data.folders ?? []);
      } catch {
        setChildren([]);
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm select-none transition-colors
          ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button onClick={toggle} className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600">
          {open ? '▾' : '▸'}
        </button>
        <button onClick={() => onSelect(folder.path)} className="flex items-center gap-1 flex-1 text-left">
          <span>📁</span>
          <span className="truncate">{folder.name}</span>
        </button>
      </div>
      {open && children && children.map((child) => (
        <FolderNode
          key={child.path}
          folder={child}
          selectedFolder={selectedFolder}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminMediaManager = () => {
  // Folder tree state
  const [rootFolders, setRootFolders] = useState<CloudinaryFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('elearning');
  const [selectedType, setSelectedType] = useState<MediaType>('image');
  const [foldersLoading, setFoldersLoading] = useState(true);

  // Resources state
  const [resources, setResources] = useState<CloudinaryResource[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Modal / UI state
  const [selectedImage, setSelectedImage] = useState<CloudinaryResource | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // publicId
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const mediaLabel = selectedType === 'video' ? 'video' : 'ảnh';
  const mediaIcon = selectedType === 'video' ? '🎬' : '🖼️';
  const uploadEndpoint = selectedType === 'video' ? 'video/upload' : 'image/upload';
  const mediaAccept = selectedType === 'video' ? 'video/*' : 'image/*';

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load root folders (= direct subfolders of elearning) ────────────────────
  useEffect(() => {
    const load = async () => {
      setFoldersLoading(true);
      try {
        const res = await api.get('/admin/media/folders', { params: { prefix: 'elearning' } });
        setRootFolders(res.data.folders ?? []);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        showToast(err?.response?.data?.message ?? 'Không tải được thư mục', false);
      } finally {
        setFoldersLoading(false);
      }
    };
    load();
  }, []);

  // ── Load resources ───────────────────────────────────────────────────────────
  const loadResources = useCallback(async (folder: string, cursor?: string) => {
    setResourcesLoading(true);
    try {
      const params: Record<string, string> = { folder, max_results: '30' };
      if (cursor) params.next_cursor = cursor;
      params.resource_type = selectedType;
      const res = await api.get('/admin/media/resources', { params });
      const incoming: CloudinaryResource[] = res.data.resources ?? [];
      setResources((prev) => cursor ? [...prev, ...incoming] : incoming);
      setNextCursor(res.data.next_cursor ?? null);
      setHasMore(!!res.data.next_cursor);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err?.response?.data?.message ?? `Không tải được ${mediaLabel}`, false);
    } finally {
      setResourcesLoading(false);
    }
  }, [mediaLabel, selectedType]);

  useEffect(() => {
    setResources([]);
    setNextCursor(null);
    setSelectedImage(null);
    loadResources(selectedFolder);
  }, [selectedFolder, loadResources]);

  // ── Upload via signature ────────────────────────────────────────────────────
  const handleUploadFiles = async (files: FileList) => {
    setUploading(true);
    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBusyMsg(`Đang tải lên ${i + 1}/${files.length}: ${file.name}`);
      try {
        // 1. Get server signature
        const sigRes = await api.post('/admin/media/upload-signature', {
          folder: selectedFolder,
          resourceType: selectedType,
        });
        const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data;

        // 2. Upload directly to Cloudinary
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', apiKey);
        form.append('timestamp', String(timestamp));
        form.append('signature', signature);
        form.append('folder', folder);

        const cdnRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${uploadEndpoint}`,
          { method: 'POST', body: form }
        );
        if (cdnRes.ok) uploaded++;
        else {
          const err = await cdnRes.json();
          showToast(`Lỗi: ${err.error?.message ?? 'Upload thất bại'}`, false);
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        showToast(err?.response?.data?.message ?? err?.message ?? 'Upload thất bại', false);
      }
    }
    setUploading(false);
    setBusyMsg('');
    if (uploaded > 0) {
      showToast(`Đã tải lên ${uploaded} ${mediaLabel}`);
      loadResources(selectedFolder);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Create folder ────────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const path = `${selectedFolder}/${newFolderName.trim().replace(/\s+/g, '-').toLowerCase()}`;
    try {
      await api.post('/admin/media/folders', { path });
      showToast(`Tạo thư mục '${path}' thành công`);
      setShowNewFolder(false);
      setNewFolderName('');
      // Refresh elearning subfolders
      const res = await api.get('/admin/media/folders', { params: { prefix: 'elearning' } });
      setRootFolders(res.data.folders ?? []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err?.response?.data?.message ?? 'Tạo thư mục thất bại', false);
    }
  };

  // ── Delete folder ────────────────────────────────────────────────────────────
  const execDeleteFolder = async (path: string) => {
    try {
      await api.delete('/admin/media/folders', { data: { path } });
      showToast(`Đã xóa thư mục '${path}'`);
      setConfirmDeleteFolder(null);
      const res = await api.get('/admin/media/folders', { params: { prefix: 'elearning' } });
      setRootFolders(res.data.folders ?? []);
      if (selectedFolder === path) setSelectedFolder('elearning');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err?.response?.data?.message ?? 'Xóa thư mục thất bại', false);
      setConfirmDeleteFolder(null);
    }
  };

  // ── Delete resource ──────────────────────────────────────────────────────────
  const execDeleteResource = async (publicId: string) => {
    try {
      await api.delete('/admin/media/resource', { data: { publicId, resourceType: selectedType } });
      showToast(`Đã xóa ${mediaLabel}`);
      setResources((prev) => prev.filter((r) => r.public_id !== publicId));
      setConfirmDelete(null);
      setSelectedImage(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err?.response?.data?.message ?? `Xóa ${mediaLabel} thất bại`, false);
      setConfirmDelete(null);
    }
  };

  // ── Replace Image ────────────────────────────────────────────────────────────
  const handleReplaceImage = async (file: File) => {
    if (!selectedImage) return;
    setUploading(true);
    setBusyMsg(`Đang thay thế ${mediaLabel}...`);
    try {
      const fileNameOnly = selectedImage.public_id.split('/').pop()!;
      const sigRes = await api.post('/admin/media/upload-signature', {
        folder: selectedFolder,
        publicId: fileNameOnly,
        resourceType: selectedType,
        overwrite: true,
        invalidate: true,
      });
      const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data;

      const form = new FormData();
      form.append('file', file);
      form.append('api_key', apiKey);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
      form.append('folder', folder);
      form.append('public_id', fileNameOnly);
      form.append('overwrite', 'true');
      form.append('invalidate', 'true');

      const cdnRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${uploadEndpoint}`,
        { method: 'POST', body: form }
      );

      if (cdnRes.ok) {
        const data = await cdnRes.json();
        // Append cache-busting query so the browser reloads the image
        const freshUrl = data.secure_url + '?v=' + Date.now();
        const updated: CloudinaryResource = {
          ...selectedImage,
          secure_url: freshUrl,
          bytes: data.bytes,
          width: data.width,
          height: data.height,
          format: data.format,
        };
        setResources(prev =>
          prev.map(r => r.public_id === selectedImage.public_id ? { ...r, secure_url: freshUrl } : r)
        );
        setSelectedImage(updated);
        showToast(`Đã thay thế ${mediaLabel} thành công`);
      } else {
        const err = await cdnRes.json();
        showToast(`Lỗi: ${err.error?.message ?? 'Thay thế thất bại'}`, false);
      }
    } catch {
      showToast('Thay thế ảnh thất bại', false);
    } finally {
      setUploading(false);
      setBusyMsg('');
      // Reset input so same file can be selected again
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // ── Copy URL ─────────────────────────────────────────────────────────────────
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => showToast('Đã copy URL'));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600">
            ← Quay lại
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Media Manager</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Cloudinary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${selectedType === 'image' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setSelectedType('image')}
            >
              Ảnh
            </button>
            <button
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${selectedType === 'video' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setSelectedType('video')}
            >
              Video
            </button>
          </div>
          <button
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setShowNewFolder(true)}
          >
            📁+ Thư mục mới
          </button>
          <button
            className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '⏳ ' + busyMsg : `⬆️ Tải lên ${mediaLabel}`}
          </button>
          <input
            type="file"
            multiple
            accept={mediaAccept}
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
          />
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* ── Folder Tree ──────────────────────────────────────────────────── */}
        <div className="w-64 bg-white border-r overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thư mục</p>
          </div>

          {foldersLoading ? (
            <div className="p-4 text-sm text-gray-400">Đang tải...</div>
          ) : (
            <div className="p-2">
              {/* Root selector */}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm select-none transition-colors
                  ${selectedFolder === 'elearning' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedFolder('elearning')}
              >
                <span className="w-4" />
                <span>🗄️</span>
                <span>elearning</span>
              </div>
              {rootFolders.map((f) => (
                <FolderNode
                  key={f.path}
                  folder={f}
                  selectedFolder={selectedFolder}
                  onSelect={setSelectedFolder}
                />
              ))}
            </div>
          )}

          {/* Delete current folder */}
          {selectedFolder !== 'elearning' && (
            <div className="p-3 border-t mt-auto">
              <button
                className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 transition-colors"
                onClick={() => setConfirmDeleteFolder(selectedFolder)}
              >
                🗑 Xóa thư mục này
              </button>
            </div>
          )}
        </div>

        {/* ── Resource Grid ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            {selectedFolder.split('/').map((seg, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <button
                  className="hover:text-blue-600 transition-colors"
                  onClick={() => setSelectedFolder(arr.slice(0, i + 1).join('/'))}
                >
                  {seg}
                </button>
              </span>
            ))}
            <span className="text-gray-400 ml-1">({resources.length}{hasMore ? '+' : ''} {mediaLabel})</span>
          </div>

          {resourcesLoading && resources.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-5xl mb-3">{mediaIcon}</span>
              <p className="text-sm">Chưa có {mediaLabel} nào trong thư mục này</p>
              <button
                className="mt-3 text-sm text-blue-600 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                Tải {mediaLabel} lên ngay →
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {resources.map((r) => (
                  <div
                    key={r.public_id}
                    className="group relative bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedImage(r)}
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {selectedType === 'video' ? (
                        <video
                          src={r.secure_url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={r.secure_url}
                          alt={r.public_id}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-xs text-gray-600 truncate" title={r.public_id}>
                        {r.public_id.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-400">{fmtBytes(r.bytes)}</p>
                    </div>
                    {/* Quick delete hover */}
                    <button
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs
                        opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(r.public_id); }}
                      title={`Xóa ${mediaLabel}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
                    disabled={resourcesLoading}
                    onClick={() => loadResources(selectedFolder, nextCursor ?? undefined)}
                  >
                    {resourcesLoading ? 'Đang tải...' : 'Tải thêm ảnh'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Resource Detail Modal ──────────────────────────────────────────────── */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900 truncate">{selectedImage.public_id.split('/').pop()}</h3>
              <button className="text-gray-400 hover:text-gray-600 text-xl" onClick={() => setSelectedImage(null)}>✕</button>
            </div>
            <div className="p-4">
              {selectedType === 'video' ? (
                <video
                  src={selectedImage.secure_url}
                  controls
                  className="w-full rounded-lg max-h-72 bg-black"
                />
              ) : (
                <img
                  src={selectedImage.secure_url}
                  alt={selectedImage.public_id}
                  className="w-full rounded-lg object-contain max-h-72 bg-gray-50"
                />
              )}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-gray-500 font-medium">Public ID</span>
                  <span className="text-gray-800 font-mono text-xs truncate max-w-xs">{selectedImage.public_id}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-gray-500 font-medium">Kích thước</span>
                  <span className="text-gray-800">{selectedImage.width} × {selectedImage.height}px</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-gray-500 font-medium">Dung lượng</span>
                  <span className="text-gray-800">{fmtBytes(selectedImage.bytes)}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-gray-500 font-medium">Format</span>
                  <span className="text-gray-800 uppercase">{selectedImage.format}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <span className="text-gray-500 font-medium">Ngày tải lên</span>
                  <span className="text-gray-800">{new Date(selectedImage.created_at).toLocaleString('vi-VN')}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  onClick={() => copyUrl(selectedImage.secure_url)}
                >
                  📋 Copy URL
                </button>
                <a
                  href={selectedImage.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-gray-50 text-gray-600 border rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  🔗 Mở gốc
                </a>
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm disabled:opacity-60"
                  onClick={() => replaceFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading && busyMsg.startsWith('Đang thay thế') ? '⏳ Đang thay thế...' : '🔄 Cập nhật ảnh'}
                </button>
                <input
                  type="file"
                  accept={mediaAccept}
                  className="hidden"
                  ref={replaceFileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleReplaceImage(e.target.files[0])}
                />
                <button
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  onClick={() => { setConfirmDelete(selectedImage.public_id); }}
                >
                  🗑 Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Resource ────────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Xác nhận xóa {mediaLabel}</h3>
            <p className="text-sm text-gray-600 mb-1">Bạn có chắc muốn xóa:</p>
            <p className="text-xs font-mono bg-gray-100 rounded px-2 py-1 break-all mb-4">{confirmDelete}</p>
            <p className="text-xs text-red-500 mb-4">⚠️ Hành động này không thể hoàn tác và sẽ xóa {mediaLabel} khỏi Cloudinary.</p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                onClick={() => setConfirmDelete(null)}
              >
                Hủy
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                onClick={() => execDeleteResource(confirmDelete)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Folder ─────────────────────────────────────────────── */}
      {confirmDeleteFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Xóa thư mục</h3>
            <p className="text-sm text-gray-600 mb-1">Thư mục: <strong>{confirmDeleteFolder}</strong></p>
            <p className="text-xs text-red-500 mb-4">⚠️ Chỉ có thể xóa thư mục <strong>rỗng</strong>. Hãy xóa tất cả ảnh trước.</p>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm" onClick={() => setConfirmDeleteFolder(null)}>Hủy</button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm" onClick={() => execDeleteFolder(confirmDeleteFolder)}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Folder Modal ──────────────────────────────────────────────────── */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-4">Tạo thư mục mới</h3>
            <p className="text-xs text-gray-500 mb-2">Thư mục sẽ được tạo trong: <strong>{selectedFolder}</strong></p>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Tên thư mục (vd: banners)"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Hủy</button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={handleCreateFolder}>Tạo</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all
          ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AdminMediaManager;
