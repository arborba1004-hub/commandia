// /src/game/GameEngine.ts

import * as THREE from 'three';
import { mountRealtimeMapPlayersLayer } from '@/components/game/realtimeMapPlayersLayer';
import { getSocket } from '@/socket';

class GameEngine {
  private static instance: GameEngine;

  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;

  playersLayer: any;
  socket: any;
  socketHandlers: Array<{ event: string; handler: any }> = [];

  mounted = false;

  static getInstance() {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  init(container: HTMLElement) {
    if (this.mounted) return;
    this.mounted = true;

    // SCENE
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#050505');

    // CAMERA
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);

    // RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // PLAYERS LAYER (uma vez só)
    this.playersLayer = mountRealtimeMapPlayersLayer({
      scene: this.scene,
      gridWidth: 120,
      gridHeight: 120,
      tileSize: 1,
      pollingMs: 10000,
      showSpaces: true,
    });

    this.playersLayer.start();

    // SOCKET
    try {
      if (typeof window !== 'undefined') {
        this.socket = getSocket();
        this.bindSocket();
      }
    } catch {
      // Socket unavailable during SSR/build
    }

    this.animate();
  }

  bindSocket() {
    if (!this.socket) return;
    
    const handleMapSnapshot = async (players: any[]) => {
      this.playersLayer.clearAllPlayers();

      for (const p of players) {
        await this.playersLayer.upsertPlayer({
          id: String(p.id),
          name: p.name,
          tileX: p.tileX,
          tileY: p.tileY,
        });
      }
    };

    const handlePlayerJoined = (p: any) => {
      this.playersLayer.upsertPlayer({
        id: String(p.id),
        name: p.name,
        tileX: p.tileX,
        tileY: p.tileY,
      });
    };

    const handlePlayerLeft = (p: any) => {
      this.playersLayer.removePlayer?.(String(p.playerId));
    };

    this.socket.on('mapSnapshot', handleMapSnapshot);
    this.socket.on('playerJoined', handlePlayerJoined);
    this.socket.on('playerLeft', handlePlayerLeft);

    // Store handlers for cleanup
    this.socketHandlers = [
      { event: 'mapSnapshot', handler: handleMapSnapshot },
      { event: 'playerJoined', handler: handlePlayerJoined },
      { event: 'playerLeft', handler: handlePlayerLeft },
    ];
  }

  // Pure animation loop - no side effects, only rendering
  // Separated concerns: scheduling is pure, rendering is pure
  private frameId: number | null = null;

  private scheduleNextFrame = (callback: FrameRequestCallback): void => {
    this.frameId = requestAnimationFrame(callback);
  };

  private createRenderFrame = (): FrameRequestCallback => {
    // Pure function that creates a frame renderer
    // Returns a function with no side effects except rendering
    return () => {
      // Pure render operation - no state mutations
      this.renderer.render(this.scene, this.camera);
      // Schedule next frame (side effect isolated to scheduling)
      this.scheduleNextFrame(this.createRenderFrame());
    };
  };

  animate = (): void => {
    // Initiate the pure animation loop
    this.scheduleNextFrame(this.createRenderFrame());
  };

  destroy() {
    if (!this.mounted) return;

    // Cancel animation frame to stop the pure loop
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    // Remove socket listeners before cleanup
    if (this.socket) {
      this.socketHandlers.forEach(({ event, handler }) => {
        try {
          this.socket.off(event, handler);
        } catch (e) {
          console.warn(`Failed to remove listener for ${event}:`, e);
        }
      });
      this.socketHandlers = [];
    }

    this.playersLayer.cleanup();
    this.renderer.dispose();

    this.mounted = false;
  }
}

export const gameEngine = GameEngine.getInstance();