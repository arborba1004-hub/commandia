import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Gauge, Zap } from 'lucide-react';
import { getPlayerCentralTileFromOrigin, tileToWorldCenter } from '@/components/game/playerMapSpace';
import { useConvoyAcceleratorStore } from '@/store/convoyAcceleratorStore';

type Props = {
  camera: THREE.Camera | null;
  player: any;
  gridWidth: number;
  gridHeight: number;
  battleId: string | null;
  phase: string;
  isAccelerating: boolean;
  onAccelerate: () => void | Promise<void>;
};

export default function MapConvoyAcceleratorButton({
  camera,
  player,
  gridWidth,
  gridHeight,
  battleId,
  phase,
  isAccelerating,
  onAccelerate,
}: Props) {
  const twoX = useConvoyAcceleratorStore((s) => s.twoX);
  const isUsing = useConvoyAcceleratorStore((s) => s.isUsing);
  const load = useConvoyAcceleratorStore((s) => s.load);
  const error = useConvoyAcceleratorStore((s) => s.error);
  const [screenPos, setScreenPos] = useState<{ left: number; top: number; visible: boolean }>({
    left: 0,
    top: 0,
    visible: false,
  });

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!camera || !player?.mapPosition) {
      setScreenPos((prev) => ({ ...prev, visible: false }));
      return;
    }

    let raf = 0;
    const update = () => {
      const center = getPlayerCentralTileFromOrigin(
        Number(player.mapPosition?.tileX ?? 0),
        Number(player.mapPosition?.tileY ?? 0),
      );
      const { worldX, worldZ } = tileToWorldCenter(center.tileX, center.tileY, gridWidth, gridHeight);
      const vector = new THREE.Vector3(worldX, 2.4, worldZ);
      camera.updateMatrixWorld(true);
      vector.project(camera);

      const left = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const top = (-vector.y * 0.5 + 0.5) * window.innerHeight;
      const visible = vector.z > -1 && vector.z < 1 && left >= -120 && left <= window.innerWidth + 120 && top >= -120 && top <= window.innerHeight + 120;
      setScreenPos({ left, top, visible });
      raf = window.requestAnimationFrame(update);
    };

    raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, [camera, player?.mapPosition?.tileX, player?.mapPosition?.tileY, gridWidth, gridHeight]);

  const shouldShow = Boolean(battleId && phase === 'moving' && twoX > 0 && screenPos.visible);
  if (!shouldShow) return null;

  return (
    <div
      className="pointer-events-auto fixed z-[80] flex -translate-x-1/2 -translate-y-full flex-col items-center gap-2"
      style={{ left: screenPos.left, top: screenPos.top }}
    >
      <button
        type="button"
        disabled={isUsing || isAccelerating}
        onClick={() => { void onAccelerate(); }}
        className="flex items-center gap-2 rounded-2xl border border-yellow-300/50 bg-black/80 px-4 py-3 text-sm font-black text-yellow-100 shadow-[0_0_25px_rgba(250,204,21,0.35)] backdrop-blur-md active:scale-95 disabled:opacity-60"
      >
        {isUsing || isAccelerating ? <Gauge className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
        <span>Acelerar 2x</span>
        <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-xs text-black">{twoX}</span>
      </button>
      {error && (
        <div className="max-w-[220px] rounded-xl border border-red-500/30 bg-red-950/80 px-3 py-2 text-center text-xs font-bold text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
