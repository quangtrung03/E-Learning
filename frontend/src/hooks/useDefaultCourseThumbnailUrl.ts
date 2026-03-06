import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';

let cachedUrl: string | null = null;
let pendingPromise: Promise<string | null> | null = null;

export default function useDefaultCourseThumbnailUrl() {
  const [url, setUrl] = useState<string | null>(cachedUrl);

  useEffect(() => {
    if (cachedUrl !== null) {
      setUrl(cachedUrl);
      return;
    }

    if (!pendingPromise) {
      pendingPromise = settingsAPI
        .getDefaultCourseThumbnail()
        .then((res) => {
          const next = res.data?.data?.url || null;
          cachedUrl = next;
          return next;
        })
        .catch(() => {
          cachedUrl = null;
          return null;
        })
        .finally(() => {
          pendingPromise = null;
        });
    }

    pendingPromise.then((next) => setUrl(next));
  }, []);

  return url;
}
