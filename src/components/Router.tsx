import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import GaleriaPage from '@/components/pages/GaleriaPage';
import ProfilePage from '@/components/pages/ProfilePage';
import GamePage from '@/components/pages/GamePage';
import GiroPage from '@/components/pages/GiroPage';
import LuxuryshowroomPage from '@/components/pages/LuxuryshowroomPage';
import LavagemDeDinheiroPage from '@/components/pages/LavagemDeDinheiroPage';
import SubornoIlustradoPage from '@/components/pages/SubornoIlustradoPage';
import DelacaoPremiadaPage from '@/components/pages/DelacaoPremiadaPage';
import ArsenalPage from '@/components/pages/ArsenalPage';
import ArmasPage from '@/components/pages/ArmasPage';
import GangPage from '@/components/gang/GangPage';
import LuxoItemPage from '@/components/pages/LuxoItemPage';
import BarracoPage from '@/components/pages/BarracoPage';
import FugaIlustradaPage from '@/components/pages/FugaIlustradaPage';
import ChatPage from '@/components/pages/ChatPage';
import TalentsPage from '@/components/pages/TalentsPage';
import FactionPage from '@/components/pages/FactionPage';
import FeatureGateRoute from '@/components/routes/FeatureGateRoute';

// FASE 6: Páginas legadas/experimentais removidas do fluxo principal
// - HomePageNew (arquivo preservado em src/components/pages/HomePageNew.tsx)
// - MatchPage (arquivo preservado em src/components/pages/MatchPage.tsx)
// - MatchmakingPage (arquivo preservado em src/components/pages/MatchmakingPage.tsx)

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'galeria',
        element: (
          <FeatureGateRoute branch="luxury">
            <GaleriaPage />
          </FeatureGateRoute>
        ),
      },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'game', element: <GamePage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'giro', element: <GiroPage /> },
      { path: 'luxuryshowroom', element: <LuxuryshowroomPage /> },
      {
        path: 'lavagem-de-dinheiro',
        element: (
          <FeatureGateRoute branch="lavagem">
            <LavagemDeDinheiroPage />
          </FeatureGateRoute>
        ),
      },
      { path: 'suborno-ilustrado', element: <SubornoIlustradoPage /> },
      { path: 'delacao-premiada', element: <DelacaoPremiadaPage /> },
      {
        path: 'arsenal',
        element: (
          <FeatureGateRoute branch="arsenal">
            <ArsenalPage />
          </FeatureGateRoute>
        ),
      },
      { path: 'armas', element: <ArmasPage /> },
      { path: 'gang', element: <GangPage /> },
      { path: 'luxo-item', element: <LuxoItemPage /> },
      { path: 'barraco', element: <BarracoPage /> },
      { path: 'fuga-ilustrada', element: <FugaIlustradaPage /> },
      {
        path: 'talentos',
        element: (
          <FeatureGateRoute branch="talents">
            <TalentsPage />
          </FeatureGateRoute>
        ),
      },
      {
        path: 'faccao',
        element: (
          <FeatureGateRoute branch="faction">
            <FactionPage />
          </FeatureGateRoute>
        ),
      },
      // FASE 6: Rotas legadas removidas
      // { path: 'home-new', element: <HomePageNew /> },
      // { path: 'match', element: <MatchPage /> },
      // { path: 'matchmaking', element: <MatchmakingPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return <RouterProvider router={router} />;
}