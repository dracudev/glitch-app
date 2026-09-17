import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  /** Pass a handler to make the rating editable; omit it for a read-only display. */
  onChange?: (value: number) => void;
  max?: number;
  /** Maximum slot width in px. The row shrinks uniformly when the container is
   *  tighter than ten slots, so it never forces its parent wider than it is. */
  size?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * StarRating — the one star renderer in the app, control and display alike.
 *
 * Every surface (game detail, reviews list, review detail, profile, feed, the
 * review form) renders the same geometry: a `border-strong` track with a
 * `primary` overlay clipped to a percentage, so 7.5 is exactly seven and a half
 * stars. Pass `onChange` to get the interactive half-star picker with its value
 * label; omit it for a plain display.
 *
 * The row is width-driven: `size` is a maximum, and the stars shrink together
 * when the parent is too narrow for all of them. Giving it a fixed width would
 * make it the min-content floor of whatever column it sits in, which is how it
 * used to push a card's rating number out past the card's clipped edge.
 */
export default function StarRating({
  value,
  onChange,
  max = 10,
  size = 16,
  disabled = false,
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const effectiveValue = (interactive ? hoverValue : null) ?? value;

  const handleClick = (starIndex: number, half: boolean) => {
    if (disabled) return;
    onChange?.(half ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <div
      className={`flex min-w-0 items-center gap-1 ${className}`.trim()}
      onMouseLeave={interactive ? () => setHoverValue(null) : undefined}
      role={interactive ? 'group' : 'img'}
      aria-label={`Rating: ${value} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const fillPercent = Math.min(100, Math.max(0, (effectiveValue - i) * 100));

        return (
          <span
            key={i}
            className="relative inline-block min-w-0 shrink"
            style={{ width: size, aspectRatio: '1 / 1' }}
          >
            {interactive && (
              <>
                {/* Left half = half step, right half = whole step */}
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 z-10 w-1/2 disabled:cursor-not-allowed"
                  onClick={() => handleClick(i, true)}
                  onMouseEnter={() => setHoverValue(i + 0.5)}
                  disabled={disabled}
                  aria-label={`${i + 0.5} out of ${max}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 z-10 w-1/2 disabled:cursor-not-allowed"
                  onClick={() => handleClick(i, false)}
                  onMouseEnter={() => setHoverValue(i + 1)}
                  disabled={disabled}
                  aria-label={`${i + 1} out of ${max}`}
                />
              </>
            )}

            {/* Track: filled, so a partial star weighs the same as a whole one */}
            <Star
              size={size}
              className="pointer-events-none absolute inset-0 w-full h-full fill-border-strong text-border-strong"
            />
            {/* Value overlay. The glyph fills the slot and the wrapper is clipped
                to a percentage, so a half star is exactly half of the star beside
                it at any slot width. Clipping the wrapper (rather than letting
                the glyph shrink inside it) is what keeps that proportion. */}
            <span
              className="pointer-events-none absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
            >
              <Star size={size} className="w-full h-full fill-primary text-primary" />
            </span>
          </span>
        );
      })}

      {interactive && (
        <span className="ml-2 font-mono text-sm text-muted-foreground">
          {hoverValue ?? value}/{max}
        </span>
      )}
    </div>
  );
}
