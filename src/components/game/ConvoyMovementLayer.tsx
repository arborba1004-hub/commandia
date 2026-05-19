/**
 * Convoy Movement Layer
 * Renders all active convoys moving across the map
 */

import React, { useEffect, useRef } from 'react';
import { useConvoyStore } from '@/store/convoyStore';
import { useConvoyAnimationStore } from '@/store/convoyAnimationStore';
import { ConvoyMovementService } from '@/services/convoyMovementService';
import { ConvoyPathfinder } from '@/services/convoyPathfinding';

export interface ConvoyMovementLayerProps {
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export default function ConvoyMovementLayer({
  mapWidth,
  mapHeight,
  tileSize,
  canvasRef,
}: ConvoyMovementLayerProps) {
  const { getAllConvoys } = useConvoyStore();
  const selectedAnimation = useConvoyAnimationStore((state) => state.selectedAnimation);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvas = canvasRef || internalCanvasRef;

  const drawConvoys = () => {
    if (!canvas.current) return;

    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

    const convoys = getAllConvoys();

    for (const convoy of convoys) {
      if (convoy.status !== 'moving') continue;

      const path = convoy.path;
      if (path.length < 2) continue;

      // Get current position on path
      const currentTileIndex = Math.min(
        convoy.currentTileIndex,
        path.length - 1
      );
      const nextTileIndex = Math.min(currentTileIndex + 1, path.length - 1);

      const currentTile = path[currentTileIndex];
      const nextTile = path[nextTileIndex];

      // Calculate interpolation between tiles
      const tileProgress = convoy.currentProgress * (path.length - 1) - currentTileIndex;
      const interpolation = Math.max(0, Math.min(1, tileProgress));

      // Convert to world coordinates
      const currentWorldPos = ConvoyPathfinder.tileToWorld(currentTile, tileSize);
      const nextWorldPos = ConvoyPathfinder.tileToWorld(nextTile, tileSize);

      const convoyX = currentWorldPos.x + (nextWorldPos.x - currentWorldPos.x) * interpolation;
      const convoyY = currentWorldPos.y + (nextWorldPos.y - currentWorldPos.y) * interpolation;

      // Draw convoy with selected animation
      drawConvoyMarker(ctx, convoyX, convoyY, convoy.attackerId, selectedAnimation);

      // Draw path (optional, for debugging)
      if (process.env.NODE_ENV === 'development') {
        drawConvoyPath(ctx, path, tileSize);
      }
    }

    animationFrameRef.current = requestAnimationFrame(drawConvoys);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(drawConvoys);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Return null as this is a canvas-based layer
  return null;
}

/**
 * Draw convoy marker on canvas
 */
function drawConvoyMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  attackerId: string,
  animationType: string = 'classic-truck'
) {
  const size = 20;

  // Draw outer glow
  ctx.fillStyle = 'rgba(255, 0, 127, 0.3)';
  ctx.beginPath();
  ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw main convoy marker with animation-specific styling
  switch (animationType) {
    case 'armored-van':
      // Red armored van
      ctx.fillStyle = '#DC2626';
      break;
    case 'motorcycle':
      // Orange motorcycle
      ctx.fillStyle = '#F59E0B';
      break;
    case 'classic-truck':
    default:
      // Pink classic truck
      ctx.fillStyle = '#FF007F';
      break;
  }

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  // Draw inner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();

  // Draw animation indicator
  drawAnimationIndicator(ctx, x, y, size, animationType);
}

/**
 * Draw convoy path for debugging
 */
function drawConvoyPath(
  ctx: CanvasRenderingContext2D,
  path: Array<{ x: number; y: number }>,
  tileSize: number
) {
  ctx.strokeStyle = 'rgba(255, 0, 127, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();

  for (let i = 0; i < path.length; i++) {
    const worldPos = ConvoyPathfinder.tileToWorld(path[i], tileSize);
    if (i === 0) {
      ctx.moveTo(worldPos.x, worldPos.y);
    } else {
      ctx.lineTo(worldPos.x, worldPos.y);
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw animation indicator on convoy marker
 */
function drawAnimationIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  animationType: string
) {
  // Draw small icon to indicate animation type
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';

  let icon = '🚚';
  if (animationType === 'armored-van') {
    icon = '🛡️';
  } else if (animationType === 'motorcycle') {
    icon = '🏍️';
  }

  ctx.fillText(icon, x, y);
}
