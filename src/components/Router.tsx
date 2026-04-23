import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import FeatureGateRoute from '@/components/routes/FeatureGateRoute';
import ProtectedRoute from '@/components/routes/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load heavy pages to prevent module fetch errors
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
const FactionPage = lazy(() => import('@/components/pages/FactionPage'));
const RankingPage = lazy(() => import('@/components/pages/RankingPage'));

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
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
            <Suspense fallback={<LoadingSpinner />}>
              <FeatureGateRoute branch="luxury">
                <GaleriaPage />
              </FeatureGateRoute>
            </Suspense>
          ),
        },

        { path: 'profile', element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ProfilePage /></Suspense></ProtectedRoute> },
        { path: 'game',    element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><GamePage /></Suspense></ProtectedRoute> },
        { path: 'chat',    element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ChatPage /></Suspense></ProtectedRoute> },

        {
          path: 'giro',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
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
              <Suspense fallback={<LoadingSpinner />}>
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
              <Suspense fallback={<LoadingSpinner />}>
                <FeatureGateRoute branch="bribery">
                  <SubornoIlustradoPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        { path: 'delacao-premiada', element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><DelacaoPremiadaPage /></Suspense></ProtectedRoute> },

        {
          path: 'arsenal',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <FeatureGateRoute branch="arsenal">
                  <ArsenalPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        { path: 'armas',     element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ArmasPage /></Suspense></ProtectedRoute> },
        { path: 'luxo-item', element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><LuxoItemPage /></Suspense></ProtectedRoute> },
        { path: 'barraco',   element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><BarracoPage /></Suspense></ProtectedRoute> },

        {
          path: 'fuga-ilustrada',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <FeatureGateRoute branch="fuga">
                  <FugaIlustradaPage />
                </FeatureGateRoute>
              </Suspense>
            </ProtectedRoute>
          ),
        },

        { path: 'faccao',  element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><FactionPage /></Suspense></ProtectedRoute> },
        { path: 'ranking', element: <ProtectedRoute><Suspense fallback={<LoadingSpinner />}><RankingPage /></Suspense></ProtectedRoute> },
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
