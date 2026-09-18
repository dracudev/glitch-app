import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';

/** Button — the single action primitive; hover is a tonal fill shift and focus comes from global.css's `:focus-visible` (no ring utilities here). */
const variantStyles = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary:
    'bg-secondary text-secondary-foreground border border-border hover:bg-secondary-hover hover:border-border-hover',
  outline:
    'border border-border-strong bg-transparent text-foreground hover:border-accent hover:text-accent',
  ghost: 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
  link: 'bg-transparent text-accent underline-offset-4 hover:underline',
} as const;

const sizeStyles = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2.5 px-6 text-base',
  icon: 'size-10 p-0',
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    // `link` is inline text — it must not inherit a control height or padding.
    const sizeClass = variant === 'link' ? '' : sizeStyles[size];

    const classes = [
      'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium',
      'transition-colors duration-150',
      variantStyles[variant],
      sizeClass,
      fullWidth ? 'w-full' : '',
      'disabled:pointer-events-none disabled:opacity-50',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Comp
        className={classes}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && (
            <span className="shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}
        {/* `Slot` counts children, so the icon slots make it throw; `Slottable` is the escape hatch. */}
        {asChild ? <Slottable>{children}</Slottable> : children}
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button };

export default Button;
