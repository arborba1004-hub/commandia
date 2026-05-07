import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Layout from '@/components/Layout';

// Lazy load all page components with proper error handling
const HomePage = lazy(() => import('@/components/pages/HomePage').catch(err => { console.error('Failed to load HomePage:', err); throw err; }));
const GaleriaPage = lazy(() => import('@/components/pages/GaleriaPage').catch(err => { console.error('Failed to load GaleriaPage:', err); throw err; }));
const ProfilePage = lazy(() => import('@/components/pages/ProfilePage').catch(err => { console.error('Failed to load ProfilePage:', err); throw err; }));
const GamePage = lazy(() => import('@/components/pages/GamePage').catch(err => { console.error('Failed to load GamePage:', err); throw err; }));
const GiroPage = lazy(() => import('@/components/pages/GiroPage').catch(err => { console.error('Failed to load GiroPage:', err); throw err; }));
const LavagemDeDinheiroPage = lazy(() => import('@/components/pages/LavagemDeDinheiroPage').catch(err => { console.error('Failed to load LavagemDeDinheiroPage:', err); throw err; }));
const SubornoIlustradoPage = lazy(() => import('@/components/pages/SubornoIlustradoPage').catch(err => { console.error('Failed to load SubornoIlustradoPage:', err); throw err; }));
const DelacaoPremiadaPage = lazy(() => import('@/components/pages/DelacaoPremiadaPage').catch(err => { console.error('Failed to load DelacaoPremiadaPage:', err); throw err; }));
const ArsenalPage = lazy(() => import('@/components/pages/ArsenalPage').catch(err => { console.error('Failed to load ArsenalPage:', err); throw err; }));
const ArmasPage = lazy(() => import('@/components/pages/ArmasPage').catch(err => { console.error('Failed to load ArmasPage:', err); throw err; }));
const LuxoItemPage = lazy(() => import('@/components/pages/LuxoItemPage').catch(err => { console.error('Failed to load LuxoItemPage:', err); throw err; }));
const BarracoPage = lazy(() => import('@/components/pages/BarracoPage').catch(err => { console.error('Failed to load BarracoPage:', err); throw err; }));
const FugaIlustradaPage = lazy(() => import('@/components/pages/FugaIlustradaPage').catch(err => { console.error('Failed to load FugaIlustradaPage:', err); throw err; }));
const ChatPage = lazy(() => import('@/components/pages/ChatPage').catch(err => { console.error('Failed to load ChatPage:', err); throw err; }));
const TalentsPage = lazy(() => import('@/components/pages/TalentsPage').catch(err => { console.error('Failed to load TalentsPage:', err); throw err; }));
const FactionPage = lazy(() => import('@/components/pages/FactionPage').catch(err => { console.error('Failed to load FactionPage:', err); throw err; }));
const RankingPage = lazy(() => import('@/components/pages/RankingPage').catch(err => { console.error('Failed to load RankingPage:', err); throw err; }));
const GangPage = lazy(() => import('@/components/gang/GangPage').catch(err => { console.error('Failed to load GangPage:', err); throw err; }));
const FeatureGateRoute = lazy(() => import('@/components/routes/FeatureGateRoute').catch(err => { console.error('Failed to load FeatureGateRoute:', err); throw err; }));
const ProtectedRoute = lazy(() => import('@/components/routes/ProtectedRoute').catch(err => { console.error('Failed to load ProtectedRoute:', err); throw err; }));

const LoadingFallback = () => <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

function AppRouterLayout() {
  return (
    <>
      <ScrollToTop />
      <Layout />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppRouterLayout />,
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
