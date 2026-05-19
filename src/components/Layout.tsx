import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import MasterDevPanel from '@/components/MasterDevPanel';
import { useGameSocket } from '@/hooks/useGameSocket';

export default function Layout() {
  // Always call hooks unconditionally (React rule)
  useGameSocket();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AchievementNotification />
      <MasterDevPanel />
      
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}