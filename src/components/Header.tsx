import { Link } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { LogOut, User } from 'lucide-react';
import { useEffect } from 'react';

export default function Header() {
  const { player, loadPlayer, isLoaded, startPolling, stopPolling } = usePlayerStore();

  useEffect(() => {
    if (!isLoaded) loadPlayer();
  }, [isLoaded, loadPlayer]);

  // Inicia polling quando autenticado
  useEffect(() => {
    const isAuthenticated = !!player?._id;
    if (isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [player?._id, startPolling, stopPolling]);

  const isAuthenticated = !!player?._id;
  const dirtyMoney = player?.balances?.dirtyMoney ?? 0;
  const cleanMoney = player?.balances?.cleanMoney ?? 0;
  const corre = player?.balances?.corre ?? 0;
  const playerName = player?.name || 'Jogador';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerData');
    stopPolling();
    loadPlayer();
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-custom4">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between gap-6">
        <Link
          to="/"
          className="font-heading text-2xl lg:text-3xl uppercase tracking-wider text-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          Domínio do Comando
        </Link>

        {isAuthenticated && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl border border-red-500/20 bg-red-900/30 text-sm font-heading uppercase tracking-wider text-red-200">
              Commands Sujo: {dirtyMoney.toLocaleString('pt-BR')}
            </div>

            <div className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-900/30 text-sm font-heading uppercase tracking-wider text-emerald-200">
              Commands Limpo: {cleanMoney.toLocaleString('pt-BR')}
            </div>

            <div className="px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-900/30 text-sm font-heading uppercase tracking-wider text-blue-200">
              Corre: {corre.toLocaleString('pt-BR')}
            </div>
          </div>
        )}

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

          {!isAuthenticated && (
            <a
              href="#missoes"
              className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Missões
            </a>
          )}

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/game"
                  className="flex items-center gap-2 font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  {playerName}
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-destructive text-destructive-foreground font-heading text-sm uppercase tracking-wider px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                >
                  Entrar
                </Link>

                <button className="bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                  Jogar
                </button>
              </>
            )}
          </div>
        </nav>
      </div>

      {isAuthenticated && (
        <div className="lg:hidden px-6 pb-4">
          <div className="flex flex-col gap-2">
            <div className="px-4 py-2 rounded-xl border border-red-500/20 bg-red-900/30 text-xs font-heading uppercase tracking-wider text-red-200">
              Commands Sujo: {player?.balances?.dirtyMoney ?? 0}
            </div>

            <div className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-900/30 text-xs font-heading uppercase tracking-wider text-emerald-200">
              Commands Limpo: {player?.balances?.cleanMoney ?? 0}
            </div>

            <div className="px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-900/30 text-xs font-heading uppercase tracking-wider text-blue-200">
              Corre: {player?.balances?.corre ?? 0}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}