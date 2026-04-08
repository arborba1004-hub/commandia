import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { Suspense, lazy } from 'react';

// Lazy load pages to avoid circular dependencies
const HomePage = lazy(() => import('@/components/pages/HomePage'));
const ProfilePage = lazy(() => import('@/components/pages/ProfilePage'));
const GamePage = lazy(() => import('@/components/pages/GamePage'));
const GiroPage = lazy(() => import('@/components/pages/GiroPage'));
const LuxuryshowroomPage = lazy(() => import('@/components/pages/LuxuryshowroomPage'));
const LuxoItemPage = lazy(() => import('@/components/pages/LuxoItemPage'));
const LavagemDeDinheiroPage = lazy(() => import('@/components/pages/LavagemDeDinheiroPage'));
const SubornoIlustradoPage = lazy(() => import('@/components/pages/SubornoIlustradoPage'));
const DelacaoPremiadaPage = lazy(() => import('@/components/pages/DelacaoPremiadaPage'));
const ArsenalPage = lazy(() => import('@/components/pages/ArsenalPage'));
const ArmasPage = lazy(() => import('@/components/pages/ArmasPage'));
const BarracoPage = lazy(() => import('@/components/pages/BarracoPage'));
const FugaIlustradaPage = lazy(() => import('@/components/pages/FugaIlustradaPage'));
const GangPage = lazy(() => import('@/components/gang/GangPage'));
const GaleriaPage = lazy(() => import('@/components/pages/GaleriaPage'));
const ChatPage = lazy(() => import('@/components/pages/ChatPage'));

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
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

        { path: 'profile', element: <ProfilePage /> },
        { path: 'game', element: <GamePage /> },
        { path: 'giro', element: <GiroPage /> },

        { path: 'luxuryshowroom', element: <LuxuryshowroomPage /> },
        { path: 'luxo-item', element: <LuxoItemPage /> },

        { path: 'lavagem-de-dinheiro', element: <LavagemDeDinheiroPage /> },
        { path: 'suborno-ilustrado', element: <SubornoIlustradoPage /> },
        { path: 'delacao-premiada', element: <DelacaoPremiadaPage /> },

        { path: 'arsenal', element: <ArsenalPage /> },
        { path: 'armas', element: <ArmasPage /> },
        { path: 'barraco', element: <BarracoPage /> },
        { path: 'fuga-ilustrada', element: <FugaIlustradaPage /> },
        { path: 'gang', element: <GangPage /> },
        { path: 'galeria', element: <GaleriaPage /> },
        { path: 'chat', element: <ChatPage /> },

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