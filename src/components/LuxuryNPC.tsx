import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  onNPCLoaded?: () => void;
}

export default function LuxuryNPC({ onNPCLoaded }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();

    // 🚨 FUNDAMENTAL (corrige fundo preto)
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      35,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );

    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );

    renderer.setPixelRatio(window.devicePixelRatio);

    mountRef.current.appendChild(renderer.domElement);

    // 🔥 placeholder até você usar seu GLB
    const geometry = new THREE.PlaneGeometry(2, 3);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });

    const npc = new THREE.Mesh(geometry, material);
    scene.add(npc);

    // 🔥 animação de entrada (vem do fundo)
    let progress = 0;

    function animate() {
      requestAnimationFrame(animate);

      progress += 0.01;

      if (progress < 1) {
        npc.position.y = -2 + progress * 2;
        npc.material.opacity = progress;
        npc.scale.setScalar(0.6 + progress * 0.4);
      }

      // idle leve
      npc.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;

      renderer.render(scene, camera);
    }

    animate();

    setTimeout(() => {
      onNPCLoaded?.();
    }, 800);

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}