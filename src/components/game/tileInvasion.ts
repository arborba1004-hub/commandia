/**
 * Tile Invasion / Teleport System
 * Handles the logic for invading and teleporting to a new tile
 */

import { usePlayerStore } from '@/store/playerStore';

const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;
const TILE_SIZE = 1;
const BLOCK_SIZE = 4; // 4x4 tiles per block

export interface TilePosition {
  tileX: number;
  tileY: number;
}

export interface OtherPlayer {
  id: string;
  tileX: number;
  tileY: number;
  name?: string;
}

/**
 * Gets the 4x4 block coordinates for a given tile
 * Each block represents a 4x4 area of tiles
 */
export function getTileBlock(tileX: number, tileY: number): { blockX: number; blockY: number } {
  return {
    blockX: Math.floor(tileX / BLOCK_SIZE),
    blockY: Math.floor(tileY / BLOCK_SIZE),
  };
}

/**
 * Gets all tiles within a 4x4 block
 */
export function getBlockTiles(blockX: number, blockY: number): Array<{ x: number; y: number }> {
  const tiles: Array<{ x: number; y: number }> = [];
  const startX = blockX * BLOCK_SIZE;
  const startY = blockY * BLOCK_SIZE;
  
  for (let x = startX; x < startX + BLOCK_SIZE && x < GRID_WIDTH; x++) {
    for (let y = startY; y < startY + BLOCK_SIZE && y < GRID_HEIGHT; y++) {
      tiles.push({ x, y });
    }
  }
  
  return tiles;
}

/**
 * Checks if a 4x4 block is occupied by any player
 */
export function isBlockOccupied(blockX: number, blockY: number, occupiedTiles: Set<string>): boolean {
  const blockTiles = getBlockTiles(blockX, blockY);
  
  for (const tile of blockTiles) {
    const tileKey = `${tile.x},${tile.y}`;
    if (occupiedTiles.has(tileKey)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validates if a tile is available for invasion
 * A tile is available if:
 * 1. It's within grid bounds
 * 2. The entire 4x4 block containing the tile is not occupied by another player
 * 3. It's not in the player's current 4x4 block
 */
export function isValidTile(
  tileX: number,
  tileY: number,
  currentTileX: number,
  currentTileY: number,
  occupiedTiles: Set<string> = new Set()
): boolean {
  // Check if tile is within grid bounds
  if (tileX < 0 || tileX >= GRID_WIDTH || tileY < 0 || tileY >= GRID_HEIGHT) {
    return false;
  }

  // Get the 4x4 blocks for both the target tile and current position
  const targetBlock = getTileBlock(tileX, tileY);
  const currentBlock = getTileBlock(currentTileX, currentTileY);

  // Check if it's not in the current block
  if (targetBlock.blockX === currentBlock.blockX && targetBlock.blockY === currentBlock.blockY) {
    return false;
  }

  // Check if the entire 4x4 block is occupied by another player
  if (isBlockOccupied(targetBlock.blockX, targetBlock.blockY, occupiedTiles)) {
    return false;
  }

  return true;
}

/**
 * Creates a set of occupied tiles from other players
 * Each player occupies a 4x4 block of tiles
 */
export function getOccupiedTiles(otherPlayers: OtherPlayer[]): Set<string> {
  const occupied = new Set<string>();
  
  otherPlayers.forEach(player => {
    const block = getTileBlock(player.tileX, player.tileY);
    const blockTiles = getBlockTiles(block.blockX, block.blockY);
    
    blockTiles.forEach(tile => {
      occupied.add(`${tile.x},${tile.y}`);
    });
  });
  
  return occupied;
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
 * Validates that the entire 4x4 block is not occupied by another player
 */
export async function handleTileInvasion(
  tileX: number,
  tileY: number,
  otherPlayers: OtherPlayer[] = []
): Promise<boolean> {
  const { player, setPlayer } = usePlayerStore.getState();

  if (!player) {
    console.error('Player not found');
    return false;
  }

  const currentTileX = player.mapPosition?.tileX ?? GRID_WIDTH / 2;
  const currentTileY = player.mapPosition?.tileY ?? GRID_HEIGHT / 2;

  // Get occupied tiles from other players
  const occupiedTiles = getOccupiedTiles(otherPlayers);

  // Validate the tile
  if (!isValidTile(tileX, tileY, currentTileX, currentTileY, occupiedTiles)) {
    // Check if the 4x4 block is occupied by another player
    const targetBlock = getTileBlock(tileX, tileY);
    if (isBlockOccupied(targetBlock.blockX, targetBlock.blockY, occupiedTiles)) {
      console.warn(`❌ Bloco 4x4 contendo (${tileX}, ${tileY}) já está ocupado por outro jogador`);
      window.alert(`❌ Este bloco 4x4 já está ocupado por outro jogador!`);
    } else {
      console.warn('Invalid tile selected');
      window.alert('❌ Lote inválido! Escolha outro local.');
    }
    return false;
  }

  // Show confirmation dialog
  const confirmed = window.confirm(
    `Deseja invadir o lote em (${tileX}, ${tileY})?\\n\\nSeu barraco será teleportado para esta localização.`
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
