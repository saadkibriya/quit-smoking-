import React from 'react';

interface DotArchProps {
  /** 0..1 — how much of the arc is filled, growing left (green) to right (blue). */
  progress: number;
  /** Curved caption that follows the outside of the arch. */
  caption: string;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  t: number; // 0 = far left, 1 = far right
  index: number;
}

const CX = 180;
const CY = 238;
const ROWS = [
  { radius: 104, count: 15, dot: 4.6 },
  { radius: 128, count: 21, dot: 5.7 },
  { radius: 152, count: 27, dot: 6.6 },
];

/**
 * Dots placed with trigonometry on three concentric semicircles. Reading order
 * runs left to right so the fill sweeps like a clock hand, and the colour flips
 * at the apex: green before, blue after.
 */
function buildDots(): Dot[] {
  const dots: Dot[] = [];
  let index = 0;

  for (const row of ROWS) {
    for (let i = 0; i < row.count; i++) {
      const t = row.count === 1 ? 0.5 : i / (row.count - 1);
      const angle = Math.PI * (1 - t); // PI (left) → 0 (right)
      dots.push({
        t,
        index: index++,
        r: row.dot,
        x: CX + row.radius * Math.cos(angle),
        y: CY - row.radius * Math.sin(angle),
      });
    }
  }

  return dots;
}

const DOTS = buildDots();

export const DotArch: React.FC<DotArchProps> = ({ progress, caption }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const textRadius = 173;

  return (
    <div className="relative w-full" style={{ aspectRatio: '360 / 256' }}>
      <svg
        viewBox="0 0 360 256"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`${Math.round(clamped * 100)} percent of the way to your next milestone`}
      >
        <defs>
          <path
            id="home-arch-caption"
            d={`M ${CX - textRadius} ${CY} A ${textRadius} ${textRadius} 0 0 1 ${CX + textRadius} ${CY}`}
            fill="none"
          />
        </defs>

        <text fill="var(--muted)" fontSize="9.5" fontWeight="800" letterSpacing="2.6">
          <textPath href="#home-arch-caption" startOffset="50%" textAnchor="middle">
            {caption}
          </textPath>
        </text>

        {DOTS.map((dot) => {
          const filled = dot.t <= clamped;
          const color = dot.t < 0.5 ? 'var(--green)' : 'var(--blue)';
          return (
            <circle
              key={dot.index}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill={filled ? color : 'rgba(11, 27, 43, 0.1)'}
            />
          );
        })}
      </svg>
    </div>
  );
};
