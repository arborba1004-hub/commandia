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
import FactionPage from '@/components/pages/FactionPage';
import RankingPage from '@/components/pages/RankingPage';
import FeatureGateRoute from '@/components/routes/FeatureGateRoute';
import ProtectedRoute from '@/components/routes/ProtectedRoute';

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

        { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
        { path: 'game',    element: <ProtectedRoute><GamePage /></ProtectedRoute> },
        { path: 'chat',    element: <ProtectedRoute><ChatPage /></ProtectedRoute> },

        {
          path: 'giro',
          element: (
            <ProtectedRoute>
              <FeatureGateRoute branch="giro">
                <GiroPage />
              </FeatureGateRoute>
            </ProtectedRoute>
          ),
        },

        {
          path: 'lavagem-de-dinheiro',
          element: (
            <ProtectedRoute>
              <FeatureGateRoute branch="lavagem">
                <LavagemDeDinheiroPage />
              </FeatureGateRoute>
            </ProtectedRoute>
          ),
        },

        {
          path: 'suborno-ilustrado',
          element: (
            <ProtectedRoute>
              <FeatureGateRoute branch="bribery">
                <SubornoIlustradoPage />
              </FeatureGateRoute>
            </ProtectedRoute>
          ),
        },

        { path: 'delacao-premiada', element: <ProtectedRoute><DelacaoPremiadaPage /></ProtectedRoute> },

        {
          path: 'arsenal',
          element: (
            <ProtectedRoute>
              <FeatureGateRoute branch="arsenal">
                <ArsenalPage />
              </FeatureGateRoute>
            </ProtectedRoute>
          ),
        },

        { path: 'armas',     element: <ProtectedRoute><ArmasPage /></ProtectedRoute> },
        { path: 'luxo-item', element: <ProtectedRoute><LuxoItemPage /></ProtectedRoute> },
        { path: 'barraco',   element: <ProtectedRoute><BarracoPage /></ProtectedRoute> },

        {
          path: 'fuga-ilustrada',
          element: (
            <ProtectedRoute>
              <FeatureGateRoute branch="fuga">
                <FugaIlustradaPage />
              </FeatureGateRoute>
            </ProtectedRoute>
          ),
        },

        { path: 'faccao',  element: <ProtectedRoute><FactionPage /></ProtectedRoute> },
        { path: 'ranking', element: <ProtectedRoute><RankingPage /></ProtectedRoute> },
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
