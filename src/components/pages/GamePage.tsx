import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GamePage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />
      <main className="flex-1" />
      <Footer />
    </div>
  );
}
