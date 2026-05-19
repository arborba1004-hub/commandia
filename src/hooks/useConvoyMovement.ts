/**
 * Hook for managing convoy movement animation and state
 */

import { useEffect, useRef, useCallback } from 'react';
import { useConvoyStore, ConvoyMovement } from '@/store/convoyStore';
import { ConvoyMovementService } from '@/services/convoyMovementService';

export interface UseConvoyMovementOptions {
  convoyId: string;
  onArrived?: (convoy: ConvoyMovement) => void;
  onCancelled?: (convoy: ConvoyMovement) => void;
}

export function useConvoyMovement(options: UseConvoyMovementOptions) {
  const { convoyId, onArrived, onCancelled } = options;
  const animationFrameRef = useRef<number | null>(null);
  const { getConvoy, updateConvoy } = useConvoyStore();

  const updateConvoyProgress = useCallback(() => {
    const convoy = getConvoy(convoyId);
    if (!convoy || convoy.status !== 'moving') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const elapsedTime = Date.now() - convoy.startTime;
    const progress = Math.min(elapsedTime / convoy.totalDuration, 1);
    const currentTileIndex = Math.floor(progress * (convoy.path.length - 1));

    // Update convoy progress
    updateConvoy(convoyId, {
      currentProgress: progress,
      currentTileIndex,
    });

    // Check if arrived
    if (progress >= 1) {
      updateConvoy(convoyId, {
        status: 'arrived',
        currentProgress: 1,
        currentTileIndex: convoy.path.length - 1,
      });

      if (onArrived) {
        const updatedConvoy = getConvoy(convoyId);
        if (updatedConvoy) {
          onArrived(updatedConvoy);
        }
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(updateConvoyProgress);
  }, [convoyId, getConvoy, updateConvoy, onArrived]);

  useEffect(() => {
    const convoy = getConvoy(convoyId);
    if (!convoy) return;

    if (convoy.status === 'moving') {
      animationFrameRef.current = requestAnimationFrame(updateConvoyProgress);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [convoyId, getConvoy, updateConvoyProgress]);

  const cancelConvoy = useCallback(() => {
    const convoy = getConvoy(convoyId);
    if (!convoy) return;

    updateConvoy(convoyId, { status: 'cancelled' });

    if (onCancelled) {
      onCancelled(convoy);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [convoyId, getConvoy, updateConvoy, onCancelled]);

  return {
    convoy: getConvoy(convoyId),
    cancelConvoy,
  };
}
