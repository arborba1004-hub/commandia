import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load all page components to reduce bundle size
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

import FeatureGateRoute from '@/components/routes/FeatureGateRoute';
import ProtectedRoute from '@/components/routes/ProtectedRoute';

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}

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
        { index: true, element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },

        {
          path: 'galeria',
          element: (
            <Suspense fallback={<PageLoader />}>
              <FeatureGateRoute branch="luxury">
                <GaleriaPage />
              </FeatureGateRoute>
            </Suspense>
          ),
        },

        { path: 'profile', element: <Suspense fallback={<PageLoader />}><ProtectedRoute><ProfilePage /></ProtectedRoute></Suspense> },
        { path: 'game',    element: <Suspense fallback={<PageLoader />}><ProtectedRoute><GamePage /></ProtectedRoute></Suspense> },
        { path: 'chat',    element: <Suspense fallback={<PageLoader />}><ProtectedRoute><ChatPage /></ProtectedRoute></Suspense> },

        {
          path: 'giro',
          element: (
            <Suspense fallback={<PageLoader />}>
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
            <Suspense fallback={<PageLoader />}>
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
            <Suspense fallback={<PageLoader />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="bribery">
                  <SubornoIlustradoPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        { path: 'delacao-premiada', element: <Suspense fallback={<PageLoader />}><ProtectedRoute><DelacaoPremiadaPage /></ProtectedRoute></Suspense> },

        {
          path: 'arsenal',
          element: (
            <Suspense fallback={<PageLoader />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="arsenal">
                  <ArsenalPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        { path: 'armas',     element: <Suspense fallback={<PageLoader />}><ProtectedRoute><ArmasPage /></ProtectedRoute></Suspense> },
        { path: 'luxo-item', element: <Suspense fallback={<PageLoader />}><ProtectedRoute><LuxoItemPage /></ProtectedRoute></Suspense> },
        { path: 'barraco',   element: <Suspense fallback={<PageLoader />}><ProtectedRoute><BarracoPage /></ProtectedRoute></Suspense> },

        {
          path: 'fuga-ilustrada',
          element: (
            <Suspense fallback={<PageLoader />}>
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
            <Suspense fallback={<PageLoader />}>
              <ProtectedRoute>
                <FeatureGateRoute branch="talents">
                  <TalentsPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </Suspense>
          ),
        },

        { path: 'faccao',  element: <Suspense fallback={<PageLoader />}><ProtectedRoute><FactionPage /></ProtectedRoute></Suspense> },
        { path: 'ranking', element: <Suspense fallback={<PageLoader />}><ProtectedRoute><RankingPage /></ProtectedRoute></Suspense> },
        { path: 'gang',    element: <Suspense fallback={<PageLoader />}><ProtectedRoute><GangPage /></ProtectedRoute></Suspense> },
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
