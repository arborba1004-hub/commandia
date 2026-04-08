import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

export default function GamePage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { player } = usePlayerStore();

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Galeria', path: '/galeria' },
    { name: 'Perfil', path: '/profile' },
    { name: 'Giro', path: '/giro' },
    { name: 'Luxo Showroom', path: '/luxuryshowroom' },
    { name: 'Lavagem de Dinheiro', path: '/lavagem-de-dinheiro' },
    { name: 'Suborno Ilustrado', path: '/suborno-ilustrado' },
    { name: 'Delação Premiada', path: '/delacao-premiada' },
    { name: 'Arsenal', path: '/arsenal' },
    { name: 'Armas', path: '/armas' },
    { name: 'Gang', path: '/gang' },
    { name: 'Barraco', path: '/barraco' },
    { name: 'Fuga Ilustrada', path: '/fuga-ilustrada' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col">
      <header className="border-b border-red-900/30 bg-black/80 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-red-400">JOGO</h1>
            <p className="text-sm text-zinc-400">Bem-vindo, {player?.name || 'Jogador'}</p>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {isMenuOpen && (
          <nav className="w-64 border-r border-red-900/30 bg-black/50 p-4 overflow-y-auto">
            <h3 className="text-red-400 font-black text-lg mb-4">Navegação</h3>
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => handleNavigate(page.path)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-red-950/20 text-white hover:bg-red-900/40 transition-colors font-semibold text-sm"
                >
                  {page.name}
                </button>
              ))}
            </div>
          </nav>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-950/30 to-black border border-red-900/30 rounded-2xl p-8">
              <h2 className="text-4xl font-black text-red-400 mb-6">Mapa do Jogo</h2>
              
              <div className="bg-black/50 rounded-xl p-8 mb-6 border border-red-900/20 min-h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-zinc-400 text-lg mb-4">
                    Carregando ambiente 3D...
                  </p>
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                  <h3 className="font-black text-red-400 mb-2">Level</h3>
                  <p className="text-2xl font-bold text-white">
                    {player?.niveis?.barracoLevel || 1}
                  </p>
                </div>
                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                  <h3 className="font-black text-red-400 mb-2">Power</h3>
                  <p className="text-2xl font-bold text-white">
                    {player?.power || 0}
                  </p>
                </div>
                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                  <h3 className="font-black text-red-400 mb-2">Dinheiro Sujo</h3>
                  <p className="text-2xl font-bold text-red-300">
                    {(player?.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
