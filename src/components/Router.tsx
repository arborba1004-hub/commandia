import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/components/pages/ErrorPage';

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
const GaleriaPage = lazy(() => import('@/components/pages/GaleriaPage'));
const ChatPage = lazy(() => import('@/components/pages/ChatPage'));
const GangPage = lazy(() => import('@/components/gang/GangPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-sm tracking-widest uppercase opacity-70">
        Carregando...
      </div>
    </div>
  );
}

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}

const basename =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  typeof import.meta.env.BASE_URL === 'string'
    ? import.meta.env.BASE_URL
    : '/';

const router = createBrowserRouter([
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
], {
  basename,
});

export default function AppRouter() {
  return <RouterProvider router={router} />;
}