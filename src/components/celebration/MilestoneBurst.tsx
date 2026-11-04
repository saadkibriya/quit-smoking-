import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  shape: 'circle' | 'square' | 'diamond';
  rotation: number;
  vRot: number;
  opacity: number;
}

interface MilestoneBurstProps {
  active: boolean;
  onComplete?: () => void;
  message?: string;
}

export const MilestoneBurst: React.FC<MilestoneBurstProps> = ({ active, onComplete, message }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Spawn 28 monochrome particles
    const initial: Particle[] = Array.from({ length: 28 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 7;
      const shapes: Array<'circle' | 'square' | 'diamond'> = ['circle', 'square', 'diamond'];
      return {
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 8 + Math.random() * 10,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 16,
        opacity: 1,
      };
    });

    setParticles(initial);

    let frameId: number;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      if (elapsed > 1200) {
        setParticles([]);
        onComplete?.();
        return;
      }

      const progress = elapsed / 1200;
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy + 0.18, // slight gravity
          rotation: p.rotation + p.vRot,
          opacity: Math.max(0, 1 - progress * 1.1),
        }))
      );

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [active]);

  if (!active && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {message && (
        <div className="absolute top-1/3 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide shadow-2xl transition-transform animate-in fade-in zoom-in-95 duration-200">
          {message}
        </div>
      )}
      {particles.map((p) => {
        let shapeClass = 'rounded-none';
        if (p.shape === 'circle') shapeClass = 'rounded-full';
        else if (p.shape === 'diamond') shapeClass = 'rotate-45';

        return (
          <div
            key={p.id}
            className={`absolute bg-black dark:bg-white border border-neutral-300 dark:border-neutral-700 ${shapeClass}`}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
              transition: 'none',
            }}
          />
        );
      })}
    </div>
  );
};
