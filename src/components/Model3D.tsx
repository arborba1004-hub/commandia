import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Model3DProps {
  modelUrl: string;
}

export function Model3D({ modelUrl }: Model3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    renderer.setPixelRatio(
      isMobile
        ? 1
        : Math.min(window.devicePixelRatio, 1.5)
    );
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Load model
    const loader = new GLTFLoader();
    let model: THREE.Group | null = null;

    loader.load(
      modelUrl,
      (gltf) => {
        model = gltf.scene;
        scene.add(model);

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;
        model.scale.multiplyScalar(scale);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (model) {
        model.rotation.x += 0.005;
        model.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl]);

  return <div ref={containerRef} className="w-full h-full" />;
}
