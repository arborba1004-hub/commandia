/**
 * components/game/ConvoyAttackAnimation.tsx
 * HUD leve do comboio. A animação real é 3D e fica em convoy/convoy3DAnimator.ts.
 */

import { motion } from 'framer-motion';
import { getConvoySkin } from '@/data/convoyCatalog';
import { usePlayerConvoyStore } from '@/store/playerConvoyStore';
import { useMapAttackStore } from '@/store/mapAttackStore';

export default function ConvoyAttackAnimation() {
  const phase = useMapAttackStore((state) => state.phase);
  const selectedSkinId = usePlayerConvoyStore((state) => state.selectedSkinId);
  const skin = getConvoySkin(selectedSkinId);

  const isVisible = phase === 'moving' || phase === 'arriving' || phase === 'resolving' || phase === 'returning';
  if (!isVisible) return null;

  const label = phase === 'returning'
    ? 'Comboio retornando'
    : phase === 'resolving'
      ? 'Confronto em andamento'
      : 'Comboio em rota';

  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white shadow-2xl backdrop-blur"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black text-xl"
          style={{ boxShadow: `0 0 18px ${skin.accentColor}66` }}
        >
          {skin.icon}
        </div>
        <div>
          <div className="text-sm font-black text-[#d9b764]">{label}</div>
          <div className="text-xs text-white/60">{skin.name}</div>
        </div>
      </div>
    </motion.div>
  );
}
