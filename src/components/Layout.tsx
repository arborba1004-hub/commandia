import { Outlet } from 'react-router-dom';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useEffect } from 'react';

export default function Layout() {
  // Only initialize socket if user is authenticated
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      useGameSocket();
    }
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