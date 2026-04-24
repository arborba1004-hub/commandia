import * as THREE from 'three';

interface HorizonConfig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  gridWidth: number;
  gridHeight: number;
  horizonImageUrl?: string;
}

/**
 * Cria um horizonte dinâmico 360° com imagem de fundo
 * que acompanha a câmera e responde ao zoom
 */
export function createDynamicHorizon(config: HorizonConfig) {
  const { scene, camera, gridWidth, gridHeight, horizonImageUrl } = config;

  const horizonGroup = new THREE.Group();
  horizonGroup.name = 'DynamicHorizon';

  // Distância e altura do horizonte
  const horizonDistance = Math.max(gridWidth, gridHeight) * 0.8;
  const horizonHeight = 50;

  interface HorizonPanel {
    mesh: THREE.Mesh;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  }

  const panels: HorizonPanel[] = [];
  const textureLoader = new THREE.TextureLoader();

  // Função para criar painel com textura
  const createPanel = (width: number, height: number, imageUrl?: string, mirrorX: boolean = false) => {
    let material: THREE.Material;

    if (imageUrl) {
      // Carregar textura da imagem
      const texture = textureLoader.load(imageUrl);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      
      // Espelhar horizontalmente se necessário para transição suave
      if (mirrorX) {
        texture.repeat.x = -1;
        texture.offset.x = 1;
      }
      
      material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: false,
        fog: false,
        depthWrite: false,
        depthTest: true,
        side: THREE.FrontSide,
      });
    } else {
      // Fallback: criar painel procedural
      material = createProceduralMaterial();
    }

    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  };

  // Painel frontal
  const frontPanel = createPanel(horizonDistance * 2, horizonHeight, horizonImageUrl);
  frontPanel.position.set(0, horizonHeight / 2, -horizonDistance);
  panels.push({
    mesh: frontPanel,
    position: { x: 0, y: horizonHeight / 2, z: -horizonDistance },
    rotation: { x: 0, y: 0, z: 0 },
  });

  // Painel traseiro (espelhado para transição suave)
  const backPanel = createPanel(horizonDistance * 2, horizonHeight, horizonImageUrl, true);
  backPanel.position.set(0, horizonHeight / 2, horizonDistance);
  backPanel.rotation.y = Math.PI;
  panels.push({
    mesh: backPanel,
    position: { x: 0, y: horizonHeight / 2, z: horizonDistance },
    rotation: { x: 0, y: Math.PI, z: 0 },
  });

  // Painel esquerdo (espelhado para transição suave)
  const leftPanel = createPanel(horizonDistance * 2, horizonHeight, horizonImageUrl, true);
  leftPanel.position.set(-horizonDistance, horizonHeight / 2, 0);
  leftPanel.rotation.y = Math.PI / 2;
  panels.push({
    mesh: leftPanel,
    position: { x: -horizonDistance, y: horizonHeight / 2, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  });

  // Painel direito (espelhado para transição suave)
  const rightPanel = createPanel(horizonDistance * 2, horizonHeight, horizonImageUrl, true);
  rightPanel.position.set(horizonDistance, horizonHeight / 2, 0);
  rightPanel.rotation.y = -Math.PI / 2;
  panels.push({
    mesh: rightPanel,
    position: { x: horizonDistance, y: horizonHeight / 2, z: 0 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  });

  // Painel superior (céu)
  const topPanel = createPanel(horizonDistance * 2, horizonDistance * 2, horizonImageUrl);
  topPanel.position.set(0, horizonHeight, 0);
  topPanel.rotation.x = Math.PI / 2;
  panels.push({
    mesh: topPanel,
    position: { x: 0, y: horizonHeight, z: 0 },
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
  });

  panels.forEach((panel) => {
    horizonGroup.add(panel.mesh);
  });

  scene.add(horizonGroup);

  // Função para atualizar o horizonte conforme a câmera se move
  const updateHorizon = () => {
    const cameraPos = camera.position;
    const cameraDistance = Math.sqrt(
      cameraPos.x * cameraPos.x + cameraPos.y * cameraPos.y + cameraPos.z * cameraPos.z
    );
    
    // Normalizar zoom factor (50 é a distância padrão)
    const zoomFactor = cameraDistance / 50;

    // Mover o horizonte para acompanhar a câmera
    horizonGroup.position.copy(cameraPos);
    horizonGroup.position.y = 0; // Manter na altura correta

    // Ajustar escala baseado no zoom (responde ao zoom in/out)
    const scale = Math.max(0.6, Math.min(2.0, zoomFactor));
    horizonGroup.scale.setScalar(scale);
  };

  return {
    group: horizonGroup,
    panels,
    update: updateHorizon,
    dispose: () => {
      panels.forEach((panel) => {
        if (panel.mesh.geometry) panel.mesh.geometry.dispose();
        if (panel.mesh.material) {
          if (Array.isArray(panel.mesh.material)) {
            panel.mesh.material.forEach((m) => m.dispose());
          } else {
            panel.mesh.material.dispose();
          }
        }
      });
      scene.remove(horizonGroup);
    },
  };
}

/**
 * Cria um material procedural como fallback
 */
function createProceduralMaterial(): THREE.Material {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.MeshBasicMaterial({ color: 0x1a1a2e });

  // Gradiente de céu ao pôr do sol
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, '#1a1a2e');
  skyGradient.addColorStop(0.2, '#2d1b4e');
  skyGradient.addColorStop(0.4, '#8b4513');
  skyGradient.addColorStop(0.6, '#ff6b35');
  skyGradient.addColorStop(0.8, '#f7931e');
  skyGradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenhar silhueta de prédios
  const buildingColors = ['#1a1a2e', '#16213e', '#0f3460'];
  const buildingCount = 12;
  let currentX = 0;

  for (let i = 0; i < buildingCount; i++) {
    const buildingWidth = 60 + Math.random() * 100;
    const buildingHeight = 180 + Math.random() * 280;
    const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

    ctx.fillStyle = color;
    ctx.fillRect(currentX, canvas.height - buildingHeight, buildingWidth, buildingHeight);

    // Janelas
    ctx.fillStyle = '#ffff99';
    for (let y = canvas.height - buildingHeight + 30; y < canvas.height - 20; y += 20) {
      for (let x = currentX + 15; x < currentX + buildingWidth - 15; x += 20) {
        if (Math.random() > 0.4) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    }

    currentX += buildingWidth + 8;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;

  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    fog: false,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
  });
}

