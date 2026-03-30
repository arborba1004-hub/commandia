import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import GaleriaPage from '@/components/pages/GaleriaPage';
import ProfilePage from '@/components/pages/ProfilePage';
import GamePage from '@/components/pages/GamePage';
import GiroPage from '@/components/pages/GiroPage';
import LuxuryshowroomPage from '@/components/pages/LuxuryshowroomPage';

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
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        routeMetadata: {
          pageIdentifier: 'home',
        },
      },
      {
        path: "galeria",
        element: <GaleriaPage />,
        routeMetadata: {
          pageIdentifier: 'galeria',
        },
      },
      {
        path: "profile",
        element: <ProfilePage />,
        routeMetadata: {
          pageIdentifier: 'profile',
        },
      },
      {
        path: "game",
        element: <GamePage />,
        routeMetadata: {
          pageIdentifier: 'game',
        },
      },
      {
        path: "giro",
        element: <GiroPage />,
        routeMetadata: {
          pageIdentifier: 'giro',
        },
      },
      {
        path: "luxuryshowroom",
        element: <LuxuryshowroomPage />,
        routeMetadata: {
          pageIdentifier: 'luxuryshowroom',
        },
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return <RouterProvider router={router} />;
}