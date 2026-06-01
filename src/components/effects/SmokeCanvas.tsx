import { useCallback, useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  speed: number;
  sway: number;
  phase: number;
  life: number;
};

export default function SmokeCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const createParticle = useCallback((width: number, height: number): Particle => {
    const baseAlpha = 0.065 + Math.random() * 0.08;
    return {
      x: Math.random() * width,
      y: height * (0.62 + Math.random() * 0.42),
      size: 72 + Math.random() * 148,
      baseAlpha,
      alpha: baseAlpha,
      speed: 0.45 + Math.random() * 0.95,
      sway: Math.random() * 2.4 - 1.2,
      phase: Math.random() * Math.PI * 2,
      life: 0.62 + Math.random() * 0.38,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particlesRef.current = Array.from({ length: 34 }, () => createParticle(window.innerWidth, window.innerHeight));
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastTime = performance.now();

    const animate = (timestamp: number) => {
      const delta = Math.min(timestamp - lastTime, 34);
      lastTime = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        p.y -= p.speed * delta * 0.045;
        p.x += Math.sin(timestamp * 0.00045 + p.phase) * p.sway * delta * 0.015;
        p.life -= 0.00085 * delta;
        p.alpha = Math.max(0, p.baseAlpha * p.life);

        if (p.life <= 0 || p.y < -p.size) Object.assign(p, createParticle(width, height));

        const gradient = ctx.createRadialGradient(p.x, p.y, Math.max(2, p.size * 0.08), p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(248,248,248,${Math.min(0.82, p.alpha * 7)})`);
        gradient.addColorStop(0.48, `rgba(185,185,190,${Math.min(0.22, p.alpha * 2.2)})`);
        gradient.addColorStop(1, 'rgba(45,45,50,0)');

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [createParticle]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[12] mix-blend-screen opacity-55 ${className}`}
      style={{ filter: 'blur(10px) contrast(112%)' }}
    />
  );
}
