import { Shield, Swords, Target, Radar, Coins, Edit2, Save, X } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';
import type { GangFormationType } from '@/types/gang';
import { useState, useEffect } from 'react';
import { getCustomFormations, saveCustomFormations, DEFAULT_CUSTOM_FORMATIONS } from '@/utils/customFormations';
import type { CustomFormationConfig } from '@/utils/customFormations';

type FormationType = GangFormationType;

interface FormationConfig {
  id: FormationType;
  title: string;
  description: string;
  rajada: string;
  blindagem: string;
  folego: string;
  quebra: string;
  loot: string;
  Icon: typeof Swords;
  isCustom?: boolean;
}

const DEFAULT_FORMATIONS: FormationConfig[] = [
  {
    id: 'pressao_total',
    title: 'Pressão Total',
    description: 'Entrada pesada, mais rajada e quebra, com mais exposição da tropa.',
    rajada: '+18%',
    blindagem: '-8%',
    folego: '-4%',
    quebra: '+14%',
    loot: '+0%',
    Icon: Swords,
  },
  {
    id: 'linha_fechada',
    title: 'Linha Fechada',
    description:
      'Formação de sustentação, melhor para resistir, preservar a tropa e segurar confronto longo.',
    rajada: '-6%',
    blindagem: '+20%',
    folego: '+10%',
    quebra: '-4%',
    loot: '+0%',
    Icon: Shield,
  },
  {
    id: 'bote_certo',
    title: 'Bote Certo',
    description: 'Ataque coordenado com boa mobilidade e pressão precisa.',
    rajada: '+10%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+10%',
    loot: '+8%',
    Icon: Target,
  },
  {
    id: 'cerco',
    title: 'Cerco',
    description: 'Formação equilibrada para sufocar o alvo e manter a linha organizada.',
    rajada: '+6%',
    blindagem: '+8%',
    folego: '+6%',
    quebra: '+6%',
    loot: '+0%',
    Icon: Radar,
  },
  {
    id: 'saque_rapido',
    title: 'Saque Rápido',
    description: 'Menos sustentação, mais mobilidade e foco em espólio.',
    rajada: '+0%',
    blindagem: '-6%',
    folego: '-2%',
    quebra: '+4%',
    loot: '+22%',
    Icon: Coins,
  },
];

const CUSTOM_FORMATION_DEFAULTS: Record<'custom_1' | 'custom_2' | 'custom_3', FormationConfig> = {
  custom_1: {
    id: 'custom_1',
    title: 'Personalizada 1',
    description: 'Configure sua formação personalizada',
    rajada: '+0%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+0%',
    loot: '+0%',
    Icon: Swords,
    isCustom: true,
  },
  custom_2: {
    id: 'custom_2',
    title: 'Personalizada 2',
    description: 'Configure sua formação personalizada',
    rajada: '+0%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+0%',
    loot: '+0%',
    Icon: Swords,
    isCustom: true,
  },
  custom_3: {
    id: 'custom_3',
    title: 'Personalizada 3',
    description: 'Configure sua formação personalizada',
    rajada: '+0%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+0%',
    loot: '+0%',
    Icon: Swords,
    isCustom: true,
  },
};

