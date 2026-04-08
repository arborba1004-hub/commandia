import { useNavigate } from 'react-router-dom';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-red-500 mb-4">Erro 404</h1>
        <p className="text-xl text-zinc-300 mb-8">Página não encontrada</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl bg-gradient-to-r from-red-950 via-red-800 to-red-950 px-8 py-4 text-sm font-bold uppercase tracking-[0.28em] text-white shadow-[0_0_20px_rgba(180,20,20,0.35)] transition hover:opacity-90"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
