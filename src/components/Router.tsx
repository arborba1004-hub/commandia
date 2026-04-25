import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import FeatureGateRoute from '@/components/routes/FeatureGateRoute';
import ProtectedRoute from '@/components/routes/ProtectedRoute';

// Lazy load pages to prevent circular dependencies
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

const LoadingFallback = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

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
            <Suspense fallback={<LoadingFallback />}>
              <FeatureGateRoute branch="luxury">
                <GaleriaPage />
              </FeatureGateRoute>
            </Suspense>
          ),
        },

        { path: 'profile', element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><ProfilePage /></Suspense></ProtectedRoute> },
        { path: 'game',    element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><GamePage /></Suspense></ProtectedRoute> },
        { path: 'chat',    element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><ChatPage /></Suspense></ProtectedRoute> },

        {
          path: 'giro',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FeatureGateRoute branch="giro">
                  <GiroPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        {
          path: 'lavagem-de-dinheiro',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FeatureGateRoute branch="lavagem">
                  <LavagemDeDinheiroPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        {
          path: 'suborno-ilustrado',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FeatureGateRoute branch="bribery">
                  <SubornoIlustradoPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        { path: 'delacao-premiada', element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><DelacaoPremiadaPage /></Suspense></ProtectedRoute> },

        {
          path: 'arsenal',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FeatureGateRoute branch="arsenal">
                  <ArsenalPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        { path: 'armas',     element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><ArmasPage /></Suspense></ProtectedRoute> },
        { path: 'luxo-item', element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><LuxoItemPage /></Suspense></ProtectedRoute> },
        { path: 'barraco',   element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><BarracoPage /></Suspense></ProtectedRoute> },

        {
          path: 'fuga-ilustrada',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FeatureGateRoute branch="fuga">
                  <FugaIlustradaPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        {
          path: 'talentos',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FeatureGateRoute branch="talents">
                  <TalentsPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        { path: 'faccao',  element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><FactionPage /></Suspense></ProtectedRoute> },
        { path: 'ranking', element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><RankingPage /></Suspense></ProtectedRoute> },
        { path: 'gang',    element: <ProtectedRoute><Suspense fallback={<LoadingFallback />}><GangPage /></Suspense></ProtectedRoute> },
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
