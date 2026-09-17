import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { fieldStyles } from '@/components/ui/Input';

/**
 * Select — the single dropdown contract.
 *
 * Trigger, popover and item treatment all live here so every dropdown in the
 * app matches (the review filters set the pattern). Values must be non-empty
 * strings: Radix rejects `''`, so an "all" option uses a sentinel value.
 */
const triggerStyles = [
  fieldStyles,
  'flex cursor-pointer items-center justify-between gap-2 text-left',
].join(' ');

const itemStyles = [
  'relative flex cursor-pointer items-center rounded-md py-2 pl-8 pr-3',
  'text-sm text-foreground-secondary outline-none transition-colors',
  'data-[highlighted]:bg-secondary data-[highlighted]:text-foreground',
].join(' ');

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Accessible name — the trigger has no visible label. */
  ariaLabel: string;
  disabled?: boolean;
  /** Ties the trigger to a visible `<Label htmlFor>`. */
  id?: string;
  /** Fill the container instead of hugging its content on wide screens. */
  fullWidth?: boolean;
}

export default function Select({
  value,
  onValueChange,
  options,
  ariaLabel,
  disabled,
  id,
  fullWidth = false,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={[triggerStyles, fullWidth ? 'w-full' : 'w-full sm:w-auto'].join(' ')}
        id={id}
        aria-label={ariaLabel}
      >
        <SelectPrimitive.Value />
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-popover overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} className={itemStyles}>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute left-2">
                  <Check className="size-4 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
