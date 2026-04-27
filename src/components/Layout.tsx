import { Outlet } from 'react-router-dom';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Call hook unconditionally at the top level
  useGameSocket();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AchievementNotification />
      
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}