export default function GangFormationSelector() {
  const gang = useGangStore((state) => state.gang);
  const isSubmitting = useGangStore((state) => state.isSubmitting);
  const setFormation = useGangStore((state) => state.setFormation);

  const formation = gang?.formation || 'pressao_total';

  // Load custom formations from localStorage
  const [customFormations, setCustomFormations] = useState<Record<'custom_1' | 'custom_2' | 'custom_3', FormationConfig>>(() => {
    const saved = getCustomFormations();
    return {
      custom_1: { ...CUSTOM_FORMATION_DEFAULTS.custom_1, ...saved.custom_1 },
      custom_2: { ...CUSTOM_FORMATION_DEFAULTS.custom_2, ...saved.custom_2 },
      custom_3: { ...CUSTOM_FORMATION_DEFAULTS.custom_3, ...saved.custom_3 },
    };
  });

  const [editingCustom, setEditingCustom] = useState<'custom_1' | 'custom_2' | 'custom_3' | null>(null);
  const [editValues, setEditValues] = useState<Partial<FormationConfig>>({});

  const allFormations: FormationConfig[] = [
    ...DEFAULT_FORMATIONS,
    customFormations.custom_1,
    customFormations.custom_2,
    customFormations.custom_3,
  ];

  const handleStartEdit = (customId: 'custom_1' | 'custom_2' | 'custom_3') => {
    setEditingCustom(customId);
    setEditValues({ ...customFormations[customId] });
  };

  const handleSaveCustom = (customId: 'custom_1' | 'custom_2' | 'custom_3') => {
    const updated = {
      ...customFormations,
      [customId]: {
        ...customFormations[customId],
        ...editValues,
      },
    };
    setCustomFormations(updated);
    
    // Save to localStorage
    const toSave: Record<'custom_1' | 'custom_2' | 'custom_3', CustomFormationConfig> = {
      custom_1: {
        id: 'custom_1',
        title: updated.custom_1.title,
        description: updated.custom_1.description,
        rajada: updated.custom_1.rajada,
        blindagem: updated.custom_1.blindagem,
        folego: updated.custom_1.folego,
        quebra: updated.custom_1.quebra,
        loot: updated.custom_1.loot,
      },
      custom_2: {
        id: 'custom_2',
        title: updated.custom_2.title,
        description: updated.custom_2.description,
        rajada: updated.custom_2.rajada,
        blindagem: updated.custom_2.blindagem,
        folego: updated.custom_2.folego,
        quebra: updated.custom_2.quebra,
        loot: updated.custom_2.loot,
      },
      custom_3: {
        id: 'custom_3',
        title: updated.custom_3.title,
        description: updated.custom_3.description,
        rajada: updated.custom_3.rajada,
        blindagem: updated.custom_3.blindagem,
        folego: updated.custom_3.folego,
        quebra: updated.custom_3.quebra,
        loot: updated.custom_3.loot,
      },
    };
    saveCustomFormations(toSave);
    setEditingCustom(null);
  };

  const handleCancelEdit = () => {
    setEditingCustom(null);
    setEditValues({});
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
          Formação da Gangue
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          A formação influencia Rajada, Blindagem, Fôlego, Quebra e o rendimento do espólio.
        </p>
      </div>

      {/* Formações Padrão */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-zinc-300">
          Formações Padrão
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {DEFAULT_FORMATIONS.map((item) => {
            const selected = formation === item.id;
            const Icon = item.Icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  void setFormation(item.id);
                }}
                disabled={isSubmitting}
                className={`rounded-3xl border p-5 text-left transition-all disabled:opacity-50 ${
                  selected
                    ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,0,127,0.18)]'
                    : 'border-white/10 bg-zinc-950/70 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-2xl p-3 ${
                      selected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-zinc-300'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {selected ? 'Ativa' : isSubmitting ? 'Salvando...' : 'Selecionar'}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>

                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                    <span className="text-zinc-400">Rajada</span>
                    <span className="font-bold text-red-300">{item.rajada}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                    <span className="text-zinc-400">Blindagem</span>
                    <span className="font-bold text-cyan-300">{item.blindagem}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                    <span className="text-zinc-400">Fôlego</span>
                    <span className="font-bold text-amber-300">{item.folego}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                    <span className="text-zinc-400">Quebra</span>
                    <span className="font-bold text-orange-300">{item.quebra}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                    <span className="text-zinc-400">Espólio</span>
                    <span className="font-bold text-emerald-300">{item.loot}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formações Personalizadas */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-zinc-300">
          Formações Personalizadas
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['custom_1', 'custom_2', 'custom_3'] as const).map((customId) => {
            const item = customFormations[customId];
            const selected = formation === customId;
            const isEditing = editingCustom === customId;
            const Icon = item.Icon;

            return (
              <div
                key={customId}
                className={`rounded-3xl border p-5 transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,0,127,0.18)]'
                    : 'border-white/10 bg-zinc-950/70'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-zinc-400">Nome</label>
                      <input
                        type="text"
                        value={editValues.title || ''}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-zinc-500"
                        placeholder="Nome da formação"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-zinc-400">Descrição</label>
                      <input
                        type="text"
                        value={editValues.description || ''}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-zinc-500"
                        placeholder="Descrição da formação"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {['rajada', 'blindagem', 'folego', 'quebra', 'loot'].map((attr) => (
                        <div key={attr}>
                          <label className="text-xs font-bold uppercase text-zinc-400">{attr}</label>
                          <input
                            type="text"
                            value={editValues[attr as keyof FormationConfig] || ''}
                            onChange={(e) => setEditValues({ ...editValues, [attr]: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white placeholder-zinc-500"
                            placeholder="+0%"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveCustom(customId)}
                        className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/80"
                      >
                        <Save className="mr-1 inline h-4 w-4" />
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/5"
                      >
                        <X className="mr-1 inline h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-2xl p-3 ${
                            selected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-zinc-300'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.title}</h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                            {selected ? 'Ativa' : 'Selecionar'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartEdit(customId)}
                        className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                      >
                        <Edit2 className="h-4 w-4 text-zinc-300" />
                      </button>
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>

                    <div className="mb-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                        <span className="text-zinc-400">Rajada</span>
                        <span className="font-bold text-red-300">{item.rajada}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                        <span className="text-zinc-400">Blindagem</span>
                        <span className="font-bold text-cyan-300">{item.blindagem}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                        <span className="text-zinc-400">Fôlego</span>
                        <span className="font-bold text-amber-300">{item.folego}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                        <span className="text-zinc-400">Quebra</span>
                        <span className="font-bold text-orange-300">{item.quebra}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                        <span className="text-zinc-400">Espólio</span>
                        <span className="font-bold text-emerald-300">{item.loot}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        void setFormation(customId);
                      }}
                      disabled={isSubmitting || selected}
                      className={`w-full rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                        selected
                          ? 'bg-primary/20 text-primary'
                          : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {selected ? 'Ativa' : 'Selecionar'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}