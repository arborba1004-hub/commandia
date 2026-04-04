import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;
const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    const highlightGeometry = new THREE.PlaneGeometry(1, 1);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.05;
    highlight.visible = false;

    scene.add(highlight);

    // Player object
    const playerGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff007f });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.castShadow = true;
    player.receiveShadow = true;
    player.position.set(0, 0.4, 0);
    scene.add(player);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 26, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(12, 30, 18);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(1, 1);

    const topMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 1,
      metalness: 0,
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: '#6e5742',
      roughness: 1,
      metalness: 0,
    });

    const platformGeometry = new THREE.BoxGeometry(
      GRID_WIDTH,
      PLATFORM_HEIGHT,
      GRID_HEIGHT
    );

    const platform = new THREE.Mesh(platformGeometry, [
      sideMaterial,
      sideMaterial,
      topMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
    ]);

    platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);

    const gridGroup = new THREE.Group();

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
    });

    for (let x = 0; x <= GRID_WIDTH; x++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - GRID_WIDTH / 2, 0.03, -GRID_HEIGHT / 2),
        new THREE.Vector3(x - GRID_WIDTH / 2, 0.03, GRID_HEIGHT / 2),
      ]);
      gridGroup.add(new THREE.Line(geo, lineMaterial));
    }

    for (let z = 0; z <= GRID_HEIGHT; z++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-GRID_WIDTH / 2, 0.03, z - GRID_HEIGHT / 2),
        new THREE.Vector3(GRID_WIDTH / 2, 0.03, z - GRID_HEIGHT / 2),
      ]);
      gridGroup.add(new THREE.Line(geo, lineMaterial));
    }

    scene.add(gridGroup);

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(platform);

      if (intersects.length > 0) {
        const point = intersects[0].point;

        const tileX = Math.floor(point.x + GRID_WIDTH / 2);
        const tileZ = Math.floor(point.z + GRID_HEIGHT / 2);

        console.log('CLICK NO TILE:', tileX, tileZ);

        highlight.visible = true;
        highlight.position.set(
          tileX - GRID_WIDTH / 2 + 0.5,
          0.05,
          tileZ - GRID_HEIGHT / 2 + 0.5
        );

        player.position.set(
          tileX - GRID_WIDTH / 2 + 0.5,
          0.3,
          tileZ - GRID_HEIGHT / 2 + 0.5
        );
      }
    };

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_WIDTH * 1.4, GRID_HEIGHT * 1.4),
      new THREE.MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0.28,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -PLATFORM_HEIGHT - 0.01, 0);
    scene.add(shadowPlane);

    let animationId = 0;

    const animate = () => {
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      platformGeometry.dispose();
      topMaterial.dispose();
      sideMaterial.dispose();
      lineMaterial.dispose();
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}