import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useState, type ReactNode } from 'react';
import AvatarNameCustomizationModal from '@/components/AvatarNameCustomizationModal';
import { Image } from '@/components/ui/image';
import { disconnectSocket } from '@/socket';
import { Zap } from 'lucide-react';

const COMMANDS_ICON = 'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';
const LOGO_URL = 'https://static.wixstatic.com/media/50f4bf_9e06e6237b1c4e87997633edc2d94227~mv2.png';

function fmt(value: number) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('pt-BR');
}

function ResourcePill({
  label,
  value,
  icon,
  iconAlt = '',
  iconClassName = 'h-3.5 w-3.5 object-contain sm:h-4 sm:w-4',
  iconNode,
}: {
  label: string;
  value: number;
  icon?: string;
  iconAlt?: string;
  iconClassName?: string;
  iconNode?: ReactNode;
}) {
  return (
    <div className="flex min-w-[66px] shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-black/55 px-1.5 py-1 shadow-[0_0_12px_rgba(0,0,0,0.35)] sm:min-w-[88px] sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-1.5">
      <div className="shrink-0">
        {iconNode ? iconNode : icon ? <Image src={icon} alt={iconAlt} className={iconClassName} /> : null}
      </div>
      <div className="flex min-w-0 flex-col leading-none">
        <span className="text-[7px] font-bold uppercase text-zinc-500 sm:text-[8px]">{label}</span>
        <span className="whitespace-nowrap text-[10px] font-black text-white sm:text-[11px]">{fmt(value)}</span>
      </div>
    </div>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.player);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const isReady = Boolean(isLoaded && ((player as any)?._id || player?.googleId));
  const avatarUrl = (player as any)?.headerCustomization?.customAvatar || (player as any)?.avatar || '';
  const playerName = (player as any)?.headerCustomization?.customName || player?.name || '—';
  const playerLevel = player?.niveis?.barracoLevel ?? 0;
  const dirtyMoney = player?.balances?.dirtyMoney ?? 0;
  const cleanMoney = player?.balances?.cleanMoney ?? 0;
  const corre = player?.balances?.corre ?? 0;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    disconnectSocket();
    clearPlayer();
    navigate('/', { replace: true });
  };

  return (
    <>
      <AvatarNameCustomizationModal isOpen={isReady && isCustomizationOpen} onClose={() => setIsCustomizationOpen(false)} />

      <header className="fixed inset-x-0 top-0 z-[100] px-1.5 pt-1.5 sm:px-3 sm:pt-2">
        <div className="mx-auto flex min-h-[58px] max-w-[1600px] items-center justify-between gap-1.5 rounded-2xl border border-[#6f3d08] bg-[linear-gradient(90deg,#120804_0%,#2d0d06_22%,#111111_52%,#2d0d06_82%,#120804_100%)] px-2 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.55)] sm:min-h-[64px] sm:gap-3 sm:px-3 sm:py-2">
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => navigate('/')} className="shrink-0" aria-label="Ir para Home">
              <Image src={LOGO_URL} alt="Domínio do Comando" className="h-8 w-8 object-contain sm:h-10 sm:w-10" draggable={false} />
            </button>

            {isReady && (
              <button type="button" onClick={() => setIsCustomizationOpen(true)} className="group relative shrink-0" aria-label="Personalizar perfil">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={playerName}
                    className="h-9 w-9 rounded-xl border-2 border-[#d9b764] object-cover shadow-[0_0_8px_rgba(217,183,100,0.35)] sm:h-11 sm:w-11"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#d9b764] bg-zinc-900 text-base font-black text-[#d9b764] sm:h-11 sm:w-11 sm:text-lg">
                    {playerName[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#d9b764] px-1.5 py-0.5 text-[8px] font-black text-black">
                  {playerLevel}
                </div>
              </button>
            )}

            {isReady ? (
              <button
                type="button"
                onClick={() => setIsCustomizationOpen(true)}
                className="hidden max-w-[150px] truncate text-left text-sm font-black uppercase leading-none tracking-wide text-[#f6d27b] hover:text-[#ffe8a3] sm:block"
              >
                {playerName}
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-black uppercase text-white hover:bg-red-500 sm:text-xs"
              >
                Entrar
              </button>
            )}
          </div>

          {isReady && (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
              <ResourcePill label="Sujo" value={dirtyMoney} icon={COMMANDS_ICON} />
              <ResourcePill label="Limpo" value={cleanMoney} icon={COMMANDS_ICON} />
              <ResourcePill
                label="Corres"
                value={corre}
                iconNode={<Zap className="h-3.5 w-3.5 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,208,0,0.45)] sm:h-4 sm:w-4" />}
              />

              <button
                onClick={handleLogout}
                className="shrink-0 rounded-lg border border-[#6f3d08] bg-black/40 px-2 py-1.5 text-[9px] font-black uppercase text-white hover:bg-white/10 sm:rounded-xl sm:px-2.5 sm:text-[10px]"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
