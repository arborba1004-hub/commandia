import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GamePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col">

      {/* BACKGROUND */}
      <div
        className="absolute top-0 left-0 w-full h-[40%] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://static.wixstatic.com/media/50f4bf_3af16a6d99f04e67b6805bb21bb1dd39~mv2.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-black/30 z-[5]" />

      {/* CHÃO */}
      <div className="absolute left-0 right-0 bottom-0 top-[48%] z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-bottom"
          style={{
            backgroundImage:
              'url("https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50" />
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* MAPA INTERATIVO (BOTÕES POSICIONADOS) */}
      <div className="absolute left-0 right-0 bottom-0 top-[48%] z-[20]">

        <div className="absolute left-[45%] bottom-[22%]">
          <button onClick={() => navigate('/barraco')} className="bg-black/70 text-white px-3 py-2 rounded">
            🏛️ QG
          </button>
        </div>

        <div className="absolute left-[20%] bottom-[30%]">
          <button onClick={() => navigate('/luxuryshowroom')} className="bg-black/70 text-white px-3 py-2 rounded">
            💎 Luxo
          </button>
        </div>

        <div className="absolute left-[25%] bottom-[15%]">
          <button onClick={() => navigate('/giro')} className="bg-black/70 text-white px-3 py-2 rounded">
            🎰 Giro
          </button>
        </div>

        <div className="absolute right-[20%] bottom-[30%]">
          <button onClick={() => navigate('/suborno-ilustrado')} className="bg-black/70 text-white px-3 py-2 rounded">
            🚔 Delegacia
          </button>
        </div>

        <div className="absolute right-[28%] bottom-[18%]">
          <button onClick={() => navigate('/lavagem-de-dinheiro')} className="bg-black/70 text-white px-3 py-2 rounded">
            🏢 Lavagem
          </button>
        </div>

        <div className="absolute right-[12%] bottom-[12%]">
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