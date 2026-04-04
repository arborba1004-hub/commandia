import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { LogOut, Settings } from 'lucide-react';
import { Image } from '@/components/ui/image';
import HeaderCustomizationModal from '@/components/HeaderCustomizationModal';

export default function Header() {
  const { player } = usePlayerStore();
  const { playerData, logout } = useGoogleAuth();

  const isAuthenticated = !!player?._id;

  const playerName = (playerData?.name || player?.name || 'CAPO GHOST').toUpperCase();
  const dirtyMoney = Number(player?.balances?.dirtyMoney ?? 5800000);
  const cleanMoney = Number(player?.balances?.cleanMoney ?? 2100000);
  const corre = Number(player?.balances?.corre ?? 12);
  const playerLevel = Number(player?.niveis?.playerLevel ?? 45);

  const power =
    Number(player?.power ?? 0) > 0
      ? Number(player?.power)
      : 1200000;

  const hierarchyBadge = (player?.hierarchyBadge || 'COMANDANTE DE ELITE').toUpperCase();

  const avatar =
    playerData?.picture ||
    player?.avatar ||
    'https://static.wixstatic.com/media/50f4bf_5868d04681cb49d1a58d89dc4493574f~mv2.png';

  const [secondsLeft, setSecondsLeft] = useState(60);
  const [pendingGiros, setPendingGiros] = useState(0);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // Get header customization
  const customization = player.headerCustomization || {
    playerNameFont: 'oswald',
    playerNameFontSize: '1.875rem',
    playerNameColor: '#1a1205',
  };

  useEffect(() => {
    const updatePassiveTimer = () => {
      const lastPassiveIncomeAt = Number(player?.lastPassiveIncomeAt ?? Date.now());
      const now = Date.now();

      const elapsedMs = now - lastPassiveIncomeAt;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      const nextTickIn = 60 - (elapsedSeconds % 60 || 60);

      setSecondsLeft(nextTickIn === 60 ? 0 : nextTickIn);
      setPendingGiros(elapsedMinutes * playerLevel);
    };

    updatePassiveTimer();

    const interval = setInterval(updatePassiveTimer, 1000);
    return () => clearInterval(interval);
  }, [player?.lastPassiveIncomeAt, playerLevel]);

  const formatCompact = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
  };

  const formatCountdown = (value: number) => {
    const safe = Math.max(0, value);
    return `00:${safe.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#5a0d0d] bg-black/95">
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(90deg, #2a0707 0%, #111111 22%, #2e2e2e 45%, #141414 68%, #310808 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_left,rgba(255,0,0,0.25),transparent_22%),radial-gradient(circle_at_right,rgba(255,220,120,0.18),transparent_20%)]" />

        <div className="relative px-2 py-2">
          <div className="grid grid-cols-[88px_1fr_96px] sm:grid-cols-[120px_1fr_150px] items-stretch gap-2">

            {/* BLOCO LOGO */}
            <div className="rounded-xl border border-[#7a5a25] bg-[linear-gradient(180deg,#4d0909_0%,#1b0909_100%)] flex flex-col items-center justify-center px-1 py-2">
              <Image 
                src="https://static.wixstatic.com/media/50f4bf_9e06e6237b1c4e87997633edc2d94227~mv2.png"
                alt="Domínio do Comando Logo"
                width={80}
                height={80}
                className="w-full h-auto object-contain"
              />
            </div>

            {/* BLOCO CENTRAL */}
            <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 px-2 py-2">
              <div className="grid grid-cols-[56px_1fr] sm:grid-cols-[78px_1fr] gap-2 items-center">
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full p-[3px] bg-[linear-gradient(180deg,#e4c778_0%,#695124_100%)]">
                    <div className="w-full h-full rounded-full overflow-hidden border border-black/70 bg-black">
                      <Image src={avatar} alt={playerName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div
                    className="inline-block max-w-full truncate px-3 sm:px-5 py-1.5 sm:py-2 bg-[linear-gradient(90deg,#8d6422_0%,#d0aa4f_45%,#8d6422_100%)] font-heading uppercase leading-none rounded-md"
                    style={{
                      fontFamily: customization.playerNameFont,
                      fontSize: customization.playerNameFontSize,
                      color: customization.playerNameColor,
                      textShadow: '0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  >
                    {playerName}
                  </div>

                  <div className="mt-1.5 sm:mt-2">
                    <div className="inline-block px-3 sm:px-4 py-1 bg-[linear-gradient(90deg,#7a0909_0%,#c51616_100%)] text-white font-heading uppercase text-[9px] sm:text-xs tracking-[0.18em] rounded-sm">
                      {hierarchyBadge}
                    </div>
                  </div>
                </div>

                {isAuthenticated && (
                  <button
                    onClick={() => setIsCustomizationOpen(true)}
                    className="ml-2 p-2 rounded hover:bg-white/10 transition-colors"
                    title="Personalizar cabeçalho"
                  >
                    <Settings className="w-4 h-4 text-yellow-400" />
                  </button>
                )}
              </div>

              <div className="mt-2 grid grid-cols-5 gap-[1px] rounded-lg overflow-hidden border border-white/10 bg-white/10">
                <div className="bg-black/45 px-2 py-1.5 sm:py-2">
                  <div className="font-heading text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-[#d9b764]">
                    Nível
                  </div>
                  <div className="mt-0.5 font-heading text-white text-sm sm:text-2xl leading-none">
                    {playerLevel}
                  </div>
                </div>

                <div className="bg-black/45 px-2 py-1.5 sm:py-2">
                  <div className="font-heading text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-[#d9b764]">
                    Poder
                  </div>
                  <div className="mt-0.5 font-heading text-white text-sm sm:text-2xl leading-none">
                    {formatCompact(power)}
                  </div>
                </div>

                <div className="bg-black/45 px-2 py-1.5 sm:py-2">
                  <div className="font-heading text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-[#d9b764]">
                    Dinheiro sujo
                  </div>
                  <div className="mt-0.5 font-heading text-white text-sm sm:text-2xl leading-none">
                    ${formatCompact(dirtyMoney)}
                  </div>
                </div>

                <div className="bg-black/45 px-2 py-1.5 sm:py-2">
                  <div className="font-heading text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-[#d9b764]">
                    Dinheiro limpo
                  </div>
                  <div className="mt-0.5 font-heading text-white text-sm sm:text-2xl leading-none">
                    ${formatCompact(cleanMoney)}
                  </div>
                </div>

                <div className="bg-black/45 px-2 py-1.5 sm:py-2">
                  <div className="font-heading text-[7px] sm:text-[9px] uppercase tracking-[0.18em] text-[#d9b764]">
                    Giros
                  </div>
                  <div className="mt-0.5 font-heading text-white text-sm sm:text-2xl leading-none">
                    {formatCompact(corre)}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO DIREITO */}
            <div className="rounded-xl border border-white/10 bg-black/45 px-2 py-2 flex flex-col justify-center">
              <div className="font-heading text-[8px] sm:text-[11px] uppercase tracking-[0.16em] text-white text-center">
                Próximo ganho de giros em:
              </div>
              <div className="mt-1 font-heading text-white text-center text-2xl sm:text-4xl leading-none tracking-[0.18em]">
                {formatCountdown(secondsLeft)}
              </div>
              <div className="mt-1 text-center text-[7px] sm:text-[9px] uppercase tracking-[0.14em] text-zinc-300 font-heading">
                +{playerLevel} giros por minuto
              </div>
              <div className="mt-1 text-center text-[8px] sm:text-[10px] uppercase tracking-[0.14em] text-yellow-300 font-heading">
                Acumulado: {pendingGiros}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-3">
              <Link to="/" className="font-heading text-[9px] sm:text-xs uppercase tracking-[0.18em] text-white hover:text-yellow-300 transition-colors">
                Início
              </Link>
              <Link to="/galeria" className="font-heading text-[9px] sm:text-xs uppercase tracking-[0.18em] text-white hover:text-yellow-300 transition-colors">
                Galeria
              </Link>
              {isAuthenticated && (
                <Link to="/game" className="font-heading text-[9px] sm:text-xs uppercase tracking-[0.18em] text-white hover:text-yellow-300 transition-colors">
                  Entrar
                </Link>
              )}

              <div className="hidden lg:flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl border border-yellow-500/30 bg-yellow-900/30 text-sm font-heading uppercase tracking-wider text-yellow-200">
                  ⏱ Próximo giro: {formatCountdown(secondsLeft)}
                </div>

                <div className="px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-900/30 text-sm font-heading uppercase tracking-wider text-purple-200">
                  ⚡ Acumulado: {pendingGiros}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isAuthenticated ? (
                <Link
                  to="/"
                  className="px-3 py-1.5 rounded-full bg-red-700 hover:bg-red-600 text-white font-heading text-[9px] sm:text-xs uppercase tracking-[0.18em] transition-colors"
                >
                  Jogar
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-700 hover:bg-red-600 text-white font-heading text-[9px] sm:text-xs uppercase tracking-[0.18em] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <HeaderCustomizationModal isOpen={isCustomizationOpen} onClose={() => setIsCustomizationOpen(false)} />
    </header>
  );
}
