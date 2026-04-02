import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import GaleriaPage from '@/components/pages/GaleriaPage';
import ProfilePage from '@/components/pages/ProfilePage';
import GamePage from '@/components/pages/GamePage';
import GiroPage from '@/components/pages/GiroPage';
import LuxuryshowroomPage from '@/components/pages/LuxuryshowroomPage';
import LavagemDeDinheiroPage from '@/components/pages/LavagemDeDinheiroPage';
import SubornoIlustradoPage from '@/components/pages/SubornoIlustradoPage';
import DelacaoPremiadaPage from '@/components/pages/DelacaoPremiadaPage';
import ArsenalPage from '@/components/pages/ArsenalPage';
import ArmasPage from '@/components/pages/ArmasPage';
import GangPage from '@/components/gang/GangPage';

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
      path: "/",
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "galeria",
          element: <GaleriaPage />,
        },
        {
          path: "profile",
          element: <ProfilePage />,
        },
        {
          path: "game",
          element: <GamePage />,
        },
        {
          path: "giro",
          element: <GiroPage />,
        },
        {
          path: "luxuryshowroom",
          element: <LuxuryshowroomPage />,
        },
        {
          path: "lavagem-de-dinheiro",
          element: <LavagemDeDinheiroPage />,
        },
        {
          path: "suborno-ilustrado",
          element: <SubornoIlustradoPage />,
        },
        {
          path: "delacao-premiada",
          element: <DelacaoPremiadaPage />,
        },
        {
          path: "arsenal",
          element: <ArsenalPage />,
        },
        {
          path: "armas",
          element: <ArmasPage />,
        },
        {
          path: "gang",
          element: <GangPage />,
        },
        {
          path: "*",
          element: <Navigate to="/" replace />,
        },
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