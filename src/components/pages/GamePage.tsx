import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col">
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://static.wixstatic.com/media/50f4bf_bfc662c34e36465cbe83cbcce45e640e~mv2.jpeg")',
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />

      <Header />

      <main className="flex-1 flex items-center justify-center relative z-10">
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

          <button
            onClick={() => navigate('/arsenal')}
            className="p-6 bg-white/10 text-white rounded-xl text-xl font-bold hover:bg-white/20 transition"
          >
            Senhor das Armas
          </button>

        </div>
      </main>

      <Footer />
    </div>
  );
}