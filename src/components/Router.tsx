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

// Lazy load pages to prevent module loading issues
const HomePage = lazy(() => import('@/components/pages/HomePage'));
const GaleriaPage = lazy(() => import('@/components/pages/GaleriaPage'));
const ProfilePage = lazy(() => import('@/components/pages/ProfilePage'));
const GamePage = lazy(() => import('@/components/pages/GamePage'));
const GiroPage = lazy(() => import('@/components/pages/GiroPage'));
const LavagemDeDinheiroPage = lazy(() => import('@/components/pages/LavagemDeDinheiroPage'));
const SubornoIlustradoPage = lazy(() => import('@/components/pages/SubornoIlustradoPage'));
const DelacaoPremiadaPage = lazy(() => import('@/components/pages/DelacaoPremiadaPage'));
const ArsenalPage = lazy(() => import('@/components/pages/ArsenalPage'));
const ArmasPage = lazy(() => import('@/components/pages/ArmasPage'));
const LuxoItemPage = lazy(() => import('@/components/pages/LuxoItemPage'));
const BarracoPage = lazy(() => import('@/components/pages/BarracoPage'));
const FugaIlustradaPage = lazy(() => import('@/components/pages/FugaIlustradaPage'));
const ChatPage = lazy(() => import('@/components/pages/ChatPage'));
const TalentsPage = lazy(() => import('@/components/pages/TalentsPage'));
const FactionPage = lazy(() => import('@/components/pages/FactionPage'));
const RankingPage = lazy(() => import('@/components/pages/RankingPage'));
const GangPage = lazy(() => import('@/components/gang/GangPage'));

const LoadingFallback = () => <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

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
        { index: true, element: <Suspense fallback={<LoadingFallback />}><HomePage /></Suspense> },

        {
          path: 'galeria',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <FeatureGateRoute branch="luxury">
                <GaleriaPage />
              </FeatureGateRoute>
            </Suspense>
          ),
        },

        { path: 'profile', element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><ProfilePage /></ProtectedRoute></Suspense> },
        { path: 'game',    element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><GamePage /></ProtectedRoute></Suspense> },
        { path: 'chat',    element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><ChatPage /></ProtectedRoute></Suspense> },

        {
          path: 'giro',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="giro">
                  <GiroPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        {
          path: 'lavagem-de-dinheiro',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="lavagem">
                  <LavagemDeDinheiroPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        {
          path: 'suborno-ilustrado',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="bribery">
                  <SubornoIlustradoPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        { path: 'delacao-premiada', element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><DelacaoPremiadaPage /></ProtectedRoute></Suspense> },

        {
          path: 'arsenal',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="arsenal">
                  <ArsenalPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        { path: 'armas',     element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><ArmasPage /></ProtectedRoute></Suspense> },
        { path: 'luxo-item', element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><LuxoItemPage /></ProtectedRoute></Suspense> },
        { path: 'barraco',   element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><BarracoPage /></ProtectedRoute></Suspense> },

        {
          path: 'fuga-ilustrada',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="fuga">
                  <FugaIlustradaPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        {
          path: 'talentos',
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="talents">
                  <TalentsPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        { path: 'faccao',  element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><FactionPage /></ProtectedRoute></Suspense> },
        { path: 'ranking', element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><RankingPage /></ProtectedRoute></Suspense> },
        { path: 'gang',    element: <Suspense fallback={<LoadingFallback />}><ProtectedRoute><GangPage /></ProtectedRoute></Suspense> },
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
