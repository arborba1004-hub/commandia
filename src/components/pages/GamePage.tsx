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

      {/* Dark overlay to darken background and make ground appear real */}
      <div className="absolute inset-0 bg-black/40 z-[5]" />

      {/* CHÃO ALINHADO COM A ÁREA DE TERRA DA IMAGEM */}
      <div className="absolute left-0 right-0 bottom-0 top-[48%] z-10 pointer-events-none overflow-hidden">
        {/* textura do chão */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')",
            backgroundRepeat: 'repeat',
            opacity: 0.22,
          }}
        />

        {/* profundidade do chão */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/55" />

        {/* vinheta inferior para dar peso */}
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/65 to-transparent" />
      </div>

      {/* CAMADA INTERATIVA DO MAPA */}
      <div className="absolute bottom-0 left-0 w-full h-[45%] z-20 flex items-end justify-center pb-10">
        <button className="px-6 py-3 bg-black/70 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-black/80 transition">
          🎰 Giro no Asfalto
        </button>
      </div>

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