import { Link } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { LogOut, User } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

export default function Header() {
  const { playerData, isAuthenticated, logout } = useGoogleAuth();
  const { player } = usePlayerStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-custom4">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl lg:text-3xl uppercase tracking-wider text-foreground hover:text-primary transition-colors">
          Domínio do Comando
        </Link>

        {/* Vaults Section */}
        {isAuthenticated && (
          <div className="flex items-center gap-6">
            {/* Dirty Money Vault */}
            <div className="flex items-center gap-2 bg-custom4 px-4 py-2 rounded-lg border border-primary">
              <span className="text-sm font-heading uppercase tracking-wider text-foreground">💰 Sujo:</span>
              <span className="text-lg font-heading text-primary font-bold">{player.balances.dirtyMoney.toLocaleString()}</span>
            </div>

            {/* Clean Money Vault */}
            <div className="flex items-center gap-2 bg-custom4 px-4 py-2 rounded-lg border border-secondary">
              <span className="text-sm font-heading uppercase tracking-wider text-foreground">💵 Limpo:</span>
              <span className="text-lg font-heading text-secondary font-bold">{player.balances.cleanMoney.toLocaleString()}</span>
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
          
          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/game"
                  className="flex items-center gap-2 font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  {playerData?.name || 'Jogo'}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-destructive text-destructiveforeground font-heading text-sm uppercase tracking-wider px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
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
    </header>
  );
}
