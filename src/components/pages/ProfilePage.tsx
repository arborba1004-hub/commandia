// ... keep existing code (Header and Footer rendered by Router layout) ...
import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore }    from '@/store/playerStore';
import { Image }             from '@/components/ui/image';
import { useEffect }         from 'react';
import HierarchyBadgesDisplay from '@/components/HierarchyBadgesDisplay';
import { disconnectSocket }  from '@/socket';

export default function ProfilePage() {
  const navigate  = useNavigate();
  const { player, isLoaded, clearPlayer } = usePlayerStore();

  // Socket envia playerInit → isLoaded fica true automaticamente
  // Não é mais necessário chamar loadPlayer()
  useEffect(() => {
    if (isLoaded && !player?._id) {
      navigate('/');
    }
  }, [isLoaded, player?._id, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-24 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Carregando...</h1>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!player?._id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-24 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Acesso negado</h1>
            <p className="text-lg mb-8">Você precisa estar autenticado para acessar seu perfil.</p>
            <Link to="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg">
              Voltar ao início
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    disconnectSocket();
    clearPlayer();
    navigate('/');
  };

  return (
    <div className="w-full">
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 space-y-6">
            <h1 className="text-4xl font-bold">Meu Perfil</h1>

            <div className="space-y-3">
              <p><strong>Nome:</strong> {player.name || 'Jogador'}</p>
              <p><strong>Email:</strong> {player.email || 'Não disponível'}</p>
              <p><strong>ID:</strong> {player._id || 'Não disponível'}</p>
              <p><strong>Level:</strong> {player.niveis.playerLevel}</p>
              <p><strong>Power:</strong> {player.power}</p>
              <p><strong>Skill Boost Multiplier:</strong> {player.skillBoostMultiplier}x</p>
            </div>

            {player.avatar && (
              <div>
                <p className="font-semibold mb-2">Avatar:</p>
                <Image
                  src={player.avatar}
                  alt="Avatar do jogador"
                  className="w-24 h-24 rounded-full object-cover border-2 border-secondary"
                />
              </div>
            )}

            <HierarchyBadgesDisplay />

            <div className="pt-4 border-t border-secondary/20">
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
