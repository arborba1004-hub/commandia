import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Always call hooks unconditionally (React rule)
  useGameSocket();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AchievementNotification />
      
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}