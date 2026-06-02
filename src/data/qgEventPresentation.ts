import type { QgEventStatus, QgLocationKey } from '@/api/qgEventApi';

export const QG_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  active: 'Guerra pelo QG',
  appointment: 'Nomeação',
  mandate: 'Mandato ativo',
  closed: 'Encerrado',
  cancelled: 'Cancelado',
};

export const QG_STATUS_DESCRIPTIONS: Record<string, string> = {
  scheduled: 'A Tomada do QG abre automaticamente às 22h a cada 72 horas.',
  active: 'Facções disputam o QG central e os 4 CTs. O QG precisa ser segurado por 8 horas seguidas.',
  appointment: 'A facção vencedora tem 2 horas para definir os cargos do mandato.',
  mandate: 'O Complexo está sob mandato da facção vencedora. Bônus temporários estão ativos.',
  closed: 'A última disputa foi encerrada. Aguarde o próximo ciclo automático.',
  cancelled: 'Evento cancelado.',
};

export function getQGStatusTheme(status?: QgEventStatus | null) {
  switch (status) {
    case 'scheduled':
      return { accent: '#38bdf8', accent2: '#0ea5e9', glow: 'rgba(56,189,248,0.36)', gradient: 'from-sky-400 via-cyan-300 to-white' };
    case 'appointment':
      return { accent: '#facc15', accent2: '#f97316', glow: 'rgba(250,204,21,0.34)', gradient: 'from-yellow-300 via-orange-400 to-white' };
    case 'mandate':
      return { accent: '#22c55e', accent2: '#facc15', glow: 'rgba(34,197,94,0.32)', gradient: 'from-emerald-400 via-yellow-300 to-white' };
    case 'closed':
      return { accent: '#94a3b8', accent2: '#475569', glow: 'rgba(148,163,184,0.22)', gradient: 'from-slate-300 via-slate-500 to-white' };
    default:
      return { accent: '#ef4444', accent2: '#a855f7', glow: 'rgba(239,68,68,0.36)', gradient: 'from-red-500 via-fuchsia-400 to-white' };
  }
}

export function getQGLocationTone(key: QgLocationKey | string) {
  if (key === 'qg') return { label: 'QG', accent: '#facc15', icon: '♛' };
  if (key === 'ct_nw') return { label: 'CT NO', accent: '#38bdf8', icon: '◆' };
  if (key === 'ct_ne') return { label: 'CT NE', accent: '#a855f7', icon: '◆' };
  if (key === 'ct_sw') return { label: 'CT SO', accent: '#22c55e', icon: '◆' };
  if (key === 'ct_se') return { label: 'CT SE', accent: '#ef4444', icon: '◆' };
  return { label: 'Ponto', accent: '#ffffff', icon: '•' };
}

export function describeQgOutcome(outcome?: string) {
  switch (outcome) {
    case 'qg_occupied': return 'Sua facção ocupou o QG.';
    case 'ct_occupied': return 'Sua facção ocupou um CT de cerco.';
    case 'qg_reinforced': return 'Reforço enviado para o QG.';
    case 'ct_reinforced': return 'Reforço enviado para o CT.';
    case 'qg_captured': return 'Sua facção expulsou o ocupante e tomou o QG.';
    case 'ct_captured': return 'Sua facção tomou o CT rival.';
    case 'attack_repelled': return 'A guarnição rival segurou o ponto.';
    default: return 'Marcha enviada para a Tomada do QG.';
  }
}
