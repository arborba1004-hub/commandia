import { Link } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { usePlayerStore } from '@/store/playerStore';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { playerData, isAuthenticated, logout } = useGoogleAuth();
  const { player } = usePlayerStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-custom4">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl lg:text-3xl uppercase tracking-wider text-foreground hover:text-primary transition-colors">
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
          {!isAuthenticated && (
            <a 
              href="#missoes"
              className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              Missões
            </a>
          )}
          
          {/* Money Vaults */}
          {isAuthenticated && (
            <div className="flex items-center gap-4 px-4 py-2 bg-custom4/30 rounded-lg border border-custom4">
              <div className="flex items-center gap-2">
                <span className="text-primary font-heading text-xs uppercase">💰 Sujo:</span>
                <span className="text-foreground font-heading text-sm">{player.balances.dirtyMoney}</span>
              </div>
              <div className="w-px h-4 bg-custom4"></div>
              <div className="flex items-center gap-2">
                <span className="text-secondary font-heading text-xs uppercase">💵 Limpo:</span>
                <span className="text-foreground font-heading text-sm">{player.balances.cleanMoney}</span>
              </div>
            </div>
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
