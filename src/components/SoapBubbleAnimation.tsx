import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Bubble {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

interface FoamParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

interface SoapBubbleAnimationProps {
  isAnimating: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function SoapBubbleAnimation({ isAnimating, buttonRef }: SoapBubbleAnimationProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [foamParticles, setFoamParticles] = useState<FoamParticle[]>([]);

  useEffect(() => {
    if (!isAnimating) {
      setBubbles([]);
      setFoamParticles([]);
      return;
    }

    // Generate bubbles - MUCH MORE DENSE with slower animation
    const newBubbles: Bubble[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 400 - 200, // -200% to 200% from center for much wider spread
      delay: Math.random() * 1.2,
      duration: 8 + Math.random() * 2, // 8-10 seconds - much slower
      size: 4 + Math.random() * 32, // 4px to 36px - more variety
    }));

    // Generate foam particles - MUCH MORE DENSE with slower animation
    const newFoamParticles: FoamParticle[] = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      left: Math.random() * 300 - 150,
      delay: Math.random() * 1,
      duration: 8 + Math.random() * 1.5, // 8-9.5 seconds - much slower
    }));

    setBubbles(newBubbles);
    setFoamParticles(newFoamParticles);
  }, [isAnimating]);

  if (!isAnimating || !buttonRef.current) return null;

  const buttonRect = buttonRef.current.getBoundingClientRect();
  const buttonCenterX = buttonRect.left + buttonRect.width / 2;
  const buttonCenterY = buttonRect.top + buttonRect.height / 2;

  return (
    <>
      {/* Bubbles Container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {bubbles.map((bubble) => (
          <motion.div
            key={`bubble-${bubble.id}`}
            className="absolute rounded-full"
            style={{
              left: `${buttonCenterX}px`,
              top: `${buttonCenterY}px`,
              width: bubble.size,
              height: bubble.size,
              background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(200, 230, 255, 0.4), rgba(100, 150, 200, 0.1))`,
              boxShadow: `
                inset -2px -2px 5px rgba(0, 0, 0, 0.2),
                inset 2px 2px 5px rgba(255, 255, 255, 0.6),
                0 0 ${bubble.size * 0.5}px rgba(100, 150, 255, 0.4)
              `,
              filter: 'drop-shadow(0 0 8px rgba(100, 150, 255, 0.3))',
            }}
            initial={{
              opacity: 0,
              y: 0,
              x: 0,
              scale: 0.3,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -window.innerHeight - 100,
              x: bubble.left,
              scale: [0.3, 1, 1, 0.8],
              rotateZ: Math.random() * 360,
            }}
            transition={{
              duration: bubble.duration,
              delay: bubble.delay,
              ease: 'easeOut',
              times: [0, 0.05, 0.85, 1],
            }}
          />
        ))}
      </div>

      {/* Foam Drip Container - Rising Up */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {foamParticles.map((particle) => (
          <motion.div
            key={`foam-${particle.id}`}
            className="absolute"
            style={{
              left: `${buttonCenterX}px`,
              top: `${buttonCenterY}px`,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 0 4px rgba(200, 230, 255, 0.6)',
              filter: 'drop-shadow(0 0 3px rgba(100, 150, 255, 0.4))',
            }}
            initial={{
              opacity: 0,
              y: 0,
              x: 0,
            }}
            animate={{
              opacity: [0, 1, 0.8, 0],
              y: -window.innerHeight - 100,
              x: particle.left,
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeOut',
              times: [0, 0.05, 0.85, 1],
            }}
          />
        ))}
      </div>

      {/* Foam Layer Effect - Flowing Up */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          left: `${buttonCenterX - 200}px`,
          top: `${buttonCenterY}px`,
          width: '400px',
          height: '500px',
          background: `linear-gradient(to top, 
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.6) 25%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            rgba(255, 255, 255, 0) 100%)`,
          borderRadius: '50% 50% 40% 40%',
          filter: 'blur(3px)',
        }}
        initial={{
          opacity: 0,
          y: 0,
          scaleY: 0.3,
          scaleX: 0.5,
        }}
        animate={{
          opacity: [0, 0.9, 0.7, 0],
          y: -window.innerHeight - 300,
          scaleY: [0.3, 1.2, 1, 0.9],
          scaleX: [0.5, 1, 1, 0.8],
        }}
        transition={{
          duration: 8,
          ease: 'easeOut',
          times: [0, 0.08, 0.75, 1],
        }}
      />

      {/* Shimmer Effect on Foam - Rising Up */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          left: `${buttonCenterX - 160}px`,
          top: `${buttonCenterY}px`,
          width: '320px',
          height: '400px',
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%)`,
          borderRadius: '50%',
        }}
        initial={{
          opacity: 0,
          y: 0,
        }}
        animate={{
          opacity: [0, 0.7, 0],
          y: -window.innerHeight - 250,
        }}
        transition={{
          duration: 8,
          delay: 0.1,
          ease: 'easeOut',
        }}
      />
    </>
  );
}
