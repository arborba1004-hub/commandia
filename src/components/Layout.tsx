import { Outlet } from 'react-router-dom';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setIsAuthenticated(!!token);
  }, []);

  // Only call hook if authenticated
  if (isAuthenticated) {
    useGameSocket();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AchievementNotification />
      
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}