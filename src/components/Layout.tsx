import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import { useGameSocket } from '@/hooks/useGameSocket';

export default function Layout() {
  const location = useLocation();
  const shouldConnectSocket = location.pathname !== '/';

  // Socket só sobe nas páginas internas. A Home/login fica leve e não abre
  // conexão realtime antes do jogador realmente entrar no jogo.
  useGameSocket({ enabled: shouldConnectSocket });

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