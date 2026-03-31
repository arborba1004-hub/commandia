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

    // Generate bubbles
    const newBubbles: Bubble[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 80 - 40, // -40% to 40% from center
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 0.5,
      size: 8 + Math.random() * 16, // 8px to 24px
    }));

    // Generate foam particles
    const newFoamParticles: FoamParticle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 - 50,
      delay: Math.random() * 0.2,
      duration: 2 + Math.random() * 0.3,
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
              times: [0, 0.1, 0.8, 1],
            }}
          />
        ))}
      </div>

      {/* Foam Drip Container */}
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
              y: window.innerHeight + 100,
              x: particle.left,
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeIn',
              times: [0, 0.1, 0.8, 1],
            }}
          />
        ))}
      </div>

      {/* Foam Layer Effect - Flowing Down */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          left: `${buttonCenterX - 60}px`,
          top: `${buttonCenterY}px`,
          width: '120px',
          height: '200px',
          background: `linear-gradient(to bottom, 
            rgba(255, 255, 255, 0.6) 0%,
            rgba(255, 255, 255, 0.4) 30%,
            rgba(255, 255, 255, 0.2) 60%,
            rgba(255, 255, 255, 0) 100%)`,
          borderRadius: '50% 50% 40% 40%',
          filter: 'blur(2px)',
        }}
        initial={{
          opacity: 0,
          y: 0,
          scaleY: 0.5,
        }}
        animate={{
          opacity: [0, 0.7, 0.5, 0],
          y: window.innerHeight + 200,
          scaleY: [0.5, 1, 1, 0.8],
        }}
        transition={{
          duration: 2,
          ease: 'easeIn',
          times: [0, 0.1, 0.7, 1],
        }}
      />

      {/* Shimmer Effect on Foam */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          left: `${buttonCenterX - 50}px`,
          top: `${buttonCenterY}px`,
          width: '100px',
          height: '150px',
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%)`,
          borderRadius: '50%',
        }}
        initial={{
          opacity: 0,
          y: 0,
        }}
        animate={{
          opacity: [0, 0.6, 0],
          y: window.innerHeight + 150,
        }}
        transition={{
          duration: 2,
          delay: 0.1,
          ease: 'easeIn',
        }}
      />
    </>
  );
}
