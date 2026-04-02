import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { getWeaponByPlayerLevel } from '@/data/armas';
import { Model3D } from '@/components/Model3D';

export default function ArmasPage() {
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg">Carregando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const playerLevel = player?.niveis?.barracoLevel || 1;
  const weapon = getWeaponByPlayerLevel(playerLevel);

  if (!weapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Arsenal</h1>
            <p className="text-white/70">
              Nenhuma arma encontrada para o nível {playerLevel}.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const bonusLabel =
    weapon.skillBonusType === 'attack' ? 'Ataque' : 'Defesa';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* MODELO 3D */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <div className="mb-4">
              <p className="text-sm text-white/50 uppercase tracking-widest">
                Objeto 3D
              </p>
              <p className="text-white/80 break-all text-sm mt-1">
                {weapon.object3d}
              </p>
            </div>

            <div
              className="h-[420px] rounded-2xl bg-black border border-white/10 overflow-hidden"
              style={{
                filter: weapon.filterCode,
              }}
            >
              <Model3D modelUrl={weapon.object3d} />
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <p className="text-sm text-white/50 uppercase tracking-widest">
              Arsenal
            </p>

            <h1 className="text-4xl font-bold mt-2 mb-6">
              {weapon.name}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-white/50">Nível do jogador</p>
                <p className="text-2xl font-bold mt-1">
                  {weapon.playerStoreLevel}
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-white/50">Categoria</p>
                <p className="text-2xl font-bold mt-1">
                  {weapon.category}
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-4">
              <p className="text-sm text-white/50 mb-2">Filtro</p>
              <p className="text-lg font-semibold">{weapon.filterName}</p>
              <p className="text-white/70 text-sm mt-2 break-all">
                Código: {weapon.filterCode}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-white/50">Brilho</p>
                  <p className="text-lg font-bold">{weapon.brightness}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Saturação</p>
                  <p className="text-lg font-bold">{weapon.saturation}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-4">
              <p className="text-sm text-white/50 mb-2">Bônus</p>
              <p className="text-2xl font-bold">
                {bonusLabel} +{weapon.skillBonusPercent}%
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-white/50 mb-2">Valor</p>
              <p className="text-3xl font-bold text-primary">
                R$ {weapon.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}