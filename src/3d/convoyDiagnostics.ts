/**
 * 3d/convoyDiagnostics.ts
 * 
 * Sistema de diagnóstico profissional para investigar por que os 6 GLB REF
 * do comboio e squad não estão sendo exibidos no mapa durante o ataque.
 * 
 * Rastreia:
 * - Carregamento de cada um dos 6 GLBs
 * - Renderização na scene
 * - Visibilidade e materiais
 * - Posicionamento e escala
 * - Problemas de frustum culling
 * - Problemas de depth testing
 */

import * as THREE from 'three';
import { getConvoySkinById } from '@/data/convoySkins';

interface ConvoyAssetDiagnostics {
  url: string;
  index: number;
  status: 'pending' | 'loading' | 'loaded' | 'failed' | 'rendered';
  loadStartTime?: number;
  loadEndTime?: number;
  loadDuration?: number;
  error?: string;
  meshCount?: number;
  materialCount?: number;
  geometryCount?: number;
  totalVertices?: number;
  totalTriangles?: number;
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  };
  materials?: Array<{
    type: string;
    color?: string;
    transparent: boolean;
    opacity: number;
    depthWrite: boolean;
    depthTest: boolean;
    visible: boolean;
  }>;
  renderOrder?: number;
  frustumCulled?: boolean;
  visible?: boolean;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

interface ConvoyAnimationDiagnostics {
  animationId: string;
  startTime: number;
  convoySkinId: string;
  memberCount: number;
  routeLength: number;
  assets: ConvoyAssetDiagnostics[];
  sceneSnapshot?: {
    totalChildren: number;
    meshCount: number;
    convoyGroupsFound: number;
    convoyMeshesVisible: number;
    convoyMeshesHidden: number;
  };
  issues: string[];
  warnings: string[];
}

const diagnosticsLog = new Map<string, ConvoyAnimationDiagnostics>();

export function createConvoyDiagnostics(
  animationId: string,
  convoySkinId: string,
  memberCount: number,
  routeLength: number
): ConvoyAnimationDiagnostics {
  const diag: ConvoyAnimationDiagnostics = {
    animationId,
    startTime: Date.now(),
    convoySkinId,
    memberCount,
    routeLength,
    assets: [],
    issues: [],
    warnings: [],
  };

  const skin = getConvoySkinById(convoySkinId);
  if (skin.assets && Array.isArray(skin.assets)) {
    skin.assets.forEach((asset, idx) => {
      diag.assets.push({
        url: asset.url,
        index: idx,
        status: 'pending',
      });
    });
  }

  diagnosticsLog.set(animationId, diag);
  return diag;
}

export function recordAssetLoadStart(animationId: string, assetIndex: number) {
  const diag = diagnosticsLog.get(animationId);
  if (!diag || !diag.assets[assetIndex]) return;

  const asset = diag.assets[assetIndex];
  asset.status = 'loading';
  asset.loadStartTime = performance.now();
}

export function recordAssetLoadSuccess(
  animationId: string,
  assetIndex: number,
  gltf: any
) {
  const diag = diagnosticsLog.get(animationId);
  if (!diag || !diag.assets[assetIndex]) return;

  const asset = diag.assets[assetIndex];
  asset.status = 'loaded';
  asset.loadEndTime = performance.now();
  asset.loadDuration = Math.round(asset.loadEndTime - (asset.loadStartTime || 0));

  // Analisar estrutura do GLB
  const scene = gltf.scene || gltf.scenes?.[0];
  if (scene) {
    let meshCount = 0;
    let materialSet = new Set<THREE.Material>();
    let geometrySet = new Set<THREE.BufferGeometry>();
    let totalVertices = 0;
    let totalTriangles = 0;
    const materials: ConvoyAssetDiagnostics['materials'] = [];

    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        meshCount++;
        
        if (obj.geometry) {
          geometrySet.add(obj.geometry);
          if (obj.geometry.attributes?.position) {
            totalVertices += obj.geometry.attributes.position.count;
          }
          if (obj.geometry.index) {
            totalTriangles += obj.geometry.index.count / 3;
          }
        }

        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat: any) => {
            materialSet.add(mat);
            materials.push({
              type: mat.type,
              color: mat.color?.getHexString?.(),
              transparent: mat.transparent,
              opacity: mat.opacity,
              depthWrite: mat.depthWrite,
              depthTest: mat.depthTest,
              visible: mat.visible,
            });
          });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    asset.meshCount = meshCount;
    asset.materialCount = materialSet.size;
    asset.geometryCount = geometrySet.size;
    asset.totalVertices = totalVertices;
    asset.totalTriangles = Math.round(totalTriangles);
    asset.boundingBox = {
      min: [box.min.x, box.min.y, box.min.z],
      max: [box.max.x, box.max.y, box.max.z],
      size: [size.x, size.y, size.z],
    };
    asset.materials = materials;
  }
}

export function recordAssetLoadError(
  animationId: string,
  assetIndex: number,
  error: any
) {
  const diag = diagnosticsLog.get(animationId);
  if (!diag || !diag.assets[assetIndex]) return;

  const asset = diag.assets[assetIndex];
  asset.status = 'failed';
  asset.loadEndTime = performance.now();
  asset.loadDuration = Math.round(asset.loadEndTime - (asset.loadStartTime || 0));
  asset.error = error?.message || String(error);

  diag.issues.push(`Asset ${assetIndex} falhou ao carregar: ${asset.error}`);
}

