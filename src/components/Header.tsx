import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { getPlayerRank } from '@/utils/hierarchySystem';
import { Image } from '@/components/ui/image';

const LOGO_URL =
  'https://static.wixstatic.com/media/50f4bf_9e06e6237b1c4e87997633edc2d94227~mv2.png';

const COMMANDS_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';

const CHAT_COMPLEXO_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_af442ef88fac45288bc762a40c07c343~mv2.png';

const CHAT_FACCAO_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_f00228a9eaa84c13ab83c4f3a6365649~mv2.png';

const CHAT_MAIL_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_e602f889654541a9aa2dfd057dad00bc~mv2.png';

export default function Header() {
  const navigate = useNavigate();
  const { player, clearPlayer } = usePlayerStore();

  const isAuthenticated = !!player?._id;
  const playerLevel = player?.niveis?.barracoLevel || 45;
  const rank = getPlayerRank(playerLevel);

  const playerName =
    (player as any)?.headerCustomization?.customName ||
    player?.name ||
    'CAPO GHOST';

  const hierarchyTitle = rank?.title || 'COMANDANTE DE ELITE';
  const avatar = player?.avatar || '';

  const dirtyMoney = player?.balances?.dirtyMoney ?? 5800000;
  const cleanMoney = player?.balances?.cleanMoney ?? 2100000;
  const corre = player?.balances?.corre ?? 12;
  const power = player?.power ?? 1200000;

  const unreadMailCount = (player?.notifications || []).filter(
    (item) => !item.read
  ).length;

  const formatCompact = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerData');
    clearPlayer();
    window.location.href = '/';
  };

  const openChatChannel = (channel: 'complexo' | 'faccao' | 'mail') => {
    navigate(`/chat?channel=${channel}`);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-2 py-2">
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[22px] border border-[#6f3d08] bg-[linear-gradient(90deg,#120804_0%,#2a0c05_10%,#6a1a0d_24%,#2a0c05_42%,#0b0b0b_56%,#2a0c05_74%,#6a1a0d_88%,#0b0b0b_100%)] shadow-[0_0_35px_rgba(0,0,0,0.55)]">
        <div className="grid min-h-[118px] grid-cols-[95px_1fr] md:min-h-[140px] md:grid-cols-[230px_1fr]">
          <div className="flex h-full items-center justify-center border-r border-[#6f3d08] bg-black/25 p-1 md:p-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-full w-full items-center justify-center"
            >
              <img
                src={LOGO_URL}
                alt="Domínio do Comando"
                className="h-full w-full object-contain"
                draggable={false}
              />
            </button>
          </div>

          <div className="flex min-w-0 flex-col justify-between px-2 py-2 md:px-4 md:py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/galeria')}
                  className="shrink-0"
                  aria-label="Abrir galeria do equipamento"
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={playerName}
                      className="h-16 w-16 rounded-full border-[3px] border-[#d7a84a] object-cover shadow-[0_0_14px_rgba(215,168,74,0.55)] md:h-20 md:w-20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#d7a84a] bg-[#241107] shadow-[0_0_14px_rgba(215,168,74,0.55)] md:h-20 md:w-20">
                      <User className="h-8 w-8 text-[#f4cb70]" />
                    </div>
                  )}
                </button>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="block truncate text-left font-heading text-[20px] font-black uppercase leading-none tracking-wide text-[#f6d27b] md:text-[42px]"
                  >
                    {playerName}
                  </button>

                  <div className="mt-1 inline-flex rounded-full bg-[linear-gradient(90deg,#7e0000_0%,#d11515_50%,#7e0000_100%)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white md:text-xs">
                    {hierarchyTitle}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openChatChannel('complexo')}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#6f3d08] bg-black/35 hover:bg-white/10 md:h-11 md:w-11"
                  aria-label="Abrir chat do complexo"
                >
                  <img
                    src={CHAT_COMPLEXO_ICON_URL}
                    alt="Chat do Complexo"
                    className="h-7 w-7 object-contain md:h-8 md:w-8"
                    draggable={false}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => openChatChannel('faccao')}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#6f3d08] bg-black/35 hover:bg-white/10 md:h-11 md:w-11"
                  aria-label="Abrir chat da facção"
                >
                  <img
                    src={CHAT_FACCAO_ICON_URL}
                    alt="Chat da Facção"
                    className="h-7 w-7 object-contain md:h-8 md:w-8"
                    draggable={false}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => openChatChannel('mail')}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#6f3d08] bg-black/35 hover:bg-white/10 md:h-11 md:w-11"
                  aria-label="Abrir correio pessoal"
                >
                  <img
                    src={CHAT_MAIL_ICON_URL}
                    alt="Correio Pessoal"
                    className="h-7 w-7 object-contain md:h-8 md:w-8"
                    draggable={false}
                  />
                  {unreadMailCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#ffe25a] px-1 text-center text-[10px] font-black text-black">
                      {unreadMailCount}
                    </span>
                  )}
                </button>

                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="hidden items-center gap-2 rounded-xl border border-[#6f3d08] bg-black/35 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white hover:bg-white/10 md:flex"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/')}
                      className="hidden rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white md:flex"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="hidden rounded-xl bg-[#ff0050] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white md:flex"
                    >
                      Jogar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-3">
              <div className="rounded-xl bg-black/40 px-2 py-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f2ca57]">
                  Nível
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-white md:text-[28px]">
                  <span>⭐</span>
                  <span>{playerLevel}</span>
                </div>
              </div>

              <div className="rounded-xl bg-black/40 px-2 py-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f2ca57]">
                  Poder
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-white md:text-[28px]">
                  <span>⚡</span>
                  <span>{formatCompact(power)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-black/40 px-2 py-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f2ca57]">
                  Dinheiro Sujo
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-white md:text-[28px]">
                  <img
                    src={COMMANDS_ICON_URL}
                    alt="Commands"
                    className="h-5 w-5 object-contain md:h-6 md:w-6"
                    draggable={false}
                  />
                  <span>{formatCompact(dirtyMoney)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-black/40 px-2 py-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f2ca57]">
                  Dinheiro Limpo
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-white md:text-[28px]">
                  <img
                    src={COMMANDS_ICON_URL}
                    alt="Commands"
                    className="h-5 w-5 object-contain md:h-6 md:w-6"
                    draggable={false}
                  />
                  <span>{formatCompact(cleanMoney)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-black/40 px-2 py-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f2ca57]">
                  Giros
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-white md:text-[28px]">
                  <span>🌀</span>
                  <span>{formatCompact(corre)}</span>
                </div>
              </div>
            </div>

            <div className="mt-2 flex justify-end md:hidden">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-[#6f3d08] bg-black/35 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/')}
                    className="rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="rounded-xl bg-[#ff0050] px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white"
                  >
                    Jogar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}