import { Link, useNavigate } from 'react-router-dom';
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

  const dirtyMoney = player?.balances?.dirtyMoney ?? 0;
  const cleanMoney = player?.balances?.cleanMoney ?? 0;
  const corre = player?.balances?.corre ?? 0;
  const power = player?.power ?? 0;
  const playerLevel = player?.niveis?.barracoLevel || 1;

  const playerName =
    (player as any)?.headerCustomization?.customName ||
    player?.name ||
    'CAPO GHOST';

  const hierarchyTitle = getPlayerRank(playerLevel).title;
  const avatar = player?.avatar || '';

  const unreadMailCount = (player?.notifications || []).filter(
    (item) => item.type === 'attack_received' && !item.read
  ).length;

  const formatCompact = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#6e4300] bg-black/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1400px] px-2 py-2 sm:px-3">
        {!isAuthenticated ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#3c2407] bg-gradient-to-r from-[#140b06] via-[#1a120a] to-[#140b06] px-4 py-3">
            <Link to="/" className="flex min-w-0 items-center">
              <img
                src={LOGO_URL}
                alt="Domínio do Comando"
                className="h-14 w-auto object-contain sm:h-16"
                draggable={false}
              />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="rounded-xl border border-[#7b4a11] px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Entrar
              </Link>

              <Link
                to="/"
                className="rounded-xl bg-[#ff003c] px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:opacity-90"
              >
                Jogar
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#6e4300] bg-[radial-gradient(circle_at_center,_rgba(120,26,10,0.45)_0%,_rgba(22,9,5,0.96)_55%,_rgba(5,5,5,0.98)_100%)] shadow-[0_0_30px_rgba(0,0,0,0.45)]">
            <div className="grid min-h-[106px] grid-cols-[88px_1fr] md:grid-cols-[170px_1fr]">
              <div className="flex items-center justify-center border-r border-[#6e4300] bg-black/30 p-1 md:p-2">
                <Link
                  to="/"
                  className="flex h-full w-full items-center justify-center"
                >
                  <img
                    src={LOGO_URL}
                    alt="Domínio do Comando"
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </Link>
              </div>

              <div className="flex min-w-0 flex-col justify-between px-2 py-2 md:px-4">
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
                          className="h-14 w-14 rounded-full border-2 border-[#d8a84a] object-cover shadow-[0_0_12px_rgba(216,168,74,0.45)] md:h-16 md:w-16"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#d8a84a] bg-[#23140b] shadow-[0_0_12px_rgba(216,168,74,0.45)] md:h-16 md:w-16">
                          <User className="h-7 w-7 text-[#e9c16f]" />
                        </div>
                      )}
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => navigate('/game')}
                        className="block truncate text-left text-xl font-black uppercase tracking-wide text-[#f2cc73] md:text-3xl"
                      >
                        {playerName}
                      </button>

                      <div className="mt-1 inline-flex rounded-full bg-[#a10e12] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white md:text-xs">
                        {hierarchyTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openChatChannel('complexo')}
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#6e4300] bg-black/35 transition hover:bg-white/10"
                      aria-label="Abrir chat do complexo"
                    >
                      <img
                        src={CHAT_COMPLEXO_ICON_URL}
                        alt="Chat do Complexo"
                        className="h-7 w-7 object-contain"
                        draggable={false}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => openChatChannel('faccao')}
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#6e4300] bg-black/35 transition hover:bg-white/10"
                      aria-label="Abrir chat da facção"
                    >
                      <img
                        src={CHAT_FACCAO_ICON_URL}
                        alt="Chat da Facção"
                        className="h-7 w-7 object-contain"
                        draggable={false}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => openChatChannel('mail')}
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#6e4300] bg-black/35 transition hover:bg-white/10"
                      aria-label="Abrir correio pessoal"
                    >
                      <img
                        src={CHAT_MAIL_ICON_URL}
                        alt="Correio Pessoal"
                        className="h-7 w-7 object-contain"
                        draggable={false}
                      />

                      {unreadMailCount > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#ffde59] px-1 text-center text-[10px] font-black text-black">
                          {unreadMailCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={handleLogout}
                      className="hidden items-center gap-2 rounded-xl border border-[#6e4300] bg-black/35 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-white/10 md:flex"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  <div className="rounded-xl bg-black/35 px-2 py-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f1c84c]">
                      Nível
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-white md:text-xl">
                      <span>⭐</span>
                      <span>{playerLevel}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/35 px-2 py-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f1c84c]">
                      Poder
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-white md:text-xl">
                      <span>⚡</span>
                      <span>{formatCompact(power)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/35 px-2 py-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f1c84c]">
                      Dinheiro Sujo
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-white md:text-xl">
                      <img
                        src={COMMANDS_ICON_URL}
                        alt="Commands"
                        className="h-5 w-5 object-contain"
                        draggable={false}
                      />
                      <span>{formatCompact(dirtyMoney)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/35 px-2 py-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f1c84c]">
                      Dinheiro Limpo
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-white md:text-xl">
                      <img
                        src={COMMANDS_ICON_URL}
                        alt="Commands"
                        className="h-5 w-5 object-contain"
                        draggable={false}
                      />
                      <span>{formatCompact(cleanMoney)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/35 px-2 py-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#f1c84c]">
                      Giros
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black text-white md:text-xl">
                      <span>🌀</span>
                      <span>{formatCompact(corre)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex justify-end md:hidden">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-xl border border-[#6e4300] bg-black/35 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}