export function recordAssetRendered(
  animationId: string,
  assetIndex: number,
  mesh: THREE.Object3D
) {
  const diag = diagnosticsLog.get(animationId);
  if (!diag || !diag.assets[assetIndex]) return;

  const asset = diag.assets[assetIndex];
  asset.status = 'rendered';
  asset.renderOrder = (mesh as any).renderOrder;
  asset.frustumCulled = (mesh as any).frustumCulled;
  asset.visible = mesh.visible;
  asset.position = [mesh.position.x, mesh.position.y, mesh.position.z];
  asset.scale = [mesh.scale.x, mesh.scale.y, mesh.scale.z];
  asset.rotation = [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z];

  // Validações
  if (!mesh.visible) {
    diag.warnings.push(`Asset ${assetIndex} está invisível (visible=false)`);
  }

  if ((mesh as any).frustumCulled && mesh.position.length === 0) {
    diag.warnings.push(`Asset ${assetIndex} pode estar fora do frustum`);
  }

  if (mesh.scale.x === 0 || mesh.scale.y === 0 || mesh.scale.z === 0) {
    diag.issues.push(`Asset ${assetIndex} tem escala zero!`);
  }
}

export function recordSceneSnapshot(animationId: string, scene: THREE.Scene) {
  const diag = diagnosticsLog.get(animationId);
  if (!diag) return;

  let totalChildren = 0;
  let meshCount = 0;
  let convoyGroupsFound = 0;
  let convoyMeshesVisible = 0;
  let convoyMeshesHidden = 0;

  scene.traverse((obj: any) => {
    totalChildren++;

    if (obj.isMesh) meshCount++;

    if (obj.name?.includes('convoy') || obj.name?.includes('squad') || obj.name?.includes('attack')) {
      if (obj.isGroup) convoyGroupsFound++;
      if (obj.isMesh) {
        if (obj.visible) convoyMeshesVisible++;
        else convoyMeshesHidden++;
      }
    }
  });

  diag.sceneSnapshot = {
    totalChildren,
    meshCount,
    convoyGroupsFound,
    convoyMeshesVisible,
    convoyMeshesHidden,
  };

  // Validações
  if (convoyMeshesHidden > convoyMeshesVisible) {
    diag.warnings.push(`Mais meshes de comboio ocultos (${convoyMeshesHidden}) do que visíveis (${convoyMeshesVisible})`);
  }

  if (convoyGroupsFound === 0) {
    diag.issues.push('Nenhum grupo de comboio encontrado na scene!');
  }
}

export function printConvoyDiagnostics(animationId: string) {
  const diag = diagnosticsLog.get(animationId);
  if (!diag) {
    console.warn('[CONVOY_DIAG] Nenhum diagnóstico encontrado para:', animationId);
    return;
  }

  const uptime = Date.now() - diag.startTime;

  console.group(`%c🎬 DIAGNÓSTICO DE COMBOIO - ${animationId}`, 'color: #ff00ff; font-weight: bold; font-size: 14px');

  console.log('%c📊 RESUMO', 'color: #00ffff; font-weight: bold');
  console.table({
    'Skin ID': diag.convoySkinId,
    'Membros': diag.memberCount,
    'Rota (tiles)': diag.routeLength,
    'Tempo ativo (ms)': uptime,
    'Assets': diag.assets.length,
  });

  console.log('%c🔧 ASSETS (6 GLBs)', 'color: #00ff00; font-weight: bold');
  const assetSummary = diag.assets.map((a, idx) => ({
    '#': idx,
    'Status': a.status,
    'Meshes': a.meshCount || '-',
    'Materiais': a.materialCount || '-',
    'Vértices': a.totalVertices || '-',
    'Triângulos': a.totalTriangles || '-',
    'Tempo (ms)': a.loadDuration || '-',
    'Visível': a.visible !== undefined ? (a.visible ? '✓' : '✗') : '-',
  }));
  console.table(assetSummary);

  if (diag.sceneSnapshot) {
    console.log('%c🌍 SCENE SNAPSHOT', 'color: #ffff00; font-weight: bold');
    console.table(diag.sceneSnapshot);
  }

  if (diag.issues.length > 0) {
    console.log('%c❌ PROBLEMAS DETECTADOS', 'color: #ff0000; font-weight: bold');
    diag.issues.forEach((issue, idx) => {
      console.error(`  ${idx + 1}. ${issue}`);
    });
  }

  if (diag.warnings.length > 0) {
    console.log('%c⚠️ AVISOS', 'color: #ffaa00; font-weight: bold');
    diag.warnings.forEach((warning, idx) => {
      console.warn(`  ${idx + 1}. ${warning}`);
    });
  }

  if (diag.issues.length === 0 && diag.warnings.length === 0) {
    console.log('%c✅ NENHUM PROBLEMA DETECTADO', 'color: #00ff00; font-weight: bold');
  }

  console.groupEnd();
}

export function exportConvoyDiagnostics(animationId: string): string {
  const diag = diagnosticsLog.get(animationId);
  if (!diag) return 'Nenhum diagnóstico encontrado';

  return JSON.stringify(diag, null, 2);
}

export function getAllDiagnostics() {
  return Array.from(diagnosticsLog.entries()).map(([id, diag]) => ({
    id,
    ...diag,
  }));
}
