import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl px-4">

          <button
            onClick={() => navigate('/giro')}
            className="p-6 bg-white/10 text-white rounded-xl text-xl font-bold hover:bg-white/20 transition"
          >
            Giro no Asfalto
          </button>

          <button
            onClick={() => navigate('/suborno-ilustrado')}
            className="p-6 bg-white/10 text-white rounded-xl text-xl font-bold hover:bg-white/20 transition"
          >
            Suborno
          </button>

          <button
            onClick={() => navigate('/luxuryshowroom')}
            className="p-6 bg-white/10 text-white rounded-xl text-xl font-bold hover:bg-white/20 transition"
          >
            Loja de Luxo
          </button>

          <button
            onClick={() => navigate('/lavagem-de-dinheiro')}
            className="p-6 bg-white/10 text-white rounded-xl text-xl font-bold hover:bg-white/20 transition"
          >
            Lavagem de Dinheiro
          </button>

        </div>
      </main>

      <Footer />
    </div>
  );
}