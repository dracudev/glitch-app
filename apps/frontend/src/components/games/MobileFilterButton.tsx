import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileFilterButtonProps {
  onClick: () => void;
  activeFilterCount: number;
}

export default function MobileFilterButton({
  onClick,
  activeFilterCount,
}: MobileFilterButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      fullWidth
      className="justify-center"
      aria-label={`Open filters ${activeFilterCount > 0 ? `(${activeFilterCount} active)` : ''}`}
    >
      <Filter className="size-4" aria-hidden="true" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );
}
