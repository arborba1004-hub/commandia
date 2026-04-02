import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { WEAPONS, Weapon } from '@/data/armas';
import * as THREE from 'three';

const FILTER_COLORS: Record<string, string> = {
  'branco': '#FFFFFF',
  'cinza leve': '#D3D3D3',
  'cinza escuro': '#555555',
  'marrom': '#8B4513',
  'verde militar': '#556B2F',
  'preto': '#000000',
  'preto neon': '#00FF00',
  'prata': '#C0C0C0',
  'bronze metálico': '#CD7F32',
  'dourado': '#FFD700',
  'dourado neon': '#FFFF00',
};

const FILTER_DESCRIPTIONS: Record<string, string> = {
  'branco': 'Iniciante',
  'cinza leve': 'Simples',
  'cinza escuro': 'Médio',
  'marrom': 'Top',
  'verde militar': 'Militar',
  'preto': 'Profissional',
  'preto neon': 'Ultra',
  'prata': 'Max',
  'bronze metálico': 'Lendário',
  'dourado': 'Domínio',
  'dourado neon': 'Comando',
};

export default function ArmasPage() {
  const player = usePlayerStore((state) => state.player);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  const playerLevel = player.niveis?.playerLevel || 1;
  const currentWeapon = WEAPONS[playerLevel - 1] || WEAPONS[0];
  const filterColor = FILTER_COLORS[currentWeapon.filter] || '#FFFFFF';
  const filterDescription = FILTER_DESCRIPTIONS[currentWeapon.filter] || 'Desconhecido';

  // Inicializar cena 3D
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1.2);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.8);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Load model
    const loader = new THREE.GLTFLoader();

    loader.load(
      currentWeapon.glb,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        scene.add(model);

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;
        model.scale.multiplyScalar(scale);

        // Apply color filter to model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const colorHex = filterColor.replace('#', '0x');
            child.material.color.setHex(parseInt(colorHex));
            child.material.emissive.setHex(parseInt(colorHex));
            child.material.emissiveIntensity = 0.3;
          }
        });
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (modelRef.current) {
        modelRef.current.rotation.x += 0.005;
        modelRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentWeapon.glb, filterColor]);

  return (
    <div className="w-full min-h-screen bg-black flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 max-w-[100rem] mx-auto w-full">
        {/* 3D Model Container */}
        <div className="flex-1 min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-zinc-900 to-black">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{
              filter: `drop-shadow(0 0 20px ${filterColor}80)`,
            }}
          />
        </div>

        {/* Info Container */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          {/* Weapon Info */}
          <div className="space-y-6">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Arma Atual</p>
              <h1 className="text-5xl font-bold text-white mb-2">{currentWeapon.name}</h1>
              <p className="text-gray-400 text-lg">Nível {currentWeapon.level}</p>
            </div>

            {/* Filter Badge */}
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 w-fit"
              style={{
                borderColor: filterColor,
                backgroundColor: `${filterColor}15`,
              }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: filterColor }}
              />
              <span className="font-semibold text-white">{filterDescription}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-gray-400 text-sm mb-1">Ataque</p>
                <p className="text-3xl font-bold text-green-400">+{currentWeapon.attackBonus}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <p className="text-gray-400 text-sm mb-1">Defesa</p>
                <p className="text-3xl font-bold text-blue-400">+{currentWeapon.defenseBonus}</p>
              </div>
            </div>

            {/* Category */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700">
              <p className="text-gray-400 text-sm mb-1">Tipo</p>
              <p className="text-xl font-semibold text-white capitalize">{currentWeapon.category.replace('_', ' ')}</p>
            </div>

            {/* Price */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-gray-400 text-sm mb-1">Preço</p>
              <p className="text-3xl font-bold text-primary">
                R$ {currentWeapon.price.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => navigate('/arsenal')}
              className="flex-1 py-4 px-6 bg-primary text-black font-bold text-lg rounded-xl hover:bg-pink-500 active:scale-95 transition-all"
            >
              Ir para Arsenal
            </button>
            <button
              onClick={() => navigate('/game')}
              className="flex-1 py-4 px-6 bg-zinc-800 text-white font-bold text-lg rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
