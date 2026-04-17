import * as THREE from 'three';

type FlashParams = {
  scene: THREE.Scene;
  position: THREE.Vector3;
  color?: number;
  duration?: number;
};

type TileHighlightParams = {
  scene: THREE.Scene;
  tileX: number;
  tileY: number;
  tileSize: number;
  gridWidth: number;
  gridHeight: number;
  duration?: number;
};

type FireAftermathParams = {
  scene: THREE.Scene;
  position: THREE.Vector3;
  duration?: number;
};

function animateUntilDone(step: (progress: number, elapsed: number) => boolean, duration: number) {
  const start = performance.now();

  function animate(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const keepGoing = step(progress, elapsed);

    if (keepGoing && progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function safeDisposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((mat) => mat.dispose());
    return;
  }

  material.dispose();
}

function removeAndDispose(scene: THREE.Scene, object: THREE.Object3D) {
  scene.remove(object);

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      if (mesh.material) {
        safeDisposeMaterial(mesh.material);
      }
    }

    const sprite = child as THREE.Sprite;
    if ((sprite as any).isSprite) {
      if ((sprite.material as THREE.SpriteMaterial)?.map) {
        (sprite.material as THREE.SpriteMaterial).map?.dispose();
      }
      sprite.material?.dispose?.();
    }

    const light = child as THREE.Light;
    if ((light as any).isLight && light.parent) {
      light.parent.remove(light);
    }
  });
}

function createSmokeSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.2, 'rgba(220,220,220,0.75)');
  gradient.addColorStop(0.55, 'rgba(110,110,110,0.42)');
  gradient.addColorStop(1, 'rgba(30,30,30,0)');

  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createFireSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  const gradient = ctx.createRadialGradient(128, 150, 10, 128, 128, 118);
  gradient.addColorStop(0, 'rgba(255,255,220,1)');
  gradient.addColorStop(0.18, 'rgba(255,220,120,0.95)');
  gradient.addColorStop(0.42, 'rgba(255,120,20,0.82)');
  gradient.addColorStop(0.7, 'rgba(180,30,0,0.36)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createShockwave(scene: THREE.Scene, position: THREE.Vector3, color: number) {
  const geometry = new THREE.RingGeometry(0.5, 0.9, 64);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, 0.08, position.z);
  scene.add(ring);

  animateUntilDone((progress) => {
    const scale = 1 + progress * 18;
    ring.scale.set(scale, scale, scale);
    material.opacity = 0.8 * (1 - progress);
    return true;
  }, 1200);

  window.setTimeout(() => {
    scene.remove(ring);
    geometry.dispose();
    material.dispose();
  }, 1300);
}

