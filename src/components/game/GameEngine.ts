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
    
    this.socket.on('mapSnapshot', async (players: any[]) => {
      this.playersLayer.clearAllPlayers();

      for (const p of players) {
        await this.playersLayer.upsertPlayer({
          id: String(p.id),
          name: p.name,
          tileX: p.tileX,
          tileY: p.tileY,
        });
      }
    });

    this.socket.on('playerJoined', (p: any) => {
      this.playersLayer.upsertPlayer({
        id: String(p.id),
        name: p.name,
        tileX: p.tileX,
        tileY: p.tileY,
      });
    });

    this.socket.on('playerLeft', (p: any) => {
      this.playersLayer.removePlayer?.(String(p.playerId));
    });
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    if (!this.mounted) return;

    this.playersLayer.cleanup();
    this.renderer.dispose();

    this.mounted = false;
  }
}

export const gameEngine = GameEngine.getInstance();