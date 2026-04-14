import { useMemo } from 'react';
import { useGangStore } from '@/store/gangStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';

function formatFormationLabel(value: string) {
  if (value === 'pressao_total') return 'Pressão total';
  if (value === 'linha_fechada') return 'Linha fechada';
  if (value === 'bote_certo') return 'Bote certo';
  if (value === 'cerco') return 'Cerco';
  if (value === 'saque_rapido') return 'Saque rápido';
  return value;
}

export default function GangSkillsPanel() {
  const gang = useGangStore((state) => state.gang);
  const baseStats = useGangStore((state) => state.getBattleStats());
  const formation = useGangBattleStore((state) => state.formation);
  const formationBonus = useGangBattleStore((state) => state.getFormationBonus());
  const finalStats = useGangBattleStore((state) => state.applyFormationStats(baseStats));

  const members = gang?.members || [];
  const ct = gang?.ct || {
    level: 1,
    trainingSlots: 1,
    recoveryBonusPercent: 0,
    trainingSpeedBonusPercent: 0,
    gangCapacityBonus: 0,
  };

  const counts = useMemo(() => {
    return {
      capanga: members.filter((m) => m.type === 'capanga').length,
      frente: members.filter((m) => m.type === 'frente').length,
      executor: members.filter((m) => m.type === 'executor').length,
      assassino: members.filter((m) => m.type === 'assassino').length,
      muralha: members.filter((m) => m.type === 'muralha').length,
      certeiro: members.filter((m) => m.type === 'certeiro').length,
      motorista: members.filter((m) => m.type === 'motorista').length,
      nitro: members.filter((m) => m.type === 'nitro').length,
      armeiro: members.filter((m) => m.type === 'armeiro').length,
      informante: members.filter((m) => m.type === 'informante').length,
      wifi: members.filter((m) => m.type === 'wifi').length,
      medico: members.filter((m) => m.type === 'medico').length,
      lavador: members.filter((m) => m.type === 'lavador').length,
      ladrao: members.filter((m) => m.type === 'ladrao').length,
      negociador: members.filter((m) => m.type === 'negociador').length,
    };
  }, [members]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
          Leitura Tática da Gangue
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Aqui você acompanha o peso real da sua composição, da formação e do CT
          sobre o desempenho da tropa.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-zinc-300">
        Formação ativa:{' '}
        <span className="font-black text-emerald-300">
          {formatFormationLabel(formation)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-red-500/20 bg-zinc-950/70 p-5">
          <h3 className="text-lg font-bold text-white">Rajada</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Pressão ofensiva da composição.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Base</span>
              <span className="font-bold text-white">
                {baseStats.rajada.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Formação</span>
              <span className="font-bold text-red-300">
                {formationBonus.rajadaPercent > 0 ? '+' : ''}
                {formationBonus.rajadaPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Final</span>
              <span className="font-bold text-red-300">
                {finalStats.rajada.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-zinc-950/70 p-5">
          <h3 className="text-lg font-bold text-white">Blindagem</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Resistência e proteção da linha.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Base</span>
              <span className="font-bold text-white">
                {baseStats.blindagem.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Formação</span>
              <span className="font-bold text-cyan-300">
                {formationBonus.blindagemPercent > 0 ? '+' : ''}
                {formationBonus.blindagemPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Final</span>
              <span className="font-bold text-cyan-300">
                {finalStats.blindagem.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-500/20 bg-zinc-950/70 p-5">
          <h3 className="text-lg font-bold text-white">Fôlego</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Sustentação, recuperação e permanência em combate.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Base</span>
              <span className="font-bold text-white">
                {baseStats.folego.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Formação</span>
              <span className="font-bold text-amber-300">
                {formationBonus.folegoPercent > 0 ? '+' : ''}
                {formationBonus.folegoPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Final</span>
              <span className="font-bold text-amber-300">
                {finalStats.folego.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-500/20 bg-zinc-950/70 p-5">
          <h3 className="text-lg font-bold text-white">Quebra</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Capacidade de arrombar, esmagar e converter confronto em dano.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Base</span>
              <span className="font-bold text-white">
                {baseStats.quebra.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Formação</span>
              <span className="font-bold text-orange-300">
                {formationBonus.quebraPercent > 0 ? '+' : ''}
                {formationBonus.quebraPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-zinc-500">Final</span>
              <span className="font-bold text-orange-300">
                {finalStats.quebra.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <h3 className="text-lg font-bold text-white">Composição da tropa</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Distribuição atual dos operadores da gangue.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Capangas</div>
              <div className="font-bold text-white">{counts.capanga}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Frente</div>
              <div className="font-bold text-white">{counts.frente}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Executor</div>
              <div className="font-bold text-white">{counts.executor}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Assassino</div>
              <div className="font-bold text-white">{counts.assassino}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Muralha</div>
              <div className="font-bold text-white">{counts.muralha}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Certeiro</div>
              <div className="font-bold text-white">{counts.certeiro}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Motorista</div>
              <div className="font-bold text-white">{counts.motorista}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Nitro</div>
              <div className="font-bold text-white">{counts.nitro}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Armeiro</div>
              <div className="font-bold text-white">{counts.armeiro}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Informante</div>
              <div className="font-bold text-white">{counts.informante}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">WiFi</div>
              <div className="font-bold text-white">{counts.wifi}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Médico</div>
              <div className="font-bold text-white">{counts.medico}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Lavador</div>
              <div className="font-bold text-white">{counts.lavador}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Ladrão</div>
              <div className="font-bold text-white">{counts.ladrao}</div>
            </div>
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Negociador</div>
              <div className="font-bold text-white">{counts.negociador}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <h3 className="text-lg font-bold text-white">Impacto estrutural</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Leitura do suporte tático e operacional da composição.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Poder médico</div>
              <div className="font-bold text-white">
                {finalStats.medicalPower.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Inteligência</div>
              <div className="font-bold text-white">
                {finalStats.intelPower.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Mobilidade</div>
              <div className="font-bold text-white">
                {finalStats.mobilityPower.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Poder bélico</div>
              <div className="font-bold text-white">
                {finalStats.weaponPower.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Coordenação</div>
              <div className="font-bold text-white">
                {finalStats.coordinationPower.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 px-3 py-2">
              <div className="text-zinc-500">Espólio</div>
              <div className="font-bold text-white">
                {finalStats.lootPower.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-zinc-300">
            Nível do CT:{' '}
            <span className="font-black text-cyan-300">Nv. {ct.level}</span>
            <span className="mx-2 text-zinc-600">•</span>
            Recuperação:{' '}
            <span className="font-black text-cyan-300">
              +{ct.recoveryBonusPercent}%
            </span>
            <span className="mx-2 text-zinc-600">•</span>
            Treino:{' '}
            <span className="font-black text-cyan-300">
              +{ct.trainingSpeedBonusPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}