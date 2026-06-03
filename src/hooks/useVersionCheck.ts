import { useEffect, useState, useCallback } from 'react';

export interface VersionCheckResult {
  hasNewVersion: boolean;
  currentVersion: string;
  latestVersion: string;
  isChecking: boolean;
}

const VERSION_FILE = '/version.json';
const CHECK_INTERVAL = 60000; // Check every 60 seconds

export function useVersionCheck() {
  const [versionInfo, setVersionInfo] = useState<VersionCheckResult>({
    hasNewVersion: false,
    currentVersion: '',
    latestVersion: '',
    isChecking: false,
  });

  const getCurrentVersion = useCallback(() => {
    // Get version from sessionStorage or localStorage
    const stored = sessionStorage.getItem('appVersion') || localStorage.getItem('appVersion');
    return stored || new Date().toISOString().split('T')[0]; // Fallback to date
  }, []);

  const checkForNewVersion = useCallback(async () => {
    try {
      setVersionInfo(prev => ({ ...prev, isChecking: true }));

      // Fetch version file with cache busting
      const response = await fetch(`${VERSION_FILE}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.statusText}`);
      }

      const data = await response.json();
      const latestVersion = data.version || new Date().toISOString().split('T')[0];
      const currentVersion = getCurrentVersion();

      const hasNewVersion = latestVersion !== currentVersion;

      setVersionInfo({
        hasNewVersion,
        currentVersion,
        latestVersion,
        isChecking: false,
      });

      // If new version is available, update stored version
      if (hasNewVersion) {
        sessionStorage.setItem('appVersion', latestVersion);
        localStorage.setItem('appVersion', latestVersion);
      }

      return hasNewVersion;
    } catch (error) {
      console.warn('Version check failed:', error);
      setVersionInfo(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [getCurrentVersion]);

  const reloadPage = useCallback(() => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Hard reload to bypass cache
    window.location.href = window.location.href;
  }, []);

  // Check for new version on mount and periodically
  useEffect(() => {
    checkForNewVersion();

    const interval = setInterval(() => {
      checkForNewVersion();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkForNewVersion]);

  return {
    ...versionInfo,
    checkForNewVersion,
    reloadPage,
  };
}
