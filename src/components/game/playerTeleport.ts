import type {
  MountedPlayerMapSpace,
  TileOrigin,
  PlayerSpaceRect,
} from '@/components/game/playerMapSpace';
import {
  PLAYER_SPACE_WIDTH,
  PLAYER_SPACE_HEIGHT,
  getFixedBuildingBlockedRects,
  getPlayerSpaceRect,
  tileToWorldCenter,
} from '@/components/game/playerMapSpace';

export const TELEPORT_AREA_WIDTH = 8;
export const TELEPORT_AREA_HEIGHT = 8;

export type PlayerTeleportOptions = {
  clickedTileX: number;
  clickedTileY: number;
  occupiedOrigins?: TileOrigin[];
  gridWidth: number;
  gridHeight: number;
  ignoreOrigin?: TileOrigin | null;
};

export type TeleportPreviewResult =
  | {
      ok: false;
      needsConfirmation: false;
      reason: string;
    }
  | {
      ok: true;
      needsConfirmation: true;
      confirmationMessage: string;
      clickedTileX: number;
      clickedTileY: number;
      teleportArea: {
        tileX: number;
        tileY: number;
        widthTiles: number;
        heightTiles: number;
      };
      playerSpawn: {
        tileX: number;
        tileY: number;
        worldX: number;
        worldZ: number;
        widthTiles: number;
        heightTiles: number;
      };
    };

export type ConfirmTeleportResult =
  | {
      ok: false;
      reason: string;
    }
  | {
      ok: true;
      tileX: number;
      tileY: number;
      worldX: number;
      worldZ: number;
    };

