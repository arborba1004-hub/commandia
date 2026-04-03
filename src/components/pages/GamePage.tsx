import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractiveTileGrid from '@/components/InteractiveTileGrid';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col">

      {/* BACKGROUND (cidade + horizonte) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://static.wixstatic.com/media/50f4bf_bfc662c34e36465cbe83cbcce45e640e~mv2.jpeg")',
        }}
      />

      {/* overlay leve */}
      <div className="absolute inset-0 bg-black/30 z-[5]" />

      {/* CHÃO REAL ALINHADO COM A FOTO */}
      <div className="absolute left-0 right-0 bottom-0 top-[48%] z-10 pointer-events-none overflow-hidden">

        {/* textura real */}
        <div
          className="absolute inset-0 bg-cover bg-bottom"
          style={{
            backgroundImage:
              'url("https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg")',
          }}
        />

        {/* blend suave com o fundo */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50" />

        {/* profundidade */}
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* CAMADA 3D - INTERACTIVE TILE GRID */}
      <div className="absolute left-0 right-0 bottom-0 top-[48%] z-[15]">
        <div className="w-full h-full">
          <InteractiveTileGrid />
        </div>
      </div>

      <Header />

      <main className="flex-1 flex items-center justify-center relative z-20">
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