/**
 * Tile Invasion / Teleport System
 * Handles the logic for invading and teleporting to a new tile
 */

import { usePlayerStore } from '@/store/playerStore';

const GRID_WIDTH = 80;
const GRID_HEIGHT = 40;
const TILE_SIZE = 1;

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
 * Validates if a tile is available for invasion
 * A tile is available if it's within grid bounds, not the player's current position, and not occupied by another player
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

  // Check if it's not the current position
  if (tileX === currentTileX && tileY === currentTileY) {
    return false;
  }

  // Check if tile is occupied by another player
  const tileKey = `${tileX},${tileY}`;
  if (occupiedTiles.has(tileKey)) {
    return false;
  }

  return true;
}

/**
 * Creates a set of occupied tiles from other players
 */
export function getOccupiedTiles(otherPlayers: OtherPlayer[]): Set<string> {
  const occupied = new Set<string>();
  otherPlayers.forEach(player => {
    occupied.add(`${player.tileX},${player.tileY}`);
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
 * Validates that the tile is not occupied by another player
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
    // Check if tile is occupied by another player
    const tileKey = `${tileX},${tileY}`;
    if (occupiedTiles.has(tileKey)) {
      console.warn(`❌ Lote (${tileX}, ${tileY}) já está ocupado por outro jogador`);
      window.alert(`❌ Este lote já está ocupado por outro jogador!`);
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

  // Update player position locally (optimistic update)
  try {
    setPlayer({
      mapPosition: {
        tileX,
        tileY,
      },
    });

    console.log(`✅ Barraco teleportado para (${tileX}, ${tileY})`);

    // 🔥 PUBLISH MOVEMENT TO OTHER PLAYERS VIA REALTIME API
    try {
      const playerId = player._id || player.googleId || 'unknown';

      // Call backend to publish movement via the movement_updates channel
      const response = await fetch('https://comando-backend.onrender.com/api/movement/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          playerId,
          tileX,
          tileY,
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ Falha ao publicar movimento, mas posição foi atualizada localmente');
      } else {
        console.log('📡 Movimento publicado com sucesso para o canal movement_updates');
      }
    } catch (publishError) {
      console.warn('⚠️ Erro ao publicar movimento (backup ativo):', publishError);
      // Não falha - o polling de posições funcionará como backup
    }

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
