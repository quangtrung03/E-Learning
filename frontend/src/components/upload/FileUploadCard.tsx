import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/Button';

export type UploadedFileMeta = {
  url: string;
  publicId?: string;
  format?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
};

type Props = {
  title: string;
  description?: string;
  accept: string;
  maxSizeMB: number;
  validateFile?: (file: File) => string | null;
  disabled?: boolean;
  uploadedUrl?: string;
  onUploadedUrlChange: (url: string) => void;
  uploadFile: (file: File, onProgress: (progress: number) => void) => Promise<UploadedFileMeta>;
};

const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export default function FileUploadCard({
  title,
  description,
  accept,
  maxSizeMB,
  validateFile: customValidateFile,
  disabled,
  uploadedUrl,
  onUploadedUrlChange,
  uploadFile,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  const resetSelection = useCallback(() => {
    setSelectedFile(null);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const validateFile = useCallback(
    (file: File) => {
      if (!file) return 'Vui lòng chọn file';
      const customError = customValidateFile?.(file);
      if (customError) return customError;
      if (file.size > maxBytes) return `Kích thước file không được vượt quá ${maxSizeMB}MB`;
      return null;
    },
    [customValidateFile, maxBytes, maxSizeMB]
  );

  const onPickFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
      setProgress(0);
    },
    [validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPickFile(e.target.files?.[0]);
    },
    [onPickFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onPickFile(e.dataTransfer.files?.[0]);
    },
    [onPickFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setError(null);

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      const result = await uploadFile(selectedFile, (p) => setProgress(p));
      onUploadedUrlChange(result.url);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi upload file');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadedUrlChange, selectedFile, uploadFile, validateFile]);

  const handleClear = useCallback(() => {
    onUploadedUrlChange('');
    resetSelection();
  }, [onUploadedUrlChange, resetSelection]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{title}</div>
          {description && <div className="text-xs text-gray-600 mt-1">{description}</div>}
        </div>

        {(uploadedUrl || selectedFile) && (
          <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={disabled || isUploading}>
            Xóa
          </Button>
        )}
      </div>

      <div
        className={
          'rounded-xl border-2 border-dashed p-4 bg-white transition-colors ' +
          (isDragging ? 'border-primary-500 bg-gray-50' : 'border-gray-200')
        }
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              Kéo thả file vào đây hoặc{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-primary-700 hover:text-primary-800 font-medium"
                disabled={disabled || isUploading}
              >
                chọn file
              </button>
            </div>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled || isUploading}
            />

            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={disabled || isUploading || !selectedFile || !!uploadedUrl}
            >
              {isUploading ? 'Đang upload...' : uploadedUrl ? '✓ Đã upload' : 'Tải lên'}
            </Button>
          </div>

          {selectedFile && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{formatMB(selectedFile.size)}</div>
                </div>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 text-center">{progress}%</div>
            </div>
          )}

          {uploadedUrl && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <span className="font-medium">Đã upload thành công.</span>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary-700 hover:text-primary-800 underline"
              >
                Mở file
              </a>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="text-xs text-gray-500">
            Giới hạn: tối đa {maxSizeMB}MB.
          </div>
        </div>
      </div>
    </div>
  );
}
