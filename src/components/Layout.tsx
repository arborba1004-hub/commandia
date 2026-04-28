import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [error, setError] = useState<Error | null>(null);

  // Always call hooks unconditionally (React rule)
  try {
    useGameSocket();
  } catch (err) {
    console.error('Layout: Error in useGameSocket:', err);
    if (err instanceof Error) {
      setError(err);
    }
  }

  useEffect(() => {
    if (error) {
      console.error('Layout error:', error);
    }
  }, [error]);

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