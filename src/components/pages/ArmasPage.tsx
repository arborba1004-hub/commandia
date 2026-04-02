import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { WEAPONS } from '@/data/armas';
import { Model3D } from '@/components/Model3D';

export default function ArmasPage() {
  const player = usePlayerStore((s) => s.player);

  const level = player?.niveis?.playerLevel || 1;
  const weapon = WEAPONS.find((w) => w.level === level);

  if (!weapon) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <Model3D modelUrl={weapon.object3d} />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{weapon.name}</h1>

            <p>Nível: {weapon.level}</p>

            <p>Filtro: {weapon.filterName}</p>
            <p>Brilho: {weapon.brightness}</p>
            <p>Saturação: {weapon.saturation}</p>

            <p>Ataque: +{weapon.attackBonus}%</p>
            <p>Defesa: +{weapon.defenseBonus}%</p>

            <p className="text-2xl font-bold">
              R$ {weapon.price.toLocaleString('pt-BR')}
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}