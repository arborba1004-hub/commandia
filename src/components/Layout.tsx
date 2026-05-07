import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import GameSocketBootstrap from '@/components/GameSocketBootstrap';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GameSocketBootstrap />
      
      <Header />
      <AchievementNotification />
      
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}