function createMushroomCloud(scene: THREE.Scene, position: THREE.Vector3) {
  const group = new THREE.Group();
  const smokeTexture = createSmokeSpriteTexture();

  const stemSprites: THREE.Sprite[] = [];
  const capSprites: THREE.Sprite[] = [];

  for (let i = 0; i < 10; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: smokeTexture,
      color: 0x5a514c,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(
      (Math.random() - 0.5) * 0.6,
      0.8 + i * 0.45,
      (Math.random() - 0.5) * 0.6
    );
    sprite.scale.set(1.8 + i * 0.18, 2.2 + i * 0.22, 1);
    stemSprites.push(sprite);
    group.add(sprite);
  }

  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 0.8 + Math.random() * 1.4;

    const material = new THREE.SpriteMaterial({
      map: smokeTexture,
      color: 0x4d4641,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(
      Math.cos(angle) * radius,
      5.8 + Math.random() * 0.8,
      Math.sin(angle) * radius
    );
    const scale = 3.4 + Math.random() * 1.6;
    sprite.scale.set(scale, scale, 1);
    capSprites.push(sprite);
    group.add(sprite);
  }

  const coreLight = new THREE.PointLight(0xff5a1f, 8, 20, 2);
  coreLight.position.set(0, 1.2, 0);
  group.add(coreLight);

  group.position.copy(position);
  scene.add(group);

  animateUntilDone((progress) => {
    const rise = progress < 0.55 ? progress / 0.55 : 1;
    const spread = progress < 0.35 ? progress / 0.35 : 1;
    const fadeStart = progress > 0.72 ? (progress - 0.72) / 0.28 : 0;

    group.position.y = position.y + rise * 2.4;

    stemSprites.forEach((sprite, index) => {
      const p = (sprite.material as THREE.SpriteMaterial);
      sprite.scale.setScalar((1.3 + index * 0.08) * (1 + spread * 0.9));
      p.opacity = 0.82 * (1 - fadeStart * 0.85);
    });

    capSprites.forEach((sprite) => {
      const p = sprite.material as THREE.SpriteMaterial;
      sprite.scale.multiplyScalar(1.0025);
      p.opacity = 0.92 * (1 - fadeStart * 0.9);
    });

    coreLight.intensity = 8 * (1 - progress);
    return true;
  }, 7000);

  window.setTimeout(() => {
    smokeTexture.dispose();
    removeAndDispose(scene, group);
  }, 7400);
}

export function createImpactFlash({
  scene,
  position,
  color = 0xff3b1f,
  duration = 1800,
}: FlashParams) {
  const group = new THREE.Group();
  group.position.copy(position);
  scene.add(group);

  const sphereGeometry = new THREE.SphereGeometry(0.8, 24, 24);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.95,
  });

  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);

  const glowLight = new THREE.PointLight(0xff6a2a, 14, 24, 2);
  glowLight.position.set(0, 0.8, 0);
  group.add(glowLight);

  createShockwave(scene, position, 0xff5b2a);
  createMushroomCloud(scene, position);
  createFireAftermath({ scene, position, duration: 180000 });

  animateUntilDone((progress) => {
    const flashScale = 1 + progress * 8;
    sphere.scale.set(flashScale, flashScale, flashScale);
    sphereMaterial.opacity = 0.95 * (1 - progress);
    glowLight.intensity = 14 * (1 - progress);
    return true;
  }, duration);

  window.setTimeout(() => {
    removeAndDispose(scene, group);
  }, duration + 100);
}

export function highlightTile({
  scene,
  tileX,
  tileY,
  tileSize,
  gridWidth,
  gridHeight,
  duration = 5000,
}: TileHighlightParams) {
  const x = (tileX - gridWidth / 2) * tileSize;
  const z = (tileY - gridHeight / 2) * tileSize;

  const group = new THREE.Group();
  scene.add(group);

  const ringGeometry = new THREE.RingGeometry(tileSize * 0.45, tileSize * 0.75, 48);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3a1a,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.04, z);
  group.add(ring);

  const innerGeometry = new THREE.CircleGeometry(tileSize * 0.44, 40);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff7a1a,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });

  const inner = new THREE.Mesh(innerGeometry, innerMaterial);
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(x, 0.03, z);
  group.add(inner);

  animateUntilDone((progress, elapsed) => {
    const pulse = 1 + Math.sin(elapsed * 0.008) * 0.12;
    ring.scale.set(pulse, pulse, pulse);
    inner.scale.set(1 + Math.sin(elapsed * 0.006) * 0.08, 1, 1 + Math.sin(elapsed * 0.006) * 0.08);

    const fade = progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1;
    ringMaterial.opacity = 0.88 * fade;
    innerMaterial.opacity = 0.2 * fade;
    return true;
  }, duration);

  window.setTimeout(() => {
    removeAndDispose(scene, group);
  }, duration + 100);
}

// ========== SISTEMA DE PARTÍCULAS DE FOGO ==========
interface ParticulaFogo {
  posicao: THREE.Vector3;
  velocidade: THREE.Vector3;
  cor: THREE.Color;
  tamanho: number;
  vida: number;
  vidaMax: number;
}

class SistemaParticulasFogo {
  private geometria: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private pontos: THREE.Points;
  private particulas: ParticulaFogo[] = [];
  private textura: THREE.Texture;
  private vento = new THREE.Vector3(0.5, 0, 0.3);
  private origem: THREE.Vector3;

