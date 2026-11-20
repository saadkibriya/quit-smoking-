import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  onClick?: () => void;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

/**
 * The one surface used across the home screen: frosted, very round, very soft.
 * Tappable cards get the springy press transform from `.home-press`.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  padding = 'p-[18px]',
  onClick,
  ariaLabel,
  style,
}) => {
  const interactive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={style}
      className={`home-glass ${padding} ${interactive ? 'home-press cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
