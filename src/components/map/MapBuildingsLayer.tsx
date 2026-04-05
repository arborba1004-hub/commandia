import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';

type BuildingProps = {
  modelPath: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
  route: string;
};

function Building({
  modelPath,
  position,
  rotation,
  scale = [1, 1, 1],
  route,
}: BuildingProps) {
  const { scene } = useGLTF(modelPath);
  const navigate = useNavigate();

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e: any) => {
        e.stopPropagation();
        navigate(route);
      }}
    />
  );
}

type MapBuildingsLayerProps = {
  cols: number;
  rows: number;
  tileSize?: number;
};

export default function MapBuildingsLayer({
  cols,
  rows,
  tileSize = 1,
}: MapBuildingsLayerProps) {
  const halfWidth = (cols * tileSize) / 2;
  const halfHeight = (rows * tileSize) / 2;

  // QG 4x4 exatamente no centro
  const qgPosition: [number, number, number] = [0, 0, 0];

  // Prédios 4x2 na margem direita, virados para o centro
  // Cada um tem largura 4 tiles no eixo X e altura 2 tiles no eixo Z
  const rightMarginCenterX = halfWidth - 2 * tileSize;

  // lado a lado na vertical do mapa, deixando ambos dentro da margem direita
  const centroComercialPosition: [number, number, number] = [
    rightMarginCenterX,
    0,
    -1.5 * tileSize,
  ];

  const centroComunitarioPosition: [number, number, number] = [
    rightMarginCenterX,
    0,
    1.5 * tileSize,
  ];

  return (
    <group>
      <Building
        modelPath="/models/qg.glb"
        position={qgPosition}
        rotation={[0, 0, 0]}
        route="/qg"
      />

      <Building
        modelPath="/models/centro-comercial.glb"
        position={centroComercialPosition}
        rotation={[0, Math.PI, 0]}
        route="/centro-comercial"
      />

      <Building
        modelPath="/models/centro-comunitario.glb"
        position={centroComunitarioPosition}
        rotation={[0, Math.PI, 0]}
        route="/centro-comunitario"
      />
    </group>
  );
}

useGLTF.preload('/models/qg.glb');
useGLTF.preload('/models/centro-comercial.glb');
useGLTF.preload('/models/centro-comunitario.glb');
