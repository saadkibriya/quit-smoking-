import React from 'react';

interface BubbleStatProps {
  label: string;
  value: number;
  /** 0..1 — decides the big bubble's diameter relative to the week total. */
  ratio: number;
  tone?: 'green' | 'blue';
  delayMs?: number;
  caption: string;
}

/**
 * Two bubbles: the small one is today, the big one is this week. The sizes are
 * proportional, so you feel the volume before you read the numbers.
 */
export const BubbleStat: React.FC<BubbleStatProps> = ({
  label,
  value,
  ratio,
  tone = 'blue',
  delayMs = 0,
  caption,
}) => {
  const size = 28 + Math.round(Math.min(1, Math.max(0.18, ratio)) * 40);
  const color = tone === 'green' ? 'var(--green)' : 'var(--blue)';
  const soft = tone === 'green' ? 'var(--green-soft)' : 'var(--blue-soft)';

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="home-label">{label}</span>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: soft }} aria-hidden="true" />
      </div>

      <div className="my-2 flex flex-1 items-center justify-center gap-2">
        <span
          className="rounded-full"
          style={{
            width: 16,
            height: 16,
            background: soft,
            animation: `home-float 5.2s ease-in-out ${delayMs}ms infinite`,
          }}
          aria-hidden="true"
        />
        <span
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85), ${color} 62%)`,
            boxShadow: `0 10px 24px ${color}33`,
            animation: `home-float 6.6s ease-in-out ${delayMs + 400}ms infinite`,
          }}
          aria-hidden="true"
        />
      </div>

      <div>
        <div className="home-num text-[30px]">{value}</div>
        <div className="home-body mt-0.5 text-[11px] font-bold">{caption}</div>
      </div>
    </div>
  );
};
