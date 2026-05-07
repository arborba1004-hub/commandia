import { getGPUInfo } from '@/hooks/useGPUDetection';

export interface PerformanceSettings {
  maxParticles: number;
  maxAnimations: number;
  textureQuality: 'low' | 'medium' | 'high';
  shadowQuality: 'off' | 'low' | 'high';
  effectsEnabled: boolean;
  animationFrameRate: number;
  enablePostProcessing: boolean;
}

/**
 * Get optimized performance settings based on GPU capabilities
 */
export function getOptimizedSettings(): PerformanceSettings {
  const gpuInfo = getGPUInfo();

  // Default settings for strong GPUs
  const defaultSettings: PerformanceSettings = {
    maxParticles: 5000,
    maxAnimations: 100,
    textureQuality: 'high',
    shadowQuality: 'high',
    effectsEnabled: true,
    animationFrameRate: 60,
    enablePostProcessing: true,
  };

  // Reduced settings for weak GPUs
  const weakGPUSettings: PerformanceSettings = {
    maxParticles: 500,
    maxAnimations: 20,
    textureQuality: 'low',
    shadowQuality: 'off',
    effectsEnabled: false,
    animationFrameRate: 30,
    enablePostProcessing: false,
  };

  // Return appropriate settings based on GPU detection
  return gpuInfo.isWeakGPU ? weakGPUSettings : defaultSettings;
}

/**
 * Apply GPU optimization settings to the document
 */
export function applyGPUOptimizations(): void {
  const settings = getOptimizedSettings();
  const gpuInfo = getGPUInfo();

  // Store settings in window for global access
  (window as any).__GPU_SETTINGS__ = settings;
  (window as any).__GPU_INFO__ = gpuInfo;

  // Apply CSS variables for performance
  const root = document.documentElement;
  root.style.setProperty('--gpu-weak', gpuInfo.isWeakGPU ? '1' : '0');
  root.style.setProperty('--animation-frame-rate', `${settings.animationFrameRate}ms`);

  // Log optimization info
  console.log('GPU Optimization Applied:', {
    gpu: gpuInfo.renderer,
    isWeakGPU: gpuInfo.isWeakGPU,
    settings,
  });

  // Disable heavy animations on weak GPUs
  if (gpuInfo.isWeakGPU) {
    // Disable smooth scrolling
    document.documentElement.style.scrollBehavior = 'auto';

    // Reduce animation complexity
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.3s !important;
        transition-duration: 0.2s !important;
      }
      @media (prefers-reduced-motion: no-preference) {
        * {
          animation-timing-function: linear !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Check if GPU is weak
 */
export function isWeakGPU(): boolean {
  return getGPUInfo().isWeakGPU;
}

/**
 * Get GPU renderer name
 */
export function getGPURenderer(): string {
  return getGPUInfo().renderer;
}
