import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Crown, LogOut, Pencil, Shield, Gem, Coins, Home, MessageCircle } from 'lucide-react';
import { Image } from '@/components/ui/image';

const LOGO_URL =
  'https://static.wixstatic.com/media/50f4bf_7140cdf76a2742628049849ce89b7560~mv2.png';

const COMMAND_NOTE_URL =
  'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';

const CHAT_FACCAO_URL =
  'https://static.wixstatic.com/media/50f4bf_f00228a9eaa84c13ab83c4f3a6365649~mv2.png';

const CHAT_COMPLEXO_URL =
  'https://static.wixstatic.com/media/50f4bf_c79d212ead9f4852aa71209ab3ad99ed~mv2.png';

const CHAT_CORREIO_URL =
  'https://static.wixstatic.com/media/50f4bf_49e49ca7e23e4f98a70a8c674da100d8~mv2.png';

const DEFAULT_AVATAR_URL =
  'https://static.wixstatic.com/media/50f4bf_402259b701d545678f7a5cd11d47c2a4~mv2.png';

const AVATAR_STORAGE_KEY = 'headerCustomAvatar';
const NAME_STORAGE_KEY = 'headerCustomName';

const CHAT_FALLBACK_ROUTE = '/game';

type ChatChannel = 'complexo' | 'faccao' | 'mail';

