import { usePlayerStore } from '@/store/playerStore';

const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;
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

export function isValidTile(
  tileX: number,
  tileY: number,
  currentTileX: number,
  currentTileY: number,
  occupiedTiles: Set<string> = new Set()
): boolean {
  if (tileX < 0 || tileX >= GRID_WIDTH || tileY < 0 || tileY >= GRID_HEIGHT) {
    return false;
  }

  if (tileX === currentTileX && tileY === currentTileY) {
    return false;
  }

  const tileKey = `${tileX},${tileY}`;
  if (occupiedTiles.has(tileKey)) {
    return false;
  }

  return true;
}

export function getOccupiedTiles(otherPlayers: OtherPlayer[]): Set<string> {
  const occupied = new Set<string>();
  otherPlayers.forEach((player) => {
    occupied.add(`${player.tileX},${player.tileY}`);
  });
  return occupied;
}

export function getTileWorldPosition(tileX: number, tileY: number) {
  const worldX = (tileX - GRID_WIDTH / 2) * TILE_SIZE;
  const worldZ = (tileY - GRID_HEIGHT / 2) * TILE_SIZE;
  return { worldX, worldZ };
}

export async function handleTileInvasion(
  tileX: number,
  tileY: number,
  otherPlayers: OtherPlayer[] = []
): Promise<boolean> {
  const { player, applyPlayerUpdate, syncPlayerToBackend } = usePlayerStore.getState();

  if (!player?._id) {
    console.error('Player not found');
    return false;
  }

  const currentTileX = player.mapPosition?.tileX ?? GRID_WIDTH / 2;
  const currentTileY = player.mapPosition?.tileY ?? GRID_HEIGHT / 2;
  const occupiedTiles = getOccupiedTiles(otherPlayers);

  if (!isValidTile(tileX, tileY, currentTileX, currentTileY, occupiedTiles)) {
    const tileKey = `${tileX},${tileY}`;

    if (occupiedTiles.has(tileKey)) {
      window.alert('❌ Este lote já está ocupado por outro jogador!');
    } else {
      window.alert('❌ Lote inválido! Escolha outro local.');
    }

    return false;
  }

  const confirmed = window.confirm(
    `Deseja invadir o lote em (${tileX}, ${tileY})?\n\nSeu barraco será teleportado para esta localização.`
  );

  if (!confirmed) {
    return false;
  }

  try {
    const { worldX, worldZ } = getTileWorldPosition(tileX, tileY);

    applyPlayerUpdate((currentPlayer) => ({
      ...currentPlayer,
      mapPosition: {
        tileX,
        tileY,
        worldX,
        worldY: worldZ,
      },
    }));

    await syncPlayerToBackend();

    console.log(`✅ Barraco teleportado para (${tileX}, ${tileY})`);
    return true;
  } catch (error) {
    console.error('Erro ao teleportar barraco:', error);
    return false;
  }
}

export function worldToTileCoordinates(worldX: number, worldZ: number): TilePosition {
  const tileX = Math.floor(worldX + GRID_WIDTH / 2);
  const tileY = Math.floor(worldZ + GRID_HEIGHT / 2);

  return { tileX, tileY };
}