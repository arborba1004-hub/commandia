import { Link, useLocation } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { LogOut } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const { player } = usePlayerStore();
  const { playerData, logout } = useGoogleAuth();

  const isAuthenticated = !!player?._id;

  const dirtyMoney = Number(player?.balances?.dirtyMoney ?? 0);
  const cleanMoney = Number(player?.balances?.cleanMoney ?? 0);
  const corre = Number(player?.balances?.corre ?? 0);

  const playerName = playerData?.name || player?.name || 'CAPO GHOST';
  const playerLevel = Number(player?.niveis?.playerLevel ?? 1);

  const power =
    Number(player?.power ?? 0) > 0
      ? Number(player?.power)
      : Number(player?.skills?.attack ?? 0) +
        Number(player?.skills?.defense ?? 0) +
        Number(player?.skills?.intelligence ?? 0) +
        Number(player?.skills?.agility ?? 0) +
        Number(player?.skills?.respect ?? 0) +
        Number(player?.skills?.vigor ?? 0);

  const hierarchyBadge = player?.hierarchyBadge || 'COMANDANTE DE ELITE';
  const avatar =
    playerData?.picture ||
    player?.avatar ||
    'https://static.wixstatic.com/media/50f4bf_5868d04681cb49d1a58d89dc4493574f~mv2.png';

  const formatCompact = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navLinkClass = (path: string) =>
    `font-heading text-[10px] sm:text-xs uppercase tracking-[0.18em] transition-colors ${
      location.pathname === path ? 'text-yellow-300' : 'text-white hover:text-yellow-300'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full bg-black/95 border-b border-red-900/60">
        <div
          className="relative overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(35,0,0,0.96) 0%, rgba(18,18,18,0.98) 28%, rgba(38,6,6,0.97) 60%, rgba(10,10,10,0.98) 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,rgba(255,215,120,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,0,0,0.18),transparent_24%)]" />

          <div className="relative flex flex-col">
            <div className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to="/"
                  className="shrink-0 leading-none font-heading uppercase text-[22px] sm:text-[30px] tracking-wide text-[#e8d29a]"
                  style={{
                    textShadow:
                      '0 1px 0 #3a2a11, 0 0 12px rgba(255,215,120,0.16), 0 0 22px rgba(255,40,40,0.12)',
                  }}
                >
                  DOMÍNIO DO COMANDO
                </Link>
              </div>

              <nav className="hidden md:flex items-center gap-5 lg:gap-7">
                <Link to="/" className={navLinkClass('/')}>
                  Início
                </Link>
                <Link to="/galeria" className={navLinkClass('/galeria')}>
                  Galeria
                </Link>
                {isAuthenticated ? (
                  <Link to="/gang" className={navLinkClass('/gang')}>
                    Quadrilha
                  </Link>
                ) : (
                  <a href="#missoes" className="font-heading text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white hover:text-yellow-300 transition-colors">
                    Missões
                  </a>
                )}
                {isAuthenticated && (
                  <Link to="/game" className={navLinkClass('/game')}>
                    Entrar
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/"
                      className="font-heading text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white hover:text-yellow-300 transition-colors"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/"
                      className="px-4 sm:px-5 py-2 rounded-full bg-red-700 hover:bg-red-600 text-white font-heading text-[10px] sm:text-xs uppercase tracking-[0.18em] transition-colors"
                    >
                      Jogar
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-red-700 hover:bg-red-600 text-white font-heading text-[10px] sm:text-xs uppercase tracking-[0.18em] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                )}
              </div>
            </div>

            {isAuthenticated && (
              <div className="px-2 sm:px-3 py-2">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 min-h-[88px] sm:min-h-[108px]">
                  <div className="hidden sm:flex items-center justify-center w-[108px] lg:w-[132px] h-full rounded-2xl border border-[#7c5b1c] bg-[linear-gradient(180deg,#3a0d0d_0%,#1a0909_100%)]">
                    <div className="text-center leading-none">
                      <div
                        className="font-heading text-[22px] lg:text-[28px] uppercase text-[#e8d29a]"
                        style={{ textShadow: '0 0 10px rgba(255,215,120,0.22)' }}
                      >
                        DOMÍNIO
                      </div>
                      <div
                        className="font-heading text-[20px] lg:text-[26px] uppercase text-[#e8d29a]"
                        style={{ textShadow: '0 0 10px rgba(255,215,120,0.22)' }}
                      >
                        DO COMANDO
                      </div>
                      <div className="mt-1 inline-flex px-2 py-1 rounded-full bg-black/40 border border-yellow-700/40 text-[9px] tracking-[0.18em] uppercase text-zinc-200 font-heading">
                        Submundo Urbano
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex items-center gap-2 sm:gap-4">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-[linear-gradient(180deg,#d8b46a_0%,#5c4219_100%)]">
                        <div className="w-full h-full rounded-full overflow-hidden border border-black/60 bg-black">
                          <img
                            src={avatar}
                            alt={playerName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div
                        className="font-heading uppercase text-[#e8d29a] text-xl sm:text-2xl lg:text-4xl leading-none truncate"
                        style={{
                          textShadow:
                            '0 1px 0 #3a2a11, 0 0 10px rgba(255,215,120,0.18)',
                        }}
                      >
                        {playerName}
                      </div>

                      <div className="mt-2 inline-flex items-center rounded-md overflow-hidden border border-red-900/70">
                        <div className="px-3 sm:px-4 py-1.5 bg-[linear-gradient(90deg,#7f0a0a_0%,#b71515_100%)] text-white font-heading uppercase tracking-[0.14em] text-[10px] sm:text-xs">
                          {hierarchyBadge}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col items-end justify-center rounded-2xl border border-white/10 bg-black/35 px-4 py-3 min-w-[172px]">
                    <div className="font-heading text-white uppercase tracking-[0.16em] text-xs">
                      Próximo ganho de giros em:
                    </div>
                    <div className="mt-2 font-heading text-[#f1f1f1] text-4xl leading-none tracking-[0.14em]">
                      45:00
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300 font-heading">
                      Tempo até próximo giro
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-5 gap-[1px] rounded-xl overflow-hidden border border-white/10 bg-white/10">
                  <div className="bg-black/45 px-2 sm:px-3 py-2 sm:py-3">
                    <div className="font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-[#d9b764]">
                      Nível
                    </div>
                    <div className="mt-1 font-heading text-white text-lg sm:text-2xl leading-none">
                      {playerLevel}
                    </div>
                  </div>

                  <div className="bg-black/45 px-2 sm:px-3 py-2 sm:py-3">
                    <div className="font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-[#d9b764]">
                      Poder
                    </div>
                    <div className="mt-1 font-heading text-white text-lg sm:text-2xl leading-none">
                      {formatCompact(power)}
                    </div>
                  </div>

                  <div className="bg-black/45 px-2 sm:px-3 py-2 sm:py-3">
                    <div className="font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-[#d9b764]">
                      Dinheiro sujo
                    </div>
                    <div className="mt-1 font-heading text-white text-lg sm:text-2xl leading-none">
                      ${formatCompact(dirtyMoney)}
                    </div>
                  </div>

                  <div className="bg-black/45 px-2 sm:px-3 py-2 sm:py-3">
                    <div className="font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-[#d9b764]">
                      Dinheiro limpo
                    </div>
                    <div className="mt-1 font-heading text-white text-lg sm:text-2xl leading-none">
                      ${formatCompact(cleanMoney)}
                    </div>
                  </div>

                  <div className="bg-black/45 px-2 sm:px-3 py-2 sm:py-3">
                    <div className="font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-[#d9b764]">
                      Giros
                    </div>
                    <div className="mt-1 font-heading text-white text-lg sm:text-2xl leading-none">
                      {formatCompact(corre)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}