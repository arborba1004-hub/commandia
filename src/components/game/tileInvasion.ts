/**
 * Tile Invasion / Teleport System
 * Handles the logic for invading and teleporting to a new tile
 */

import { usePlayerStore } from '@/store/playerStore';

const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;
const TILE_SIZE = 1;

export interface TilePosition {
  tileX: number;
  tileY: number;
}

/**
 * Validates if a tile is available for invasion
 * A tile is available if it's within grid bounds and not the player's current position
 */
export function isValidTile(tileX: number, tileY: number, currentTileX: number, currentTileY: number): boolean {
  // Check if tile is within grid bounds
  if (tileX < 0 || tileX >= GRID_WIDTH || tileY < 0 || tileY >= GRID_HEIGHT) {
    return false;
  }

  // Check if it's not the current position
  if (tileX === currentTileX && tileY === currentTileY) {
    return false;
  }

  return true;
}

/**
 * Calculates the world position from tile coordinates
 */
export function getTileWorldPosition(tileX: number, tileY: number) {
  const worldX = (tileX - GRID_WIDTH / 2) * TILE_SIZE;
  const worldZ = (tileY - GRID_HEIGHT / 2) * TILE_SIZE;
  return { worldX, worldZ };
}

/**
 * Handles the tile invasion process
 * Shows a confirmation dialog and updates the player's position if confirmed
 */
export async function handleTileInvasion(tileX: number, tileY: number): Promise<boolean> {
  const { player, setPlayer } = usePlayerStore.getState();

  if (!player) {
    console.error('Player not found');
    return false;
  }

  const currentTileX = player.mapPosition?.tileX ?? GRID_WIDTH / 2;
  const currentTileY = player.mapPosition?.tileY ?? GRID_HEIGHT / 2;

  // Validate the tile
  if (!isValidTile(tileX, tileY, currentTileX, currentTileY)) {
    console.warn('Invalid tile selected');
    return false;
  }

  // Show confirmation dialog
  const confirmed = window.confirm(
    `Deseja invadir o lote em (${tileX}, ${tileY})?\n\nSeu barraco será teleportado para esta localização.`
  );

  if (!confirmed) {
    return false;
  }

  // Update player position
  try {
    setPlayer({
      mapPosition: {
        tileX,
        tileY,
      },
    });

    console.log(`✅ Barraco teleportado para (${tileX}, ${tileY})`);
    return true;
  } catch (error) {
    console.error('Erro ao teleportar barraco:', error);
    return false;
  }
}

/**
 * Converts world coordinates to tile coordinates
 */
export function worldToTileCoordinates(worldX: number, worldZ: number): TilePosition {
  const tileX = Math.floor(worldX + GRID_WIDTH / 2);
  const tileY = Math.floor(worldZ + GRID_HEIGHT / 2);

  return { tileX, tileY };
}
