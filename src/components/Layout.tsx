import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AchievementNotification />
      <main className="flex-1 pt-[120px] md:pt-[140px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
