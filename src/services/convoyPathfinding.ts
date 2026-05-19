/**
 * Pathfinding service for convoy movement
 * Uses A* algorithm to find the shortest path between two barracks
 */

export interface TileCoord {
  x: number;
  y: number;
}

export interface PathNode {
  coord: TileCoord;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // g + h
  parent: PathNode | null;
}

export class ConvoyPathfinder {
  /**
   * Calculate Manhattan distance heuristic
   */
  private static heuristic(from: TileCoord, to: TileCoord): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  }

  /**
   * Get all valid neighboring tiles (8 directions: diagonal, horizontal, vertical)
   */
  private static getNeighbors(coord: TileCoord, mapBounds: { width: number; height: number }): TileCoord[] {
    const neighbors: TileCoord[] = [];
    const directions = [
      { x: -1, y: -1 }, // top-left
      { x: 0, y: -1 },  // top
      { x: 1, y: -1 },  // top-right
      { x: -1, y: 0 },  // left
      { x: 1, y: 0 },   // right
      { x: -1, y: 1 },  // bottom-left
      { x: 0, y: 1 },   // bottom
      { x: 1, y: 1 },   // bottom-right
    ];

    for (const dir of directions) {
      const newX = coord.x + dir.x;
      const newY = coord.y + dir.y;

      if (newX >= 0 && newX < mapBounds.width && newY >= 0 && newY < mapBounds.height) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  /**
   * Check if two coordinates are equal
   */
  private static coordsEqual(a: TileCoord, b: TileCoord): boolean {
    return a.x === b.x && a.y === b.y;
  }

  /**
   * Find path using A* algorithm
   */
  static findPath(
    start: TileCoord,
    end: TileCoord,
    mapBounds: { width: number; height: number }
  ): TileCoord[] {
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: PathNode = {
      coord: start,
      g: 0,
      h: this.heuristic(start, end),
      f: this.heuristic(start, end),
      parent: null,
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find node with lowest f score
      let current = openSet[0];
      let currentIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < current.f) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      if (this.coordsEqual(current.coord, end)) {
        // Reconstruct path
        const path: TileCoord[] = [];
        let node: PathNode | null = current;

        while (node !== null) {
          path.unshift(node.coord);
          node = node.parent;
        }

        return path;
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.coord.x},${current.coord.y}`);

      const neighbors = this.getNeighbors(current.coord, mapBounds);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Calculate cost (diagonal movement costs slightly more)
        const isDiagonal = Math.abs(neighbor.x - current.coord.x) === 1 && Math.abs(neighbor.y - current.coord.y) === 1;
        const movementCost = isDiagonal ? 1.414 : 1; // sqrt(2) for diagonal

        const tentativeG = current.g + movementCost;

        let neighborNode = openSet.find(n => this.coordsEqual(n.coord, neighbor));

        if (!neighborNode) {
          neighborNode = {
            coord: neighbor,
            g: tentativeG,
            h: this.heuristic(neighbor, end),
            f: 0,
            parent: current,
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openSet.push(neighborNode);
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    // No path found, return direct line
    return [start, end];
  }

  /**
   * Convert world coordinates to tile coordinates
   */
  static worldToTile(worldCoord: { x: number; y: number }, tileSize: number): TileCoord {
    return {
      x: Math.floor(worldCoord.x / tileSize),
      y: Math.floor(worldCoord.y / tileSize),
    };
  }

  /**
   * Convert tile coordinates to world coordinates (center of tile)
   */
  static tileToWorld(tileCoord: TileCoord, tileSize: number): { x: number; y: number } {
    return {
      x: tileCoord.x * tileSize + tileSize / 2,
      y: tileCoord.y * tileSize + tileSize / 2,
    };
  }
}
