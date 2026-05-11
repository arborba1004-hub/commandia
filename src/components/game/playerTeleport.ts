import type {
  MountedPlayerMapSpace,
  TileOrigin,
} from '@/components/game/playerMapSpace';
import {
  PLAYER_SPACE_WIDTH,
  PLAYER_SPACE_HEIGHT,
  resolvePlayerSpawnSpace,
} from '@/components/game/playerMapSpace';

export type PlayerTeleportOptions = {
  clickedTileX: number;
  clickedTileY: number;
  occupiedOrigins?: TileOrigin[];
  gridWidth: number;
  gridHeight: number;
};

export type PlayerTeleportResult = {
  tileX: number;
  tileY: number;
  worldX: number;
  worldZ: number;
  widthTiles: number;
  heightTiles: number;
};

function toInt(value: number, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
}

export function getTeleportOriginFromClickedTile(
  clickedTileX: number,
  clickedTileY: number
) {
  const tileX = toInt(clickedTileX) - Math.floor(PLAYER_SPACE_WIDTH / 2);
  const tileY = toInt(clickedTileY) - Math.floor(PLAYER_SPACE_HEIGHT / 2);

  return {
    tileX,
    tileY,
  };
}

export function resolvePlayerTeleport({
  clickedTileX,
  clickedTileY,
  occupiedOrigins = [],
  gridWidth,
  gridHeight,
}: PlayerTeleportOptions): PlayerTeleportResult {
  const origin = getTeleportOriginFromClickedTile(clickedTileX, clickedTileY);

  return resolvePlayerSpawnSpace(
    origin.tileX,
    origin.tileY,
    occupiedOrigins,
    gridWidth,
    gridHeight
  );
}

export function teleportPlayerMapSpace(
  playerMapSpace: MountedPlayerMapSpace,
  options: PlayerTeleportOptions
): PlayerTeleportResult {
  const resolved = resolvePlayerTeleport(options);

  playerMapSpace.updatePosition(
    resolved.tileX,
    resolved.tileY,
    options.occupiedOrigins ?? []
  );

  return resolved;
}