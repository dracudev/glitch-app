import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  $notifications,
  dismissNotification,
  type NotificationEntry,
  type NotificationTone,
} from '@/stores/notifications';

// ============================================================================
// Tone styling
// ============================================================================

const TONE_ICON: Record<NotificationTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
};

const TONE_COLOR: Record<NotificationTone, string> = {
  info: 'text-[var(--text-secondary)]',
  success: 'text-[var(--state-success)]',
  error: 'text-[var(--state-error)]',
};

const DEFAULT_DURATION = 6000;

// ============================================================================
// Single notification
// ============================================================================

function NotificationItem({ notification }: { notification: NotificationEntry }) {
  const {
    id,
    title,
    tone = 'info',
    action,
    duration = DEFAULT_DURATION,
  } = notification;

  const [settled, setSettled] = useState(false);
  const [paused, setPaused] = useState(false);

  // Settle into place. Transform only: the notice is fully visible and readable
  // at every frame, so a missed animation can never hide it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-dismiss, paused while the pointer or focus is inside. ponytail: unpausing
  // restarts the full duration instead of resuming the remainder — good enough.
  useEffect(() => {
    if (paused || duration <= 0) return;
    const timer = setTimeout(() => dismissNotification(id), duration);
    return () => clearTimeout(timer);
  }, [paused, duration, id]);

  const Icon = TONE_ICON[tone];

  return (
    <li
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] px-3.5 py-3 shadow-[0_2px_8px_-4px_var(--bg-tertiary)] transition-transform duration-200 motion-reduce:transition-none"
      style={{ transform: settled ? 'translateY(0)' : 'translateY(-6px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Icon
        size={16}
        strokeWidth={1.75}
        className={`mt-0.5 shrink-0 ${TONE_COLOR[tone]}`}
        aria-hidden="true"
      />

      <p className="min-w-0 flex-1 text-sm leading-5 text-[var(--text-primary)]">{title}</p>

      {action && (
        <Button
          asChild
          variant="secondary"
          size="sm"
          // The `secondary` fill IS the notice surface, so without this the button
          // has no presence of its own. Lift it one tonal step instead.
          className="shrink-0 bg-[var(--bg-tertiary)] hover:bg-[var(--text-muted)]/20"
        >
          <a href={action.href}>{action.label}</a>
        </Button>
      )}

      <button
        type="button"
        onClick={() => dismissNotification(id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      >
        <X size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  );
}

// ============================================================================
// Notification stack
// ============================================================================

/**
 * Global notification stack. Sits below the 64px navbar, top-right.
 *
 * @example
 * ```ts
 * notify({ title: 'Sign in to follow people', action: { label: 'Sign in', href: '/auth/login' } });
 * ```
 */
export default function Notifications() {
  const notifications = useStore($notifications);

  return (
    <ul
      className="pointer-events-none fixed top-20 right-4 z-[var(--z-toast)] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </ul>
  );
}
