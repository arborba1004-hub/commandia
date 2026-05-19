/**
 * Convoy Attack Service
 * Handles the creation and management of convoys after an attack
 */

import { useConvoyStore, ConvoyMovement } from '@/store/convoyStore';
import { ConvoyPathfinder, TileCoord } from '@/services/convoyPathfinding';
import { ConvoyMovementService } from '@/services/convoyMovementService';
import { v4 as uuidv4 } from 'crypto';

export interface BarracPosition {
  x: number;
  y: number;
  level: number;
}

export interface CreateConvoyParams {
  attackerId: string;
  defenderId: string;
  attackerBarrac: BarracPosition;
  defenderBarrac: BarracPosition;
  mapBounds: { width: number; height: number };
  tileSize: number;
}

export class ConvoyAttackService {
  /**
   * Create a new convoy after an attack
   */
  static createConvoy(params: CreateConvoyParams): ConvoyMovement {
    const {
      attackerId,
      defenderId,
      attackerBarrac,
      defenderBarrac,
      mapBounds,
      tileSize,
    } = params;

    // Convert world coordinates to tile coordinates
    const startTile = ConvoyPathfinder.worldToTile(
      { x: attackerBarrac.x, y: attackerBarrac.y },
      tileSize
    );
    const endTile = ConvoyPathfinder.worldToTile(
      { x: defenderBarrac.x, y: defenderBarrac.y },
      tileSize
    );

    // Calculate map bounds in tiles
    const mapBoundsInTiles = {
      width: Math.ceil(mapBounds.width / tileSize),
      height: Math.ceil(mapBounds.height / tileSize),
    };

    // Find shortest path
    const path = ConvoyPathfinder.findPath(startTile, endTile, mapBoundsInTiles);

    // Calculate movement timing based on attacker's barrack level
    const tileCount = path.length - 1; // Number of movements between tiles
    const timing = ConvoyMovementService.getMovementTiming({
      barracLevel: attackerBarrac.level,
      tileCount,
    });

    // Create convoy
    const convoy: ConvoyMovement = {
      id: uuidv4(),
      attackerId,
      defenderId,
      startBarracLevel: attackerBarrac.level,
      path,
      startTime: Date.now(),
      totalDuration: timing.totalDuration,
      timePerTile: timing.timePerTile,
      status: 'moving',
      currentProgress: 0,
      currentTileIndex: 0,
    };

    return convoy;
  }

  /**
   * Start a convoy movement
   */
  static startConvoy(convoy: ConvoyMovement): void {
    const { addConvoy } = useConvoyStore.getState();
    addConvoy(convoy);
  }

  /**
   * Get estimated arrival time for a convoy
   */
  static getEstimatedArrivalTime(convoy: ConvoyMovement): Date {
    const arrivalTime = new Date(convoy.startTime + convoy.totalDuration);
    return arrivalTime;
  }

  /**
   * Get remaining time for a convoy
   */
  static getRemainingTime(convoy: ConvoyMovement): number {
    if (convoy.status !== 'moving') return 0;

    const elapsed = Date.now() - convoy.startTime;
    const remaining = Math.max(0, convoy.totalDuration - elapsed);
    return remaining;
  }

  /**
   * Get convoy progress percentage
   */
  static getProgressPercentage(convoy: ConvoyMovement): number {
    return convoy.currentProgress * 100;
  }

  /**
   * Get current world position of convoy
   */
  static getCurrentWorldPosition(
    convoy: ConvoyMovement,
    tileSize: number
  ): { x: number; y: number } {
    const path = convoy.path;
    const currentTileIndex = Math.min(convoy.currentTileIndex, path.length - 1);
    const nextTileIndex = Math.min(currentTileIndex + 1, path.length - 1);

    const currentTile = path[currentTileIndex];
    const nextTile = path[nextTileIndex];

    // Calculate interpolation between tiles
    const tileProgress = convoy.currentProgress * (path.length - 1) - currentTileIndex;
    const interpolation = Math.max(0, Math.min(1, tileProgress));

    // Convert to world coordinates
    const currentWorldPos = ConvoyPathfinder.tileToWorld(currentTile, tileSize);
    const nextWorldPos = ConvoyPathfinder.tileToWorld(nextTile, tileSize);

    return {
      x: currentWorldPos.x + (nextWorldPos.x - currentWorldPos.x) * interpolation,
      y: currentWorldPos.y + (nextWorldPos.y - currentWorldPos.y) * interpolation,
    };
  }
}
