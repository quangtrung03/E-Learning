// Helper to resolve file URLs coming from the API.
// Supports both absolute URLs (Cloudinary) and legacy server-relative paths.
export default function resolveFileUrl(url?: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (url.startsWith('/')) return `${apiBaseUrl}${url}`;
  return `${apiBaseUrl}/${url}`;
}
