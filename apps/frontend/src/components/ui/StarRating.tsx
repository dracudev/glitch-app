import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
}

/**
 * StarRating — the one rating control in the app.
 *
 * Filled stars use the brand primary so a rating reads the same colour
 * everywhere (previously purple here, yellow in GameCard, green in ReviewCard).
 * Unfilled stars use the strong border token so the track is visible without
 * being mistaken for ink.
 */
export default function StarRating({
  value,
  onChange,
  max = 10,
  size = 28,
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const effectiveValue = hoverValue ?? value;

  const handleClick = (starIndex: number, half: boolean) => {
    if (disabled) return;
    onChange(half ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      onMouseLeave={() => setHoverValue(null)}
      role="group"
      aria-label={`Rating: ${value} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const fillPercent = Math.min(100, Math.max(0, (effectiveValue - i) * 100));

        return (
          <span
            key={i}
            className="relative inline-block shrink-0"
            style={{ width: size, height: size }}
          >
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

            {/* Track: filled, so a partial star weighs the same as a whole one */}
            <Star
              size={size}
              className="pointer-events-none absolute inset-0 fill-border-strong text-border-strong"
            />
            {/* Value overlay, clipped to a percentage. The star keeps its full
                size and is cropped by the wrapper — `max-w-none` defeats the
                base `svg { max-width: 100% }` rule, which would otherwise shrink
                a half star to half size instead of showing half of a full one. */}
            <span
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star size={size} className="max-w-none fill-primary text-primary" />
            </span>
          </span>
        );
      })}

      <span className="ml-2 font-mono text-sm text-muted-foreground">
        {hoverValue ?? value}/{max}
      </span>
    </div>
  );
}
