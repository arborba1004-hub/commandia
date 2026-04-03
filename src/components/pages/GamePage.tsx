import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractiveTileGrid from '@/components/InteractiveTileGrid';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen relative overflow-hidden">

      {/* FUNDO COMPLETO */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://static.wixstatic.com/media/50f4bf_3af16a6d99f04e67b6805bb21bb1dd39~mv2.jpeg")',
        }}
      />

      {/* ESCURECIMENTO */}
      <div className="absolute inset-0 bg-black/30 z-[5]" />

      {/* 3D FULL SCREEN (SEM CORTE!) */}
      <div className="absolute inset-0 z-[10]">
        <InteractiveTileGrid />
      </div>

      {/* UI (CLICÁVEL POR CIMA) */}
      <div className="absolute inset-0 z-[20] pointer-events-none">

        <div className="absolute left-[48%] bottom-[20%] pointer-events-auto">
          <button onClick={() => navigate('/barraco')} className="bg-black/70 text-white px-3 py-2 rounded">
            🏛️ QG
          </button>
        </div>

        <div className="absolute left-[18%] bottom-[30%] pointer-events-auto">
          <button onClick={() => navigate('/luxuryshowroom')} className="bg-black/70 text-white px-3 py-2 rounded">
            💎 Luxo
          </button>
        </div>

        <div className="absolute left-[25%] bottom-[12%] pointer-events-auto">
          <button onClick={() => navigate('/giro')} className="bg-black/70 text-white px-3 py-2 rounded">
            🎰 Giro
          </button>
        </div>

        <div className="absolute right-[18%] bottom-[30%] pointer-events-auto">
          <button onClick={() => navigate('/suborno-ilustrado')} className="bg-black/70 text-white px-3 py-2 rounded">
            🚔 Delegacia
          </button>
        </div>

        <div className="absolute right-[25%] bottom-[18%] pointer-events-auto">
          <button onClick={() => navigate('/lavagem-de-dinheiro')} className="bg-black/70 text-white px-3 py-2 rounded">
            🏢 Lavagem
          </button>
        </div>

        <div className="absolute right-[10%] bottom-[10%] pointer-events-auto">
          <button onClick={() => navigate('/arsenal')} className="bg-black/70 text-white px-3 py-2 rounded">
            🔫 Arsenal
          </button>
        </div>

      </div>

      <Header />
      <Footer />
    </div>
  );
}