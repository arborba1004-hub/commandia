import { useEffect, useState } from 'react';
import SmokeCanvas from './SmokeCanvas';
import SmokeWebGL from './SmokeWebGL';

export default function FugaSmokeFX() {
  const [mode, setMode] = useState<'webgl' | 'canvas'>('canvas');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const supported = !!canvas.getContext('webgl', {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
    });
    setMode(supported ? 'webgl' : 'canvas');
  }, []);

  return mode === 'webgl' ? <SmokeWebGL /> : <SmokeCanvas />;
}
