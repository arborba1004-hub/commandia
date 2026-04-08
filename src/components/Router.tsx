// src/components/Router.tsx
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import PlayerPersistenceProvider from '@/components/PlayerPersistenceProvider';

// Lazy load all pages to prevent circular dependencies
const HomePage = lazy(() => import('@/components/pages/HomePage'));
const GaleriaPage = lazy(() => import('@/components/pages/GaleriaPage'));
const ProfilePage = lazy(() => import('@/components/pages/ProfilePage'));
const GamePage = lazy(() => import('@/components/pages/GamePage'));
const GiroPage = lazy(() => import('@/components/pages/GiroPage'));
const LuxuryshowroomPage = lazy(() => import('@/components/pages/LuxuryshowroomPage'));
const LavagemDeDinheiroPage = lazy(() => import('@/components/pages/LavagemDeDinheiroPage'));
const SubornoIlustradoPage = lazy(() => import('@/components/pages/SubornoIlustradoPage'));
const DelacaoPremiadaPage = lazy(() => import('@/components/pages/DelacaoPremiadaPage'));
const ArsenalPage = lazy(() => import('@/components/pages/ArsenalPage'));
const ArmasPage = lazy(() => import('@/components/pages/ArmasPage'));
const GangPage = lazy(() => import('@/components/gang/GangPage'));
const LuxoItemPage = lazy(() => import('@/components/pages/LuxoItemPage'));
const BarracoPage = lazy(() => import('@/components/pages/BarracoPage'));
const FugaIlustradaPage = lazy(() => import('@/components/pages/FugaIlustradaPage'));
const ChatPage = lazy(() => import('@/components/pages/ChatPage'));
const MatchmakingPage = lazy(() => import('@/components/pages/MatchmakingPage'));
const MatchPage = lazy(() => import('@/components/pages/MatchPage'));

// Fallback component for loading states
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
      { path: 'galeria', element: <Suspense fallback={<PageLoader />}><GaleriaPage /></Suspense> },
      { path: 'profile', element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },
      { path: 'game', element: <Suspense fallback={<PageLoader />}><GamePage /></Suspense> },
      { path: 'giro', element: <Suspense fallback={<PageLoader />}><GiroPage /></Suspense> },
      { path: 'luxuryshowroom', element: <Suspense fallback={<PageLoader />}><LuxuryshowroomPage /></Suspense> },
      { path: 'lavagem-de-dinheiro', element: <Suspense fallback={<PageLoader />}><LavagemDeDinheiroPage /></Suspense> },
      { path: 'suborno-ilustrado', element: <Suspense fallback={<PageLoader />}><SubornoIlustradoPage /></Suspense> },
      { path: 'delacao-premiada', element: <Suspense fallback={<PageLoader />}><DelacaoPremiadaPage /></Suspense> },
      { path: 'arsenal', element: <Suspense fallback={<PageLoader />}><ArsenalPage /></Suspense> },
      { path: 'armas', element: <Suspense fallback={<PageLoader />}><ArmasPage /></Suspense> },
      { path: 'gang', element: <Suspense fallback={<PageLoader />}><GangPage /></Suspense> },
      { path: 'luxo-item', element: <Suspense fallback={<PageLoader />}><LuxoItemPage /></Suspense> },
      { path: 'barraco', element: <Suspense fallback={<PageLoader />}><BarracoPage /></Suspense> },
      { path: 'fuga-ilustrada', element: <Suspense fallback={<PageLoader />}><FugaIlustradaPage /></Suspense> },
      { path: 'chat', element: <Suspense fallback={<PageLoader />}><ChatPage /></Suspense> },
      { path: 'matchmaking', element: <Suspense fallback={<PageLoader />}><MatchmakingPage /></Suspense> },
      { path: 'match/:matchId', element: <Suspense fallback={<PageLoader />}><MatchPage /></Suspense> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <PlayerPersistenceProvider>
      <RouterProvider router={router} />
    </PlayerPersistenceProvider>
  );
}