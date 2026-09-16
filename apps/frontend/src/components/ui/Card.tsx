import * as React from 'react';

const surfaceStyles = {
  /** Page-level panel. No shadow — depth comes from the surface tone. */
  flat: 'bg-card border border-border',
  /** Floating panel that genuinely sits above the page. */
  raised: 'bg-card border border-border shadow-md',
  /** Same as flat, but reacts to a hovered/focused child link. */
  interactive: 'bg-card border border-border interactive-surface hover:border-border-hover',
} as const;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof surfaceStyles;
}

/**
 * Card — the one surface primitive.
 *
 * Every card in the app is this: a raised surface, a single hairline border, no
 * default shadow bloom. Depth comes from surface tone and radius, not from a
 * symmetric shadow on every box.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'flat', ...props }, ref) => (
    <div
      ref={ref}
      className={[surfaceStyles[variant], 'rounded-lg', className || ''].filter(Boolean).join(' ')}
      {...props}
    />
  ),
);

Card.displayName = 'Card';

export { Card };

export default Card;
