import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type BuildingItem = {
  name: string;
  url: string;
  x: number;
  z: number;
};

const COMPLEXO_BUILDINGS: BuildingItem[] = [
  {
    name: 'QG',
    url: 'https://static.wixstatic.com/3d/50f4bf_938928189a844f56ac340bada0b551bd.glb',
    x: 0,
    z: 0,
  },
  {
    name: 'Centro Comercial',
    url: 'https://static.wixstatic.com/3d/50f4bf_8b894931f3c241f285c4292c4842c4f0.glb',
    x: 17,
    z: -5,
  },
  {
    name: 'Centro Comunitário',
    url: 'https://static.wixstatic.com/3d/50f4bf_1641be50f6a74954848cfaae281d6b15.glb',
    x: 17,
    z: 2,
  },
];

type BuildingModelProps = {
  item: BuildingItem;
};

function BuildingModel({ item }: BuildingModelProps) {
  const { scene } = useGLTF(item.url);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  return (
    <group position={[item.x, 0, item.z]}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function ComplexoBuildingsLayer() {
  return (
    <group name="complexo-buildings-layer">
      {COMPLEXO_BUILDINGS.map((item) => (
        <BuildingModel key={item.name} item={item} />
      ))}
    </group>
  );
}

useGLTF.preload('https://static.wixstatic.com/3d/50f4bf_938928189a844f56ac340bada0b551bd.glb');
useGLTF.preload('https://static.wixstatic.com/3d/50f4bf_8b894931f3c241f285c4292c4842c4f0.glb');
useGLTF.preload('https://static.wixstatic.com/3d/50f4bf_1641be50f6a74954848cfaae281d6b15.glb');