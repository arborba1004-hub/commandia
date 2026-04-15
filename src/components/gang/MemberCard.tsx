import { Activity, HeartPulse, Shield, Zap } from 'lucide-react';
import type { GangUnit } from '@/types/gangWar';

interface MemberCardProps {
  member: GangUnit;
  onTrain?: (memberId: string) => void;
  isBusy?: boolean;
}

function getTypeLabel(type: GangUnit['type']) {
  if (type === 'capanga') return 'Capanga';
  if (type === 'frente') return 'Frente';
  if (type === 'executor') return 'Executor';
  if (type === 'assassino') return 'Assassino';
  if (type === 'muralha') return 'Muralha';
  if (type === 'certeiro') return 'Certeiro';
  if (type === 'motorista') return 'Motorista';
  if (type === 'nitro') return 'Nitro';
  if (type === 'armeiro') return 'Armeiro';
  if (type === 'informante') return 'Informante';
  if (type === 'wifi') return 'WiFi';
  if (type === 'medico') return 'Médico';
  if (type === 'lavador') return 'Lavador';
  if (type === 'ladrao') return 'Ladrão';
  return 'Negociador';
}

function getRoleLabel(type: GangUnit['type']) {
  if (type === 'capanga') return 'Base da tropa';
  if (type === 'frente') return 'Linha de entrada';
  if (type === 'executor') return 'Ofensiva pesada';
  if (type === 'assassino') return 'Eliminação rápida';
  if (type === 'muralha') return 'Defesa pesada';
  if (type === 'certeiro') return 'Cobertura ofensiva';
  if (type === 'motorista') return 'Mobilidade';
  if (type === 'nitro') return 'Velocidade tática';
  if (type === 'armeiro') return 'Arsenal';
  if (type === 'informante') return 'Inteligência';
  if (type === 'wifi') return 'Coordenação';
  if (type === 'medico') return 'Recuperação';
  if (type === 'lavador') return 'Economia';
  if (type === 'ladrao') return 'Saque';
  return 'Negociação';
}

function getStatusLabel(status: GangUnit['status']) {
  if (status === 'ativo') return 'Ativo';
  if (status === 'ferido') return 'Ferido';
  if (status === 'morto') return 'Morto';
  return 'Treinando';
}

function getStatusClasses(status: GangUnit['status']) {
  if (status === 'ativo') {
    return 'bg-emerald-500/20 text-emerald-300';
  }
  if (status === 'ferido') {
    return 'bg-amber-500/20 text-amber-300';
  }
  if (status === 'morto') {
    return 'bg-red-500/20 text-red-300';
  }
  return 'bg-cyan-500/20 text-cyan-300';
}

function getCardClasses(type: GangUnit['type']) {
  if (type === 'assassino' || type === 'executor' || type === 'frente') {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }
  if (type === 'muralha' || type === 'medico') {
    return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  }
  if (type === 'motorista' || type === 'nitro') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  if (type === 'lavador' || type === 'ladrao' || type === 'negociador') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  return 'border-white/10 bg-white/[0.03] text-zinc-200';
}

export default function MemberCard({
  member,
  onTrain,
  isBusy = false,
}: MemberCardProps) {
  return (
    <div className={`rounded-3xl border p-5 ${getCardClasses(member.type)}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black">{getTypeLabel(member.type)}</h3>

            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
              {getRoleLabel(member.type)}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                member.status
              )}`}
            >
              {getStatusLabel(member.status)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Nível</div>
              <div className="font-bold">{member.level}</div>
            </div>

            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Recrutado</div>
              <div className="font-bold">
                {new Date(member.recruitedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Treino</div>
              <div className="font-bold">
                {member.trainingEndsAt ? 'Em andamento' : 'Livre'}
              </div>
            </div>

            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Condição</div>
              <div className="font-bold">{getStatusLabel(member.status)}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {member.injuryEndsAt && (
              <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-2 text-zinc-200">
                <HeartPulse className="h-3.5 w-3.5" />
                Recupera em {new Date(member.injuryEndsAt).toLocaleString('pt-BR')}
              </span>
            )}

            {member.trainingEndsAt && (
              <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-2 text-zinc-200">
                <Activity className="h-3.5 w-3.5" />
                Treino até {new Date(member.trainingEndsAt).toLocaleString('pt-BR')}
              </span>
            )}

            {member.lastBattleAt && (
              <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-2 text-zinc-200">
                <Shield className="h-3.5 w-3.5" />
                Última batalha {new Date(member.lastBattleAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {onTrain && (
            <button
              onClick={() => onTrain(member.id)}
              disabled={isBusy || member.status !== 'ativo' || member.level >= 10}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {member.level >= 10 ? 'Nível máximo' : 'Treinar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}