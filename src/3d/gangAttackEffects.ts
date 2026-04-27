/**
 * 3d/gangAttackEffects.ts
 * Efeitos visuais 3D de nível profissional para o ataque PVP.
 * Substitui: mapAttackAdvancedEffects.ts (legado — efeitos amadores)
 *
 * Efeitos disponíveis:
 *   playImpactEffect()  → sequência de explosão ao chegar no alvo (efeito principal)
 *   playMuzzleFlash()   → flash de tiro ao longo da rota
 *   playShockwave()     → onda de choque radial no ponto de impacto
 *   playDebrisCloud()   → nuvem de partículas de destroços
 *   playScreenFlash()   → flash de tela (DOM overlay)
 *   playCameraShake()   → tremor de câmera
 */

import * as THREE from 'three';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type ImpactEffectOptions = {
  position: THREE.Vector3;
  scene:    THREE.Scene;
  camera?:  THREE.Camera;
  /** 'success' = ataque bem-sucedido (vermelho/laranja), 'fail' = falhou (azul/cinza) */
  outcome?: 'success' | 'fail';
  /** Intensidade do efeito: 1 = normal, 2 = crítico */
  intensity?: number;
};

type CleanupFn = () => void;

// ═════════════════════════════════════════════════════════════════════════════
// PALETA DE CORES
// ═════════════════════════════════════════════════════════════════════════════

