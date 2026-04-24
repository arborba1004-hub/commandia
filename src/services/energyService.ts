/**
 * Energy Service
 * Manages player energy system with regeneration
 */

interface EnergyConfig {
  maxEnergy: number;
  regenRate: number; // energy per second
  regenInterval: number; // milliseconds between regen ticks
}

const DEFAULT_CONFIG: EnergyConfig = {
  maxEnergy: 100,
  regenRate: 1, // 1 energy per second
  regenInterval: 1000, // 1 second
};

class EnergyService {
  private currentEnergy: number;
  private maxEnergy: number;
  private regenRate: number;
  private regenInterval: number;
  private lastRegenTime: number;
  private regenTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(energy: number) => void> = new Set();

  constructor(config: Partial<EnergyConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    this.maxEnergy = finalConfig.maxEnergy;
    this.currentEnergy = finalConfig.maxEnergy;
    this.regenRate = finalConfig.regenRate;
    this.regenInterval = finalConfig.regenInterval;
    this.lastRegenTime = Date.now();
  }

  /**
   * Get current energy
   */
  getEnergy(): number {
    return this.currentEnergy;
  }

  /**
   * Get max energy
   */
  getMaxEnergy(): number {
    return this.maxEnergy;
  }

  /**
   * Get energy percentage (0-100)
   */
  getEnergyPercent(): number {
    return (this.currentEnergy / this.maxEnergy) * 100;
  }

  /**
   * Use energy
   */
  useEnergy(amount: number): boolean {
    if (this.currentEnergy >= amount) {
      this.currentEnergy -= amount;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Add energy
   */
  addEnergy(amount: number): void {
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);
    this.notifyListeners();
  }

  /**
   * Set energy to specific value
   */
  setEnergy(amount: number): void {
    this.currentEnergy = Math.max(0, Math.min(this.maxEnergy, amount));
    this.notifyListeners();
  }

  /**
   * Start energy regeneration
   */
  startRegen(): void {
    // CRITICAL: Only start regen in browser environment, never during build/SSR
    if (typeof window === 'undefined') return;
    
    if (this.regenTimer) return;

    this.lastRegenTime = Date.now();
    this.regenTimer = setInterval(() => {
      const now = Date.now();
      const timePassed = (now - this.lastRegenTime) / 1000; // convert to seconds
      const energyToAdd = timePassed * this.regenRate;

      if (energyToAdd > 0) {
        this.addEnergy(energyToAdd);
        this.lastRegenTime = now;
      }
    }, this.regenInterval);
  }

  /**
   * Stop energy regeneration
   */
  stopRegen(): void {
    if (this.regenTimer) {
      clearInterval(this.regenTimer);
      this.regenTimer = null;
    }
  }

  /**
   * Subscribe to energy changes
   */
  subscribe(listener: (energy: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentEnergy));
  }

  /**
   * Get time until full energy (in seconds)
   */
  getTimeUntilFull(): number {
    if (this.currentEnergy >= this.maxEnergy) return 0;
    const energyNeeded = this.maxEnergy - this.currentEnergy;
    return energyNeeded / this.regenRate;
  }

  /**
   * Reset energy to max
   */
  reset(): void {
    this.currentEnergy = this.maxEnergy;
    this.notifyListeners();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopRegen();
    this.listeners.clear();
  }
}

export default EnergyService;
