import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
          Erro
        </h1>
        <p className="text-lg font-paragraph text-foreground/80 mb-8">
          {error instanceof Error ? error.message : 'Algo deu errado'}
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-heading uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
}
