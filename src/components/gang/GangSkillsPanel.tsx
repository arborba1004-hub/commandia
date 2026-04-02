import { useGangStore } from '@/store/gangStore';

export default function GangSkillsPanel() {
  const { myGang, upgradeGangSkill } = useGangStore();
  if (!myGang) return null;

  // Habilidades fixas da quadrilha (exemplo)
  const skills = [
    { id: 'training', name: 'Campo de Treinamento', level: myGang.upgrades.trainingGroundsLevel, effect: '+10% EXP por membro por nível', cost: 5000 },
    { id: 'hideout', name: 'Esconderijo', level: myGang.upgrades.hideoutLevel, effect: '-5% manutenção diária por nível', cost: 8000 },
    { id: 'blackmarket', name: 'Mercado Negro', level: myGang.upgrades.blackMarketLevel, effect: '+5% chance de recrutar raros por nível', cost: 10000 },
  ];

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-4">Habilidades da Quadrilha</h2>
      {skills.map(skill => (
        <div key={skill.id} className="flex justify-between items-center border-b border-white/10 py-3">
          <div>
            <p className="font-bold">{skill.name} Nv.{skill.level}</p>
            <p className="text-sm text-gray-400">{skill.effect}</p>
          </div>
          <button onClick={() => upgradeGangSkill(skill.id)} className="bg-primary text-black px-4 py-1 rounded">Upgrade ({skill.cost} EXP)</button>
        </div>
      ))}
    </div>
  );
}