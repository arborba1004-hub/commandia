import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AchievementNotification from '@/components/AchievementNotification';
import GameSocketBootstrap from '@/components/GameSocketBootstrap';
import { applyGPUOptimizations } from '@/utils/gpuOptimization';
import FeatureGateRoute from '@/components/routes/FeatureGateRoute';
import ProtectedRoute from '@/components/routes/ProtectedRoute';
import HomePage from '@/components/pages/HomePage';
import GaleriaPage from '@/components/pages/GaleriaPage';
import ProfilePage from '@/components/pages/ProfilePage';
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

// Lazy load GamePage to prevent module fetch errors
const GamePage = lazy(() => import('@/components/pages/GamePage'));

function AppRouterLayout() {
  useEffect(() => {
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

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <>
          <ScrollToTop />
          <AppRouterLayout />
        </>
      ),
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
        { path: 'game',    element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><GamePage /></Suspense></ProtectedRoute> },
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
        {
          path: 'talentos',
          element: (
            <ProtectedRoute>
              <FeatureGateRoute branch="talents">
                <TalentsPage />
              </FeatureGateRoute>
            </ProtectedRoute>
          ),
        },
        { path: 'faccao',  element: <ProtectedRoute><FactionPage /></ProtectedRoute> },
        { path: 'ranking', element: <ProtectedRoute><RankingPage /></ProtectedRoute> },
        { path: 'gang',    element: <ProtectedRoute><GangPage /></ProtectedRoute> },
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
    basename: import.meta.env.BASE_URL,
  }
);

function AppRouter() {
  return (
    <RouterProvider router={router} />
  );
}

export default AppRouter;
