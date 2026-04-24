import * as THREE from 'three';

export function createBulletTrail(scene: THREE.Scene, from: THREE.Vector3, to: THREE.Vector3) {
  const material = new THREE.LineBasicMaterial({ color: 0xffaa00 });
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  setTimeout(() => {
    scene.remove(line);
    geometry.dispose();
    material.dispose();
  }, 120);
}

export function createExplosion(scene: THREE.Scene, position: THREE.Vector3) {
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);

  const material = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.9,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  scene.add(mesh);

  const start = performance.now();

  function animate(now: number) {
    const progress = (now - start) / 400;

    if (progress >= 1) {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      return;
    }

    mesh.scale.setScalar(1 + progress * 3);
    material.opacity = 0.9 * (1 - progress);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

export function createPoliceLight(scene: THREE.Scene, position: THREE.Vector3) {
  // CRITICAL: Only run in browser environment, never during build/SSR
  if (typeof window === 'undefined') return;

  const light = new THREE.PointLight(0xff0000, 3, 5);
  light.position.copy(position);
  scene.add(light);

  let toggle = true;

  const interval = setInterval(() => {
    light.color.set(toggle ? 0xff0000 : 0x0000ff);
    toggle = !toggle;
  }, 120);

  setTimeout(() => {
    clearInterval(interval);
    scene.remove(light);
  }, 2000);
}