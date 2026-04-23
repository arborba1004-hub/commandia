import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { Image } from '@/components/ui/image';
import { useEffect } from 'react';
import HierarchyBadgesDisplay from '@/components/HierarchyBadgesDisplay';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { player, isLoaded, loadPlayer } = usePlayerStore();

  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    } else if (!player?._id) {
      navigate('/');
    }
  }, [isLoaded, player?._id, navigate, loadPlayer]);

  if (!player?._id) {
    return (
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
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerData');
    loadPlayer();
    navigate('/');
  };

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-8 space-y-6">
          <h1 className="text-4xl font-bold">
            Meu Perfil
          </h1>

          <div className="space-y-3">
            <p><strong>Nome:</strong> {player.name || 'Jogador'}</p>
            <p><strong>Email:</strong> {player.email || 'Não disponível'}</p>
            <p><strong>ID:</strong> {player._id || 'Não disponível'}</p>
            <p><strong>Level:</strong> {player.niveis.playerLevel}</p>
            <p><strong>Power:</strong> {player.power}</p>
            <p><strong>Skill Boost Multiplier:</strong> {player.skillBoostMultiplier}x</p>
            {/* ÚNICA FONTE: playerStore */}
            <p><strong>Commands Sujo:</strong> {player.balances.dirtyMoney.toLocaleString('pt-BR')}</p>
            <p><strong>Commands Limpo:</strong> {player.balances.cleanMoney.toLocaleString('pt-BR')}</p>
            <p><strong>Corre:</strong> {player.balances.corre.toLocaleString('pt-BR')}</p>
          </div>

          {player.avatar && (
            <div>
              <Image src={player.avatar} alt={player.name || 'Perfil'} className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 bg-red-600 text-white rounded-lg"
          >
            Sair da conta
          </button>
        </div>

        {/* Hierarchy Badges Section */}
        <div className="mt-12">
          <HierarchyBadgesDisplay
            playerLevel={player.niveis.barracoLevel || 1}
            currentRank={player.currentRank}
          />
        </div>
      </div>
    </section>
  );
}