const COLORS = {
  success: {
    core:     new THREE.Color(0xff4400),
    mid:      new THREE.Color(0xff8800),
    outer:    new THREE.Color(0xffcc00),
    shockwave: new THREE.Color(0xff3300),
  },
  fail: {
    core:     new THREE.Color(0x4488ff),
    mid:      new THREE.Color(0x88aaff),
    outer:    new THREE.Color(0xccddff),
    shockwave: new THREE.Color(0x2255cc),
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═════════════════════════════════════════════════════════════════════════════

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOut(t: number, power = 3) {
  return 1 - Math.pow(1 - t, power);
}

function easeIn(t: number, power = 2) {
  return Math.pow(t, power);
}

/** RAF-based animator. Retorna função de cancelamento. */
function animate(
  durationMs: number,
  onFrame: (progress: number, elapsed: number) => void,
  onComplete?: () => void
): CleanupFn {
  const startedAt = performance.now();
  let frameId = 0;
  let done = false;

  function tick(now: number) {
    if (done) return;
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / durationMs);

    onFrame(progress, elapsed);

    if (progress >= 1) {
      done = true;
      onComplete?.();
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  frameId = requestAnimationFrame(tick);

  return () => {
    done = true;
    cancelAnimationFrame(frameId);
  };
}

/** Cria um MeshStandardMaterial e o registra para dispose automático. */
function makeMat(params: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial(params);
}

/** Cria um MeshBasicMaterial e o registra para dispose automático. */
function makeBasic(params: THREE.MeshBasicMaterialParameters) {
  return new THREE.MeshBasicMaterial(params);
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 1: NÚCLEO DE EXPLOSÃO (esfera expandindo com emissive intenso)
// ═════════════════════════════════════════════════════════════════════════════

function createExplosionCore(
  scene: THREE.Scene,
  position: THREE.Vector3,
  palette: typeof COLORS['success'],
  intensity: number
): CleanupFn {
  const geo = new THREE.SphereGeometry(0.1, 24, 24);
  const mat = makeMat({
    color: palette.core,
    emissive: palette.core,
    emissiveIntensity: 8 * intensity,
    transparent: true,
    opacity: 1,
    roughness: 0.1,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  scene.add(mesh);

  const maxScale = 4.5 * intensity;

  const cancel = animate(600, (t) => {
    const eased = easeOut(t, 2);
    const scale = lerp(0.1, maxScale, eased);
    mesh.scale.setScalar(scale);
    mat.opacity = lerp(1, 0, easeIn(t, 1.5));
    mat.emissiveIntensity = lerp(8 * intensity, 0, t);
  }, () => {
    scene.remove(mesh);
    geo.dispose();
    mat.dispose();
  });

  return cancel;
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 2: ANÉIS DE ONDA DE CHOQUE
// ═════════════════════════════════════════════════════════════════════════════

function createShockwaveRings(
  scene: THREE.Scene,
  position: THREE.Vector3,
  palette: typeof COLORS['success'],
  intensity: number
): CleanupFn {
  const cancels: CleanupFn[] = [];

  const ringCount = Math.round(3 * intensity);

  for (let i = 0; i < ringCount; i++) {
    const delay = i * 80;

    const geo = new THREE.RingGeometry(0.05, 0.15, 48);
    const mat = makeBasic({
      color: palette.shockwave,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y += 0.15;
    scene.add(mesh);

    let started = false;
    const maxRadius = (2.5 + i * 1.2) * intensity;

    const cancel = animate(800, (_, elapsed) => {
      if (elapsed < delay) return;
      if (!started) { started = true; }

      const localProgress = Math.min(1, (elapsed - delay) / 700);
      const eased = easeOut(localProgress, 2);
      const radius = lerp(0.1, maxRadius, eased);

      geo.dispose();
      const newGeo = new THREE.RingGeometry(radius * 0.85, radius, 48);
      mesh.geometry = newGeo;
      mat.opacity = lerp(0.9, 0, easeIn(localProgress, 1.5));
    }, () => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mat.dispose();
    });

    cancels.push(cancel);
  }

  return () => cancels.forEach((c) => c());
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 3: PARTÍCULAS DE DESTROÇO
// ═════════════════════════════════════════════════════════════════════════════

function createDebrisParticles(
  scene: THREE.Scene,
  position: THREE.Vector3,
  palette: typeof COLORS['success'],
  intensity: number
): CleanupFn {
  const count = Math.round(28 * intensity);
  const group = new THREE.Group();
  scene.add(group);

  const particles: Array<{
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotSpeed: THREE.Vector3;
  }> = [];

  for (let i = 0; i < count; i++) {
    const size = 0.06 + Math.random() * 0.12;
    const geo = Math.random() > 0.5
      ? new THREE.BoxGeometry(size, size, size)
      : new THREE.TetrahedronGeometry(size);

    const mat = makeMat({
      color: i % 3 === 0 ? palette.core : i % 3 === 1 ? palette.mid : palette.outer,
      emissive: palette.mid,
      emissiveIntensity: 2,
      roughness: 0.6,
      metalness: 0.3,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    group.add(mesh);

    const angle  = Math.random() * Math.PI * 2;
    const elevation = Math.random() * Math.PI * 0.7;
    const speed  = (1.5 + Math.random() * 3.5) * intensity;

    particles.push({
      mesh,
      velocity: new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed * 0.8,
        Math.sin(angle) * Math.cos(elevation) * speed
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
    });
  }

  const cancel = animate(1400, (t, elapsed) => {
    const dt = elapsed / 1000 / 60; // ~frame delta

    for (const { mesh, velocity, rotSpeed } of particles) {
      // Gravidade
      velocity.y -= 9.8 * dt;

      mesh.position.x += velocity.x * dt;
      mesh.position.y += velocity.y * dt;
      mesh.position.z += velocity.z * dt;

      mesh.rotation.x += rotSpeed.x * dt;
      mesh.rotation.y += rotSpeed.y * dt;
      mesh.rotation.z += rotSpeed.z * dt;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = lerp(1, 0, easeIn(t, 2));
      mat.transparent = true;
    }
  }, () => {
    for (const { mesh } of particles) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    scene.remove(group);
  });

  return cancel;
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 4: PONTO DE LUZ DINÂMICO
// ═════════════════════════════════════════════════════════════════════════════

function createDynamicLight(
  scene: THREE.Scene,
  position: THREE.Vector3,
  palette: typeof COLORS['success'],
  intensity: number
): CleanupFn {
  const light = new THREE.PointLight(palette.core, 0, 18 * intensity);
  light.position.copy(position);
  light.position.y += 0.5;
  scene.add(light);

  const maxIntensity = 12 * intensity;

  const cancel = animate(900, (t) => {
    // Pico rápido, decay suave
    const peak = t < 0.15
      ? easeOut(t / 0.15) * maxIntensity
      : lerp(maxIntensity, 0, easeOut((t - 0.15) / 0.85, 2));
    light.intensity = peak;
  }, () => {
    scene.remove(light);
  });

  return cancel;
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 5: FLASH DE TELA (DOM overlay — sem Three.js)
// ═════════════════════════════════════════════════════════════════════════════

export function playScreenFlash(outcome: 'success' | 'fail' = 'success') {
  const overlay = document.createElement('div');
  const color = outcome === 'success' ? 'rgba(255,80,0,0.45)' : 'rgba(40,100,255,0.35)';

  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: color,
    pointerEvents: 'none',
    zIndex: '9999',
    transition: 'opacity 0.4s ease-out',
    opacity: '1',
  });

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 450);
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 6: CÂMERA SHAKE
// ═════════════════════════════════════════════════════════════════════════════

export function playCameraShake(
  camera: THREE.Camera,
  intensity = 0.15,
  durationMs = 500
): CleanupFn {
  const originalPosition = camera.position.clone();
  let cancel: CleanupFn;

  cancel = animate(durationMs, (t) => {
    const strength = intensity * (1 - t);
    camera.position.set(
      originalPosition.x + (Math.random() - 0.5) * strength * 2,
      originalPosition.y + (Math.random() - 0.5) * strength,
      originalPosition.z + (Math.random() - 0.5) * strength * 2,
    );
  }, () => {
    camera.position.copy(originalPosition);
  });

  return cancel;
}

// ═════════════════════════════════════════════════════════════════════════════
// EFEITO 7: FLASH DE DISPARO (ao longo da rota)
// ═════════════════════════════════════════════════════════════════════════════

export function playMuzzleFlash(
  scene: THREE.Scene,
  from: THREE.Vector3,
  to: THREE.Vector3
): CleanupFn {
  // Linha tracejada de projétil
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const length    = from.distanceTo(to);

  const geo = new THREE.CylinderGeometry(0.025, 0.025, length, 8);
  const mat = makeBasic({
    color: 0xffdd00,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  const mid  = new THREE.Vector3().lerpVectors(from, to, 0.5);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  scene.add(mesh);

  const cancel = animate(200, (t) => {
    mat.opacity = lerp(0.85, 0, t);
  }, () => {
    scene.remove(mesh);
    geo.dispose();
    mat.dispose();
  });

  return cancel;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPOSIÇÃO PRINCIPAL: EFEITO DE IMPACTO AAA
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Dispara a sequência completa de efeitos visuais de impacto.
 * Use ao final da animação de deslocamento do squad.
 *
 * Retorna função de limpeza para cancelamento antecipado.
 */
export function playImpactEffect({
  position,
  scene,
  camera,
  outcome = 'success',
  intensity = 1,
}: ImpactEffectOptions): CleanupFn {
  const palette = COLORS[outcome];
  const cancels: CleanupFn[] = [];

  // 1. Flash de tela imediato
  playScreenFlash(outcome);

  // 2. Câmera shake
  if (camera) {
    cancels.push(playCameraShake(camera, 0.12 * intensity, 550));
  }

  // 3. Núcleo de explosão
  cancels.push(createExplosionCore(scene, position, palette, intensity));

  // 4. Ondas de choque
  cancels.push(createShockwaveRings(scene, position, palette, intensity));

  // 5. Partículas de destroço
  cancels.push(createDebrisParticles(scene, position, palette, intensity));

  // 6. Luz dinâmica
  cancels.push(createDynamicLight(scene, position, palette, intensity));

  return () => cancels.forEach((c) => c());
}
