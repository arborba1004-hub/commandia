export type AttackRouteTile = { tileX: number; tileY: number };

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clampTile(value: unknown, maxExclusive: number): number {
  const max = Math.max(0, Math.floor(toFiniteNumber(maxExclusive, 1)) - 1);
  return Math.max(0, Math.min(max, Math.floor(toFiniteNumber(value, 0))));
}

/**
 * Menor caminho em tiles quando o comboio pode andar nas 8 direções:
 * diagonal, vertical e horizontal.
 *
 * Exemplo: de (0,0) para (5,3) gera 5 movimentos:
 * (0,0) -> (1,1) -> (2,2) -> (3,3) -> (4,3) -> (5,3)
 */
export function buildShortestTileRoute(
  fromTileX: number,
  fromTileY: number,
  toTileX: number,
  toTileY: number,
  gridWidth = 120,
  gridHeight = 120,
): AttackRouteTile[] {
  let x = clampTile(fromTileX, gridWidth);
  let y = clampTile(fromTileY, gridHeight);
  const tx = clampTile(toTileX, gridWidth);
  const ty = clampTile(toTileY, gridHeight);

  const route: AttackRouteTile[] = [{ tileX: x, tileY: y }];

  while (x !== tx || y !== ty) {
    if (x < tx) x += 1;
    else if (x > tx) x -= 1;

    if (y < ty) y += 1;
    else if (y > ty) y -= 1;

    route.push({ tileX: x, tileY: y });
  }

  return route;
}

export function normalizeRouteTiles(
  route: unknown,
  gridWidth = 120,
  gridHeight = 120,
): AttackRouteTile[] {
  if (!Array.isArray(route)) return [];

  const normalized = route
    .map((step: any) => ({
      tileX: clampTile(step?.tileX ?? step?.x, gridWidth),
      tileY: clampTile(step?.tileY ?? step?.y, gridHeight),
    }))
    .filter((step) => Number.isFinite(step.tileX) && Number.isFinite(step.tileY));

  // Remove repetições consecutivas para evitar trechos parados na animação.
  return normalized.filter((step, index, arr) => {
    if (index === 0) return true;
    const prev = arr[index - 1];
    return prev.tileX !== step.tileX || prev.tileY !== step.tileY;
  });
}

/** Distância em número de movimentos por tile com diagonal permitida. */
export function getShortestRouteDistanceTiles(
  fromTileX: number,
  fromTileY: number,
  toTileX: number,
  toTileY: number,
): number {
  const dx = Math.abs(Math.floor(toFiniteNumber(toTileX)) - Math.floor(toFiniteNumber(fromTileX)));
  const dy = Math.abs(Math.floor(toFiniteNumber(toTileY)) - Math.floor(toFiniteNumber(fromTileY)));
  return Math.max(dx, dy);
}

/**
 * Tempo por tile do ataque.
 * Barraco maior => menor tempo por tile.
 * velocityBonus fica pronto para aceleradores comprados na loja/investimentos.
 */
export function getAttackTimePerTileMs(
  barracoLevel: number,
  velocityBonus = 0,
  baseTimeMs = 5000,
): number {
  const safeBase = Math.max(1, Math.floor(toFiniteNumber(baseTimeMs, 5000)));
  const safeLevel = Math.max(1, Math.floor(toFiniteNumber(barracoLevel, 1)));
  const safeBonus = Math.max(0, Math.min(0.9, toFiniteNumber(velocityBonus, 0)));

  const levelFactor = 1 + 0.05 * (safeLevel - 1);
  const baseSpeed = safeBase / levelFactor;
  return Math.max(50, Math.floor(baseSpeed * (1 - safeBonus)));
}

export function getAttackTravelMetrics(params: {
  fromTileX: number;
  fromTileY: number;
  toTileX: number;
  toTileY: number;
  barracoLevel: number;
  velocityBonus?: number;
  baseTimeMs?: number;
}) {
  const distanceTiles = getShortestRouteDistanceTiles(
    params.fromTileX,
    params.fromTileY,
    params.toTileX,
    params.toTileY,
  );
  const timePerTileMs = getAttackTimePerTileMs(
    params.barracoLevel,
    params.velocityBonus ?? 0,
    params.baseTimeMs ?? 5000,
  );

  return {
    distanceTiles,
    timePerTileMs,
    totalDurationMs: distanceTiles * timePerTileMs,
  };
}

export function getElapsedProgress(launchedAtIso?: string | null, totalDurationMs?: number | null): number {
  const total = Math.max(1, Number(totalDurationMs || 0));
  const launchedAt = launchedAtIso ? new Date(launchedAtIso).getTime() : 0;
  if (!Number.isFinite(launchedAt) || launchedAt <= 0) return 0;
  return Math.max(0, Math.min(1, (Date.now() - launchedAt) / total));
}
