import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function ProfilePage() {
  const { playerData, isAuthenticated, logout } = useGoogleAuth();

  if (!isAuthenticated || !playerData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-24 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">
              Acesso negado
            </h1>
            <p className="text-lg mb-8">
              Você precisa estar autenticado para acessar seu perfil.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg"
            >
              Voltar ao início
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 space-y-6">
            <h1 className="text-4xl font-bold">
              Meu Perfil
            </h1>

            <div className="space-y-3">
              <p><strong>Nome:</strong> {playerData.name || 'Jogador'}</p>
              <p><strong>Email:</strong> {playerData.email || 'Não disponível'}</p>
              <p><strong>ID:</strong> {playerData._id || 'Não disponível'}</p>
              <p><strong>Level:</strong> {playerData.level ?? 1}</p>
              <p><strong>HP:</strong> {playerData.hp ?? 100}</p>
              <p><strong>Moedas:</strong> {playerData.money ?? 0}</p>
            </div>

            {playerData.avatar && (
              <div>
                <img
                  src={playerData.avatar}
                  alt={playerData.name || 'Perfil'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              </div>
            )}

            <button
              onClick={logout}
              className="w-full px-6 py-4 bg-red-600 text-white rounded-lg"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}