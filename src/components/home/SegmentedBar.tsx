import React, { useEffect, useState } from 'react';

interface SegmentedBarProps {
  value: number;
  max: number;
  tone?: 'green' | 'blue';
  blocks?: number;
  /** Stagger the fill animation when several bars load together. */
  delayMs?: number;
  label: string;
}

/**
 * A bar made of chunky rounded blocks rather than a smooth rectangle — the
 * squishy, hand-made feel of the reference without losing the data density.
 */
export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  value,
  max,
  tone = 'green',
  blocks = 9,
  delayMs = 0,
  label,
}) => {
  const target = Math.max(0, Math.min(blocks, Math.round((value / Math.max(1, max)) * blocks)));
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFilled(target);
      return;
    }
    const timeout = window.setTimeout(() => setFilled(target), 220 + delayMs);
    return () => window.clearTimeout(timeout);
  }, [target, delayMs]);

  const color = tone === 'green' ? 'var(--green)' : 'var(--blue)';
  const soft = tone === 'green' ? 'var(--green-soft)' : 'var(--blue-soft)';

  return (
    <div className="flex items-end gap-[3px]" role="img" aria-label={`${label}: ${value} of ${max}`}>
      {Array.from({ length: blocks }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <span
            key={i}
            className="h-4 flex-1 rounded-full transition-colors duration-500"
            style={{
              background: isFilled ? color : soft,
              transitionDelay: `${i * 35}ms`,
              transform: i % 2 === 0 ? 'translateY(0)' : 'translateY(-2px)',
            }}
          />
        );
      })}
    </div>
  );
};
