import type { QgEventPhase } from '@/api/qgEventApi';

export const QG_PHASE_LABELS: Record<string, string> = {
  preparation: 'Infiltração',
  war: 'Guerra pelo QG',
  final: 'Último avanço',
  finished: 'Mandato definido',
};

export const QG_PHASE_DESCRIPTIONS: Record<string, string> = {
  preparation: 'Facções entram no prédio, instalam repetidores e preparam a invasão do painel central.',
  war: 'O controle do QG muda a cada ação. Pontuação, presença e calor decidem quem domina.',
  final: 'A reta final libera o Avanço Final. É o momento de virar o placar ou segurar o mandato.',
  finished: 'A facção vencedora assume o Mandato do QG e recebe bônus temporário real de batalha.',
};

export function getQGPhaseTheme(phase?: QgEventPhase | null) {
  switch (phase) {
    case 'preparation':
      return {
        accent: '#38bdf8',
        accent2: '#0ea5e9',
        glow: 'rgba(56,189,248,0.35)',
        gradient: 'from-sky-400 via-cyan-300 to-slate-100',
      };
    case 'final':
      return {
        accent: '#f97316',
        accent2: '#ef4444',
        glow: 'rgba(249,115,22,0.42)',
        gradient: 'from-orange-400 via-red-400 to-yellow-200',
      };
    case 'finished':
      return {
        accent: '#facc15',
        accent2: '#f59e0b',
        glow: 'rgba(250,204,21,0.32)',
        gradient: 'from-yellow-300 via-amber-400 to-white',
      };
    default:
      return {
        accent: '#ef4444',
        accent2: '#a855f7',
        glow: 'rgba(239,68,68,0.34)',
        gradient: 'from-red-400 via-fuchsia-400 to-cyan-200',
      };
  }
}

export function getQGActionTone(actionId: string) {
  if (actionId === 'hack_panel') return { color: '#38bdf8', icon: '▣' };
  if (actionId === 'hold_gate') return { color: '#f97316', icon: '▰' };
  if (actionId === 'disrupt_signal') return { color: '#a855f7', icon: '⌁' };
  if (actionId === 'reinforce_convoy') return { color: '#22c55e', icon: '◆' };
  if (actionId === 'final_push') return { color: '#facc15', icon: '★' };
  return { color: '#ffffff', icon: '•' };
}
