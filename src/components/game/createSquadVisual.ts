import * as THREE from 'three';

type CreateSquadParams = {
  level?: number;
};

export function createSquadVisual({ level = 1 }: CreateSquadParams = {}) {
  const group = new THREE.Group();

  // ===== CONFIG POR NÍVEL (ESCALA VISUAL) =====
  const memberCount =
    level < 5 ? 2 :
    level < 15 ? 3 :
    level < 30 ? 4 :
    level < 60 ? 5 : 6;

  const hasVehicle = level >= 20;
  const isHighLevel = level >= 50;

  // ===== MATERIAIS =====
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: isHighLevel ? 0xff2a2a : 0xffffff,
    emissive: isHighLevel ? 0x550000 : 0x000000,
    metalness: 0.3,
    roughness: 0.6,
  });

  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd7a3,
  });

  const weaponMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.8,
    roughness: 0.2,
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.25,
  });

  // ===== FUNÇÃO PRA CRIAR UM MEMBRO =====
  function createMember(index: number) {
    const member = new THREE.Group();

    // Corpo
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.3, 4, 8),
      bodyMaterial
    );
    body.position.y = 0.25;

    // Cabeça
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      headMaterial
    );
    head.position.y = 0.55;

    // Arma simples
    const weapon = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.05, 0.05),
      weaponMaterial
    );
    weapon.position.set(0.15, 0.35, 0);

    member.add(body, head, weapon);

    // Posicionamento em formação
    const spacing = 0.35;
    const row = Math.floor(index / 3);
    const col = index % 3;

    member.position.x = (col - 1) * spacing;
    member.position.z = row * spacing;

    return member;
  }

  // ===== MEMBROS =====
  for (let i = 0; i < memberCount; i++) {
    group.add(createMember(i));
  }

  // ===== VEÍCULO (MID/HIGH LEVEL) =====
  if (hasVehicle) {
    const vehicle = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.2, 1.2),
      new THREE.MeshStandardMaterial({
        color: isHighLevel ? 0x111111 : 0x333333,
        metalness: 0.7,
        roughness: 0.4,
      })
    );
    base.position.y = 0.15;

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.25, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    cabin.position.y = 0.35;

    vehicle.add(base, cabin);

    vehicle.position.z = -0.6;

    group.add(vehicle);
  }

  // ===== AURA / INTIMIDAÇÃO =====
  if (isHighLevel) {
    const aura = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 32),
      glowMaterial
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.02;

    group.add(aura);
  }

  // ===== SOMBRA =====
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;

  group.add(shadow);

  group.name = 'SQUAD_ENTITY';

  return group;
}