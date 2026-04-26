import { Outlet } from 'react-router-dom';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';


export default function Layout() {
  useGameSocket();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AchievementNotification />
      
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}