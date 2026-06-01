import { useEffect, useRef } from 'react';

export default function SmokeWebGL({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
    });

    if (!gl) return;
    glRef.current = gl;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const vsSource = `
      attribute vec2 aPosition;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aLife;
      varying float vAlpha;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        gl_PointSize = aSize;
        vAlpha = aAlpha * aLife;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float core = smoothstep(0.50, 0.05, dist);
        float feather = smoothstep(0.50, 0.34, dist);
        float alpha = (core * 0.48 + feather * 0.52) * vAlpha;
        gl_FragColor = vec4(0.92, 0.93, 0.98, alpha * 0.72);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    if (!program || !vertexShader || !fragmentShader) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();
    const lifeBuffer = gl.createBuffer();

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aSize = gl.getAttribLocation(program, 'aSize');
    const aAlpha = gl.getAttribLocation(program, 'aAlpha');
    const aLife = gl.getAttribLocation(program, 'aLife');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const PARTICLE_COUNT = 150;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * 2 - 1,
      y: 0.18 + Math.random() * 1.02,
      size: 130 + Math.random() * 260,
      alpha: 0.035 + Math.random() * 0.085,
      speed: 0.0007 + Math.random() * 0.00125,
      sway: (Math.random() - 0.5) * 0.9,
      phase: Math.random() * Math.PI * 2,
      life: 0.55 + Math.random() * 0.45,
    }));

    const updateAndRender = (timestamp: number) => {
      const activeGl = glRef.current;
      if (!activeGl) return;

      activeGl.clearColor(0, 0, 0, 0);
      activeGl.clear(activeGl.COLOR_BUFFER_BIT);

      const positions = new Float32Array(PARTICLE_COUNT * 2);
      const sizes = new Float32Array(PARTICLE_COUNT);
      const alphas = new Float32Array(PARTICLE_COUNT);
      const lives = new Float32Array(PARTICLE_COUNT);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        p.y -= p.speed;
        p.x += Math.sin(timestamp * 0.0005 + p.phase) * p.sway * 0.00105;
        p.life -= 0.00145;

        if (p.life <= 0 || p.y < -0.35) {
          p.x = Math.random() * 2 - 1;
          p.y = 0.35 + Math.random() * 0.9;
          p.life = 0.68 + Math.random() * 0.32;
          p.size = 130 + Math.random() * 260;
        }

        const idx = i * 2;
        positions[idx] = p.x;
        positions[idx + 1] = -p.y;
        sizes[i] = p.size;
        alphas[i] = p.alpha;
        lives[i] = p.life;
      }

      const bindAttribute = (buffer: WebGLBuffer | null, location: number, data: Float32Array, size: number) => {
        if (!buffer || location < 0) return;
        activeGl.bindBuffer(activeGl.ARRAY_BUFFER, buffer);
        activeGl.bufferData(activeGl.ARRAY_BUFFER, data, activeGl.DYNAMIC_DRAW);
        activeGl.enableVertexAttribArray(location);
        activeGl.vertexAttribPointer(location, size, activeGl.FLOAT, false, 0, 0);
      };

      bindAttribute(positionBuffer, aPosition, positions, 2);
      bindAttribute(sizeBuffer, aSize, sizes, 1);
      bindAttribute(alphaBuffer, aAlpha, alphas, 1);
      bindAttribute(lifeBuffer, aLife, lives, 1);

      activeGl.drawArrays(activeGl.POINTS, 0, PARTICLE_COUNT);
      animationRef.current = requestAnimationFrame(updateAndRender);
    };

    animationRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(sizeBuffer);
      gl.deleteBuffer(alphaBuffer);
      gl.deleteBuffer(lifeBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      glRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[12] mix-blend-screen opacity-50 ${className}`}
      style={{ filter: 'blur(12px) contrast(114%)' }}
    />
  );
}
