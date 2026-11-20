import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  tone?: 'blue' | 'green';
  children?: React.ReactNode;
  label: string;
}

/**
 * Thick ring with rounded caps. Animates from empty to its value on mount so
 * the card reads as alive rather than printed.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 104,
  stroke = 13,
  tone = 'blue',
  children,
  label,
}) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(clamped);
      return;
    }
    const frame = window.requestAnimationFrame(() => setShown(clamped));
    return () => window.cancelAnimationFrame(frame);
  }, [clamped]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = tone === 'green' ? 'var(--green)' : 'var(--blue)';
  const track = tone === 'green' ? 'var(--green-soft)' : 'var(--blue-soft)';

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 1100ms var(--spring)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};
