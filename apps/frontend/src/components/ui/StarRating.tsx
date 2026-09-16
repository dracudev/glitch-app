import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
}

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
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverValue(null)}
      aria-label={`Rating: ${value} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const fillPercent = Math.min(100, Math.max(0, (effectiveValue - i) * 100));

        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            {/* Left half click zone (0.5 step) */}
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
              style={disabled ? { cursor: 'not-allowed' } : undefined}
              onClick={() => handleClick(i, true)}
              onMouseEnter={() => setHoverValue(i + 0.5)}
              disabled={disabled}
              aria-label={`${i + 0.5} stars`}
            />
            {/* Right half click zone (1.0 step) */}
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
              style={disabled ? { cursor: 'not-allowed' } : undefined}
              onClick={() => handleClick(i, false)}
              onMouseEnter={() => setHoverValue(i + 1)}
              disabled={disabled}
              aria-label={`${i + 1} stars`}
            />

            {/* Star background (outline) */}
            <Star
              size={size}
              className="absolute inset-0 text-[var(--text-muted)] pointer-events-none"
            />
            {/* Star fill overlay (clipped to percentage) */}
            <span
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${fillPercent}%` }}
            >
              <Star
                size={size}
                className="fill-[var(--brand-primary)] text-[var(--brand-primary)]"
              />
            </span>
          </span>
        );
      })}
      <span className="ml-2 text-sm font-medium text-[var(--text-secondary)]">
        {hoverValue ?? value}/{max}
      </span>
    </div>
  );
}
