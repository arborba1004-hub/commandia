export type AttackRouteTile = {
  tileX: number;
  tileY: number;
};

type BuildRouteParams = {
  fromTileX: number;
  fromTileY: number;
  toTileX: number;
  toTileY: number;
  includeOrigin?: boolean;
};

function pushTileIfNeeded(route: AttackRouteTile[], tileX: number, tileY: number) {
  const last = route[route.length - 1];

  if (!last || last.tileX !== tileX || last.tileY !== tileY) {
    route.push({ tileX, tileY });
  }
}

export function buildManhattanAttackRoute({
  fromTileX,
  fromTileY,
  toTileX,
  toTileY,
  includeOrigin = false,
}: BuildRouteParams): AttackRouteTile[] {
  const route: AttackRouteTile[] = [];

  let currentX = fromTileX;
  let currentY = fromTileY;

  if (includeOrigin) {
    pushTileIfNeeded(route, currentX, currentY);
  }

  while (currentX !== toTileX) {
    currentX += currentX < toTileX ? 1 : -1;
    pushTileIfNeeded(route, currentX, currentY);
  }

  while (currentY !== toTileY) {
    currentY += currentY < toTileY ? 1 : -1;
    pushTileIfNeeded(route, currentX, currentY);
  }

  return route;
}

export function buildReturnAttackRoute(route: AttackRouteTile[]): AttackRouteTile[] {
  return [...route].reverse();
}

export function areSameTile(a: AttackRouteTile | null | undefined, b: AttackRouteTile | null | undefined) {
  if (!a || !b) return false;
  return a.tileX === b.tileX && a.tileY === b.tileY;
}

export function getRouteStep(route: AttackRouteTile[], step: number): AttackRouteTile | null {
  if (!route.length) return null;
  if (step < 0) return route[0];
  if (step >= route.length) return route[route.length - 1];
  return route[step];
}

export function isLastRouteStep(route: AttackRouteTile[], step: number): boolean {
  if (!route.length) return true;
  return step >= route.length - 1;
}