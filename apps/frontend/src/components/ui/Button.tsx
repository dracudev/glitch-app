import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90 active:opacity-80',
  secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-muted',
  outline: 'border border-primary bg-transparent text-primary hover:bg-primary/10',
  ghost: 'bg-transparent text-muted-foreground hover:bg-secondary',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  link: 'bg-transparent text-primary underline-offset-4 hover:underline p-0',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10 p-0',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Button component built with Radix UI Slot for maximum flexibility
 */
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

    const baseClasses =
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 cursor-pointer';
    const focusClasses =
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2';
    const disabledClasses =
      'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];
    const widthClass = fullWidth ? 'w-full' : '';

    const buttonContent = (
      <>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </>
    );

    return (
      <Comp
        className={`${baseClasses} ${focusClasses} ${disabledClasses} ${variantClass} ${sizeClass} ${widthClass} ${className || ''}`.trim()}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button };
