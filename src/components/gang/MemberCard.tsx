import { Shield, Swords, Trash2, Zap } from 'lucide-react';
import type { GangMember } from '@/types/gang';

interface MemberCardProps {
  member: GangMember;
  onToggleActive?: (memberId: string) => void;
  onDismiss?: (memberId: string) => void;
  onTrain?: (memberId: string, premium?: boolean) => void;
  isBusy?: boolean;
}

function getRarityClasses(rarity: string) {
  switch (rarity) {
    case 'Mítico':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'Lendário':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'Épico':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
    case 'Raro':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
    default:
      return 'border-white/10 bg-white/[0.03] text-zinc-200';
  }
}

export default function MemberCard({
  member,
  onToggleActive,
  onDismiss,
  onTrain,
  isBusy = false,
}: MemberCardProps) {
  return (
    <div className={`rounded-3xl border p-5 ${getRarityClasses(member.rarity)}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black">{member.name}</h3>
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
              {member.class}
            </span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
              {member.rarity}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                member.active
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {member.active ? 'Ativo' : 'Reserva'}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Nível</div>
              <div className="font-bold">{member.level}</div>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Lealdade</div>
              <div className="font-bold">{member.loyalty}</div>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Vitórias</div>
              <div className="font-bold">{member.victories}</div>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2">
              <div className="text-zinc-400">Derrotas</div>
              <div className="font-bold">{member.defeats}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {member.skills.map((skill) => (
              <span
                key={`${member.id}-${skill.id}`}
                className="rounded-full bg-black/30 px-3 py-2 text-zinc-200"
              >
                {skill.name} Lv.{skill.level}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {onTrain && (
            <>
              <button
                onClick={() => onTrain(member.id, false)}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                Treinar
              </button>

              <button
                onClick={() => onTrain(member.id, true)}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                <Swords className="h-4 w-4" />
                Premium
              </button>
            </>
          )}

          {onToggleActive && (
            <button
              onClick={() => onToggleActive(member.id)}
              disabled={isBusy}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black disabled:opacity-50 ${
                member.active
                  ? 'bg-cyan-500 text-black'
                  : 'bg-emerald-500 text-black'
              }`}
            >
              <Shield className="h-4 w-4" />
              {member.active ? 'Reserva' : 'Ativar'}
            </button>
          )}

          {onDismiss && (
            <button
              onClick={() => onDismiss(member.id)}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Dispensar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}