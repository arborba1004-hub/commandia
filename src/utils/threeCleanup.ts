import * as THREE from "three";

export function disposeThreeMaterial(material: THREE.Material | THREE.Material[] | null | undefined) {
  if (!material) return;
  if (Array.isArray(material)) {
    material.forEach((item) => disposeThreeMaterial(item));
    return;
  }

  const anyMaterial = material as any;
  const textureKeys = [
    "map",
    "alphaMap",
    "aoMap",
    "bumpMap",
    "clearcoatMap",
    "clearcoatNormalMap",
    "clearcoatRoughnessMap",
    "displacementMap",
    "emissiveMap",
    "envMap",
    "gradientMap",
    "lightMap",
    "metalnessMap",
    "normalMap",
    "roughnessMap",
    "sheenColorMap",
    "sheenRoughnessMap",
    "specularColorMap",
    "specularIntensityMap",
    "transmissionMap",
  ];

  for (const key of textureKeys) {
    const texture = anyMaterial[key];
    if (texture && typeof texture.dispose === "function") {
      texture.dispose();
    }
  }

  material.dispose?.();
}

export function disposeThreeObject(object: THREE.Object3D | null | undefined) {
  if (!object) return;

  object.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose?.();
    }
    if (mesh.material) {
      disposeThreeMaterial(mesh.material as THREE.Material | THREE.Material[]);
    }
  });
}

function loseCanvasContext(canvas: HTMLCanvasElement | null | undefined) {
  if (!canvas) return;
  const contexts: Array<"webgl2" | "webgl" | "experimental-webgl"> = [
    "webgl2",
    "webgl",
    "experimental-webgl",
  ];

  for (const type of contexts) {
    try {
      const context = canvas.getContext(type as any) as WebGLRenderingContext | null;
      const extension = context?.getExtension?.("WEBGL_lose_context");
      extension?.loseContext?.();
    } catch {
      // O browser pode bloquear getContext depois de falha WebGL. Ignora.
    }
  }
}

export function releaseWebGLRenderer(
  renderer: THREE.WebGLRenderer | null | undefined,
  container?: HTMLElement | null,
) {
  const canvas = renderer?.domElement || null;

  try {
    renderer?.renderLists?.dispose?.();
  } catch {
    // compatibilidade com versões diferentes do Three.js
  }

  try {
    renderer?.dispose?.();
  } catch {
    // dispose não deve derrubar cleanup
  }

  try {
    renderer?.forceContextLoss?.();
  } catch {
    loseCanvasContext(canvas);
  }

  if (canvas?.parentNode) {
    try {
      canvas.parentNode.removeChild(canvas);
    } catch {
      // canvas já pode ter sido removido
    }
  } else if (container && canvas && container.contains(canvas)) {
    try {
      container.removeChild(canvas);
    } catch {
      // noop
    }
  }
}

export function releaseOrphanedCommandiaCanvases(container: HTMLElement | null | undefined) {
  if (!container) return;
  const canvases = Array.from(
    container.querySelectorAll<HTMLCanvasElement>('canvas[data-commandia-game-canvas="true"], canvas'),
  );

  for (const canvas of canvases) {
    loseCanvasContext(canvas);
    try {
      canvas.remove();
    } catch {
      // noop
    }
  }
}
