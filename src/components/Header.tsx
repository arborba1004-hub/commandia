import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChatStore } from '@/store/chatStore';
import { usePlayerPersistence } from '@/hooks/usePlayerPersistence';
import { LogOut } from 'lucide-react';
import { Image } from '@/components/ui/image';
import AdminResetPanel from '@/components/AdminResetPanel';

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

const AVATAR_STORAGE_KEY = 'headerCustomAvatar';
const NAME_STORAGE_KEY = 'headerCustomName';

function formatCompact(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toString();
}

export default function Header() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { player, setPlayer } = usePlayerStore();
  const { playerData, authToken, logout } = useGoogleAuth();

  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const mailMessages = useChatStore((state) => state.mailMessages);
  const loadChat = useChatStore((state) => state.loadChat);
  const startChatPolling = useChatStore((state) => state.startChatPolling);
  const stopChatPolling = useChatStore((state) => state.stopChatPolling);

  // Player persistence integration
  const { handleLogin, handleLogout: handlePersistenceLogout } = usePlayerPersistence({
    enabled: true,
    autoSync: true,
  });

  const isAuthenticated = !!player?._id && !!authToken;

  const unreadCount = useMemo(() => {
    const myId = player?._id || '';

    return mailMessages.filter(
      (msg) => msg.recipientId === myId && !msg.read
    ).length;
  }, [mailMessages, player?._id]);

  const dirtyMoney = Number(player?.balances?.dirtyMoney || 0);
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const corre = Number(player?.balances?.corre || 0);
  const level = Number(
    player?.niveis?.playerLevel || player?.niveis?.barracoLevel || 1
  );
  const power = Number(player?.power || 0);
  const hierarchyBadge = player?.hierarchyBadge || 'Antena';

  const basePlayerName = playerData?.name || player?.name || 'Jogador';
  const customName =
    (player as any)?.headerCustomization?.customName ||
    localStorage.getItem(NAME_STORAGE_KEY) ||
    basePlayerName;

  const [displayName, setDisplayName] = useState(customName);
  const [avatarPreview, setAvatarPreview] = useState(
    player?.avatar || localStorage.getItem(AVATAR_STORAGE_KEY) || ''
  );

  useEffect(() => {
    const nextName =
      (player as any)?.headerCustomization?.customName ||
      localStorage.getItem(NAME_STORAGE_KEY) ||
      playerData?.name ||
      player?.name ||
      'Jogador';

    setDisplayName(nextName);
  }, [playerData?.name, player?.name, (player as any)?.headerCustomization?.customName]);

  useEffect(() => {
    const nextAvatar = player?.avatar || localStorage.getItem(AVATAR_STORAGE_KEY) || '';
    setAvatarPreview(nextAvatar);
  }, [player?.avatar]);

  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    // Aguarda 1 segundo para garantir que o player está carregado
    // e o token está disponível antes de iniciar o polling
    const timer = setTimeout(() => {
      void loadChat();
      startChatPolling();
    }, 1000);

    return () => {
      clearTimeout(timer);
      stopChatPolling();
    };
  }, [isAuthenticated, authToken, loadChat, startChatPolling, stopChatPolling]);

  // Handle player login - load data from CMS
  useEffect(() => {
    if (isAuthenticated && player._id) {
      handleLogin(player._id);
    }
  }, [isAuthenticated, player._id, handleLogin]);

  const handleLogout = async () => {
    stopChatPolling();
    
    // Save player data to CMS before logout
    await handlePersistenceLogout();
    
    logout();
    window.location.href = '/';
  };

  const handleOpenGallery = () => {
    if (!isAuthenticated) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setAvatarPreview(result);
      localStorage.setItem(AVATAR_STORAGE_KEY, result);

      if (setPlayer) {
        setPlayer({
          avatar: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditName = () => {
    if (!isAuthenticated) return;

    const next = window.prompt('Digite o nome do comandante', displayName)?.trim();
    if (!next) return;

    setDisplayName(next);
    localStorage.setItem(NAME_STORAGE_KEY, next);

    if (setPlayer) {
      setPlayer({
        headerCustomization: {
          ...(player?.headerCustomization || {}),
          customName: next,
        } as any,
      });
    }
  };

  const openChat = (channel: 'complexo' | 'faccao' | 'mail') => {
    setActiveChannel(channel);
    navigate('/chat');
  };

  if (!isAuthenticated) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-custom4">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="font-heading text-2xl lg:text-3xl uppercase tracking-wider text-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            Domínio do Comando
          </Link>

          <nav className="flex items-center gap-8">
            <Link
              to="/"
              className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Início
            </Link>

            <Link
              to="/galeria"
              className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Galeria
            </Link>

            <a
              href="#missoes"
              className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Missões
            </a>

            <Link
              to="/"
              className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Entrar
            </Link>

            <button className="bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
              Jogar
            </button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#4d1b12] bg-black shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(33,8,8,0.82)_45%,rgba(0,0,0,0.98)_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(135deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_10px)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(170,20,20,0.18)_0%,rgba(0,0,0,0)_60%)]" />

      <div className="relative max-w-[120rem] mx-auto px-2 md:px-4 lg:px-8 py-2">
        <div className="flex items-stretch gap-2 md:gap-3">
          <Link
            to="/"
            className="w-[110px] md:w-[150px] lg:w-[180px] shrink-0 rounded-2xl border border-[#6e4218] bg-[linear-gradient(180deg,rgba(38,10,10,0.95)_0%,rgba(14,5,5,0.98)_100%)] px-2 py-2 flex items-center justify-center"
          >
            <Image
              src={LOGO_URL}
              alt="Domínio do Comando"
              width={180}
              height={180}
              className="w-full h-auto max-h-[88px] md:max-h-[98px] object-contain"
            />
          </Link>

          <div className="min-w-0 flex-1 rounded-2xl border border-[#6e4218] bg-[linear-gradient(180deg,rgba(73,23,13,0.98)_0%,rgba(18,8,8,0.98)_100%)] shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3 px-3 py-2 md:px-4">
              <div className="shrink-0">
                <button
                  onClick={handleOpenGallery}
                  className="group relative rounded-full border-[3px] md:border-4 border-[#b28632] bg-black shadow-[0_0_20px_rgba(210,170,50,0.35)]"
                  title="Trocar avatar"
                >
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,215,120,0.28)_0%,rgba(0,0,0,0)_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Image
                    src={
                      avatarPreview ||
                      'https://static.wixstatic.com/media/50f4bf_402259b701d545678f7a5cd11d47c2a4~mv2.png'
                    }
                    alt="Avatar do comandante"
                    width={84}
                    height={84}
                    className="h-[58px] w-[58px] md:h-[72px] md:w-[72px] rounded-full object-cover"
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

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleEditName}
                    className="max-w-full truncate rounded-xl bg-[linear-gradient(180deg,#7f5a1f_0%,#3f2a0c_100%)] px-3 py-1 text-left text-[22px] md:text-[30px] lg:text-[38px] font-black tracking-tight text-[#f6db86]"
                    title="Editar nome"
                  >
                    {displayName}
                  </button>

                  <div className="rounded-xl bg-[linear-gradient(180deg,#b10f10_0%,#6c0707_100%)] px-3 py-1 text-[10px] md:text-[12px] font-black uppercase tracking-[0.18em] text-white">
                    {hierarchyBadge}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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

          <div className="w-[108px] md:w-[130px] lg:w-[160px] shrink-0 rounded-2xl border border-[#272727] bg-[linear-gradient(180deg,rgba(10,10,10,0.98)_0%,rgba(24,24,24,0.98)_100%)] p-2 flex flex-col justify-between">
            <div className="text-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.18em] text-white/90 mb-2">
              Comunicações
            </div>

            <div className="grid grid-cols-1 gap-2">
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
                  <div className="absolute -right-1 -top-1 flex min-w-[22px] h-[22px] items-center justify-center rounded-full border-2 border-black bg-red-600 px-1 text-[10px] font-black text-white shadow-[0_0_15px_rgba(255,0,0,0.45)]">
                    {unreadCount}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground font-heading text-[11px] md:text-xs uppercase tracking-wider px-3 py-2 hover:opacity-90 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
      <AdminPanel />
    </header>
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
      <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-[#d7a63a]">
        {label}
      </div>
      <div className="mt-1 text-[16px] md:text-[20px] lg:text-[26px] font-black leading-none text-white">
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
      <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-[#d7a63a]">
        {label}
      </div>

      <div className="mt-1 flex items-center justify-center gap-1">
        <Image
          src={icon}
          alt={label}
          width={28}
          height={20}
          className="h-[14px] md:h-[18px] w-auto object-contain"
        />
        <div className="text-[14px] md:text-[18px] lg:text-[24px] font-black leading-none text-white">
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
        className="h-[22px] w-[22px] md:h-[26px] md:w-[26px] shrink-0 object-contain"
      />
      <span className="truncate text-left text-[9px] md:text-[10px] font-black uppercase tracking-[0.06em] text-white">
        {label}
      </span>
    </button>
  );
}

// Admin panel only visible in development
function AdminPanel() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <AdminResetPanel />;
}