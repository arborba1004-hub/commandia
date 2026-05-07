import { useEffect, useState } from 'react';

interface GPUInfo {
  renderer: string;
  isWeakGPU: boolean;
  vendor: string;
}

export function useGPUDetection(): GPUInfo {
  const [gpuInfo, setGpuInfo] = useState<GPUInfo>({
    renderer: '',
    isWeakGPU: false,
    vendor: '',
  });

  useEffect(() => {
    try {
      // Create a temporary canvas to get WebGL context
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

      if (!gl) {
        setGpuInfo({
          renderer: 'WebGL not supported',
          isWeakGPU: true,
          vendor: 'Unknown',
        });
        return;
      }

      // Get GPU renderer info
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : '';

      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : '';

      // Check for weak GPU patterns
      const weakGPUPatterns = /Mali|Adreno 5|PowerVR|Tegra|Apple A[0-9]|Intel HD|Intel UHD/i;
      const isWeakGPU = weakGPUPatterns.test(gpu);

      setGpuInfo({
        renderer: gpu || 'Unknown',
        isWeakGPU,
        vendor: vendor || 'Unknown',
      });

      // Log GPU info for debugging
      console.log('GPU Detection:', {
        renderer: gpu,
        vendor: vendor,
        isWeakGPU,
      });
    } catch (error) {
      console.error('Error detecting GPU:', error);
      setGpuInfo({
        renderer: 'Error detecting GPU',
        isWeakGPU: true,
        vendor: 'Unknown',
      });
    }
  }, []);

  return gpuInfo;
}

/**
 * Get GPU detection info synchronously (for use outside React components)
 */
export function getGPUInfo(): GPUInfo {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

    if (!gl) {
      return {
        renderer: 'WebGL not supported',
        isWeakGPU: true,
        vendor: 'Unknown',
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : '';

    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : '';

    const weakGPUPatterns = /Mali|Adreno 5|PowerVR|Tegra|Apple A[0-9]|Intel HD|Intel UHD/i;
    const isWeakGPU = weakGPUPatterns.test(gpu);

    return {
      renderer: gpu || 'Unknown',
      isWeakGPU,
      vendor: vendor || 'Unknown',
    };
  } catch (error) {
    console.error('Error detecting GPU:', error);
    return {
      renderer: 'Error detecting GPU',
      isWeakGPU: true,
      vendor: 'Unknown',
    };
  }
}
