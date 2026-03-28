import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10\">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between\">
        <Link to="/" className="text-white font-bold text-xl lg:text-2xl uppercase tracking-[0.2em] hover:text-amber-300 transition-colors\">
          Domínio do Comando
        </Link>
        
        <nav className="flex items-center gap-8\">
          <Link 
            to="/" 
            className="text-white/80 text-sm uppercase tracking-[0.15em] hover:text-amber-300 transition-colors"
          >
            Início
          </Link>
          <Link 
            to="/galeria" 
            className="text-white/80 text-sm uppercase tracking-[0.15em] hover:text-amber-300 transition-colors"
          >
            Galeria
          </Link>
        </nav>
      </div>
    </header>
  );
}
