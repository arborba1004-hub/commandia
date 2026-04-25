import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';
import { DebugLoader } from '@/components/DebugLoader';

export default function Layout() {
  // Initialize socket globally for all authenticated users
  useGameSocket();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AchievementNotification />
      <DebugLoader />
      <main className="flex-1 pt-[120px] md:pt-[140px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
