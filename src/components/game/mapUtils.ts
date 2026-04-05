// src/components/game/mapUtils.ts
import * as THREE from 'three';

// 1. Função para clarear materiais
export const fixDarkMaterials = (child: any) => {
  if (child.isMesh) {
      child.castShadow = true;
          child.receiveShadow = true;
              if (child.material) {
                    child.material.metalness = 0;
                          child.material.roughness = 0.8;
                                child.material.emissive = new THREE.Color(0x3a220f);
                                      child.material.emissiveIntensity = 0.2;
                                            child.material.needsUpdate = true;
                                                }
                                                  }
                                                  };

                                                  // 2. Função para criar etiquetas de texto
                                                  export function createTextLabel(text: string) {
                                                    const canvas = document.createElement('canvas');
                                                      const context = canvas.getContext('2d');
                                                        if (!context) return new THREE.Group();

                                                          canvas.width = 512;
                                                            canvas.height = 128;
                                                              context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                                                                context.roundRect(0, 0, 512, 128, 20);
                                                                  context.fill();
                                                                    context.font = 'bold 54px Oswald, Impact, Arial';
                                                                      context.textAlign = 'center';
                                                                        context.fillStyle = '#d9b764';
                                                                          context.fillText(text.toUpperCase(), 256, 85);

                                                                            const texture = new THREE.CanvasTexture(canvas);
                                                                              const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
                                                                                const sprite = new THREE.Sprite(spriteMaterial);
                                                                                  sprite.scale.set(3.2, 0.8, 1);
                                                                                    return sprite;
                                                                                    }

                                                                                    // 3. Constantes de Configuração
                                                                                    export const GRID_CONFIG = {
                                                                                      WIDTH: 40,
                                                                                        HEIGHT: 20,
                                                                                          TILE_SIZE: 1,
                                                                                            PLATFORM_Y: 1.2,
                                                                                            };
