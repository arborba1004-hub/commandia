import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useState } from 'react';
import AvatarNameCustomizationModal from '@/components/AvatarNameCustomizationModal';
import { Image } from '@/components/ui/image';

const COMMANDS_ICON = 'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';
const LOGO_URL      = 'https://static.wixstatic.com/media/50f4bf_9e06e6237b1c4e87997633edc2d94227~mv2.png';

function fmt(value: number) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)         return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('pt-BR');
}

export default function Header() {
  const navigate = useNavigate();
  const { player, clearPlayer, isLoaded } = usePlayerStore();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const isReady    = Boolean(isLoaded && ((player as any)?._id || player?.googleId));
  const avatarUrl  = (player as any)?.headerCustomization?.customAvatar || (player as any)?.avatar || '';
  const playerName = (player as any)?.headerCustomization?.customName   || player?.name || '—';
  const playerLevel = player?.niveis?.barracoLevel ?? 0;
  const dirtyMoney  = player?.balances?.dirtyMoney  ?? 0;
  const cleanMoney  = player?.balances?.cleanMoney  ?? 0;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    clearPlayer();
    navigate('/', { replace: true });
  };

  return (
    <>
      <AvatarNameCustomizationModal
        isOpen={isReady && isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
      />

      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-2">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between
          rounded-2xl border border-[#6f3d08]
          bg-[linear-gradient(90deg,#120804_0%,#2d0d06_20%,#111111_50%,#2d0d06_80%,#120804_100%)]
          shadow-[0_0_20px_rgba(0,0,0,0.5)] px-3 py-2">

          {/* ESQUERDA — logo + avatar + nome */}
          <div className="flex items-center gap-2">
            {/* Logo */}
            <button type="button" onClick={() => navigate('/')} className="shrink-0">
              <Image src={LOGO_URL} alt="Domínio do Comando" className="h-10 w-10 object-contain" draggable={false} />
            </button>

            {/* Avatar */}
            {isReady && (
              <button type="button" onClick={() => setIsCustomizationOpen(true)}
                className="relative shrink-0 group">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={playerName} className="h-11 w-11 rounded-xl border-2 border-[#d9b764] object-cover shadow-[0_0_8px_rgba(217,183,100,0.35)]" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#d9b764] bg-zinc-900 text-lg font-black text-[#d9b764]">
                    {playerName[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {/* Nível */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#d9b764] px-1.5 py-0.5 text-[8px] font-black text-black whitespace-nowrap">
                  {playerLevel}
                </div>
              </button>
            )}

            {/* Nome */}
            {isReady && (
              <div>
                <button type="button" onClick={() => setIsCustomizationOpen(true)}
                  className="block font-black text-[#f6d27b] text-sm uppercase tracking-wide leading-none hover:text-[#ffe8a3] truncate max-w-[120px]">
                  {playerName}
                </button>
              </div>
            )}

            {!isReady && (
              <button onClick={() => navigate('/')}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-red-500">
                Entrar
              </button>
            )}
          </div>

          {/* DIREITA — saldos + sair */}
          {isReady && (
            <div className="flex items-center gap-2">
              {/* Commands Sujo */}
              <div className="flex items-center gap-1 rounded-xl bg-black/50 border border-white/10 px-2.5 py-1.5">
                <Image src={COMMANDS_ICON} alt="" className="h-4 w-4 object-contain" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Sujo</span>
                  <span className="text-[11px] font-black text-white">{fmt(dirtyMoney)}</span>
                </div>
              </div>

              {/* Commands Limpo */}
              <div className="flex items-center gap-1 rounded-xl bg-black/50 border border-white/10 px-2.5 py-1.5">
                <Image src={COMMANDS_ICON} alt="" className="h-4 w-4 object-contain" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Limpo</span>
                  <span className="text-[11px] font-black text-white">{fmt(cleanMoney)}</span>
                </div>
              </div>

              {/* Sair */}
              <button onClick={handleLogout}
                className="rounded-xl border border-[#6f3d08] bg-black/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-white hover:bg-white/10">
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}