export default function Footer() {
  return (
    <footer className="bg-background border-t border-custom4">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-wider text-foreground mb-4">
              Domínio do Comando
            </h3>
            <p className="font-paragraph text-base text-foreground/80 leading-relaxed">
              Conquiste o poder absoluto. Do nível 1 ao 100, cada missão é uma oportunidade de dominar o império.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading text-lg uppercase tracking-wider text-foreground mb-4">
              Navegação
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/" className="font-paragraph text-base text-foreground/80 hover:text-primary transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="/galeria" className="font-paragraph text-base text-foreground/80 hover:text-primary transition-colors">
                  Galeria
                </a>
              </li>
              <li>
                <a href="#missoes" className="font-paragraph text-base text-foreground/80 hover:text-primary transition-colors">
                  Missões
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-lg uppercase tracking-wider text-foreground mb-4">
              Contato
            </h4>
            <ul className="space-y-3">
              <li className="font-paragraph text-base text-foreground/80">
                suporte@dominiocomando.com
              </li>
              <li className="font-paragraph text-base text-foreground/80">
                Comunidade Discord
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-custom4">
          <p className="font-paragraph text-sm text-foreground/60 text-center">
            © 2026 Domínio do Comando. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
