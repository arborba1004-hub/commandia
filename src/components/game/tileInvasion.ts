/**
 * tileInvasion.ts
 *
 * MUDANÇAS:
 *   - Remove syncPlayerToBackend() — socket em GamePage.tsx faz o save + broadcast
 *   - applyPlayerUpdate() continua atualizando o store local (otimista)
 *   - Função agora é síncrona no caminho feliz (não precisa await syncPlayerToBackend)
 *
 * NOTA: Esta função ainda é válida para validação e update local.
 * O broadcast real-time é feito pelo GamePage após chamar esta função.
 */

import { usePlayerStore } from '@/store/playerStore';

const GRID_WIDTH  = 120;
const GRID_HEIGHT = 120;
const TILE_SIZE   = 1;

export interface TilePosition {
  tileX: number;
  tileY: number;
}

export interface OtherPlayer {
  id:    string;
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
  if (tileX < 0 || tileX >= GRID_WIDTH || tileY < 0 || tileY >= GRID_HEIGHT) return false;
  if (tileX === currentTileX && tileY === currentTileY) return false;
  if (occupiedTiles.has(`${tileX},${tileY}`)) return false;
  return true;
}

export function getOccupiedTiles(otherPlayers: OtherPlayer[]): Set<string> {
  const occupied = new Set<string>();
  otherPlayers.forEach((player) => occupied.add(`${player.tileX},${player.tileY}`));
  return occupied;
}

export function getTileWorldPosition(tileX: number, tileY: number) {
  return {
    worldX: (tileX - GRID_WIDTH  / 2) * TILE_SIZE,
    worldZ: (tileY - GRID_HEIGHT / 2) * TILE_SIZE,
  };
}

/**
 * Tenta mover o jogador para um tile.
 * - Valida bounds e ocupação
 * - Pede confirmação ao jogador
 * - Atualiza o store local (optimistic)
 * - NÃO faz mais syncPlayerToBackend — GamePage emite socket.emit('move')
 *
 * @returns true se o movimento foi confirmado e aplicado
 */
export async function handleTileInvasion(
  tileX: number,
  tileY: number,
  otherPlayers: OtherPlayer[] = []
): Promise<boolean> {
  const { player, applyPlayerUpdate } = usePlayerStore.getState();

  if (!player?._id) {
    console.error('Player not found');
    return false;
  }

  const currentTileX  = player.mapPosition?.tileX ?? GRID_WIDTH  / 2;
  const currentTileY  = player.mapPosition?.tileY ?? GRID_HEIGHT / 2;
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
    `Deseja mover seu barraco para (${tileX}, ${tileY})?\n\nSeu barraco será teleportado para esta localização.`
  );

  if (!confirmed) return false;

  const { worldX, worldZ } = getTileWorldPosition(tileX, tileY);

  // Atualiza store local (otimista)
  applyPlayerUpdate((currentPlayer) => ({
    ...currentPlayer,
    mapPosition: { tileX, tileY, worldX, worldY: worldZ },
  }));

  // ⚠️ NÃO chama syncPlayerToBackend — GamePage emite socket.emit('move')
  // que salva no DB e faz broadcast em tempo real para todos

  return true;
}

export function worldToTileCoordinates(worldX: number, worldZ: number): TilePosition {
  return {
    tileX: Math.floor(worldX + GRID_WIDTH  / 2),
    tileY: Math.floor(worldZ + GRID_HEIGHT / 2),
  };
}
