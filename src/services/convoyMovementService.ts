/**
 * Convoy movement service
 * Handles convoy speed calculation and movement timing based on barrack level
 */

export interface ConvoyMovementConfig {
  barracLevel: number;
  tileCount: number;
}

export interface ConvoyMovementTiming {
  totalDuration: number; // Total time in milliseconds
  timePerTile: number; // Time per tile in milliseconds
  speedMultiplier: number; // Speed multiplier based on level
}

export class ConvoyMovementService {
  /**
   * Base time per tile in milliseconds (at level 1)
   * This is the slowest movement speed
   */
  private static readonly BASE_TIME_PER_TILE = 2000; // 2 seconds per tile at level 1

  /**
   * Maximum speed multiplier (at max level)
   */
  private static readonly MAX_SPEED_MULTIPLIER = 5; // 5x faster at max level

  /**
   * Maximum barrack level for calculation
   */
  private static readonly MAX_BARRACK_LEVEL = 50;

  /**
   * Calculate speed multiplier based on barrack level
   * Formula: 1 + (level - 1) * (MAX_SPEED_MULTIPLIER - 1) / (MAX_BARRACK_LEVEL - 1)
   * This creates a linear progression from 1x at level 1 to MAX_SPEED_MULTIPLIER at max level
   */
  static calculateSpeedMultiplier(barracLevel: number): number {
    if (barracLevel <= 1) return 1;
    if (barracLevel >= this.MAX_BARRACK_LEVEL) return this.MAX_SPEED_MULTIPLIER;

    const progression = (barracLevel - 1) / (this.MAX_BARRACK_LEVEL - 1);
    return 1 + progression * (this.MAX_SPEED_MULTIPLIER - 1);
  }

  /**
   * Calculate time per tile based on barrack level
   * Higher level = faster movement = less time per tile
   */
  static calculateTimePerTile(barracLevel: number): number {
    const speedMultiplier = this.calculateSpeedMultiplier(barracLevel);
    return this.BASE_TIME_PER_TILE / speedMultiplier;
  }

  /**
   * Calculate total movement duration
   */
  static calculateTotalDuration(barracLevel: number, tileCount: number): number {
    const timePerTile = this.calculateTimePerTile(barracLevel);
    return timePerTile * tileCount;
  }

  /**
   * Get complete movement timing configuration
   */
  static getMovementTiming(config: ConvoyMovementConfig): ConvoyMovementTiming {
    const speedMultiplier = this.calculateSpeedMultiplier(config.barracLevel);
    const timePerTile = this.calculateTimePerTile(config.barracLevel);
    const totalDuration = this.calculateTotalDuration(config.barracLevel, config.tileCount);

    return {
      totalDuration,
      timePerTile,
      speedMultiplier,
    };
  }

  /**
   * Calculate progress percentage at a given time
   */
  static getProgressAtTime(timing: ConvoyMovementTiming, elapsedTime: number): number {
    return Math.min(elapsedTime / timing.totalDuration, 1);
  }

  /**
   * Calculate current tile index based on elapsed time
   */
  static getCurrentTileIndex(timing: ConvoyMovementTiming, elapsedTime: number, totalTiles: number): number {
    const progress = this.getProgressAtTime(timing, elapsedTime);
    return Math.floor(progress * (totalTiles - 1));
  }

  /**
   * Get example speeds for different levels (for UI display)
   */
  static getSpeedExamples(): Array<{ level: number; multiplier: number; timePerTile: number }> {
    const examples = [];
    const levels = [1, 10, 20, 30, 40, 50];

    for (const level of levels) {
      examples.push({
        level,
        multiplier: this.calculateSpeedMultiplier(level),
        timePerTile: this.calculateTimePerTile(level),
      });
    }

    return examples;
  }
}