function toInt(value: number, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rectanglesOverlap(a: PlayerSpaceRect, b: PlayerSpaceRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function sameOrigin(a?: TileOrigin | null, b?: TileOrigin | null): boolean {
  if (!a || !b) return false;
  return toInt(a.tileX) === toInt(b.tileX) && toInt(a.tileY) === toInt(b.tileY);
}

export function getTeleportAreaRect(tileX: number, tileY: number): PlayerSpaceRect {
  return {
    x: toInt(tileX),
    y: toInt(tileY),
    width: TELEPORT_AREA_WIDTH,
    height: TELEPORT_AREA_HEIGHT,
  };
}

export function isTeleportAreaInsideMap(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  const x = toInt(tileX);
  const y = toInt(tileY);

  return (
    x >= 0 &&
    y >= 0 &&
    x + TELEPORT_AREA_WIDTH <= gridWidth &&
    y + TELEPORT_AREA_HEIGHT <= gridHeight
  );
}

export function getTeleportAreaOriginFromClickedTile(
  clickedTileX: number,
  clickedTileY: number,
  gridWidth: number,
  gridHeight: number
) {
  const rawTileX = toInt(clickedTileX) - Math.floor(TELEPORT_AREA_WIDTH / 2);
  const rawTileY = toInt(clickedTileY) - Math.floor(TELEPORT_AREA_HEIGHT / 2);

  return {
    tileX: clamp(rawTileX, 0, Math.max(0, gridWidth - TELEPORT_AREA_WIDTH)),
    tileY: clamp(rawTileY, 0, Math.max(0, gridHeight - TELEPORT_AREA_HEIGHT)),
  };
}

export function getPlayerSpawnFromTeleportArea(
  teleportTileX: number,
  teleportTileY: number,
  gridWidth: number,
  gridHeight: number
) {
  const paddingX = Math.floor((TELEPORT_AREA_WIDTH - PLAYER_SPACE_WIDTH) / 2);
  const paddingY = Math.floor((TELEPORT_AREA_HEIGHT - PLAYER_SPACE_HEIGHT) / 2);

  const tileX = teleportTileX + paddingX;
  const tileY = teleportTileY + paddingY;
  const { worldX, worldZ } = tileToWorldCenter(tileX, tileY, gridWidth, gridHeight);

  return {
    tileX,
    tileY,
    worldX,
    worldZ,
    widthTiles: PLAYER_SPACE_WIDTH,
    heightTiles: PLAYER_SPACE_HEIGHT,
  };
}

export function isTeleportAreaAvailable(
  tileX: number,
  tileY: number,
  occupiedOrigins: TileOrigin[],
  gridWidth: number,
  gridHeight: number,
  ignoreOrigin: TileOrigin | null = null
): boolean {
  if (!isTeleportAreaInsideMap(tileX, tileY, gridWidth, gridHeight)) {
    return false;
  }

  const candidate = getTeleportAreaRect(tileX, tileY);
  const fixedBlockedRects = getFixedBuildingBlockedRects(gridWidth, gridHeight, 1);

  for (const blocked of fixedBlockedRects) {
    if (rectanglesOverlap(candidate, blocked)) {
      return false;
    }
  }

  for (const occupiedOrigin of occupiedOrigins) {
    if (sameOrigin(occupiedOrigin, ignoreOrigin)) {
      continue;
    }

    const occupied = getPlayerSpaceRect(occupiedOrigin.tileX, occupiedOrigin.tileY);

    if (rectanglesOverlap(candidate, occupied)) {
      return false;
    }
  }

  return true;
}

export function createTeleportPreview({
  clickedTileX,
  clickedTileY,
  occupiedOrigins = [],
  gridWidth,
  gridHeight,
  ignoreOrigin = null,
}: PlayerTeleportOptions): TeleportPreviewResult {
  const teleportAreaOrigin = getTeleportAreaOriginFromClickedTile(
    clickedTileX,
    clickedTileY,
    gridWidth,
    gridHeight
  );

  const available = isTeleportAreaAvailable(
    teleportAreaOrigin.tileX,
    teleportAreaOrigin.tileY,
    occupiedOrigins,
    gridWidth,
    gridHeight,
    ignoreOrigin
  );

  if (!available) {
    return {
      ok: false,
      needsConfirmation: false,
      reason: 'A área 8x8 escolhida não está livre para teleporte.',
    };
  }

  const playerSpawn = getPlayerSpawnFromTeleportArea(
    teleportAreaOrigin.tileX,
    teleportAreaOrigin.tileY,
    gridWidth,
    gridHeight
  );

  return {
    ok: true,
    needsConfirmation: true,
    confirmationMessage: `Teleportar para esta área 8x8 livre?`,
    clickedTileX: toInt(clickedTileX),
    clickedTileY: toInt(clickedTileY),
    teleportArea: {
      tileX: teleportAreaOrigin.tileX,
      tileY: teleportAreaOrigin.tileY,
      widthTiles: TELEPORT_AREA_WIDTH,
      heightTiles: TELEPORT_AREA_HEIGHT,
    },
    playerSpawn,
  };
}

export function confirmPlayerTeleport(
  playerMapSpace: MountedPlayerMapSpace,
  preview: TeleportPreviewResult,
  occupiedOrigins: TileOrigin[] = [],
  gridWidth?: number,
  gridHeight?: number,
  ignoreOrigin: TileOrigin | null = null
): ConfirmTeleportResult {
  if (!preview.ok) {
    return {
      ok: false,
      reason: preview.reason,
    };
  }

  if (
    typeof gridWidth === 'number' &&
    typeof gridHeight === 'number' &&
    !isTeleportAreaAvailable(
      preview.teleportArea.tileX,
      preview.teleportArea.tileY,
      occupiedOrigins,
      gridWidth,
      gridHeight,
      ignoreOrigin
    )
  ) {
    return {
      ok: false,
      reason: 'A área 8x8 deixou de estar livre.',
    };
  }

  playerMapSpace.updatePosition(
    preview.playerSpawn.tileX,
    preview.playerSpawn.tileY,
    occupiedOrigins
  );

  return {
    ok: true,
    tileX: preview.playerSpawn.tileX,
    tileY: preview.playerSpawn.tileY,
    worldX: playerMapSpace.worldX,
    worldZ: playerMapSpace.worldZ,
  };
}