  constructor(private cena: THREE.Scene, origem: THREE.Vector3) {
    this.origem = origem.clone();
    this.textura = this.criarTexturaFogo();
    this.geometria = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      map: this.textura,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
      size: 0.8,
      sizeAttenuation: true,
    });
    this.pontos = new THREE.Points(this.geometria, this.material);
    this.pontos.position.copy(this.origem);
    this.cena.add(this.pontos);
  }

  private criarTexturaFogo(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 48, 4, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,220,100,1)');
    grad.addColorStop(0.7, 'rgba(255,80,0,0.9)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  emitir(qtd = 1) {
    for (let i = 0; i < qtd; i++) {
      const vida = 0.8 + Math.random() * 0.5;
      this.particulas.push({
        posicao: new THREE.Vector3(
          (Math.random() - 0.5) * 1.2,
          0.2 + Math.random() * 0.3,
          (Math.random() - 0.5) * 1.2
        ),
        velocidade: new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          0.05 + Math.random() * 0.08,
          (Math.random() - 0.5) * 0.04
        ),
        cor: new THREE.Color().setHSL(0.08, 1, 0.6),
        tamanho: 0.5 + Math.random() * 1.0,
        vida,
        vidaMax: vida,
      });
    }
  }

  atualizar(deltaTime: number) {
    if (this.particulas.length < 150) this.emitir(2);

    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      p.vida -= deltaTime * 0.6;
      if (p.vida <= 0) {
        this.particulas.splice(i, 1);
        continue;
      }

      p.velocidade.x += (Math.random() - 0.5) * 0.006;
      p.velocidade.z += (Math.random() - 0.5) * 0.006;
      p.velocidade.addScaledVector(this.vento, deltaTime * 0.15);
      p.posicao.addScaledVector(p.velocidade, deltaTime * 35);

      const prog = 1 - p.vida / p.vidaMax;
      if (prog < 0.3) p.cor.setHSL(0.08, 1, 0.65);
      else if (prog < 0.7) p.cor.setHSL(0.05, 1, 0.45);
      else p.cor.setHSL(0.02, 1, 0.25);
      p.cor.multiplyScalar(1 - prog * 0.7);
    }

    const posicoes = new Float32Array(this.particulas.length * 3);
    const cores = new Float32Array(this.particulas.length * 3);
    this.particulas.forEach((p, i) => {
      posicoes[i*3] = p.posicao.x;
      posicoes[i*3+1] = p.posicao.y;
      posicoes[i*3+2] = p.posicao.z;
      cores[i*3] = p.cor.r;
      cores[i*3+1] = p.cor.g;
      cores[i*3+2] = p.cor.b;
    });
    this.geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));
    this.geometria.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  }

  destruir() {
    this.cena.remove(this.pontos);
    this.geometria.dispose();
    this.material.dispose();
    this.textura.dispose();
  }
}

export function createFireAftermath({
  scene,
  position,
  duration = 180000,
}: FireAftermathParams) {
  const sistema = new SistemaParticulasFogo(scene, position);
  const inicio = performance.now();
  let ultimoTempo = inicio;

  function animar(agora: number) {
    const deltaTime = Math.min(0.1, (agora - ultimoTempo) / 1000);
    ultimoTempo = agora;
    const progresso = Math.min((agora - inicio) / duration, 1);

    sistema.atualizar(deltaTime);

    if (progresso < 1) {
      requestAnimationFrame(animar);
    } else {
      sistema.destruir();
    }
  }

  requestAnimationFrame(animar);
}

export function shakeObject(object: THREE.Object3D, intensity = 0.18, duration = 650) {
  const originalPosition = object.position.clone();
  const originalRotation = object.rotation.clone();
  const start = performance.now();

  function animate(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const factor = 1 - progress;

    if (progress >= 1) {
      object.position.copy(originalPosition);
      object.rotation.copy(originalRotation);
      return;
    }

    object.position.x = originalPosition.x + (Math.random() - 0.5) * intensity * factor;
    object.position.z = originalPosition.z + (Math.random() - 0.5) * intensity * factor;
    object.rotation.z = originalRotation.z + (Math.random() - 0.5) * 0.025 * factor;
    object.rotation.x = originalRotation.x + (Math.random() - 0.5) * 0.015 * factor;

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}