import { Link } from 'react-router-dom';
import { useMember } from '@/integrations';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { member, isAuthenticated, isLoading, actions } = useMember();

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
          <a 
            href="#missoes"
            className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
          >
            Missões
          </a>
          
          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  {member?.profile?.nickname || 'Perfil'}
                </Link>
                <button
                  onClick={actions.logout}
                  className="flex items-center gap-2 bg-destructive text-destructiveforeground font-heading text-sm uppercase tracking-wider px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={actions.login}
                  className="font-heading text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                >
                  Entrar
                </button>
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
