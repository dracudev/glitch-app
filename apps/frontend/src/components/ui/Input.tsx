import * as React from 'react';

/**
 * The single text-field contract. Replaces the three competing focus
 * treatments (ring-2, border-primary, outline-none) that were previously
 * hand-rolled per form.
 *
 * Focus needs no classes here: global.css owns :focus-visible.
 */
export const fieldStyles = [
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
  'transition-colors placeholder:text-muted-foreground hover:border-border-hover',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={[fieldStyles, className].filter(Boolean).join(' ')} {...props} />
));
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={[fieldStyles, 'resize-y leading-relaxed', className].filter(Boolean).join(' ')}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={['block text-sm font-medium text-foreground', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export { Input, Textarea, Label };
export default Input;
