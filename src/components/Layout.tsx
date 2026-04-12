import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] md:pt-[140px]">
        <Outlet />
      </main>
    </div>
  );
}
