import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import GaleriaPage from '@/components/pages/GaleriaPage';
import ProfilePage from '@/components/pages/ProfilePage';
import GamePage from '@/components/pages/GamePage';
import GiroPage from '@/components/pages/GiroPage';
import LavagemDeDinheiroPage from '@/components/pages/LavagemDeDinheiroPage';
import SubornoIlustradoPage from '@/components/pages/SubornoIlustradoPage';
import DelacaoPremiadaPage from '@/components/pages/DelacaoPremiadaPage';
import ArsenalPage from '@/components/pages/ArsenalPage';
import ArmasPage from '@/components/pages/ArmasPage';
import LuxoItemPage from '@/components/pages/LuxoItemPage';
import BarracoPage from '@/components/pages/BarracoPage';
import FugaIlustradaPage from '@/components/pages/FugaIlustradaPage';
import ChatPage from '@/components/pages/ChatPage';
import TalentsPage from '@/components/pages/TalentsPage';
import FactionPage from '@/components/pages/FactionPage';
import RankingPage from '@/components/pages/RankingPage';
import GangPage from '@/components/gang/GangPage';
import FeatureGateRoute from '@/components/routes/FeatureGateRoute';

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  [
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

        {
          path: 'giro',
          element: (
            <FeatureGateRoute branch="giro">
              <GiroPage />
            </FeatureGateRoute>
          ),
        },

        {
          path: 'lavagem-de-dinheiro',
          element: (
            <FeatureGateRoute branch="lavagem">
              <LavagemDeDinheiroPage />
            </FeatureGateRoute>
          ),
        },

        {
          path: 'suborno-ilustrado',
          element: (
            <FeatureGateRoute branch="bribery">
              <SubornoIlustradoPage />
            </FeatureGateRoute>
          ),
        },

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
        { path: 'luxo-item', element: <LuxoItemPage /> },
        { path: 'barraco', element: <BarracoPage /> },

        {
          path: 'fuga-ilustrada',
          element: (
            <FeatureGateRoute branch="fuga">
              <FugaIlustradaPage />
            </FeatureGateRoute>
          ),
        },

        {
          path: 'talentos',
          element: (
            <FeatureGateRoute branch="talents">
              <TalentsPage />
            </FeatureGateRoute>
          ),
        },

        { path: 'faccao', element: <FactionPage /> },

        { path: 'ranking', element: <RankingPage /> },

        { path: 'gang', element: <GangPage /> },
        { path: 'luxuryshowroom', element: <Navigate to="/galeria" replace /> },
        { path: 'lavagemdedinheiro', element: <Navigate to="/lavagem-de-dinheiro" replace /> },
        { path: 'subornoilustrado', element: <Navigate to="/suborno-ilustrado" replace /> },
        { path: 'delacaopremiada', element: <Navigate to="/delacao-premiada" replace /> },
        { path: 'fuga', element: <Navigate to="/fuga-ilustrada" replace /> },

        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_NAME,
  }
);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
