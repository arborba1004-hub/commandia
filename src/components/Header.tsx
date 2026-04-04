import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { LogOut, Settings } from 'lucide-react';
import { Image } from '@/components/ui/image';
import HeaderCustomizationModal from '@/components/HeaderCustomizationModal';

export default function Header() {
  const { player } = usePlayerStore();
  const { logout } = useGoogleAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAuthenticated = !!player?._id;

  // LÓGICA DO NOME: Prioriza o nome personalizado do Header, depois o nome da conta, e por fim o padrão.
  const playerName = (
    player?.headerCustomization?.customName || 
    player?.name || 
    'CAPO GHOST'
  ).toUpperCase();

  const dirtyMoney = Number(player?.balances?.dirtyMoney ?? 0);
  const cleanMoney = Number(player?.balances?.cleanMoney ?? 0);
  const corre = Number(player?.balances?.corre ?? 0);
  const playerLevel = Number(player?.niveis?.playerLevel ?? 1);

  const power = Number(player?.power ?? 0);
  const hierarchyBadge = (player?.hierarchyBadge || 'RECRUTA').toUpperCase();

  const avatar =
    player?.avatar ||
    'https://static.wixstatic.com/media/50f4bf_5868d04681cb49d1a58d89dc4493574f~mv2.png';

  const handleLogout = () => {
    logout();
  };

  // Estilos dinâmicos vindos da personalização
  const nameStyle = {
    fontFamily: player?.headerCustomization?.playerNameFont || 'oswald',
    fontSize: player?.headerCustomization?.playerNameFontSize || '1.875rem',
    color: player?.headerCustomization?.playerNameColor || '#d9b764',
  };

  return (
    <header className="w-full bg-black border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* LADO ESQUERDO: AVATAR E INFOS */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Image 
              src={avatar} 
              alt="Avatar" 
              className="w-12 h-12 rounded-full border-2 border-[#d9b764] object-cover" 
            />
            <div className="absolute -bottom-1 -right-1 bg-[#d9b764] text-black text-[10px] font-bold px-1 rounded">
              LVL {playerLevel}
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span style={nameStyle} className="font-bold tracking-tighter leading-none">
                {playerName}
              </span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <span className="text-[10px] text-[#d9b764] font-bold tracking-[0.2em]">
              {hierarchyBadge}
            </span>
          </div>
        </div>

        {/* CENTRO: SALDOS (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/40 uppercase font-bold">Dinheiro Sujo</span>
            <span className="text-red-500 font-mono font-bold">R$ {dirtyMoney.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/40 uppercase font-bold">Dinheiro Limpo</span>
            <span className="text-emerald-400 font-mono font-bold">R$ {cleanMoney.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-white/40 uppercase font-bold">Corre</span>
            <span className="text-purple-400 font-mono font-bold">{corre}</span>
          </div>
        </div>

        {/* LADO DIREITO: BOTÕES */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] text-white/40 uppercase font-bold">Poder de Fogo</span>
            <span className="text-white font-bold">{power.toLocaleString('pt-BR')}</span>
          </div>

          {!isAuthenticated ? (
            <Link
              to="/"
              className="px-6 py-2 rounded-lg bg-[#d9b764] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#c4a45a] transition-colors"
            >
              Entrar
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE PERSONALIZAÇÃO */}
      <HeaderCustomizationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </header>
  );
}
