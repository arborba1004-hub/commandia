import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import GameSocketBootstrap from '@/components/GameSocketBootstrap';
import { applyGPUOptimizations } from '@/utils/gpuOptimization';

export default function Layout() {
  useEffect(() => {
    // Apply GPU optimizations on app load
    applyGPUOptimizations();
  }, []);

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