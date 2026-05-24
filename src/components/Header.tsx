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
  iconClassName = 'h-4 w-4 object-contain',
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
    <div className="flex min-w-[88px] items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 px-2.5 py-1.5 shadow-[0_0_12px_rgba(0,0,0,0.35)]">
      <div className="shrink-0">
        {iconNode ? iconNode : icon ? <Image src={icon} alt={iconAlt} className={iconClassName} /> : null}
      </div>
      <div className="flex min-w-0 flex-col leading-none">
        <span className="text-[8px] font-bold uppercase text-zinc-500">{label}</span>
        <span className="whitespace-nowrap text-[11px] font-black text-white">{fmt(value)}</span>
      </div>
    </div>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { player, clearPlayer, isLoaded } = usePlayerStore();
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

      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-2">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between rounded-2xl border border-[#6f3d08] bg-[linear-gradient(90deg,#120804_0%,#2d0d06_20%,#111111_50%,#2d0d06_80%,#120804_100%)] px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => navigate('/')} className="shrink-0">
              <Image src={LOGO_URL} alt="Domínio do Comando" className="h-10 w-10 object-contain" draggable={false} />
            </button>

            {isReady && (
              <button type="button" onClick={() => setIsCustomizationOpen(true)} className="group relative shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={playerName}
                    className="h-11 w-11 rounded-xl border-2 border-[#d9b764] object-cover shadow-[0_0_8px_rgba(217,183,100,0.35)]"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#d9b764] bg-zinc-900 text-lg font-black text-[#d9b764]">
                    {playerName[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#d9b764] px-1.5 py-0.5 text-[8px] font-black text-black">
                  {playerLevel}
                </div>
              </button>
            )}

            {isReady ? (
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCustomizationOpen(true)}
                  className="block max-w-[120px] truncate text-sm font-black uppercase leading-none tracking-wide text-[#f6d27b] hover:text-[#ffe8a3]"
                >
                  {playerName}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-red-500"
              >
                Entrar
              </button>
            )}
          </div>

          {isReady && (
            <div className="flex items-center gap-2">
              <ResourcePill label="Sujo" value={dirtyMoney} icon={COMMANDS_ICON} />
              <ResourcePill label="Limpo" value={cleanMoney} icon={COMMANDS_ICON} />
              <ResourcePill
                label="Corres"
                value={corre}
                iconNode={<Zap className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,208,0,0.45)]" />}
              />

              <button
                onClick={handleLogout}
                className="rounded-xl border border-[#6f3d08] bg-black/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-white hover:bg-white/10"
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
