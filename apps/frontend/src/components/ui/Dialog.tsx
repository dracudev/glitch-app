import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Dialog — the single overlay + panel contract for the whole app.
 *
 * Rules this encodes, so no call site has to remember them:
 *  - Backdrop is the page colour at 60% plus a real blur. Never solid black.
 *  - Overlay sits at `z-overlay` (50), the panel at `z-modal` (60) — both above
 *    the navbar (`z-nav`, 40), so the backdrop actually covers the header.
 *  - Focus trap, Escape, scroll lock and focus restore come from Radix.
 *  - The close control is always present and always labelled.
 *
 * Entrance motion animates `scale`/`translate` as standalone properties, so it
 * composes with the centring `-translate-*` utilities instead of fighting them.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const centerWidths = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

/** Placement of the panel. `right` and `bottom` are the sheet variants. */
type Placement = 'center' | 'right' | 'bottom';

const placementStyles: Record<Placement, string> = {
  center:
    'left-1/2 top-1/2 max-h-[85vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border data-[state=open]:animate-panel-in data-[state=closed]:animate-panel-out',
  right:
    'inset-y-0 right-0 h-full w-[85%] max-w-sm border-l data-[state=open]:animate-drawer-in',
  bottom:
    'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl border-t data-[state=open]:animate-sheet-in',
};

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={[
      'fixed inset-0 z-overlay bg-background/60 backdrop-blur-md',
      'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Width of a centred panel. Ignored for sheet placements. */
  size?: keyof typeof centerWidths;
  placement?: Placement;
  /** Hide the built-in close control (only when the panel supplies its own). */
  hideClose?: boolean;
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    { className, children, size = 'md', placement = 'center', hideClose = false, ...props },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={[
          'fixed z-modal overflow-y-auto border-border bg-popover shadow-xl',
          placementStyles[placement],
          placement === 'center' ? 'p-6' : 'p-0',
          placement === 'center' ? centerWidths[size] : '',
          className || '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}

        {!hideClose && (
          <DialogPrimitive.Close
            className={[
              'absolute rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
              placement === 'center' ? '-mr-1 -mt-1 right-4 top-4' : 'right-3 top-3',
            ].join(' ')}
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['mb-5 space-y-1.5 pr-8', className].filter(Boolean).join(' ')} {...props} />
  );
}

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={['font-display text-xl font-semibold text-foreground', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={['text-sm text-muted-foreground', className].filter(Boolean).join(' ')}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
