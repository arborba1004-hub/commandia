import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load all pages to prevent module resolution issues
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

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
}

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
        { index: true, element: <PageWrapper><HomePage /></PageWrapper> },

        {
          path: 'galeria',
          element: (
            <PageWrapper>
              <FeatureGateRoute branch="luxury">
                <GaleriaPage />
              </FeatureGateRoute>
            </PageWrapper>
          ),
        },

        { path: 'profile', element: <PageWrapper><ProtectedRoute><ProfilePage /></ProtectedRoute></PageWrapper> },
        { path: 'game',    element: <PageWrapper><ProtectedRoute><GamePage /></ProtectedRoute></PageWrapper> },
        { path: 'chat',    element: <PageWrapper><ProtectedRoute><ChatPage /></ProtectedRoute></PageWrapper> },

        {
          path: 'giro',
          element: (
            <PageWrapper>
              <ProtectedRoute>
                <FeatureGateRoute branch="giro">
                  <GiroPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </PageWrapper>
          ),
        },

        {
          path: 'lavagem-de-dinheiro',
          element: (
            <PageWrapper>
              <ProtectedRoute>
                <FeatureGateRoute branch="lavagem">
                  <LavagemDeDinheiroPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </PageWrapper>
          ),
        },

        {
          path: 'suborno-ilustrado',
          element: (
            <PageWrapper>
              <ProtectedRoute>
                <FeatureGateRoute branch="bribery">
                  <SubornoIlustradoPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </PageWrapper>
          ),
        },

        { path: 'delacao-premiada', element: <PageWrapper><ProtectedRoute><DelacaoPremiadaPage /></ProtectedRoute></PageWrapper> },

        {
          path: 'arsenal',
          element: (
            <PageWrapper>
              <ProtectedRoute>
                <FeatureGateRoute branch="arsenal">
                  <ArsenalPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </PageWrapper>
          ),
        },

        { path: 'armas',     element: <PageWrapper><ProtectedRoute><ArmasPage /></ProtectedRoute></PageWrapper> },
        { path: 'luxo-item', element: <PageWrapper><ProtectedRoute><LuxoItemPage /></ProtectedRoute></PageWrapper> },
        { path: 'barraco',   element: <PageWrapper><ProtectedRoute><BarracoPage /></ProtectedRoute></PageWrapper> },

        {
          path: 'fuga-ilustrada',
          element: (
            <PageWrapper>
              <ProtectedRoute>
                <FeatureGateRoute branch="fuga">
                  <FugaIlustradaPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </PageWrapper>
          ),
        },

        {
          path: 'talentos',
          element: (
            <PageWrapper>
              <ProtectedRoute>
                <FeatureGateRoute branch="talents">
                  <TalentsPage />
                </FeatureGateRoute>
              </ProtectedRoute>
            </PageWrapper>
          ),
        },

        { path: 'faccao',  element: <PageWrapper><ProtectedRoute><FactionPage /></ProtectedRoute></PageWrapper> },
        { path: 'ranking', element: <PageWrapper><ProtectedRoute><RankingPage /></ProtectedRoute></PageWrapper> },
        { path: 'gang',    element: <PageWrapper><ProtectedRoute><GangPage /></ProtectedRoute></PageWrapper> },
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
  return <RouterProvider router={router} />;
}

export default AppRouter;
