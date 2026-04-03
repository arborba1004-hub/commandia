import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen relative overflow-hidden">

      {/* FUNDO ÚNICO (cidade + chão juntos) */}
      <div className="absolute inset-0 z-0">

        {/* CIDADE */}
        <div
          className="absolute top-0 left-0 w-full h-[50%] bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://static.wixstatic.com/media/50f4bf_3af16a6d99f04e67b6805bb21bb1dd39~mv2.jpeg")',
          }}
        />

        {/* CHÃO COLADO PERFEITO */}
        <div
          className="absolute bottom-0 left-0 w-full h-[50%] bg-cover bg-top"
          style={{
            backgroundImage:
              'url("https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg")',
          }}
        />

        {/* BLEND SUAVE ENTRE OS DOIS */}
        <div className="absolute top-[45%] left-0 w-full h-[10%] bg-gradient-to-b from-transparent via-black/40 to-transparent" />
      </div>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/20 z-[5]" />

      {/* 👇 AQUI ENTRA O GRID DEPOIS */}
      <div className="absolute inset-0 z-[10]">
        {/* futuramente THREE / GRID */}
      </div>

      {/* BOTÕES TEMPORÁRIOS */}
      <div className="absolute inset-0 z-[20] pointer-events-none">

        <div className="absolute left-[45%] bottom-[22%] pointer-events-auto">
          <button onClick={() => navigate('/barraco')} className="bg-black/70 text-white px-3 py-2 rounded">
            🏛️ QG
          </button>
        </div>

        <div className="absolute left-[20%] bottom-[30%] pointer-events-auto">
          <button onClick={() => navigate('/luxuryshowroom')} className="bg-black/70 text-white px-3 py-2 rounded">
            💎 Luxo
          </button>
        </div>

        <div className="absolute left-[25%] bottom-[15%] pointer-events-auto">
          <button onClick={() => navigate('/giro')} className="bg-black/70 text-white px-3 py-2 rounded">
            🎰 Giro
          </button>
        </div>

        <div className="absolute right-[20%] bottom-[30%] pointer-events-auto">
          <button onClick={() => navigate('/suborno-ilustrado')} className="bg-black/70 text-white px-3 py-2 rounded">
            🚔 Delegacia
          </button>
        </div>

        <div className="absolute right-[28%] bottom-[18%] pointer-events-auto">
          <button onClick={() => navigate('/lavagem-de-dinheiro')} className="bg-black/70 text-white px-3 py-2 rounded">
            🏢 Lavagem
          </button>
        </div>

        {/* Arsenal */}
        <div className="absolute right-[12%] bottom-[12%] pointer-events-auto">
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