/**
 * Cria um painel individual do horizonte com prédios procedurais
 */
function createHorizonPanel(
  width: number,
  height: number,
  buildingColors: number[],
  lightColors: number[]
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Mesh();

  // Gradiente de céu
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, '#1a1a2e');
  skyGradient.addColorStop(0.3, '#16213e');
  skyGradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenhar prédios procedurais
  const buildingCount = 15;
  let currentX = 0;

  for (let i = 0; i < buildingCount; i++) {
    const buildingWidth = 50 + Math.random() * 80;
    const buildingHeight = 150 + Math.random() * 250;
    const buildingColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];

    // Converter cor hex para RGB
    const r = (buildingColor >> 16) & 255;
    const g = (buildingColor >> 8) & 255;
    const b = buildingColor & 255;

    // Desenhar prédio
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(currentX, canvas.height - buildingHeight, buildingWidth, buildingHeight);

    // Desenhar janelas
    const windowSize = 8;
    const windowSpacing = 12;
    const windowColor = lightColors[Math.floor(Math.random() * lightColors.length)];
    ctx.fillStyle = `#${windowColor.toString(16).padStart(6, '0')}`;

    for (let y = canvas.height - buildingHeight + 20; y < canvas.height - 10; y += windowSpacing) {
      for (let x = currentX + 10; x < currentX + buildingWidth - 10; x += windowSpacing) {
        // Algumas janelas acesas, outras não
        if (Math.random() > 0.3) {
          ctx.fillRect(x, y, windowSize, windowSize);
        }
      }
    }

    // Adicionar alguns detalhes (antenas, etc)
    if (Math.random() > 0.6) {
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const antennaX = currentX + buildingWidth / 2;
      const antennaHeight = 30 + Math.random() * 50;
      ctx.moveTo(antennaX, canvas.height - buildingHeight);
      ctx.lineTo(antennaX, canvas.height - buildingHeight - antennaHeight);
      ctx.stroke();
    }

    currentX += buildingWidth + 5;
  }

  // Adicionar efeito de neblina/profundidade
  const fogGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  fogGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = fogGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Criar textura
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;

  // Criar material
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    fog: false,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
  });

  // Criar geometria e mesh
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}

/**
 * Cria um sistema de relevo/montanhas ao fundo
 */
export function createTerrainRelief(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const reliefGroup = new THREE.Group();
  reliefGroup.name = 'TerrainRelief';

  const reliefDistance = 80;
  const reliefHeight = 30;

  // Criar silhueta de montanhas/relevo
  const reliefGeometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // Gerar perfil de montanha
  const mountainCount = 8;
  let vertexIndex = 0;

  for (let i = 0; i <= mountainCount; i++) {
    const x = (i / mountainCount) * 200 - 100;
    const y = Math.sin(i * 0.5) * reliefHeight + reliefHeight * 0.5;

    // Base
    vertices.push(x, 0, 0);
    // Topo
    vertices.push(x, y, 0);

    if (i < mountainCount) {
      const baseIdx = vertexIndex;
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
      vertexIndex += 2;
    }
  }

  reliefGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  reliefGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

  const reliefMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a0a1a,
    fog: false,
    depthWrite: false,
    depthTest: true,
  });

  const reliefMesh = new THREE.Mesh(reliefGeometry, reliefMaterial);
  reliefMesh.position.z = -reliefDistance;

  reliefGroup.add(reliefMesh);
  scene.add(reliefGroup);

  const updateRelief = () => {
    reliefGroup.position.copy(camera.position);
    reliefGroup.position.y = 0;
  };

  return {
    group: reliefGroup,
    update: updateRelief,
    dispose: () => {
      reliefGeometry.dispose();
      reliefMaterial.dispose();
      scene.remove(reliefGroup);
    },
  };
}