function formatCompact(value: number) {
  const safe = Number(value || 0);

  if (safe >= 1_000_000_000) return `${(safe / 1_000_000_000).toFixed(1)}B`;
  if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`;
  if (safe >= 1_000) return `${(safe / 1_000).toFixed(1)}K`;

  return Math.floor(safe).toString();
}

function navClass(isActive: boolean) {
  return [
    'rounded-full px-4 py-2 text-[11px] md:text-xs font-black uppercase tracking-[0.18em] transition-all',
    isActive
      ? 'bg-[#8a1212] text-white shadow-[0_0_20px_rgba(180,30,30,0.35)]'
      : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white',
  ].join(' ');
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { player, setPlayer } = usePlayerStore();
  const { playerData, logout } = useGoogleAuth();

  const mailMessages: any[] = [];

  const isAuthenticated = !!player?._id;
  const myPlayerId = player?._id || '';

  const unreadCount = useMemo(() => {
    if (!myPlayerId) return 0;
    return mailMessages.filter(
      (msg: any) => msg.recipientId === myPlayerId && !msg.read
    ).length;
  }, [mailMessages, myPlayerId]);

  const dirtyMoney = Number(player?.balances?.dirtyMoney || 0);
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const corre = Number(player?.balances?.corre || 0);
  const level = Number(player?.niveis?.playerLevel || player?.niveis?.barracoLevel || 1);
  const power = Number(player?.power || 0);
  const hierarchyBadge = player?.hierarchyBadge || 'Antena';

  const basePlayerName = playerData?.name || player?.name || 'Jogador';
  const localStoredName =
    typeof window !== 'undefined' ? localStorage.getItem(NAME_STORAGE_KEY) || '' : '';
  const localStoredAvatar =
    typeof window !== 'undefined' ? localStorage.getItem(AVATAR_STORAGE_KEY) || '' : '';

  const customName =
    (player as any)?.headerCustomization?.customName || localStoredName || basePlayerName;

  const [displayName, setDisplayName] = useState(customName);
  const [avatarPreview, setAvatarPreview] = useState(
    player?.avatar || localStoredAvatar || DEFAULT_AVATAR_URL
  );

  useEffect(() => {
    const nextName =
      (player as any)?.headerCustomization?.customName ||
      (typeof window !== 'undefined' ? localStorage.getItem(NAME_STORAGE_KEY) : '') ||
      playerData?.name ||
      player?.name ||
      'Jogador';

    setDisplayName(nextName);
  }, [playerData?.name, player?.name, (player as any)?.headerCustomization?.customName]);

  useEffect(() => {
    const nextAvatar =
      player?.avatar ||
      (typeof window !== 'undefined' ? localStorage.getItem(AVATAR_STORAGE_KEY) : '') ||
      DEFAULT_AVATAR_URL;

    setAvatarPreview(nextAvatar);
  }, [player?.avatar]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleOpenAvatarPicker = () => {
    if (!isAuthenticated) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result) return;

      setAvatarPreview(result);
      localStorage.setItem(AVATAR_STORAGE_KEY, result);

      setPlayer?.({
        avatar: result,
      } as any);
    };

    reader.readAsDataURL(file);
  };

  const handleEditName = () => {
    if (!isAuthenticated) return;

    const next = window.prompt('Digite o nome do comandante', displayName)?.trim();
    if (!next) return;

    setDisplayName(next);
    localStorage.setItem(NAME_STORAGE_KEY, next);

    setPlayer?.({
      headerCustomization: {
        ...(player?.headerCustomization || {}),
        customName: next,
      },
    } as any);
  };

  const openChat = (_channel: ChatChannel) => {
    navigate('/chat');
  };

  if (!isAuthenticated) {
    return (
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#35120d] bg-black/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[120rem] items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <Image
              src={LOGO_URL}
              alt="Domínio do Comando"
              width={140}
              height={64}
              className="h-12 w-auto object-contain md:h-14"
            />
            <div className="hidden md:block">
              <div className="text-lg font-black uppercase tracking-[0.16em] text-[#f1d17b]">
                Domínio do Comando
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                Submundo urbano
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link to="/" className={navClass(location.pathname === '/')}>
              Início
            </Link>
            <Link
              to="/luxuryshowroom"
              className={navClass(location.pathname === '/luxuryshowroom')}
            >
              Showroom
            </Link>
            <Link to="/game" className={navClass(location.pathname === '/game')}>
              Jogar
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/[0.08] hover:text-white md:text-xs"
            >
              Entrar
            </Link>

            <Link
              to="/game"
              className="rounded-full bg-[linear-gradient(180deg,#b71515_0%,#6c0707_100%)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_0_20px_rgba(180,20,20,0.35)] transition hover:opacity-90 md:text-xs"
            >
              Jogar
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#4d1b12] bg-black shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(33,8,8,0.82)_45%,rgba(0,0,0,0.98)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(170,20,20,0.18)_0%,rgba(0,0,0,0)_60%)]" />
      <div className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(135deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_10px)]" />

      <div className="relative mx-auto max-w-[120rem] px-2 py-2 md:px-4 lg:px-8">
        <div className="flex flex-col gap-2 xl:flex-row">
          <Link
            to="/game"
            className="flex shrink-0 items-center justify-center rounded-2xl border border-[#6e4218] bg-[linear-gradient(180deg,rgba(38,10,10,0.95)_0%,rgba(14,5,5,0.98)_100%)] px-3 py-3 xl:w-[190px]"
          >
            <Image
              src={LOGO_URL}
              alt="Domínio do Comando"
              width={180}
              height={100}
              className="h-auto max-h-[82px] w-auto object-contain md:max-h-[92px]"
            />
          </Link>

          <div className="min-w-0 flex-1 rounded-2xl border border-[#6e4218] bg-[linear-gradient(180deg,rgba(73,23,13,0.98)_0%,rgba(18,8,8,0.98)_100%)] shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-3 px-3 py-3 md:px-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <button
                      onClick={handleOpenAvatarPicker}
                      className="group relative rounded-full border-[3px] border-[#b28632] bg-black shadow-[0_0_20px_rgba(210,170,50,0.35)] md:border-4"
                      title="Trocar avatar"
                    >
                      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,215,120,0.28)_0%,rgba(0,0,0,0)_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <Image
                        src={avatarPreview || DEFAULT_AVATAR_URL}
                        alt="Avatar do comandante"
                        width={84}
                        height={84}
                        className="h-[58px] w-[58px] rounded-full object-cover md:h-[72px] md:w-[72px]"
                      />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleEditName}
                        className="max-w-full truncate rounded-xl bg-[linear-gradient(180deg,#7f5a1f_0%,#3f2a0c_100%)] px-3 py-1 text-left text-[22px] font-black tracking-tight text-[#f6db86] md:text-[30px] lg:text-[38px]"
                        title="Editar nome"
                      >
                        {displayName}
                      </button>

                      <button
                        onClick={handleEditName}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7f5a1f] bg-black/25 text-[#f6db86] transition hover:bg-black/40"
                        title="Editar nome"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <div className="rounded-xl bg-[linear-gradient(180deg,#b10f10_0%,#6c0707_100%)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white md:text-[12px]">
                        {hierarchyBadge}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <HeaderMiniNav
                        to="/game"
                        label="Game"
                        active={location.pathname === '/game'}
                        icon={<Home className="h-3.5 w-3.5" />}
                      />
                      <HeaderMiniNav
                        to="/giro"
                        label="Giro"
                        active={location.pathname === '/giro'}
                        icon={<Coins className="h-3.5 w-3.5" />}
                      />
                      <HeaderMiniNav
                        to="/barraco"
                        label="Barraco"
                        active={location.pathname === '/barraco'}
                        icon={<Shield className="h-3.5 w-3.5" />}
                      />
                      <HeaderMiniNav
                        to="/arsenal"
                        label="Arsenal"
                        active={location.pathname === '/arsenal' || location.pathname === '/armas'}
                        icon={<Crown className="h-3.5 w-3.5" />}
                      />
                      <HeaderMiniNav
                        to="/luxuryshowroom"
                        label="Luxo"
                        active={
                          location.pathname === '/luxuryshowroom' ||
                          location.pathname === '/luxo-item'
                        }
                        icon={<Gem className="h-3.5 w-3.5" />}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  <StatCell label="Nível" value={String(level)} />
                  <StatCell label="Poder" value={formatCompact(power)} />
                  <StatMoneyCell
                    label="Commands Sujo"
                    value={formatCompact(dirtyMoney)}
                    icon={COMMAND_NOTE_URL}
                  />
                  <StatMoneyCell
                    label="Commands Limpo"
                    value={formatCompact(cleanMoney)}
                    icon={COMMAND_NOTE_URL}
                  />
                  <StatCell label="Corre" value={String(corre)} />
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-[#272727] bg-[linear-gradient(180deg,rgba(10,10,10,0.98)_0%,rgba(24,24,24,0.98)_100%)] p-2 xl:w-[170px]">
            <div className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/90 md:text-[11px]">
              Comunicações
            </div>

            <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
              <ChatHeaderButton
                label="Complexo"
                image={CHAT_COMPLEXO_URL}
                onClick={() => openChat('complexo')}
              />

              <ChatHeaderButton
                label="Facção"
                image={CHAT_FACCAO_URL}
                onClick={() => openChat('faccao')}
              />

              <div className="relative">
                <ChatHeaderButton
                  label="Correio"
                  image={CHAT_CORREIO_URL}
                  onClick={() => openChat('mail')}
                />

                {unreadCount > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-black bg-red-600 px-1 text-[10px] font-black text-white shadow-[0_0_15px_rgba(255,0,0,0.45)]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => openChat('complexo')}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/[0.08] hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Abrir chat
            </button>

            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-3 py-2 font-heading text-[11px] uppercase tracking-wider text-destructive-foreground transition-opacity hover:opacity-90 md:text-xs"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderMiniNav({
  to,
  label,
  active,
  icon,
}: {
  to: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all md:text-[11px]',
        active
          ? 'bg-[linear-gradient(180deg,#a31313_0%,#6a0707_100%)] text-white shadow-[0_0_20px_rgba(160,20,20,0.28)]'
          : 'bg-black/25 text-white/80 hover:bg-black/40 hover:text-white',
      ].join(' ')}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/35 px-2 py-2 text-center">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#d7a63a] md:text-[10px]">
        {label}
      </div>
      <div className="mt-1 text-[16px] font-black leading-none text-white md:text-[20px] lg:text-[26px]">
        {value}
      </div>
    </div>
  );
}

function StatMoneyCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl bg-black/35 px-2 py-2 text-center">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#d7a63a] md:text-[10px]">
        {label}
      </div>

      <div className="mt-1 flex items-center justify-center gap-1">
        <Image
          src={icon}
          alt={label}
          width={28}
          height={20}
          className="h-[14px] w-auto object-contain md:h-[18px]"
        />
        <div className="text-[14px] font-black leading-none text-white md:text-[18px] lg:text-[24px]">
          {value}
        </div>
      </div>
    </div>
  );
}

function ChatHeaderButton({
  label,
  image,
  onClick,
}: {
  label: string;
  image: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 transition-all hover:bg-white/[0.08]"
    >
      <Image
        src={image}
        alt={label}
        width={30}
        height={30}
        className="h-[22px] w-[22px] shrink-0 object-contain md:h-[26px] md:w-[26px]"
      />
      <span className="truncate text-left text-[9px] font-black uppercase tracking-[0.06em] text-white md:text-[10px]">
        {label}
      </span>
    </button>
  );
}