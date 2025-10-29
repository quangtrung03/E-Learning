// Helper to resolve avatar/image paths coming from the API.
// Ensures absolute URLs are returned for use in <img src="..." />
export default function resolveAvatar(path?: string) {
  if (!path) return undefined;
  // If it's already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // If path starts with a leading slash, assume it's a server-relative path and prefix API host
  if (path.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL}${path}`;
  }
  // Otherwise assume it's a filename stored under /uploads/avatars
  return `${import.meta.env.VITE_API_URL}/uploads/avatars/${path}`;
}
