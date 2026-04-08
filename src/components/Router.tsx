import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { Suspense, lazy } from 'react';

// Lazy load pages to avoid circular dependencies
const HomePage = lazy(() => import('@/components/pages/HomePage').catch(err => {
  console.error('Failed to load HomePage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const ProfilePage = lazy(() => import('@/components/pages/ProfilePage').catch(err => {
  console.error('Failed to load ProfilePage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const GamePage = lazy(() => import('@/components/pages/GamePage').catch(err => {
  console.error('Failed to load GamePage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const GiroPage = lazy(() => import('@/components/pages/GiroPage').catch(err => {
  console.error('Failed to load GiroPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const LuxuryshowroomPage = lazy(() => import('@/components/pages/LuxuryshowroomPage').catch(err => {
  console.error('Failed to load LuxuryshowroomPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const LuxoItemPage = lazy(() => import('@/components/pages/LuxoItemPage').catch(err => {
  console.error('Failed to load LuxoItemPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const LavagemDeDinheiroPage = lazy(() => import('@/components/pages/LavagemDeDinheiroPage').catch(err => {
  console.error('Failed to load LavagemDeDinheiroPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const SubornoIlustradoPage = lazy(() => import('@/components/pages/SubornoIlustradoPage').catch(err => {
  console.error('Failed to load SubornoIlustradoPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const DelacaoPremiadaPage = lazy(() => import('@/components/pages/DelacaoPremiadaPage').catch(err => {
  console.error('Failed to load DelacaoPremiadaPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const ArsenalPage = lazy(() => import('@/components/pages/ArsenalPage').catch(err => {
  console.error('Failed to load ArsenalPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const ArmasPage = lazy(() => import('@/components/pages/ArmasPage').catch(err => {
  console.error('Failed to load ArmasPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const BarracoPage = lazy(() => import('@/components/pages/BarracoPage').catch(err => {
  console.error('Failed to load BarracoPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const FugaIlustradaPage = lazy(() => import('@/components/pages/FugaIlustradaPage').catch(err => {
  console.error('Failed to load FugaIlustradaPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const GangPage = lazy(() => import('@/components/gang/GangPage').catch(err => {
  console.error('Failed to load GangPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const GaleriaPage = lazy(() => import('@/components/pages/GaleriaPage').catch(err => {
  console.error('Failed to load GaleriaPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));
const ChatPage = lazy(() => import('@/components/pages/ChatPage').catch(err => {
  console.error('Failed to load ChatPage:', err);
  return { default: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading page</div> };
}));

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