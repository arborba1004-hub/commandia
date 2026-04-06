import * as THREE from 'three';

type FlashParams = {
  scene: THREE.Scene;
  position: THREE.Vector3;
  color?: number;
  duration?: number;
};

export function createImpactFlash({
  scene,
  position,
  color = 0xff0000,
  duration = 300,
}: FlashParams) {
  const geometry = new THREE.SphereGeometry(0.6, 16, 16);

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);

  scene.add(mesh);

  const start = performance.now();

  function animate(now: number) {
    const elapsed = now - start;
    const progress = elapsed / duration;

    if (progress >= 1) {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      return;
    }

    const scale = 1 + progress * 2;
    mesh.scale.set(scale, scale, scale);

    material.opacity = 0.8 * (1 - progress);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

type TileHighlightParams = {
  scene: THREE.Scene;
  tileX: number;
  tileY: number;
  tileSize: number;
  gridWidth: number;
  gridHeight: number;
  duration?: number;
};

export function highlightTile({
  scene,
  tileX,
  tileY,
  tileSize,
  gridWidth,
  gridHeight,
  duration = 500,
}: TileHighlightParams) {
  const x = (tileX - gridWidth / 2) * tileSize;
  const z = (tileY - gridHeight / 2) * tileSize;

  const geometry = new THREE.CircleGeometry(tileSize * 0.6, 24);

  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5,
  });

  const circle = new THREE.Mesh(geometry, material);
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(x, 0.02, z);

  scene.add(circle);

  const start = performance.now();

  function animate(now: number) {
    const elapsed = now - start;
    const progress = elapsed / duration;

    if (progress >= 1) {
      scene.remove(circle);
      geometry.dispose();
      material.dispose();
      return;
    }

    const pulse = 1 + Math.sin(progress * Math.PI * 2) * 0.3;
    circle.scale.set(pulse, pulse, pulse);

    material.opacity = 0.5 * (1 - progress);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

export function shakeObject(object: THREE.Object3D, intensity = 0.1, duration = 300) {
  const originalPosition = object.position.clone();
  const start = performance.now();

  function animate(now: number) {
    const elapsed = now - start;
    const progress = elapsed / duration;

    if (progress >= 1) {
      object.position.copy(originalPosition);
      return;
    }

    const factor = 1 - progress;

    object.position.x =
      originalPosition.x + (Math.random() - 0.5) * intensity * factor;
    object.position.z =
      originalPosition.z + (Math.random() - 0.5) * intensity * factor;

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}