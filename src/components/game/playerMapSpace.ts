export const PLAYER_SPACE_WIDTH = 6;
export const PLAYER_SPACE_HEIGHT = 6;

export type TileOrigin = {
  tileX: number;
  tileY: number;
};

export type PlayerSpaceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function toInt(value: number, fallback = 0): number {
  return Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback;
}

function rectanglesOverlap(a: PlayerSpaceRect, b: PlayerSpaceRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getPlayerSpaceRect(tileX: number, tileY: number): PlayerSpaceRect {
  return {
    x: toInt(tileX),
    y: toInt(tileY),
    width: PLAYER_SPACE_WIDTH,
    height: PLAYER_SPACE_HEIGHT,
  };
}

export function isPlayerSpaceInsideMap(
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
    x + PLAYER_SPACE_WIDTH <= gridWidth &&
    y + PLAYER_SPACE_HEIGHT <= gridHeight
  );
}

export function isPlayerSpaceAvailable(
  tileX: number,
  tileY: number,
  occupiedOrigins: TileOrigin[],
  gridWidth: number,
  gridHeight: number,
  ignoreIndex: number | null = null
): boolean {
  if (!isPlayerSpaceInsideMap(tileX, tileY, gridWidth, gridHeight)) {
    return false;
  }

  const candidate = getPlayerSpaceRect(tileX, tileY);

  for (let i = 0; i < occupiedOrigins.length; i += 1) {
    if (ignoreIndex !== null && i === ignoreIndex) continue;

    const occupied = getPlayerSpaceRect(
      occupiedOrigins[i].tileX,
      occupiedOrigins[i].tileY
    );

    if (rectanglesOverlap(candidate, occupied)) {
      return false;
    }
  }

  return true;
}

export function tileToWorldCenter(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number
) {
  const x = toInt(tileX);
  const y = toInt(tileY);

  return {
    worldX: x - Math.floor(gridWidth / 2) + PLAYER_SPACE_WIDTH / 2,
    worldZ: y - Math.floor(gridHeight / 2) + PLAYER_SPACE_HEIGHT / 2,
  };
}

function buildCandidateOrigins(gridWidth: number, gridHeight: number): TileOrigin[] {
  const origins: TileOrigin[] = [];

  for (let y = 0; y <= gridHeight - PLAYER_SPACE_HEIGHT; y += 1) {
    for (let x = 0; x <= gridWidth - PLAYER_SPACE_WIDTH; x += 1) {
      origins.push({ tileX: x, tileY: y });
    }
  }

  return origins;
}

function shuffle<T>(list: T[]): T[] {
  const array = [...list];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

export function generateRandomPlayerSpace(
  occupiedOrigins: TileOrigin[],
  gridWidth: number,
  gridHeight: number
) {
  const candidates = shuffle(buildCandidateOrigins(gridWidth, gridHeight));

  for (const candidate of candidates) {
    const available = isPlayerSpaceAvailable(
      candidate.tileX,
      candidate.tileY,
      occupiedOrigins,
      gridWidth,
      gridHeight
    );

    if (!available) continue;

    const { worldX, worldZ } = tileToWorldCenter(
      candidate.tileX,
      candidate.tileY,
      gridWidth,
      gridHeight
    );

    return {
      tileX: candidate.tileX,
      tileY: candidate.tileY,
      worldX,
      worldZ,
      widthTiles: PLAYER_SPACE_WIDTH,
      heightTiles: PLAYER_SPACE_HEIGHT,
    };
  }

  throw new Error('Nenhum espaço 6x6 disponível no mapa');
}